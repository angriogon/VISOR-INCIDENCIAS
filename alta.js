// ===== Nueva incidencia: alta de tickets en ATGO =====
// Mismos campos y orden que «Alta rápida de incidencia» del ERP, sin Actuación. Las listas y el alta se hacen en la pestaña de ATGO
// (atgo-sync.js: altaListas y altaCrear). Un alta se envía una sola vez: nunca se reintenta sola, porque crearía un ticket duplicado.
const ALTA_ESPERA_MS = 60000, ALTA_DEBOUNCE_MS = 300, ALTA_MIN_BUSCA = 2, ALTA_DUPLICADO_MS = 30 * 60000;
const ALTA_SEDES_KEY = 'dispatcher_alta_sedes_v1', ALTA_SEDES_CLIENTES = 40, ALTA_SEDES_ESPERA_MS = 45000;   // caché: se reconstruye sola, no va en la copia de seguridad
const ALTA_MAX = { ref: 50, recepcion: 2000, descripcion: 4000 };
const ALTA_BUSCADORES = { cliente: 'Cliente', sede: 'Sede', elemento: 'Elemento', proyecto: 'Proyecto' };
function altaVacia() {
  return { cliente: null, sede: null, elemento: null, proyecto: null, textos: {}, severidades: [], estados: [], operarios: [], sedesCli: null, sedesCargando: false, sedesListas: false, sedesError: '', todasSedes: false, severidad: '', estado: '', operario: '', fecha: '', desde: '', hasta: '', ref: '', recepcion: '', descripcion: '', error: '', incierto: false, enviando: false, idEnvio: '', resultado: null };
}
let altaEst = altaVacia(), altaRes = {}, altaUltima = {}, altaT = {}, altaEsperaT = null, altaSedesT = null, altaRecientes = [];
const altaId = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function altaOcupada() { return altaEst.enviando; }

