// ===== Nueva incidencia: alta de tickets en ATGO =====
// Mismos campos y orden que «Alta rápida de incidencia» del ERP, sin Actuación. Las listas y el alta se hacen en la pestaña de ATGO
// (atgo-sync.js: altaListas y altaCrear). Un alta se envía una sola vez: nunca se reintenta sola, porque crearía un ticket duplicado.
const ALTA_ESPERA_MS = 60000, ALTA_DEBOUNCE_MS = 300, ALTA_MIN_BUSCA = 2, ALTA_DUPLICADO_MS = 30 * 60000;
const ALTA_MAX = { ref: 50, recepcion: 2000, descripcion: 4000 };
const ALTA_BUSCADORES = { cliente: 'Cliente', sede: 'Sede', elemento: 'Elemento', proyecto: 'Proyecto' };
function altaVacia() {
  return { cliente: null, sede: null, elemento: null, proyecto: null, textos: {}, severidades: [], estados: [], severidad: '', estado: '', operario: '', fecha: '', desde: '', hasta: '', ref: '', recepcion: '', descripcion: '', error: '', incierto: false, enviando: false, idEnvio: '', resultado: null };
}
let altaEst = altaVacia(), altaRes = {}, altaUltima = {}, altaT = {}, altaEsperaT = null, altaRecientes = [];
const altaId = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function altaOcupada() { return altaEst.enviando; }

function abrirAlta() {
  if (!hiloFuente()) { toast('Conecta ATGO (Ajustes › General) y repítelo'); return; }
  if (!atgoCaps.includes('alta')) { confirmar('<b>Falta actualizar la extensión</b><p>Para crear incidencias, instala la extensión 2.2 desde Ajustes › General y recarga la pestaña de ATGO.</p>', 'Entendido'); return; }
  if (altaEst.resultado) altaEst = altaVacia();
  const m = document.getElementById('modal');
  m.innerHTML = '<div class="md-box md-alta" id="altaBox"></div>'; m.hidden = false;
  renderAlta(); altaCargarListas();
}
function altaCampoBusca(que) {
  const bloqueado = que === 'proyecto' && !altaEst.cliente;
  return `<label for="al-${que}"${que === 'cliente' || que === 'sede' ? ' class="ob"' : ''}>${ALTA_BUSCADORES[que]}</label>
    <div class="al-bus"><input id="al-${que}" autocomplete="off" value="${esc(altaEst.textos[que] || '')}"${bloqueado ? ' disabled' : ''} placeholder="Escribe para buscar…" oninput="altaBuscar('${que}',this.value)" onkeydown="altaTecla(event,'${que}')">
      <div class="al-res" id="alRes-${que}" hidden></div></div>`;
}
function altaCampoTexto(id, titulo, ob, filas) {
  const v = esc(altaEst[id]), max = ALTA_MAX[id], attrs = `id="al-${id}" maxlength="${max}" oninput="altaTexto('${id}',this.value)"`;
  return `<label for="al-${id}"${ob ? ' class="ob"' : ''}>${titulo}</label>${filas ? `<textarea ${attrs} rows="${filas}">${v}</textarea>` : `<input ${attrs} autocomplete="off" value="${v}">`}
    <span class="al-cont" id="alCont-${id}">${altaEst[id].length}/${max} caracteres</span>`;
}
function renderAlta() {
  const box = document.getElementById('altaBox'); if (!box) return;
  const a = altaEst, cab = t => `<div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">${t}</div></div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>`;
  if (a.resultado) {
    const r = a.resultado;
    box.innerHTML = `${cab('Incidencia creada ✓')}<p class="al-num">Nº <b class="mono">${esc(r.num)}</b></p>
      ${(r.avisos || []).map(t => `<p class="md-warn">${esc(t)}</p>`).join('')}
      <p class="hint">Saldrá en Despacho en la próxima sincronización, si es de un técnico de tu perfil.</p>
      <div class="acts" style="justify-content:flex-end"><button class="btn" onclick="altaOtra()">Crear otra</button><button class="btn pri" onclick="cerrarModal()">Cerrar</button></div>`;
    return;
  }
  box.innerHTML = `${cab('Nueva incidencia')}
    ${a.error ? `<p class="md-warn" role="alert">${esc(a.error)}</p>` : ''}
    <div class="al-f">
      <label for="al-serie">Serie</label><input id="al-serie" value="00" disabled>
      ${altaCampoBusca('cliente')}${altaCampoBusca('sede')}${altaCampoBusca('proyecto')}
      <label for="al-fecha">Fecha visita</label><div class="al-visita"><input type="date" id="al-fecha" value="${esc(a.fecha)}" onchange="altaEst.fecha=this.value"><input type="time" id="al-desde" aria-label="Hora de inicio" value="${esc(a.desde)}" onchange="altaEst.desde=this.value"><input type="time" id="al-hasta" aria-label="Hora de fin" value="${esc(a.hasta)}" onchange="altaEst.hasta=this.value"></div>
      <label for="al-op">Operario</label><select id="al-op" onchange="altaEst.operario=this.value">${opcionesTecnico([], a.operario, 'Sin asignar')}</select>
      <label for="al-estado">Estado</label><select id="al-estado" onchange="altaEst.estado=this.value"></select>
      <label for="al-severidad" class="ob">Severidad</label><select id="al-severidad" onchange="altaEst.severidad=this.value"></select>
      ${altaCampoBusca('elemento')}
      ${altaCampoTexto('ref', 'Su referencia', true)}
      ${altaCampoTexto('recepcion', 'Datos recepción', false, 4)}
      ${altaCampoTexto('descripcion', 'Descripción', false, 5)}
    </div>
    <div class="acts al-pie"><button class="btn ghost" onclick="altaOtra()">Vaciar</button><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn pri" id="altaEnviar" onclick="altaEnviar()"${a.enviando ? ' disabled' : ''}>${a.enviando ? 'Creando en ATGO…' : 'Aceptar'}</button></div>`;
  altaPintarListas();
}
function altaOtra() { altaEst = altaVacia(); renderAlta(); altaCargarListas(); }
function altaTexto(id, v) { altaEst[id] = v; const c = document.getElementById('alCont-' + id); if (c) c.textContent = `${v.length}/${ALTA_MAX[id]} caracteres`; }

