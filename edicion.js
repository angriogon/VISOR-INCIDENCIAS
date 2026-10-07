// ===== Edición en ATGO (fase 1): comentario en el hilo y cambio de estado =====
// Despacho pide el cambio a la pestaña de ATGO (atgo-sync.js), que lo hace con tu sesión y lo comprueba.
// Usa utilidades de index.html, dia.js y herramientas.js solo en tiempo de llamada.

const EDIT_KEY = 'dispatcher_ediciones_v1';
const EDIT_TIMEOUT_MS = 25000;
let ediciones = lsGet(EDIT_KEY, []);
let atgoCaps = [], atgoEstados = [];
let editPend = null;   // { id, key, accion, t0 } mientras se espera respuesta

// Llamado desde index.html al recibir datos de ATGO: qué sabe hacer la pestaña de ATGO y su lista de estados
function recibirCapacidades(m) {
  if (Array.isArray(m.caps)) atgoCaps = m.caps;
  if (Array.isArray(m.estados) && m.estados.length) atgoEstados = m.estados;
}
function puedeEditar() { return atgoCaps.includes('editar') && !!hiloFuente(); }

function registrarEdicion(o) {
  ediciones = [{ ts: Date.now(), ...o }, ...ediciones].filter(e => Date.now() - e.ts < 30 * 86400000).slice(0, 300);
  lsSet(EDIT_KEY, ediciones);
}
function edicionesDe(key) { return ediciones.filter(e => e.key === key); }

// ---- Ventana de confirmación ----
function confirmar(html, okLabel, peligro) {
  return new Promise(res => {
    const m = document.getElementById('modal');
    m.innerHTML = `<div class="md-box md-confirm"><div class="md-txt">${html}</div>
      <div class="acts" style="justify-content:flex-end"><button class="btn" id="mdNo">Cancelar</button><button class="btn pri${peligro ? ' warn' : ''}" id="mdSi">${esc(okLabel)}</button></div></div>`;
    m.hidden = false;
    const fin = v => { m.hidden = true; res(v); };
    document.getElementById('mdNo').onclick = () => fin(false);
    document.getElementById('mdSi').onclick = () => fin(true);
    document.getElementById('mdSi').focus();
  });
}

// ---- Enviar a ATGO ----
function enviarEdicion(accion, key, datos) {
  if (editPend) { toast('Espera a que termine el cambio anterior'); return; }
  const src = hiloFuente();
  if (!src) { toast('Abre ATGO y pulsa el favorito ⟳ Despacho ATGO'); return; }
  const id = 'e' + Date.now().toString(36);
  editPend = { id, key, accion, t0: Date.now(), datos };
  try { src.postMessage({ type: 'despacho-editar', id, key, accion, ...datos }, ATGO_ORIGIN); }
  catch (e) { editPend = null; toast('No se pudo contactar con la pestaña de ATGO'); return; }
  renderFicha();
  setTimeout(() => {
    if (!editPend || editPend.id !== id) return;
    const r = rows.find(x => tkey(x) === key) || {};
    registrarEdicion({ key, num: r.num, accion, detalle: datos.resumen, ok: false, error: 'sin respuesta de ATGO' });
    editPend = null;
    toast('ATGO no ha respondido. Comprueba en ATGO si se aplicó antes de repetirlo.');
    if (fichaKey === key) renderFicha();
  }, EDIT_TIMEOUT_MS);
}
function recibirEdicion(m) {
  if (!editPend || m.id !== editPend.id) return;
  const { key, accion, datos } = editPend;
  editPend = null;
  const r = rows.find(x => tkey(x) === key) || {};
  registrarEdicion({ key, num: r.num, accion, detalle: datos.resumen, ok: !!m.ok, error: m.error || '', dif: m.dif || null });
  if (m.hilo) recibirHilos({ [key]: m.hilo });
  if (m.ok) {
    toast(accion === 'comentario' ? 'Comentario publicado en ATGO ✓' : accion === 'asignar' ? 'Guardado en ATGO ✓ · comprobado campo a campo' : 'Estado cambiado en ATGO ✓ · ' + (m.estadoActual || ''));
    if (accion === 'comentario' && fichaKey === key) { const ta = document.getElementById('edCom'); if (ta) ta.value = ''; }
  } else toast('No se aplicó: ' + (m.error || 'error desconocido'));
  if (fichaKey === key) renderFicha();
}

