// ===== Mi día: seguimiento, avisos, notas, búsqueda, rutina y resumen =====
// Despacho es un visor: nada de esto modifica ATGO ni el ERP. Todo se guarda en este equipo.
// Usa utilidades de index.html (rows, esc, toast, norm, ZONAS, nextWorkday, ddmmyyyy, …) en tiempo de llamada.

const SNAP_KEY = 'dispatcher_snap_v1', EVT_KEY = 'dispatcher_eventos_v1', NOTAS_KEY = 'dispatcher_notas_v1';
const RUT_KEY = 'dispatcher_rutina_v1', ENV_KEY = 'dispatcher_envios_v1', AVI_KEY = 'dispatcher_avisos_v1';
const PARADO_SIN_CAMBIOS = 3;   // días sin cambios para considerar un ticket parado
const PARADO_ANTIGUEDAD = 15;   // días desde el registro para considerarlo parado
const ESTADOS_ESPERA = ['EN FABRICANTE', 'MATERIAL PTE. FABRICANTE', 'PTE. MOVER MATERIAL', 'ESCALADO TIER1', 'FUERA DE MANTENIMIENTO'];
const RUTINA_DEF = ['Revisar novedades y tickets a mi nombre', 'Planificar visitas sin fecha o vencidas', 'Revisar escalados y tickets parados', 'Enviar las rutas de mañana por WhatsApp', 'Enviar el resumen del día'];

function lsGet(k, def) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { toast('No se pudo guardar en este equipo'); } }

let segSnap = lsGet(SNAP_KEY, { start: 0, items: {} });
let eventos = lsGet(EVT_KEY, []);
let notas = lsGet(NOTAS_KEY, {});
let rutina = lsGet(RUT_KEY, null) || { items: RUTINA_DEF.map((t, i) => ({ id: 'r' + i, t })), hechos: {} };
let envios = lsGet(ENV_KEY, {});
let avisos = { on: false, miNombre: true, escalado: true, ruta: true, nuevos: false, ...lsGet(AVI_KEY, {}) };
let novFiltro = 'nv', rutEdit = false, diaPending = false;

