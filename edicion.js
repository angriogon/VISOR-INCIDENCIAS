// ===== Edición en ATGO (fase 1): comentario en el hilo y cambio de estado =====
// Despacho pide el cambio a la pestaña de ATGO (atgo-sync.js), que lo hace con tu sesión y lo comprueba.
// Usa utilidades de index.html, dia.js y herramientas.js solo en tiempo de llamada.

const EDIT_KEY = 'dispatcher_ediciones_v1';
const EDIT_TIMEOUT_MS = 25000;
let ediciones = lsGet(EDIT_KEY, []);
let atgoCaps = [], atgoEstados = [];
// Resultado del último cambio, visible arriba de la ficha › Actuar (el aviso flotante quedaba tapado por la ficha)
let edResultado = null;   // { key, ok, txt, ts }
function anotarResultado(key, ok, txt) { edResultado = { key, ok, txt, ts: Date.now() }; toast(txt, ok ? 'ok' : 'ko'); }
let editPend = null;   // { id, key, accion, t0 } mientras se espera respuesta

// Llamado desde index.html al recibir datos de ATGO: qué sabe hacer la pestaña de ATGO y su lista de estados
function recibirCapacidades(m) {
  if (Array.isArray(m.caps)) atgoCaps = m.caps;
  if (Array.isArray(m.estados) && m.estados.length) atgoEstados = m.estados;
}
function puedeEditar() { return atgoCaps.includes('editar') && !!hiloFuente(); }
function puedeLote() { return atgoCaps.includes('lote') && !!hiloFuente(); }
// La fila que devuelve ATGO tras asignar se aplica ya: no hay que esperar a la siguiente recarga de la lista.
// Si era de Sin asignar y pasa a un técnico de tu perfil, entra en Incidencias.
function aplicarFila(key, f) {
  if (!f) return;
  const r = ticketDe(key); if (!r) return;
  Object.assign(r, { operario: f.operario || r.operario, desOperario: f.desOperario || r.desOperario, fVisita: f.fVisita || '', desdeHora: f.desdeHora || '', hastaHora: f.hastaHora || '' });
  if (poolRows.includes(r) && !/^XXX/.test(r.operario) && OPERARIOS.includes(r.operario) && !rows.some(x => tkey(x) === key)) rows.push(r);
}
// Lote de asignaciones: un solo mensaje a la pestaña de ATGO, que las guarda de 4 en 4 y contesta cada una al terminarla.
let lotePend = new Map();   // id → { key, datos, resolve }
function enviarLoteAtgo(items, alResultado) {
  const src = hiloFuente();
  if (!src || src.closed) return Promise.resolve(items.map(() => ({ ok: false, error: 'sin pestaña de ATGO', sinAtgo: true })));
  const ps = items.map(it => new Promise(resolve => {
    it.id = 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    lotePend.set(it.id, { key: it.key, datos: it.datos, resolve: res => { if (alResultado) alResultado(res); resolve(res); } });
  }));
  try { src.postMessage({ type: 'despacho-editar-lote', items: items.map(it => ({ id: it.id, key: it.key, accion: 'asignar', ...it.datos })) }, ATGO_ORIGIN); }
  catch (e) { items.forEach(it => { const p = lotePend.get(it.id); lotePend.delete(it.id); if (p) p.resolve({ ok: false, error: 'sin contacto con ATGO', sinAtgo: true }); }); }
  // Tiempo de espera según el tamaño (4 a la vez, ~10 s cada tanda en el peor caso)
  setTimeout(() => items.forEach(it => {
    const p = lotePend.get(it.id); if (!p) return;
    lotePend.delete(it.id); editTarde[it.id] = { key: it.key, accion: 'asignar', datos: it.datos, ts: Date.now() };
    registrarEdicion({ key: it.key, num: (ticketDe(it.key) || {}).num, accion: 'asignar', detalle: it.datos.resumen, ok: false, error: 'sin respuesta de ATGO' });
    p.resolve({ ok: false, error: 'sin respuesta de ATGO: comprueba en ATGO si se aplicó' });
  }), EDIT_TIMEOUT_MS + Math.ceil(items.length / 4) * 12000);
  return Promise.all(ps);
}