function abrirAlta() {
  if (!hiloFuente()) { toast('Conecta ATGO (Ajustes › General) y repítelo'); return; }
  if (!atgoCaps.includes('alta')) { confirmar('<b>Falta actualizar la extensión</b><p>Para crear incidencias, instala la última extensión desde Ajustes › General y recarga la pestaña de ATGO.</p>', 'Entendido'); return; }
  if (altaEst.resultado) altaEst = altaVacia();
  const m = document.getElementById('modal');
  m.innerHTML = '<div class="md-box md-alta" id="altaBox"></div>'; m.hidden = false;
  renderAlta(); altaCargarListas();
}
function altaDependeCliente(que) { return que === 'sede' || que === 'proyecto'; }
function altaPista(que) {
  if (altaDependeCliente(que) && !altaEst.cliente) return 'Elige primero el cliente';
  return que === 'sede' && !altaEst.todasSedes ? 'Pulsa para ver sus sedes o escribe para filtrar' : 'Escribe para buscar…';
}
function altaCampoBusca(que) {
  const bloqueado = altaDependeCliente(que) && !altaEst.cliente;
  return `<label for="al-${que}"${que === 'cliente' || que === 'sede' ? ' class="ob"' : ''}>${ALTA_BUSCADORES[que]}</label>
    <div class="al-bus"><input id="al-${que}" autocomplete="off" value="${esc(altaEst.textos[que] || '')}"${bloqueado ? ' disabled' : ''} placeholder="${altaPista(que)}"${que === 'sede' ? ' onfocus="altaFocoSede()"' : ''} oninput="altaBuscar('${que}',this.value)" onkeydown="altaTecla(event,'${que}')">
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
      <label for="al-op">Operario</label><select id="al-op" onchange="altaEst.operario=this.value"></select>
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
function altaCargarListas() {
  altaPedir('severidad');
  if (!altaEst.estados.length) altaPedir('estado');
  if (!altaEst.operarios.length) altaPedir('operario');
  if (altaEst.cliente && !altaEst.sedesCargando && !altaEst.sedesListas) altaPedirSedes();
}
function altaPintarListas() {
  const a = altaEst, sev = document.getElementById('al-severidad'), est = document.getElementById('al-estado'), op = document.getElementById('al-op'); if (!sev || !est || !op) return;
  op.innerHTML = '<option value="">Sin asignar</option>' + a.operarios.map(x => `<option value="${esc(x.v)}"${x.v === a.operario ? ' selected' : ''}>${esc(x.l)}</option>`).join('');
  sev.innerHTML = `<option value="">Elige severidad…</option>` + a.severidades.map(x => `<option value="${esc(x.v)}"${String(x.v) === a.severidad ? ' selected' : ''}>${esc(x.l)}</option>`).join('');
  est.innerHTML = a.estados.map(x => `<option value="${esc(x.v)}"${String(x.v) === a.estado ? ' selected' : ''}>${esc(x.l)}</option>`).join('');
}
function recibirAltaLista(m) {
  if (m.id !== altaUltima[m.que]) return;   // respuesta de una búsqueda anterior
  if (m.que === 'sedes-cliente') {
    const a = altaEst;
    if (m.ok && m.items.length) a.sedesCli = altaMezclarSedes(a.sedesCli || [], m.items);
    if (!m.parcial) {
      clearTimeout(altaSedesT);
      a.sedesCargando = false; a.sedesListas = true; a.sedesError = m.ok ? '' : errorAtgo(m.error);
      if (a.sedesCli === null) a.sedesCli = [];
      if (a.cliente && a.sedesCli.length) altaGuardarSedes(a.cliente.v, a.sedesCli);
      if (m.tiempos) diagLog('Sedes del cliente: ' + Object.entries(m.tiempos).map(([k, v]) => k + ' ' + v).join(' · '), 'alta');
    }
    altaRepintarSedes();
    return;
  }
  if (m.que === 'severidad' || m.que === 'estado' || m.que === 'operario') {
    if (!m.ok) { altaEst.error = 'No se pudo cargar la lista de ' + m.que + ': ' + errorAtgo(m.error); renderAlta(); return; }
    if (m.que === 'operario') { altaEst.operarios = m.items; altaPintarListas(); return; }
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
  if (que === 'sede' && altaEst.cliente && !altaEst.todasSedes) { altaPintarSedes(); return; }
  const res = document.getElementById('alRes-' + que), q = txt.trim();
  if (q.length < ALTA_MIN_BUSCA) { altaUltima[que] = ''; if (res) res.hidden = true; return; }
  altaT[que] = setTimeout(() => altaPedir(que, q), ALTA_DEBOUNCE_MS);
}
function altaSoltar(que) {
  altaEst[que] = null;
  if (que === 'cliente') { altaReiniciarCliente(); altaCargarListas(); }
}
// Al cambiar de cliente, la sede y el proyecto elegidos dejan de valer
function altaReiniciarCliente() {
  const a = altaEst;
  clearTimeout(altaSedesT);
  a.sede = null; a.proyecto = null; a.sedesCli = null; a.sedesCargando = false; a.sedesListas = false; a.sedesError = ''; a.todasSedes = false; a.textos.sede = ''; a.textos.proyecto = '';
  ['sede', 'proyecto'].forEach(q => {
    const inp = document.getElementById('al-' + q), res = document.getElementById('alRes-' + q);
    if (inp) { inp.value = ''; inp.disabled = !a.cliente; inp.placeholder = altaPista(q); }
    if (res) res.hidden = true;
  });
}
// Sedes de cada cliente guardadas en este PC: salen al instante mientras ATGO confirma por detrás
function altaMezclarSedes(a, b) {
  const m = new Map(); [...a, ...b].forEach(x => m.set(String(x.v), x));
  return [...m.values()].sort((x, y) => x.l.localeCompare(y.l, 'es', { numeric: true }));
}
function altaGuardarSedes(cli, items) {
  const g = lsGet(ALTA_SEDES_KEY, {}); g[cli] = { ts: Date.now(), items: items.slice(0, 500) };
  Object.entries(g).sort((a, b) => b[1].ts - a[1].ts).slice(ALTA_SEDES_CLIENTES).forEach(([k]) => delete g[k]);
  lsSet(ALTA_SEDES_KEY, g);
}
function altaPedirSedes() {
  const a = altaEst, g = lsGet(ALTA_SEDES_KEY, {})[a.cliente.v];
  a.sedesCli = g ? g.items : null; a.sedesCargando = true; a.sedesListas = false; a.sedesError = '';
  const id = altaPedir('sedes-cliente');
  clearTimeout(altaSedesT);
  altaSedesT = setTimeout(() => {
    if (altaUltima['sedes-cliente'] !== id || !altaEst.sedesCargando) return;
    const e = altaEst; e.sedesCargando = false; e.sedesListas = true; if (e.sedesCli === null) e.sedesCli = [];
    if (!e.sedesCli.length) e.sedesError = 'ATGO está tardando demasiado. Busca en todas las sedes.';
    altaRepintarSedes();
  }, ALTA_SEDES_ESPERA_MS);
  if (!id) { a.sedesCargando = false; a.sedesListas = true; if (a.sedesCli === null) a.sedesCli = []; a.sedesError = 'Sin conexión con la pestaña de ATGO'; }
}
function altaRepintarSedes() {
  const a = altaEst, inp = document.getElementById('al-sede'), res = document.getElementById('alRes-sede');
  if (inp && res && !a.sede && !a.todasSedes && (document.activeElement === inp || !res.hidden)) altaPintarSedes();
}
// Sedes del cliente elegido: se ven al entrar en el campo y se filtran al escribir, sin preguntar a ATGO cada vez
function altaFocoSede() { if (altaEst.cliente && !altaEst.sede && !altaEst.todasSedes) altaPintarSedes(); }
function altaPintarSedes() {
  const a = altaEst, res = document.getElementById('alRes-sede'); if (!res) return;
  res.hidden = false;
  const t = norm(a.textos.sede || '').trim(), todas = a.sedesCli || [];
  altaRes.sede = todas.filter(x => !t || norm(x.l).includes(t)).slice(0, 300);
  const vacio = a.sedesCargando ? 'Cargando las sedes de este cliente…' : a.sedesError ? esc(a.sedesError) : todas.length ? 'Ninguna sede coincide' : 'ATGO no indica sedes para este cliente';
  res.innerHTML = (altaRes.sede.length ? altaRes.sede.map((x, i) => `<button type="button" onclick="altaElegir('sede',${i})" onkeydown="altaTecla(event,'sede')">${esc(x.l)}</button>`).join('') : `<div class="al-vacio">${vacio}</div>`)
    + (altaRes.sede.length && a.sedesCargando ? '<div class="al-vacio">Buscando más sedes en ATGO…</div>' : '')
    + '<button type="button" class="al-otras" onclick="altaBuscarEnTodas()" onkeydown="altaTecla(event,\'sede\')">¿No está? Buscar en todas las sedes</button>';
}
function altaBuscarEnTodas() {
  setTimeout(() => {   // después del clic: la lista se sustituye y no debe contarse como clic fuera
    const a = altaEst, inp = document.getElementById('al-sede'), res = document.getElementById('alRes-sede'), q = (a.textos.sede || '').trim(); if (!inp || !res) return;
    a.todasSedes = true; inp.placeholder = altaPista('sede'); inp.focus();
    if (q.length >= ALTA_MIN_BUSCA) { altaPedir('sede', q); return; }
    res.innerHTML = '<div class="al-vacio">Escribe al menos 2 letras para buscar en todas las sedes</div>'; res.hidden = false;
  }, 0);
}
function altaElegir(que, i) {
  const x = (altaRes[que] || [])[i]; if (!x) return;
  altaEst[que] = x; altaEst.textos[que] = x.l;
  // Una sede encontrada fuera de la lista del cliente se recuerda para la próxima vez
  if (que === 'sede' && altaEst.todasSedes && altaEst.cliente) { altaEst.sedesCli = altaMezclarSedes(altaEst.sedesCli || [], [x]); altaGuardarSedes(altaEst.cliente.v, altaEst.sedesCli); }
  const inp = document.getElementById('al-' + que), res = document.getElementById('alRes-' + que);
  if (inp) { inp.value = x.l; inp.focus(); } if (res) res.hidden = true;
  if (que === 'cliente') { altaReiniciarCliente(); altaEst.textos.cliente = x.l; altaCargarListas(); }
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