function tkey(r) { return String(r.key || r.num); }
function dispatcherOps() { return ZONAS.filter(z => z.dispatcher).flatMap(z => z.ops); }
function esMio(op) { return dispatcherOps().includes(cleanInitials(op)); }
function isoHoy(d) { const x = d || new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
function parseEs(s) { const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(s || ''); return m ? new Date(+m[3], +m[2] - 1, +m[1], 12) : null; }
function parseIso(s) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null; }
function registro(r) {
  if (r.fRegistroISO) { const d = new Date(r.fRegistroISO); if (!isNaN(d)) return d; }
  const m = /^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s+(\d{2}):(\d{2}))?/.exec(r.fRegistro || '');
  return m ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)) : null;
}
function dias(desde) { if (!desde) return null; return Math.floor((Date.now() - +desde) / 86400000); }
function hhmm(ts) { return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }
function cuando(ts) { const d = new Date(ts); return isoHoy(d) === isoHoy() ? hhmm(ts) : d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ' + hhmm(ts); }
function visTxt(f, h, h2) { return f ? f + (h ? ' ' + h + (h2 ? '–' + h2 : '') : '') : ''; }
function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
// "GARCIA SUTIL, JESUS" → "Jesus Garcia Sutil"
function nombreTecnico(r) {
  const tc = s => s.toLowerCase().replace(/(^|[\s-])\S/g, c => c.toUpperCase());
  const [ap, nom] = String(r.desOperario || '').split(',').map(s => s.trim());
  return nom ? tc(nom + ' ' + ap) : (ap ? tc(ap) : '');
}

// ===== 1. Detección de cambios entre cargas de ATGO =====
function trackChanges(list) {
  const now = Date.now(), first = !segSnap.start;
  if (first) segSnap.start = now;
  const nuevos = [], seen = new Set();
  const ev = (tipo, r, de, a, extra) => nuevos.push({ id: hash(tipo + tkey(r) + now + nuevos.length), ts: now, key: tkey(r), num: r.num, tipo, de: de || '', a: a || '', op: r.operario || '', sede: r.descSede || '', cli: r.descCliente || '', f: r.fVisita || '', visto: false, ...(extra || {}) });
  list.forEach(r => {
    const k = tkey(r); seen.add(k);
    const cur = { e: r.estado || '', op: r.operario || '', f: r.fVisita || '', h: r.desdeHora || '', h2: r.hastaHora || '', num: r.num, sede: r.descSede || '', cli: r.descCliente || '' };
    const old = segSnap.items[k];
    if (!old) { segSnap.items[k] = { ...cur, miss: 0, last: now }; if (!first) ev('nuevo', r, '', r.estado); return; }
    old.miss = 0;
    let changed = false;
    if (old.e !== cur.e) { ev('estado', r, old.e, cur.e); changed = true; }
    if (old.op !== cur.op) { ev('tecnico', r, old.op, cur.op); changed = true; }
    if (old.f !== cur.f || old.h !== cur.h) { ev('visita', r, visTxt(old.f, old.h) || 'sin fecha', visTxt(cur.f, cur.h) || 'sin fecha', { deF: old.f }); changed = true; }
    Object.assign(old, cur);
    if (changed) old.last = now;
  });
  // Un ticket solo "sale" si falta en dos cargas seguidas (ATGO pagina y a veces se salta alguno).
  Object.entries(segSnap.items).forEach(([k, o]) => {
    if (seen.has(k)) return;
    o.miss = (o.miss || 0) + 1;
    if (o.miss >= 2) { ev('salio', { key: k, num: o.num, operario: o.op, descSede: o.sede, descCliente: o.cli, fVisita: o.f }, o.e, ''); delete segSnap.items[k]; }
  });
  revisarRutasEnviadas(nuevos, now);
  lsSet(SNAP_KEY, segSnap);
  if (nuevos.length) {
    eventos = [...nuevos, ...eventos].filter(e => now - e.ts < 10 * 86400000).slice(0, 600);
    lsSet(EVT_KEY, eventos);
    notificar(nuevos);
  }
  return nuevos;
}
function evTexto(e) {
  switch (e.tipo) {
    case 'nuevo': return 'Nuevo · ' + e.a;
    case 'estado': return e.de + ' → ' + e.a;
    case 'tecnico': return 'Reasignado ' + e.de + ' → ' + e.a;
    case 'visita': return 'Visita ' + e.de + ' → ' + e.a;
    case 'salio': return 'Salió de la lista (estaba en ' + e.de + ')';
    case 'ruta': return 'Su ruta del ' + e.a + ' cambió después de enviarla';
  }
  return e.tipo;
}
function evImportante(e) {
  return (e.tipo === 'nuevo' && esMio(e.op)) || (e.tipo === 'tecnico' && esMio(e.a)) || norm(e.a) === norm('ESCALADO TIER1') || e.tipo === 'ruta';
}
function noVistos() { return eventos.filter(e => !e.visto); }
function marcarVistos(key) {
  let n = 0; eventos.forEach(e => { if (!e.visto && (!key || e.key === key)) { e.visto = true; n++; } });
  if (n) { lsSet(EVT_KEY, eventos); updateDiaBadge(); }
}

// ===== 2. Avisos de Windows =====
async function notificar(list) {
  if (!avisos.on || !('Notification' in window) || Notification.permission !== 'granted') return;
  const M = ddmmyyyy(nextWorkday());
  const rel = list.filter(e =>
    (avisos.miNombre && ((e.tipo === 'nuevo' && esMio(e.op)) || (e.tipo === 'tecnico' && esMio(e.a)))) ||
    (avisos.escalado && norm(e.a) === norm('ESCALADO TIER1')) ||
    (avisos.ruta && (e.tipo === 'ruta' || ((e.f === M || e.deF === M) && e.tipo !== 'nuevo'))) ||
    (avisos.nuevos && e.tipo === 'nuevo'));
  if (!rel.length) return;
  const title = rel.length === 1 ? `Nº ${rel[0].num} · ${rel[0].op}` : `${rel.length} novedades en Despacho`;
  const body = rel.slice(0, 4).map(e => (rel.length > 1 ? `Nº ${e.num} · ` : '') + evTexto(e)).join('\n') + (rel.length > 4 ? `\n…y ${rel.length - 4} más` : '');
  const opts = { body, tag: 'despacho', renotify: true, icon: 'icon-192.png', badge: 'icon-192.png', data: { url: './#dia' } };
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if (reg) await reg.showNotification(title, opts); else new Notification(title, opts);
  } catch (e) { try { new Notification(title, opts); } catch (er) {} }
}
async function activarAvisos() {
  if (!('Notification' in window)) { toast('Este navegador no permite avisos'); return; }
  const p = await Notification.requestPermission();
  avisos.on = p === 'granted'; lsSet(AVI_KEY, avisos);
  toast(avisos.on ? 'Avisos activados' : 'Windows no ha dado permiso para avisar');
  renderCfg();
  if (avisos.on) notificarPrueba();
}
async function notificarPrueba() {
  const opts = { body: 'Así te avisará Despacho de lo importante.', tag: 'despacho-prueba', icon: 'icon-192.png' };
  try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.showNotification('Despacho', opts); else new Notification('Despacho', opts); } catch (e) {}
}

// ===== 11. Rutas enviadas por WhatsApp y cambios posteriores =====
function firmaRuta(op, f) {
  return hash(rows.filter(r => esPresencial(r) && r.fVisita === f && r.operario === op)
    .map(r => [r.num, r.desdeHora, r.hastaHora, r.descSede].join('|')).sort().join('#'));
}
function registrarEnvio(op, f) {
  f = f || ddmmyyyy(manDate);
  envios[f] = envios[f] || {};
  envios[f][op] = { ts: Date.now(), firma: firmaRuta(op, f) };
  // Se guardan solo los últimos 7 días
  Object.keys(envios).forEach(k => { const d = parseEs(k); if (d && dias(d) > 7) delete envios[k]; });
  lsSet(ENV_KEY, envios);
}
function toggleEnviado(op) {
  const f = ddmmyyyy(manDate);
  if (envios[f] && envios[f][op]) { delete envios[f][op]; lsSet(ENV_KEY, envios); }
  else registrarEnvio(op, f);
  renderManana(); updateDiaBadge();
}
function estadoEnvio(op, f) {
  const e = envios[f] && envios[f][op];
  if (!e) return null;
  return { ts: e.ts, cambiada: e.firma !== firmaRuta(op, f) };
}
function envioBadge(op) {
  const s = estadoEnvio(op, ddmmyyyy(manDate));
  if (!s) return '';
  return s.cambiada ? `<span class="env warn" title="La ruta cambió en ATGO después de enviarla">⚠ cambió tras enviar</span>` : `<span class="env ok">✓ enviada ${hhmm(s.ts)}</span>`;
}
function revisarRutasEnviadas(out, now) {
  const f = ddmmyyyy(nextWorkday());
  const env = envios[f]; if (!env) return;
  Object.entries(env).forEach(([op, e]) => {
    const fNow = firmaRuta(op, f);
    if (fNow !== e.firma && e.avisada !== fNow) {
      e.avisada = fNow;
      out.push({ id: hash('ruta' + op + now), ts: now, key: 'ruta:' + op, num: '', tipo: 'ruta', de: '', a: diaLargo(parseEs(f)), op, sede: '', cli: '', f, visto: false });
    }
  });
  lsSet(ENV_KEY, envios);
}
function rutasResumen() {
  const f = ddmmyyyy(nextWorkday());
  const ops = [...new Set(rows.filter(r => esPresencial(r) && r.fVisita === f && TECNICOS.includes(cleanInitials(r.operario))).map(r => r.operario))];
  let enviadas = 0, cambiadas = 0;
  ops.forEach(op => { const s = estadoEnvio(op, f); if (s) { enviadas++; if (s.cambiada) cambiadas++; } });
  return { total: ops.length, enviadas, cambiadas };
}