function registrarEdicion(o) {
  ediciones = [{ ts: Date.now(), ...o }, ...ediciones].filter(e => Date.now() - e.ts < 30 * 86400000).slice(0, 300);
  lsSet(EDIT_KEY, ediciones);
}
function edicionesDe(key) { return ediciones.filter(e => e.key === key); }

// ---- Ventana de confirmación ----
function confirmar(html, okLabel, peligro) {
  return new Promise(res => {
    const m = document.getElementById('modal');
    if (m.__fin) m.__fin(false);   // otra confirmación a medias: queda cancelada
    m.innerHTML = `<div class="md-box md-confirm"><div class="md-txt">${html}</div>
      <div class="acts" style="justify-content:flex-end"><button class="btn" id="mdNo">Cancelar</button><button class="btn pri${peligro ? ' warn' : ''}" id="mdSi">${esc(okLabel)}</button></div></div>`;
    m.hidden = false;
    const fin = v => { m.__fin = null; m.hidden = true; res(v); };
    m.__fin = fin;   // si se cierra con Esc o con otra ventana, cuenta como «Cancelar» (cerrarModal)
    document.getElementById('mdNo').onclick = () => fin(false);
    document.getElementById('mdSi').onclick = () => fin(true);
    document.getElementById('mdSi').focus();
  });
}