// ---- Listas que dependen del cliente ----
function altaPedir(que, q) {
  const src = hiloFuente(); if (!src) return null;
  const id = altaId(); altaUltima[que] = id;
  try { src.postMessage({ type: 'despacho-alta-lista', id, que, q: q || '', codCli: altaEst.cliente ? altaEst.cliente.v : '' }, ATGO_ORIGIN); } catch (e) { return null; }
  return id;
}
function altaCargarListas() { altaPedir('severidad'); altaPedir('estado'); }
function altaPintarListas() {
  const a = altaEst, sev = document.getElementById('al-severidad'), est = document.getElementById('al-estado'); if (!sev || !est) return;
  sev.innerHTML = `<option value="">Elige severidad…</option>` + a.severidades.map(x => `<option value="${esc(x.v)}"${String(x.v) === a.severidad ? ' selected' : ''}>${esc(x.l)}</option>`).join('');
  est.innerHTML = a.estados.map(x => `<option value="${esc(x.v)}"${String(x.v) === a.estado ? ' selected' : ''}>${esc(x.l)}</option>`).join('');
}
function recibirAltaLista(m) {
  if (m.id !== altaUltima[m.que]) return;   // respuesta de una búsqueda anterior
  if (m.que === 'severidad' || m.que === 'estado') {
    if (!m.ok) { altaEst.error = 'No se pudo cargar la lista de ' + m.que + ': ' + errorAtgo(m.error); renderAlta(); return; }
    if (m.que === 'severidad') { altaEst.severidades = m.items; if (!m.items.some(x => String(x.v) === altaEst.severidad)) altaEst.severidad = ''; }
    else { altaEst.estados = m.items; if (!m.items.some(x => String(x.v) === altaEst.estado)) { const c = m.items.find(x => /CREADO/i.test(x.l)) || m.items[0]; altaEst.estado = c ? String(c.v) : ''; } }
    altaPintarListas(); return;
  }
  const res = document.getElementById('alRes-' + m.que); if (!res) return;
  altaRes[m.que] = m.items || [];
  res.innerHTML = !m.ok ? `<div class="al-vacio">${esc(errorAtgo(m.error))}</div>` : altaRes[m.que].length ? altaRes[m.que].map((x, i) => `<button type="button" onclick="altaElegir('${m.que}',${i})" onkeydown="altaTecla(event,'${m.que}')">${esc(x.l)}</button>`).join('') : '<div class="al-vacio">Sin resultados</div>';
  res.hidden = false;
}