// ===== 3 y 4. Sin planificar y parados =====
function sinPlanificar() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const pres = rows.filter(r => esPresencial(r));
  const sinFecha = pres.filter(r => !r.fVisita).sort((a, b) => (registro(a) || 0) - (registro(b) || 0));
  const vencidas = pres.filter(r => { const d = parseEs(r.fVisita); return d && d < hoy; }).sort((a, b) => parseEs(a.fVisita) - parseEs(b.fVisita));
  const sinHora = pres.filter(r => { const d = parseEs(r.fVisita); return d && d >= hoy && !r.desdeHora; });
  return { sinFecha, vencidas, sinHora };
}
function parados() {
  const esp = ESTADOS_ESPERA.map(norm);
  return rows.filter(r => esp.includes(norm(r.estado))).map(r => {
    const s = segSnap.items[tkey(r)];
    return { r, abierta: dias(registro(r)), sin: s ? dias(s.last) : null };
  }).filter(x => (x.abierta != null && x.abierta >= PARADO_ANTIGUEDAD) || (x.sin != null && x.sin >= PARADO_SIN_CAMBIOS))
    .sort((a, b) => (b.sin || 0) - (a.sin || 0) || (b.abierta || 0) - (a.abierta || 0));
}

// ===== 5. Notas y seguimientos =====
function notaDe(key) { return notas[key]; }
function guardarNota(key, cambios) {
  const r = rows.find(x => tkey(x) === key) || {};
  const n = { ...(notas[key] || {}), ...cambios, num: r.num || (notas[key] && notas[key].num) || key, sede: r.descSede || (notas[key] && notas[key].sede) || '', op: r.operario || (notas[key] && notas[key].op) || '', ts: Date.now() };
  if (!n.texto && !n.fecha) delete notas[key]; else notas[key] = n;
  lsSet(NOTAS_KEY, notas);
  updateDiaBadge();
}
function seguimientos() {
  const hoy = isoHoy(), lim = isoHoy(new Date(Date.now() + 7 * 86400000));
  const all = Object.entries(notas).filter(([k, n]) => n.fecha && !n.hecho).map(([k, n]) => ({ key: k, ...n }));
  return { pendientes: all.filter(n => n.fecha <= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha)), proximos: all.filter(n => n.fecha > hoy && n.fecha <= lim).sort((a, b) => a.fecha.localeCompare(b.fecha)) };
}
function fechaCorta(iso) { const d = parseIso(iso); if (!d) return ''; const hoy = isoHoy(); if (iso === hoy) return 'hoy'; if (iso < hoy) return 'vencido ' + d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }); return DIAS[d.getDay()].slice(0, 3) + ' ' + d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }); }
// Indicadores en las listas de incidencias
function segBadges(r) {
  const k = tkey(r), n = notas[k];
  const nv = eventos.some(e => !e.visto && e.key === k);
  return (nv ? '<span class="nv-dot" title="Cambios sin ver"></span>' : '') +
    (n ? `<span class="nt-badge${n.fecha && !n.hecho && n.fecha <= isoHoy() ? ' due' : ''}" title="${esc(n.texto || 'Seguimiento')}">✎${n.fecha && !n.hecho ? ' ' + esc(fechaCorta(n.fecha)) : ''}</span>` : '');
}