// ---- Enviar a ATGO ----
function enviarEdicion(accion, key, datos) {
  return new Promise(resolve => {
  if (editPend) { toast('Espera a que termine el cambio anterior'); resolve({ ok: false, error: 'otro cambio en curso' }); return; }
  const src = hiloFuente();
  if (!src || src.closed) { toast('Abre ATGO y pulsa el favorito ⟳ Despacho ATGO'); resolve({ ok: false, error: 'sin pestaña de ATGO', sinAtgo: true }); return; }
  const id = 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  // Para "Deshacer": cómo estaba antes lo que se va a cambiar
  const r0 = ticketDe(key) || {}, antes = {};
  if (accion === 'asignar' && !datos.esDeshacer && !datos.sinDeshacer) {
    if ('codOpe' in datos) antes.codOpe = cleanInitials(r0.operario);
    if ('fechaVisita' in datos && fechaIsoDe(r0)) antes.fechaVisita = fechaIsoDe(r0);
    if ('horaInicio' in datos || 'fechaVisita' in datos) antes.horaInicio = r0.desdeHora || '';
    if ('horaFin' in datos || 'fechaVisita' in datos) antes.horaFin = r0.hastaHora || '';
  }
  editPend = { id, key, accion, t0: Date.now(), datos, resolve, antes, sinFechaAntes: 'fechaVisita' in datos && !fechaIsoDe(r0) };
  try { src.postMessage({ type: 'despacho-editar', id, key, accion, ...datos }, ATGO_ORIGIN); }
  catch (e) { editPend = null; toast('No se pudo contactar con la pestaña de ATGO'); resolve({ ok: false, error: 'sin contacto con ATGO', sinAtgo: true }); return; }
  if (fichaKey) renderFicha();
  setTimeout(() => {
    if (!editPend || editPend.id !== id) return;
    const r = ticketDe(key) || {};
    registrarEdicion({ key, num: r.num, accion, detalle: datos.resumen, ok: false, error: 'sin respuesta de ATGO' });
    editTarde[id] = { key, accion, datos, ts: Date.now() };   // si ATGO contesta luego, se apunta el resultado real
    editPend = null;
    anotarResultado(key, false, 'ATGO no ha respondido. Comprueba en ATGO si se aplicó antes de repetirlo.');
    if (fichaKey === key) renderFicha();
    resolve({ ok: false, error: 'sin respuesta de ATGO' });
  }, EDIT_TIMEOUT_MS);
  });
}
// Respuestas que llegan después del tiempo de espera: el cambio pudo aplicarse igualmente
let editTarde = {};
function recibirEdicionTarde(m) {
  const t = editTarde[m.id]; delete editTarde[m.id];
  const r = ticketDe(t.key) || {};
  const error = errorAtgo(m.error);
  registrarEdicion({ key: t.key, num: r.num, accion: t.accion, detalle: t.datos.resumen + ' (respuesta tardía)', ok: !!m.ok, error, dif: m.dif || null });
  if (m.hilo) recibirHilos({ [t.key]: m.hilo });
  if (m.ok) confirmar(`<b>ATGO respondió tarde, pero sí se aplicó ✓</b><p>Nº ${esc(r.num || t.key)} · ${esc(t.datos.resumen || '')}</p><p class="hint">No lo repitas: ya está guardado y comprobado.</p>`, 'Entendido');
  else toast('ATGO respondió tarde: no se aplicó · ' + error);
  if (fichaKey === t.key) renderFicha();
}
// Mensajes de ATGO más claros para los fallos habituales
function errorAtgo(e) {
  const s = String(e || 'error desconocido');
  const cod = (/ATGO respondió (\d{3})/.exec(s) || [])[1];
  if (cod === '401' || /^la sesión de ATGO ha caducado/.test(s)) return 'la sesión de ATGO ha caducado: vuelve a iniciar sesión en ATGO y repítelo';
  if (cod === '400') return 'ATGO no acepta el cambio en este ticket (400). Detalle: ' + s.replace(/^.*?ATGO respondió 400:?\s*/, '').slice(0, 300) + '. Prueba a hacerlo en ATGO y, si allí funciona, pásame este mensaje';
  if (cod === '403') return 'ATGO no permite este cambio a tu usuario (403). Prueba a hacerlo en ATGO; si allí sí deja, avisa';
  if (/(^|\D)404(\D|$)/.test(s)) return 'ATGO no encuentra el ticket (puede que ya no exista o haya cambiado)';
  if (/(^|\D)5\d\d(\D|$)|failed to fetch|network/i.test(s)) return 'ATGO no responde ahora mismo (' + s.slice(0, 80) + '). Comprueba en ATGO si se aplicó antes de repetirlo';
  return s;
}
function recibirEdicion(m) {
  if (m && editTarde[m.id]) { recibirEdicionTarde(m); return; }
  if (m && lotePend.has(m.id)) {
    const p = lotePend.get(m.id); lotePend.delete(m.id);
    if (!m.ok) m = { ...m, error: errorAtgo(m.error), sinAtgo: /sesión de ATGO ha caducado/.test(errorAtgo(m.error)) };
    registrarEdicion({ key: p.key, num: (ticketDe(p.key) || {}).num, accion: 'asignar', detalle: p.datos.resumen, ok: !!m.ok, error: m.error || '', dif: m.dif || null });
    if (m.ok) aplicarFila(p.key, m.fila);
    p.resolve(m); return;
  }
  if (!editPend || m.id !== editPend.id) return;
  const { key, accion, datos, resolve, antes, sinFechaAntes } = editPend;
  editPend = null;
  const r = ticketDe(key) || {};
  if (!m.ok) m = { ...m, error: errorAtgo(m.error), sinAtgo: /sesión de ATGO ha caducado/.test(errorAtgo(m.error)) };
  registrarEdicion({ key, num: r.num, accion, detalle: datos.resumen, ok: !!m.ok, error: m.error || '', dif: m.dif || null });
  if (m.hilo) recibirHilos({ [key]: m.hilo });
  if (m.ok && m.fila) { aplicarFila(key, m.fila); refreshVisible(); }
  if (m.ok) {
    anotarResultado(key, true, accion === 'comentario' ? 'Comentario publicado en ATGO ✓' : accion === 'asignar' ? 'Guardado en ATGO ✓ · comprobado campo a campo' : 'Estado cambiado en ATGO ✓ · ' + (m.estadoActual || ''));
    if (accion === 'comentario' && fichaKey === key) { const ta = document.getElementById('edCom'); if (ta) ta.value = ''; }
    if (accion === 'asignar' && antes && Object.keys(antes).length) ofrecerDeshacer(key, r, antes, sinFechaAntes);
  } else anotarResultado(key, false, 'No se aplicó: ' + (m.error || 'error desconocido'));
  if (fichaKey === key) { renderFicha(); verResultado(); }
  if (resolve) resolve(m);
}