// ---- Buscadores ----
function altaBuscar(que, txt) {
  altaEst.textos[que] = txt;
  if (altaEst[que]) altaSoltar(que);
  clearTimeout(altaT[que]);
  const res = document.getElementById('alRes-' + que), q = txt.trim();
  if (q.length < ALTA_MIN_BUSCA) { altaUltima[que] = ''; if (res) res.hidden = true; return; }
  altaT[que] = setTimeout(() => altaPedir(que, q), ALTA_DEBOUNCE_MS);
}
function altaSoltar(que) {
  altaEst[que] = null;
  if (que === 'cliente') { altaEst.proyecto = null; altaEst.textos.proyecto = ''; altaBloqueoProyecto(); altaCargarListas(); }
}
function altaBloqueoProyecto() {
  const p = document.getElementById('al-proyecto'); if (!p) return;
  p.disabled = !altaEst.cliente; if (!altaEst.cliente) p.value = '';
}
function altaElegir(que, i) {
  const x = (altaRes[que] || [])[i]; if (!x) return;
  altaEst[que] = x; altaEst.textos[que] = x.l;
  const inp = document.getElementById('al-' + que), res = document.getElementById('alRes-' + que);
  if (inp) { inp.value = x.l; inp.focus(); } if (res) res.hidden = true;
  if (que === 'cliente') { altaBloqueoProyecto(); altaCargarListas(); }
}
function altaTecla(ev, que) {
  const res = document.getElementById('alRes-' + que); if (!res || res.hidden) return;
  const bs = [...res.querySelectorAll('button')], i = bs.indexOf(document.activeElement);
  if (ev.key === 'ArrowDown' && bs.length) { ev.preventDefault(); bs[Math.min(i + 1, bs.length - 1)].focus(); }
  else if (ev.key === 'ArrowUp' && i >= 0) { ev.preventDefault(); if (i === 0) document.getElementById('al-' + que).focus(); else bs[i - 1].focus(); }
  else if (ev.key === 'Enter' && i < 0 && bs.length === 1) { ev.preventDefault(); bs[0].click(); }
}
document.addEventListener('click', e => { if (!e.target.closest || !e.target.closest('.al-bus')) document.querySelectorAll('.al-res').forEach(r => { r.hidden = true; }); });