// ===== 7. Copiar ficha (para pegar en tu plantilla de Outlook) =====
function fichaCampos(r) {
  const d = parseEs(r.fVisita);
  const vis = d ? `${DIAS[d.getDay()]} ${r.fVisita}${r.desdeHora ? (r.hastaHora ? ` de ${r.desdeHora} a ${r.hastaHora}` : ` a las ${r.desdeHora}`) : ''}` : '';
  const tec = nombreTecnico(r);
  return [['Nº incidencia', r.num], ['Cliente', r.descCliente], ['Sede', r.descSede], ['Dirección', r.domicilio], ['Estado', r.estado], ['Visita', vis],
    ['Técnico', tec ? `${tec} (${r.operario})` : r.operario], ['Tipo', r.tipo], ['Referencia', r.referencia]].filter(x => x[1]);
}
async function copiarFicha(key) {
  const r = rows.find(x => tkey(x) === key); if (!r) return;
  const c = fichaCampos(r);
  const text = c.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<table style="font:11pt Calibri,Arial,sans-serif;border-collapse:collapse">${c.map(([k, v]) => `<tr><td style="padding:1px 14px 1px 0;color:#666">${esc(k)}</td><td style="padding:1px 0"><b>${esc(v)}</b></td></tr>`).join('')}</table>`;
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
    toast('Ficha copiada · pégala en tu correo');
  } catch (e) { copyText(text); }
}

// ===== Ficha del ticket (panel lateral) =====
let fichaKey = null;
function openTicket(key) {
  fichaKey = String(key);
  marcarVistos(fichaKey);
  renderFicha();
  document.getElementById('drawer').hidden = false;
  document.body.classList.add('dw-open');
  refreshVisible();
}
function closeTicket() { document.getElementById('drawer').hidden = true; document.body.classList.remove('dw-open'); fichaKey = null; }
function renderFicha() {
  const key = fichaKey, r = rows.find(x => tkey(x) === key);
  const s = segSnap.items[key], n = notas[key] || {};
  const p = document.getElementById('dwPanel');
  const hist = eventos.filter(e => e.key === key);
  const base = r || { num: (s && s.num) || n.num || key, estado: s ? s.e : '', operario: s ? s.op : n.op, descSede: s ? s.sede : n.sede };
  const reg = r && registro(r);
  const campos = r ? [
    ['Cliente', r.descCliente], ['Sede', r.descSede], ['Dirección', r.domicilio], ['Tipo', r.tipo], ['Referencia', r.referencia],
    ['Técnico', [nombreTecnico(r), r.operario, zonaDe(r.operario)].filter(Boolean).join(' · ')],
    ['Visita', visTxt(r.fVisita, r.desdeHora, r.hastaHora) || 'Sin fecha'],
    ['Registro', reg ? reg.toLocaleDateString('es-ES') + ` · hace ${plural(dias(reg), 'día')}` : ''],
    ['Sin cambios', s ? (s.last <= segSnap.start ? `desde que se vigila (${plural(dias(s.last), 'día')})` : plural(dias(s.last), 'día')) : '']
  ].filter(x => x[1]) : [['', 'Este ticket ya no está en la lista de ATGO (cambió a otro estado u operario).']];
  const q = d => isoHoy(d);
  const lunes = (() => { const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return d; })();
  const quick = [['Hoy', q(new Date())], ['Mañana', q(new Date(Date.now() + 86400000))], ['Lunes', q(lunes)], ['+1 semana', q(new Date(Date.now() + 7 * 86400000))]];
  p.innerHTML = `
    <div class="dw-head">
      <div><div class="dw-num mono">Nº ${esc(base.num)}</div>
      <div class="dw-sub">${base.estado ? `<span class="dot" style="background:${colorFor(base.estado)}"></span> <b>${esc(base.estado)}</b>` : ''} ${base.operario ? '· ' + esc(base.operario) : ''}</div></div>
      <button class="iconbtn" onclick="closeTicket()" title="Cerrar (Esc)" aria-label="Cerrar">✕</button>
    </div>
    <div class="dw-acts">
      ${r && r.url && String(r.url).startsWith(ATGO_ORIGIN + '/') ? `<a class="btn pri" href="${esc(r.url)}" target="atgo-ticket" rel="noopener">Abrir en ATGO</a>` : ''}
      ${r ? `<button class="btn" onclick="copiarFicha('${jsq(key)}')" title="Copia los datos con formato para pegarlos en tu plantilla de Outlook">Copiar ficha</button>` : ''}
      <button class="btn" onclick="copyText('${jsq(base.num)}')">Copiar Nº</button>
    </div>
    <dl class="dw-data">${campos.map(([k, v]) => `${k ? `<dt>${esc(k)}</dt>` : ''}<dd${k ? '' : ' class="full"'}>${esc(v)}</dd>`).join('')}</dl>
    <div class="dw-sec">
      <div class="dw-h">Nota y seguimiento</div>
      <textarea id="dwNota" rows="3" placeholder="Nota privada: qué falta, con quién hablaste…">${esc(n.texto || '')}</textarea>
      <div class="dw-quick">
        <span>Revisar:</span>
        ${quick.map(([l, d]) => `<button class="chip sm${n.fecha === d ? ' active' : ''}" onclick="setSeg('${d}')">${l}</button>`).join('')}
        <input type="date" id="dwFecha" value="${esc(n.fecha || '')}" onchange="setSeg(this.value)">
        ${n.fecha ? `<label class="dw-done"><input type="checkbox" ${n.hecho ? 'checked' : ''} onchange="guardarNota(fichaKey,{hecho:this.checked});renderFicha();refreshVisible()"> Hecho</label><button class="chip sm" onclick="setSeg('')">Quitar</button>` : ''}
      </div>
    </div>
    <div class="dw-sec">
      <div class="dw-h">Historial en Despacho</div>
      ${hist.length ? `<ul class="dw-hist">${hist.map(e => `<li><span>${esc(cuando(e.ts))}</span>${esc(evTexto(e))}</li>`).join('')}</ul>` : `<div class="dw-empty">Sin cambios registrados${segSnap.start ? ' desde el ' + new Date(segSnap.start).toLocaleDateString('es-ES') : ''}.</div>`}
    </div>`;
  const ta = document.getElementById('dwNota');
  ta.addEventListener('input', () => { guardarNota(key, { texto: ta.value.trim() }); });
  ta.addEventListener('blur', refreshVisible);
}
function setSeg(fecha) { guardarNota(fichaKey, { fecha, hecho: false }); renderFicha(); refreshVisible(); }

// ===== 13. Buscador rápido (Ctrl+K) =====
let palSel = 0, palItems = [];
const PAL_ACCIONES = [
  { t: 'Ir a Mi día', k: 'inicio hoy', run: () => showTab('dia') },
  { t: 'Ir a Incidencias', k: 'lista', run: () => showTab('inc') },
  { t: 'Ir a Mañana', k: 'rutas planificacion whatsapp', run: () => showTab('man') },
  { t: 'Copiar resumen del día', k: 'informe responsable', run: () => copiarResumenJornada() },
  { t: 'Marcar novedades como vistas', k: 'leido', run: () => { marcarVistos(); refreshVisible(); toast('Novedades marcadas como vistas'); } },
  { t: 'Ver tickets a mi nombre', k: 'dispatcher amrg', run: () => { zonaSel = 'DISPATCHER'; showTab('inc'); } },
  { t: 'Abrir ATGO', k: 'sincronizar', run: () => document.getElementById('atgoBtn').click() }
];
function openPalette() {
  const o = document.getElementById('palette'); o.hidden = false;
  const i = document.getElementById('palInput'); i.value = ''; palSel = 0; palRender(); i.focus();
}
function closePalette() { document.getElementById('palette').hidden = true; }
function palRender() {
  const q = norm(document.getElementById('palInput').value), toks = q.split(/\s+/).filter(Boolean);
  const acc = PAL_ACCIONES.filter(a => !toks.length || toks.every(t => norm(a.t + ' ' + a.k).includes(t))).map(a => ({ type: 'a', a }));
  const tks = toks.length ? rows.filter(r => { const hay = norm([r.num, r.operario, r.desOperario, r.estado, r.descSede, r.descCliente, r.domicilio, r.referencia, r.tipo, (notas[tkey(r)] || {}).texto].join(' ')); return toks.every(t => hay.includes(t)); }).slice(0, 30).map(r => ({ type: 't', r })) : [];
  palItems = toks.length ? [...tks, ...acc] : acc;
  palSel = Math.min(palSel, Math.max(0, palItems.length - 1));
  document.getElementById('palList').innerHTML = palItems.length ? palItems.map((it, i) => it.type === 'a'
    ? `<li class="${i === palSel ? 'on' : ''}" data-i="${i}"><span class="pa">→</span>${esc(it.a.t)}</li>`
    : `<li class="${i === palSel ? 'on' : ''}" data-i="${i}"><b class="mono">${esc(it.r.num)}</b> <span>${esc(it.r.operario)} · ${esc(it.r.estado)}</span><small>${esc([it.r.descSede, it.r.descCliente].filter(Boolean).join(' · '))}</small></li>`).join('')
    : '<li class="none">Sin resultados</li>';
  const on = document.querySelector('#palList li.on'); if (on) on.scrollIntoView({ block: 'nearest' });
}
function palRun(i) {
  const it = palItems[i]; if (!it) return;
  closePalette();
  if (it.type === 'a') it.a.run(); else openTicket(tkey(it.r));
}

// ===== 12. Rutina diaria =====
function rutinaHoy() { return rutina.hechos[isoHoy()] || []; }
function toggleRutina(id) {
  const h = new Set(rutinaHoy()); h.has(id) ? h.delete(id) : h.add(id);
  rutina.hechos = { [isoHoy()]: [...h] };   // solo se guarda el día de hoy: mañana empieza vacía
  lsSet(RUT_KEY, rutina); renderDia();
}
function rutinaAdd() {
  const i = document.getElementById('rutNew'); const t = (i.value || '').trim(); if (!t) return;
  rutina.items.push({ id: 'r' + Date.now().toString(36), t }); lsSet(RUT_KEY, rutina); i.value = ''; renderDia(true); document.getElementById('rutNew').focus();
}
function rutinaDel(id) { rutina.items = rutina.items.filter(x => x.id !== id); lsSet(RUT_KEY, rutina); renderDia(true); }
function rutinaEdit(id, t) { const it = rutina.items.find(x => x.id === id); if (it) { it.t = t; lsSet(RUT_KEY, rutina); } }

// ===== 14. Resumen del día =====
function copiarResumenJornada() {
  const ahora = new Date(), hoy = isoHoy();
  const cnt = (list, f) => { const c = {}; list.forEach(x => { const k = f(x); c[k] = (c[k] || 0) + 1; }); return c; };
  const fmt = c => Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ');
  const evHoy = eventos.filter(e => isoHoy(new Date(e.ts)) === hoy);
  const M = nextWorkday(), fM = ddmmyyyy(M);
  const visM = rows.filter(r => esPresencial(r) && r.fVisita === fM && TECNICOS.includes(cleanInitials(r.operario)));
  const opsM = new Set(visM.map(r => r.operario));
  const sp = sinPlanificar();
  const tec = rows.filter(r => TECNICOS.includes(cleanInitials(r.operario)));
  const out = [
    `Resumen Despacho · ${DIAS[ahora.getDay()]} ${ddmmyyyy(ahora)} ${hhmm(ahora)}`,
    '',
    `Abiertas: ${tec.length} (${fmt(cnt(tec, r => r.estado))})`,
    `Por zona: ${fmt(cnt(tec, r => zonaDe(r.operario)))}`,
    `Hoy: ${plural(evHoy.filter(e => e.tipo === 'nuevo').length, 'nueva')} · ${evHoy.filter(e => e.tipo === 'salio').length} salieron de la lista · ${plural(evHoy.filter(e => e.tipo === 'estado').length, 'cambio')} de estado`,
    `${diaLargo(M).replace(/^./, c => c.toUpperCase())}: ${plural(visM.length, 'visita')} presenciales · ${plural(opsM.size, 'técnico')} · ${TECNICOS.length - opsM.size} libres`,
    `Sin planificar: ${sp.sinFecha.length} sin fecha · ${sp.vencidas.length} con la visita vencida`,
    `Parados: ${parados().length}`
  ];
  const mio = rows.filter(r => esMio(r.operario)).length;
  if (mio) out.push(`A mi nombre (por asignar): ${mio}`);
  copyText(out.join('\n'));
}

// ===== 10. Pantalla Mi día =====
function updateDiaBadge() {
  const b = document.getElementById('diaBadge'); if (!b) return;
  const n = noVistos().length;
  b.textContent = n > 99 ? '99+' : n; b.hidden = !n;
}
function refreshVisible() {
  updateDiaBadge();
  const vis = id => document.getElementById(id).style.display !== 'none';
  if (vis('viewDia')) renderDia();
  if (vis('viewInc') && rows.length) render();
  if (vis('viewMan')) renderManana();
  if (fichaKey && !document.getElementById('drawer').hidden && document.activeElement && document.activeElement.id !== 'dwNota') renderFicha();
}
function ticketLi(r, extra, cls) {
  return `<li class="${cls || ''}" data-key="${esc(tkey(r))}"><b class="mono">${esc(r.num)}</b><span class="op">${esc(r.operario || '')}</span><span class="tx">${esc(r.descSede || r.domicilio || '—')}</span>${extra ? `<span class="ex">${extra}</span>` : ''}</li>`;
}
function renderDia(force) {
  const root = document.getElementById('viewDia');
  if (!force && root.contains(document.activeElement) && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) { diaPending = true; return; }
  diaPending = false;
  const ahora = new Date();
  const fecha = `${DIAS[ahora.getDay()]} ${ahora.getDate()} de ${ahora.toLocaleDateString('es-ES', { month: 'long' })}`.replace(/^./, c => c.toUpperCase());
  if (!rows.length) {
    root.innerHTML = `<div class="dia-top"><h1>${esc(fecha)}</h1></div>
      <div class="empty"><h2>Sin incidencias cargadas</h2><div>Conecta ATGO para ver tu día.</div>
      <div class="acts" style="justify-content:center;margin-top:12px"><button class="btn pri" onclick="document.getElementById('atgoBtn').click()">Abrir ATGO</button><button class="btn" onclick="showTab('inc')">Cómo conectarlo</button></div></div>
      ${rutinaHtml()}`;
    return;
  }
  const nv = noVistos(), mio = rows.filter(r => esMio(r.operario));
  const sp = sinPlanificar(), sg = seguimientos(), par = parados(), rt = rutasResumen();
  const M = nextWorkday();
  const evHoy = eventos.filter(e => isoHoy(new Date(e.ts)) === isoHoy()).length;
  const tiles = [
    { go: 'secNov', n: nv.length, l: 'Novedades', s: `${evHoy} hoy`, hot: nv.some(evImportante) },
    { go: 'mio', n: mio.length, l: 'A tu nombre', s: 'por asignar', hot: mio.length > 0 },
    { go: 'secPlan', n: sp.sinFecha.length + sp.vencidas.length, l: 'Sin planificar', s: `${sp.vencidas.length} vencidas · ${sp.sinHora.length} sin hora` },
    { go: 'secSeg', n: sg.pendientes.length, l: 'Seguimientos', s: sg.proximos.length ? `${sg.proximos.length} próximos` : 'para hoy', hot: sg.pendientes.length > 0 },
    { go: 'man', n: `${rt.enviadas}/${rt.total}`, l: `Rutas ${DIAS[M.getDay()]}`, s: rt.cambiadas ? `${rt.cambiadas} cambiadas tras enviar` : 'enviadas', hot: rt.cambiadas > 0 || (rt.total > 0 && rt.enviadas < rt.total && ahora.getHours() >= 15) },
    { go: 'secPar', n: par.length, l: 'Parados', s: `+${PARADO_SIN_CAMBIOS} días sin cambios` }
  ];
  const feed = eventos.filter(e => novFiltro === 'nv' ? !e.visto : novFiltro === 'hoy' ? isoHoy(new Date(e.ts)) === isoHoy() : true).slice(0, 80);
  const rh = rutinaHoy();
  root.innerHTML = `
    <div class="dia-top">
      <h1>${esc(fecha)}</h1>
      <div class="acts"><button class="btn sm" onclick="openPalette()" title="Buscar ticket o acción">Buscar <kbd>Ctrl K</kbd></button><button class="btn sm" onclick="copiarResumenJornada()" title="Texto listo para pegar a tu responsable">Copiar resumen del día</button></div>
    </div>
    <div class="tiles">${tiles.map(t => `<button class="tile${t.hot ? ' hot' : ''}${!t.n || t.n === '0/0' ? ' zero' : ''}" data-go="${t.go}"><b>${esc(String(t.n))}</b><span>${esc(t.l)}</span><small>${esc(t.s)}</small></button>`).join('')}</div>
    <div class="dia-grid">
      <section class="dsec" id="secNov">
        <div class="dsh"><h2>Novedades</h2>
          <span class="seg mini">${[['nv', 'Sin ver'], ['hoy', 'Hoy'], ['all', 'Todo']].map(([v, l]) => `<button class="segb${novFiltro === v ? ' on' : ''}" onclick="novFiltro='${v}';renderDia()">${l}</button>`).join('')}</span>
          ${nv.length ? '<button class="btn sm ghost" onclick="marcarVistos();renderDia()">Marcar todo visto</button>' : ''}</div>
        ${feed.length ? `<ul class="feed">${feed.map(e => `<li class="${e.visto ? '' : 'nv'}${evImportante(e) ? ' imp' : ''}" data-key="${esc(e.tipo === 'ruta' ? '' : e.key)}" ${e.tipo === 'ruta' ? 'data-go="man"' : ''}>
            <span class="t">${esc(cuando(e.ts))}</span>
            <span class="w">${e.num ? `<b class="mono">${esc(e.num)}</b> · ` : ''}${esc(e.op)}${e.sede ? ' · ' + esc(e.sede) : ''}</span>
            <span class="x tipo-${e.tipo}">${esc(evTexto(e))}</span></li>`).join('')}</ul>`
          : `<div class="dempty">${segSnap.start ? (novFiltro === 'nv' ? 'Todo visto. Despacho compara cada actualización de ATGO y te muestra aquí lo que cambie.' : 'Sin cambios en este periodo.') : 'Empezará a detectar cambios en la próxima actualización de ATGO.'}</div>`}
      </section>
      <div class="dcol">
        ${rutinaHtml(rh)}
        <section class="dsec" id="secSeg">
          <div class="dsh"><h2>Seguimientos</h2><small>Ábrelos desde la ficha de cualquier ticket</small></div>
          ${sg.pendientes.length || sg.proximos.length ? `<ul class="tlist">${[...sg.pendientes.map(n => ({ n, due: true })), ...sg.proximos.map(n => ({ n, due: false }))].map(({ n, due }) =>
            `<li class="${due ? 'due' : 'dim'}" data-key="${esc(n.key)}"><input type="checkbox" title="Hecho" onclick="event.stopPropagation();guardarNota('${jsq(n.key)}',{hecho:true});renderDia()"><b class="mono">${esc(n.num)}</b><span class="tx">${esc(n.texto || n.sede || '')}</span><span class="ex">${esc(fechaCorta(n.fecha))}</span></li>`).join('')}</ul>`
          : '<div class="dempty">Nada pendiente. En la ficha de un ticket puedes dejar una nota y una fecha para revisarlo.</div>'}
        </section>
        <section class="dsec" id="secPlan">
          <div class="dsh"><h2>Sin planificar</h2><small>Visitas presenciales</small></div>
          ${sp.vencidas.length || sp.sinFecha.length ? `<ul class="tlist">
            ${sp.vencidas.slice(0, 15).map(r => ticketLi(r, 'vencida ' + esc(r.fVisita.slice(0, 5)), 'due')).join('')}
            ${sp.sinFecha.slice(0, 25).map(r => { const d = dias(registro(r)); return ticketLi(r, d != null ? `sin fecha · ${d} d` : 'sin fecha'); }).join('')}
            ${sp.vencidas.length + sp.sinFecha.length > 40 ? `<li class="more">y ${sp.vencidas.length + sp.sinFecha.length - 40} más…</li>` : ''}
          </ul>` : '<div class="dempty">Todas las visitas presenciales tienen fecha.</div>'}
          ${sp.sinHora.length ? `<div class="dnote">${plural(sp.sinHora.length, 'visita')} con fecha pero sin hora.</div>` : ''}
        </section>
        <section class="dsec" id="secPar">
          <div class="dsh"><h2>Parados</h2><small>${esc(ESTADOS_ESPERA.length)} estados de espera · +${PARADO_ANTIGUEDAD} días abiertos o +${PARADO_SIN_CAMBIOS} sin cambios</small></div>
          ${par.length ? `<ul class="tlist">${par.slice(0, 20).map(x => ticketLi(x.r, esc(x.r.estado) + ' · ' + (x.sin != null && x.sin >= PARADO_SIN_CAMBIOS ? `${x.sin} d sin cambios` : `${x.abierta} d abierto`))).join('')}${par.length > 20 ? `<li class="more">y ${par.length - 20} más…</li>` : ''}</ul>`
          : '<div class="dempty">Ningún ticket parado.</div>'}
        </section>
      </div>
    </div>`;
}
function rutinaHtml(rh) {
  rh = rh || rutinaHoy();
  const done = rutina.items.filter(i => rh.includes(i.id)).length;
  return `<section class="dsec" id="secRut">
    <div class="dsh"><h2>Rutina</h2><small>${done}/${rutina.items.length}</small><button class="btn sm ghost" onclick="rutEdit=!rutEdit;renderDia(true)">${rutEdit ? 'Listo' : 'Editar'}</button></div>
    ${rutEdit ? `<ul class="rut edit">${rutina.items.map(i => `<li><input value="${esc(i.t)}" oninput="rutinaEdit('${i.id}',this.value)"><button class="iconbtn" onclick="rutinaDel('${i.id}')" title="Quitar">✕</button></li>`).join('')}
        <li><input id="rutNew" placeholder="Nueva tarea diaria…" onkeydown="if(event.key==='Enter')rutinaAdd()"><button class="iconbtn" onclick="rutinaAdd()" title="Añadir">+</button></li></ul>`
      : `<ul class="rut">${rutina.items.map(i => `<li class="${rh.includes(i.id) ? 'ok' : ''}" onclick="toggleRutina('${i.id}')"><span class="ck">${rh.includes(i.id) ? '✓' : ''}</span>${esc(i.t)}</li>`).join('')}</ul>`}
  </section>`;
}

// ===== Ajustes: avisos y copia de seguridad =====
function toggleCfg(ev) {
  const m = document.getElementById('cfgMenu');
  m.hidden = !m.hidden; if (!m.hidden) renderCfg();
  if (ev) ev.stopPropagation();
}
function renderCfg() {
  const m = document.getElementById('cfgMenu'); if (!m || m.hidden) return;
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const ck = (k, l) => `<label><input type="checkbox" ${avisos[k] ? 'checked' : ''} onchange="avisos['${k}']=this.checked;lsSet(AVI_KEY,avisos)"> ${l}</label>`;
  m.innerHTML = `
    <div class="cfg-h">Avisos de Windows</div>
    ${avisos.on && perm === 'granted'
      ? `<div class="cfg-ck">${ck('miNombre', 'Tickets nuevos o reasignados a mi nombre')}${ck('escalado', 'Escalados a TIER1')}${ck('ruta', 'Cambios en las rutas de mañana')}${ck('nuevos', 'Cualquier ticket nuevo')}</div>
         <div class="acts"><button class="btn sm" onclick="notificarPrueba()">Probar</button><button class="btn sm ghost" onclick="avisos.on=false;lsSet(AVI_KEY,avisos);renderCfg()">Desactivar</button></div>`
      : perm === 'denied' ? '<div class="cfg-t">Windows tiene bloqueados los avisos de esta app. Actívalos en el candado de la barra de direcciones → Notificaciones.</div>'
      : `<div class="cfg-t">Te avisa aunque estés en otra ventana. Necesita la pestaña de ATGO abierta.</div><button class="btn sm pri" onclick="activarAvisos()">Activar avisos</button>`}
    <div class="cfg-h">Copia de seguridad</div>
    <div class="cfg-t">Notas, rutina, teléfonos, avisos y plantillas guardadas.</div>
    <div class="acts"><button class="btn sm" onclick="exportBackup()">Exportar</button><button class="btn sm" onclick="document.getElementById('backupInput').click()">Restaurar</button></div>`;
}
document.addEventListener('click', e => { const m = document.getElementById('cfgMenu'); if (m && !m.hidden && !m.contains(e.target) && e.target.id !== 'cfgBtn') m.hidden = true; });

function exportBackup() {
  const data = { app: 'panel-despacho', version: 3, fecha: new Date().toISOString(), tecnicos: tecCfg, notas, rutina: { items: rutina.items }, avisos: { ...avisos, on: false }, plantillas: lsGet('dispatcher_plantillas_v2', undefined) };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'), d = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = `despacho-copia-${isoHoy(d)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Copia exportada');
}
document.getElementById('backupInput').addEventListener('change', e => { const f = e.target.files[0]; if (f) restoreBackup(f); e.target.value = ''; });
function restoreBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      if (!d || d.app !== 'panel-despacho') throw new Error('no es una copia de Despacho');
      const hechos = [];
      if (d.notas && typeof d.notas === 'object') { notas = { ...notas, ...d.notas }; lsSet(NOTAS_KEY, notas); hechos.push(Object.keys(d.notas).length + ' notas'); }
      if (d.rutina && Array.isArray(d.rutina.items)) { rutina.items = d.rutina.items; lsSet(RUT_KEY, rutina); hechos.push('rutina'); }
      if (d.avisos && typeof d.avisos === 'object') { avisos = { ...avisos, ...d.avisos, on: avisos.on }; lsSet(AVI_KEY, avisos); }
      if (d.tecnicos && typeof d.tecnicos === 'object') { tecCfg = { ...tecCfg, ...d.tecnicos, tel: { ...tecCfg.tel, ...(d.tecnicos.tel || {}) } }; saveTec(); hechos.push('teléfonos'); }
      if (Array.isArray(d.plantillas)) {
        const m = new Map((lsGet('dispatcher_plantillas_v2', []) || []).map(x => [x.id, x])); d.plantillas.forEach(x => x && m.set(x.id, x));
        lsSet('dispatcher_plantillas_v2', [...m.values()]); hechos.push(d.plantillas.length + ' plantillas guardadas');
      }
      refreshVisible();
      toast('Restaurado: ' + (hechos.join(', ') || 'nada que restaurar'));
    } catch (err) { toast('No se pudo restaurar: ' + err.message); }
  };
  reader.readAsText(file);
}