async function publicarComentario() {
  const key = fichaKey, ta = document.getElementById('edCom');
  const texto = (ta && ta.value || '').trim();
  if (!texto) { toast('Escribe el comentario'); ta && ta.focus(); return; }
  if (texto.length > 4000) { toast('El comentario es demasiado largo'); return; }
  const r = ticketDe(key) || {};
  const ok = await confirmar(`<b>Publicar en el hilo de ATGO</b><p>Nº ${esc(r.num || key)} · ${esc(r.descSede || '')}</p>
    <div class="dw-txt">${esc(texto)}</div><p class="hint">Quedará a tu nombre y lo verán el técnico y el resto de usuarios del ticket.</p>`, 'Publicar');
  if (ok) enviarEdicion('comentario', key, { texto, resumen: 'Comentario: ' + texto.slice(0, 120) });
}
async function cambiarEstadoAtgo() {
  const key = fichaKey, sel = document.getElementById('edEst');
  const est = sel && Number(sel.value);
  if (!est && est !== 0) { toast('Elige el nuevo estado'); return; }
  const r = ticketDe(key) || {};
  const nuevo = atgoEstados.find(x => x.estado === est);
  if (!nuevo) return;
  const cierra = nuevo.cierra === 'S';
  const ok = await confirmar(`<b>Cambiar el estado en ATGO</b><p>Nº ${esc(r.num || key)} · ${esc(r.descSede || '')}</p>
    <p class="md-chg"><span>${esc(r.estado || '—')}</span> → <b>${esc(nuevo.desEstado)}</b></p>
    ${cierra ? '<p class="md-warn">Este estado <b>cierra</b> el ticket en ATGO. Puede que no se pueda deshacer desde Despacho.</p>' : ''}
    <p class="hint">Quedará registrado a tu nombre en ATGO.</p>`, cierra ? 'Cerrar el ticket' : 'Cambiar estado', cierra);
  if (ok) enviarEdicion('estado', key, { estado: est, resumen: (r.estado || '') + ' → ' + nuevo.desEstado });
}