async function publicarComentario() {
  const key = fichaKey, ta = document.getElementById('edCom');
  const texto = (ta && ta.value || '').trim();
  if (!texto) { toast('Escribe el comentario'); ta && ta.focus(); return; }
  if (texto.length > 4000) { toast('El comentario es demasiado largo'); return; }
  const r = rows.find(x => tkey(x) === key) || {};
  const ok = await confirmar(`<b>Publicar en el hilo de ATGO</b><p>Nº ${esc(r.num || key)} · ${esc(r.descSede || '')}</p>
    <div class="dw-txt">${esc(texto)}</div><p class="hint">Quedará a tu nombre y lo verán el técnico y el resto de usuarios del ticket.</p>`, 'Publicar');
  if (ok) enviarEdicion('comentario', key, { texto, resumen: 'Comentario: ' + texto.slice(0, 120) });
}
async function cambiarEstadoAtgo() {
  const key = fichaKey, sel = document.getElementById('edEst');
  const est = sel && Number(sel.value);
  if (!est && est !== 0) { toast('Elige el nuevo estado'); return; }
  const r = rows.find(x => tkey(x) === key) || {};
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
// Hasta que la valides, solo funciona en el ticket de prueba. Luego se activa para todos en ⚙.
const FASE2_PRUEBA = '2026/00/97784';
function fase2Activa(key) { return atgoCaps.includes('asignar') && (tecCfg.fase2 === 'todos' || key === FASE2_PRUEBA); }
function preAsignar(op) { const s = document.getElementById('asOp'); if (s) { s.value = op; s.dispatchEvent(new Event('change')); s.scrollIntoView({ block: 'nearest' }); } }
function fechaIsoDe(r) { const d = parseEs(r.fVisita); return d ? isoHoy(d) : ''; }
async function asignarAtgo() {
  const key = fichaKey, r = rows.find(x => tkey(x) === key) || {};
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
    <p class="hint">ATGO guarda la ficha completa: Despacho reenvía el resto tal cual, comprueba campo a campo y, si cambiara algo más, restaura la ficha original.${datos.codOpe ? ' El técnico puede recibir un aviso de ATGO.' : ''}</p>`, 'Guardar en ATGO');
  if (ok) enviarEdicion('asignar', key, { ...datos, resumen: cambios.map(([k, a, b]) => `${k}: ${a} → ${b}`).join(' · ') });
}
function nombreDe(op) { const r = rows.find(x => cleanInitials(x.operario) === op && x.desOperario); return r ? nombreTecnico(r) : ''; }
function difHtml(dif) {
  const ks = Object.keys(dif || {}); if (!ks.length) return '';
  const fmt = x => x === null || x === undefined ? '—' : String(x);
  return `<details class="ed-dif"><summary>Comprobación en ATGO: ${ks.length} campo${ks.length === 1 ? '' : 's'} cambiado${ks.length === 1 ? '' : 's'}</summary><ul>${ks.map(k => `<li><b>${esc(k)}</b>: ${esc(fmt(dif[k].antes))} → ${esc(fmt(dif[k].despues))}</li>`).join('')}</ul></details>`;
}
function asignarHtml(key, r, pend) {
  if (!fase2Activa(key)) return '';
  const ops = [...dispatcherOps(), ...TECNICOS];
  const ult = edicionesDe(key).find(e => e.accion === 'asignar');
  return `<div class="ed-asig">
    <div class="dw-h" style="margin-top:6px">Planificar en ATGO ${key === FASE2_PRUEBA && tecCfg.fase2 !== 'todos' ? '<small>en prueba: solo este ticket</small>' : ''}</div>
    <div class="ed-grid">
      <label>Técnico<select id="asOp"${pend ? ' disabled' : ''}>${ops.map(op => `<option value="${esc(op)}"${op === cleanInitials(r.operario) ? ' selected' : ''}>${esc(op)} · ${esc(zonaDe(op))}</option>`).join('')}</select></label>
      <label>Fecha de visita<input type="date" id="asFecha" value="${esc(fechaIsoDe(r))}"${pend ? ' disabled' : ''}></label>
      <label>Desde<input type="time" id="asH1" value="${esc(r.desdeHora || '')}"${pend ? ' disabled' : ''}></label>
      <label>Hasta<input type="time" id="asH2" value="${esc(r.hastaHora || '')}"${pend ? ' disabled' : ''}></label>
    </div>
    <div class="acts"><button class="btn" onclick="asignarAtgo()"${pend ? ' disabled' : ''}>Guardar en ATGO</button></div>
    ${ult && ult.dif ? difHtml(ult.dif) : ''}
  </div>`;
}

// ---- Sección "Actuar en ATGO" de la ficha ----
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
    ${pend ? `<div class="ed-pend">Enviando a ATGO y comprobando… no cierres la pestaña de ATGO.</div>` : ''}
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