// ---- Comprobar y crear ----
function altaFaltan(a) {
  const f = [];
  if (!a.cliente) f.push(['al-cliente', 'el cliente']);
  if (!a.sede) f.push(['al-sede', 'la sede']);
  if (!a.severidad) f.push(['al-severidad', 'la severidad']);
  if (!a.ref.trim()) f.push(['al-ref', 'su referencia']);
  return f;
}
function altaHorasError(a) {
  if ((a.desde || a.hasta) && !a.fecha) return 'Para poner horas, indica también la fecha de visita.';
  if (a.desde && a.hasta && a.hasta < a.desde) return 'La hora de fin es anterior a la de inicio.';
  return '';
}
function altaDatos(a) {
  return { codCli: a.cliente.v, idSede: a.sede.v, sedeEtiqueta: a.sede.l, codSede: a.sede.cod || null, severidad: a.severidad, estado: a.estado, codElemento: a.elemento ? a.elemento.v : null, numProy: a.proyecto ? a.proyecto.v : null, codOpe: a.operario || null, fechaVisita: a.fecha || null, horaInicio: a.desde || null, horaFin: a.hasta || null, suReferencia: a.ref.trim(), datosRecepcion: a.recepcion.trim(), descripcion: a.descripcion.trim() };
}
function altaYaEnviada(a) {
  const ref = a.ref.trim().toUpperCase();
  altaRecientes = altaRecientes.filter(x => Date.now() - x.ts < ALTA_DUPLICADO_MS);
  return altaRecientes.some(x => x.ref === ref && x.sede === a.sede.v);
}
async function altaEnviar() {
  const a = altaEst; if (a.enviando) return;
  const faltan = altaFaltan(a), mal = altaHorasError(a), src = hiloFuente();
  if (faltan.length) { toast('Falta ' + faltan.map(x => x[1]).join(', ')); document.getElementById(faltan[0][0]).focus(); return; }
  if (mal) { toast(mal); return; }
  if (!src) { toast('Conecta ATGO (Ajustes › General) y repítelo'); return; }
  const sev = a.severidades.find(x => String(x.v) === a.severidad), est = a.estados.find(x => String(x.v) === a.estado);
  const filas = [['Cliente', a.cliente.l], ['Sede', a.sede.l], ['Proyecto', a.proyecto && a.proyecto.l], ['Fecha visita', a.fecha && a.fecha.split('-').reverse().join('/') + (a.desde ? ' · ' + a.desde + (a.hasta ? '–' + a.hasta : '') : '')], ['Operario', a.operario], ['Estado', est && est.l], ['Severidad', sev && sev.l], ['Elemento', a.elemento && a.elemento.l], ['Su referencia', a.ref.trim()]].filter(x => x[1]);
  const dup = altaYaEnviada(a);
  const ok = await confirmar(`<b>Crear esta incidencia en ATGO</b><table class="md-tab">${filas.map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join('')}</table>
    ${dup ? '<p class="md-warn">Ya enviaste hace poco una incidencia con esta referencia y esta sede. Compruébalo en ATGO para no duplicarla.</p>' : ''}
    <p class="hint">Se creará un ticket real. Si te equivocas, no se puede anular: habrá que cerrarlo en ATGO.</p>`, 'Crear en ATGO');
  altaVolver();
  if (!ok) return;
  const id = altaId(), fuente = hiloFuente();
  if (!fuente) { altaEst.error = 'Se ha perdido la conexión con ATGO. No se ha creado nada.'; renderAlta(); return; }
  const datos = altaDatos(altaEst);
  altaEst.enviando = true; altaEst.idEnvio = id; altaEst.datosEnvio = datos; altaEst.error = ''; altaEst.incierto = false;
  altaRecientes.push({ ref: datos.suReferencia.toUpperCase(), sede: datos.idSede, ts: Date.now() });
  renderAlta();
  try { fuente.postMessage({ type: 'despacho-alta', id, datos }, ATGO_ORIGIN); }
  catch (e) { altaEst.enviando = false; altaEst.idEnvio = ''; altaEst.error = 'No se pudo contactar con la pestaña de ATGO. No se ha creado nada.'; renderAlta(); return; }
  clearTimeout(altaEsperaT);
  altaEsperaT = setTimeout(() => altaSinRespuesta(id), ALTA_ESPERA_MS);
}
// La confirmación usa la misma ventana que el formulario: al acabar se vuelve a pintar con lo escrito
function altaVolver() {
  const m = document.getElementById('modal');
  m.innerHTML = '<div class="md-box md-alta" id="altaBox"></div>'; m.hidden = false;
  renderAlta();
}
function altaResumenRegistro(d) { return d.suReferencia + ' · ' + d.sedeEtiqueta; }
function altaSinRespuesta(id) {
  if (altaEst.idEnvio !== id) return;
  altaEst.enviando = false; altaEst.incierto = true;
  altaEst.error = 'ATGO no ha respondido y no se sabe si la ha creado. Compruébalo en ATGO antes de volver a enviarla.';
  registrarEdicion({ key: '', num: '', accion: 'alta', detalle: altaResumenRegistro(altaEst.datosEnvio), ok: false, error: 'sin respuesta de ATGO' });
  renderAlta();
}
function recibirAlta(m) {
  if (!altaEst.idEnvio || m.id !== altaEst.idEnvio) return;
  clearTimeout(altaEsperaT);
  const tarde = !altaEst.enviando, datos = altaEst.datosEnvio;
  altaEst.enviando = false; altaEst.idEnvio = '';
  const error = m.ok ? '' : m.incierto ? m.error : errorAtgo(m.error);
  if (!tarde || m.ok) registrarEdicion({ key: m.key || '', num: m.num || '', accion: 'alta', detalle: altaResumenRegistro(datos), ok: !!m.ok, error });
  if (m.ok) { altaEst.resultado = { num: m.num, key: m.key, avisos: m.avisos || [] }; altaEst.error = ''; altaEst.incierto = false; refreshVisible(); }
  else { altaEst.incierto = !!m.incierto; altaEst.error = m.incierto ? error : 'No se ha creado: ' + error; }
  const abierta = document.getElementById('altaBox');
  if (abierta) renderAlta();
  else if (m.ok) toast('Incidencia creada · Nº ' + m.num, 'ok');
  else { abrirAlta(); }
}