// ---- Fase 2: asignar técnico y fecha/hora de visita ----
function fase2Activa() { return atgoCaps.includes('asignar'); }
function preAsignar(op) { const s = document.getElementById('asOp'); if (s) { s.value = op; s.dispatchEvent(new Event('change')); s.scrollIntoView({ block: 'nearest' }); } }
function fechaIsoDe(r) { const d = parseEs(r.fVisita); return d ? isoHoy(d) : ''; }
async function asignarAtgo() {
  const key = fichaKey, r = ticketDe(key) || {};
  const op = document.getElementById('asOp').value, f = document.getElementById('asFecha').value;
  const h1 = document.getElementById('asH1').value, h2 = document.getElementById('asH2').value;
  const datos = {}, cambios = [];
  if (op && op !== cleanInitials(r.operario)) { datos.codOpe = op; cambios.push(['Técnico', r.operario || '—', op + (nombreDe(op) ? ' · ' + nombreDe(op) : '')]); }
  if (f && f !== fechaIsoDe(r)) { datos.fechaVisita = f; cambios.push(['Fecha de visita', r.fVisita || '—', f.split('-').reverse().join('/')]); }
  if (h1 !== (r.desdeHora || '')) { datos.horaInicio = h1; cambios.push(['Hora desde', r.desdeHora || '—', h1 || '—']); }
  if (h2 !== (r.hastaHora || '')) { datos.horaFin = h2; cambios.push(['Hora hasta', r.hastaHora || '—', h2 || '—']); }
  if (!cambios.length) { toast('No has cambiado nada'); return; }
  if (!f && !r.fVisita && (h1 || h2)) { toast('Pon también la fecha de visita'); return; }
  if (h1 && h2 && h2 <= h1) { toast('La hora "hasta" debe ser posterior a "desde"'); return; }
  const ok = await confirmar(`<b>Guardar en ATGO</b><p>Nº ${esc(r.num || key)} · ${esc(r.descSede || '')}</p>
    <table class="md-tab">${cambios.map(([k, a, b]) => `<tr><td>${esc(k)}</td><td><span>${esc(a)}</span> → <b>${esc(b)}</b></td></tr>`).join('')}</table>
    ${datos.codOpe ? sedeConfirmHtml(r, datos.codOpe) : ''}
    <p class="hint">ATGO guarda la ficha completa: Despacho reenvía el resto tal cual, comprueba campo a campo y, si cambiara algo más, restaura la ficha original.${datos.codOpe ? ' El técnico puede recibir un aviso de ATGO.' : ''}</p>`, 'Guardar en ATGO');
  if (ok) enviarEdicion('asignar', key, { ...datos, resumen: cambios.map(([k, a, b]) => `${k}: ${a} → ${b}`).join(' · ') });
}
// ---- Deshacer la última asignación (30 s) ----
// Vuelve a guardar el técnico y la fecha/horas anteriores, con la misma confirmación y comprobación.
let deshacerT = null;
function ofrecerDeshacer(key, r, antes, sinFechaAntes) {
  let bar = document.getElementById('undoBar');
  if (!bar) { bar = document.createElement('div'); bar.id = 'undoBar'; bar.className = 'undo-bar'; document.body.appendChild(bar); }
  bar.innerHTML = `<span>Asignación guardada · Nº ${esc(r.num || key)}</span><button class="btn sm" id="undoBtn">Deshacer</button><button class="iconbtn sm" onclick="this.parentNode.hidden=true" aria-label="Cerrar">✕</button>`;
  bar.hidden = false;
  clearTimeout(deshacerT); deshacerT = setTimeout(() => { bar.hidden = true; }, 30000);
  document.getElementById('undoBtn').onclick = async () => {
    bar.hidden = true; clearTimeout(deshacerT);
    const ok = await confirmar(`<b>Deshacer en ATGO</b><p>Nº ${esc(r.num || key)} · ${esc(r.descSede || '')}</p>
      <table class="md-tab">${'codOpe' in antes ? `<tr><td>Técnico</td><td>vuelve a <b>${esc(antes.codOpe || '—')}</b></td></tr>` : ''}${antes.fechaVisita ? `<tr><td>Fecha de visita</td><td>vuelve al <b>${esc(antes.fechaVisita.split('-').reverse().join('/'))}</b></td></tr>` : ''}${'horaInicio' in antes ? `<tr><td>Horas</td><td><b>${esc(antes.horaInicio || '—')} – ${esc(antes.horaFin || '—')}</b></td></tr>` : ''}</table>
      ${sinFechaAntes ? '<p class="md-warn">Antes no tenía fecha de visita: ATGO no deja quitarla desde Despacho. Quítala en ATGO si hace falta.</p>' : ''}`, 'Deshacer');
    if (ok) enviarEdicion('asignar', key, { ...antes, esDeshacer: true, resumen: 'Deshacer: ' + Object.entries(antes).map(([k, v]) => k + ' → ' + (v || '—')).join(' · ') });
  };
}
function nombreDe(op) { const r = rows.find(x => cleanInitials(x.operario) === op && x.desOperario); return r ? nombreTecnico(r) : ''; }
function difHtml(dif) {
  const ks = Object.keys(dif || {}); if (!ks.length) return '';
  const fmt = x => x === null || x === undefined ? '—' : String(x);
  return `<details class="ed-dif"><summary>Comprobación en ATGO: ${ks.length} campo${ks.length === 1 ? '' : 's'} cambiado${ks.length === 1 ? '' : 's'}</summary><ul>${ks.map(k => `<li><b>${esc(k)}</b>: ${esc(fmt(dif[k].antes))} → ${esc(fmt(dif[k].despues))}</li>`).join('')}</ul></details>`;
}
function asignarHtml(key, r, pend) {
  if (!fase2Activa()) return '';
  // Mismo selector que en Sin asignar (opcionesTecnico, panel.js): cualquier técnico de cualquier perfil,
  // con los recomendados de su zona primero. Si el actual es un comodín "PENDIENTE ASIGNAR", sale como primera opción.
  const rec = recomendar(r, nextWorkday()) || [];
  const actual = cleanInitials(r.operario);
  const opciones = opcionesTecnico(rec, actual, TODOS_OPS.includes(actual) ? false : `Sin técnico (${actual || '—'})`);
  const ult = edicionesDe(key).find(e => e.accion === 'asignar');
  const sug = sugerirTecnico(r, nextWorkday()), best = sug && sug.lista[0] && sug.lista[0].op !== actual ? sug.lista[0].op : '';
  return `<div class="ed-asig">
    <div class="dw-h" style="margin-top:6px">Planificar en ATGO</div>
    ${best && !pend ? `<div class="acts"><button class="btn sm pri" onclick="preAsignar('${jsq(best)}');asignarAtgo()" title="Técnico recomendado: ${esc(sug.lista[0].sede ? 'ya tiene otra incidencia en esta sede' : 'menos carga el próximo laborable')}">Asignar a ★ ${esc(best)}</button>${sedeAvisoHtml(r, actual)}</div>` : sedeAvisoHtml(r, actual)}
    <div class="ed-grid">
      <label>Técnico<select id="asOp"${pend ? ' disabled' : ''} onchange="const a=document.getElementById('asSede');if(a)a.innerHTML=sedeAvisoHtml(ticketDe(fichaKey),this.value)">${opciones}</select><span id="asSede"></span></label>
      <label>Fecha de visita <i>(opcional)</i><input type="date" id="asFecha" value="${esc(fechaIsoDe(r))}"${pend ? ' disabled' : ''}></label>
      <label>Desde <i>(opcional)</i><input type="time" id="asH1" value="${esc(r.desdeHora || '')}"${pend ? ' disabled' : ''}></label>
      <label>Hasta <i>(opcional)</i><input type="time" id="asH2" value="${esc(r.hastaHora || '')}"${pend ? ' disabled' : ''}></label>
    </div>
    <div class="acts"><button class="btn" onclick="asignarAtgo()"${pend ? ' disabled' : ''}>Guardar en ATGO</button></div>
    ${ult && ult.dif ? difHtml(ult.dif) : ''}
  </div>`;
}

