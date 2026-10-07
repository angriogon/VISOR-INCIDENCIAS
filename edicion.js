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
  registrarEdicion({ key, num: r.num, accion, detalle: datos.resumen, ok: !!m.ok, error: m.error || '' });
  if (m.hilo) recibirHilos({ [key]: m.hilo });
  if (m.ok) {
    toast(accion === 'comentario' ? 'Comentario publicado en ATGO ✓' : 'Estado cambiado en ATGO ✓ · ' + (m.estadoActual || ''));
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
    ${histHtml}
  </div>`;
}