// ===== Eventos globales =====
document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  const pal = document.getElementById('palette');
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.hidden ? openPalette() : closePalette(); return; }
  if (!pal.hidden) {
    if (e.key === 'Escape') closePalette();
    else if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palItems.length - 1, palSel + 1); palRender(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(0, palSel - 1); palRender(); }
    else if (e.key === 'Enter') { e.preventDefault(); palRun(palSel); }
    return;
  }
  if (e.key === 'Escape' && !document.getElementById('drawer').hidden) { closeTicket(); return; }
  if (!typing && e.key === '/') { e.preventDefault(); openPalette(); }
});
document.getElementById('palInput').addEventListener('input', () => { palSel = 0; palRender(); });
document.getElementById('palList').addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) palRun(+li.dataset.i); });
document.getElementById('palette').addEventListener('click', e => { if (e.target.id === 'palette') closePalette(); });
document.getElementById('drawer').addEventListener('click', e => { if (e.target.classList.contains('dw-back')) closeTicket(); });
// Clic en cualquier ticket (Mi día, Incidencias, Mañana) abre su ficha; los enlaces y botones siguen funcionando.
document.querySelector('main').addEventListener('click', e => {
  if (e.target.closest('a,button,input,label,select,textarea')) {
    const t = e.target.closest('button[data-go]'); if (!t) return;
  }
  const go = e.target.closest('[data-go]');
  if (go && go.dataset.go) {
    const g = go.dataset.go;
    if (g === 'man') showTab('man');
    else if (g === 'mio') { zonaSel = 'DISPATCHER'; showTab('inc'); }
    else { const s = document.getElementById(g); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    return;
  }
  const el = e.target.closest('[data-key]');
  if (el && el.dataset.key) openTicket(el.dataset.key);
});
document.getElementById('viewDia').addEventListener('focusout', () => { if (diaPending) setTimeout(() => { if (diaPending) renderDia(); }, 200); });
// El aviso de Windows pide mostrar Mi día (ver sw.js)
if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'show-dia') showTab('dia'); });