// ---- Sección "Actuar en ATGO" de la ficha ----
// Lleva a la vista el resultado (la ficha puede estar desplazada más abajo, en el formulario)
function verResultado() { setTimeout(() => { const el = document.getElementById('edRes'); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 50); }
function edicionHtml(key, r) {
  if (!r || !/^\d+\/[^/]+\/\d+$/.test(key)) return '';
  const pend = editPend && editPend.key === key;
  const hist = edicionesDe(key);
  const histHtml = hist.length ? `<ul class="dw-hist ed-hist">${hist.slice(0, 8).map(e => `<li class="${e.ok ? '' : 'ko'}"><span>${esc(cuando(e.ts))}</span>${e.ok ? '✓' : '✕'} ${esc(e.detalle || e.accion)}${e.ok ? '' : ' · ' + esc(e.error || 'no aplicado')}</li>`).join('')}</ul>` : '';
  if (!puedeEditar()) {
    return `<div class="dw-sec"><div class="dw-h">Actuar en ATGO</div>
      <div class="dw-empty">${hiloFuente() ? 'Recarga la pestaña de ATGO y vuelve a pulsar el favorito ⟳ Despacho ATGO para activar la edición.' : 'Abre ATGO y pulsa el favorito ⟳ Despacho ATGO para poder comentar o cambiar el estado desde aquí.'}</div>${histHtml}</div>`;
  }
  const opciones = atgoEstados.filter(x => norm(x.desEstado) !== norm(r.estado));
  return `<div class="dw-sec">
    <div class="dw-h">Actuar en ATGO <small>con tu usuario</small></div>
    ${pend ? `<div class="ed-pend" role="status">⏳ Enviando a ATGO y comprobando… no cierres la pestaña de ATGO.</div>` : ''}
    ${!pend && edResultado && edResultado.key === key && Date.now() - edResultado.ts < 120000 ? `<div class="ed-res ${edResultado.ok ? 'ok' : 'ko'}" id="edRes" role="status"><span>${esc(edResultado.txt)}</span><small>${esc(hhmm(edResultado.ts))}</small><button class="iconbtn sm" onclick="edResultado=null;this.parentNode.remove()" aria-label="Cerrar aviso">✕</button></div>` : ''}
    ${frasesHtml(r)}
    <textarea id="edCom" rows="2" placeholder="Comentario para el hilo del ticket (lo verá el técnico)"${pend ? ' disabled' : ''}></textarea>
    <div class="acts"><button class="btn" onclick="publicarComentario()"${pend ? ' disabled' : ''}>Publicar en el hilo</button></div>
    <div class="ed-row">
      <select id="edEst"${pend ? ' disabled' : ''}><option value="">Cambiar estado a…</option>${opciones.map(x => `<option value="${x.estado}">${esc(x.desEstado)}${x.cierra === 'S' ? ' (cierra)' : ''}</option>`).join('')}</select>
      <button class="btn" onclick="cambiarEstadoAtgo()"${pend ? ' disabled' : ''}>Cambiar</button>
    </div>
    ${asignarHtml(key, r, pend)}
    ${histHtml}
  </div>`;
}
