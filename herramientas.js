// ===== Herramientas: cerradas, material, caducidad (SLA), copia en OneDrive, ruta en Maps,
// sugerencia de técnico, correos del día e informe semanal.
// Usa utilidades de index.html y dia.js (rows, eventos, hilos, notas, norm, esc…) solo en tiempo de llamada.

const CERR_KEY = 'dispatcher_cerradas_v1', JORN_KEY = 'dispatcher_jornadas_v1', MAILS_KEY = 'dispatcher_correos_v1', SLA_KEY = 'dispatcher_sla_avisos_v1';
const CERRADAS_DIAS = 15;
const MATERIAL = 'PTE. MOVER MATERIAL';
const SLA_AVISO_HORAS = 4;          // aviso de Windows cuando a un ticket le quedan menos horas
const SLA_PRONTO_HORAS = 48;        // aparece en "Caducidades" de Mi día

let cerradas = lsGet(CERR_KEY, {});
let jornadas = lsGet(JORN_KEY, {});
let correosEnv = lsGet(MAILS_KEY, {});
let slaAvisados = lsGet(SLA_KEY, {});

// ===== 1. Historial de cerradas (15 días) =====
function registrarCerrada(e, estado) {
  const k = e.key; if (!k || cerradas[k]) return;
  const r = rows.find(x => tkey(x) === k) || {};
  cerradas[k] = {
    key: k, num: e.num || r.num, op: cleanInitials(e.op || r.operario || ''), sede: e.sede || r.descSede || '', cli: e.cli || r.descCliente || '',
    dir: r.domicilio || '', estado, ts: e.ts || Date.now(), fVisita: e.f || r.fVisita || '', motivo: motivoTexto(k), url: r.url || ATGO_URL + k
  };
}
function podarCerradas() {
  Object.keys(cerradas).forEach(k => { if (Date.now() - cerradas[k].ts > CERRADAS_DIAS * 86400000) delete cerradas[k]; });
  lsSet(CERR_KEY, cerradas);
}
function cerradasDe(op) { return Object.values(cerradas).filter(c => c.op === cleanInitials(op)).sort((a, b) => b.ts - a.ts); }
// Llamado tras cada carga (dia.js trackChanges) y al recibir el estado final de un ticket que salió
function registrarCambiosExtra(nuevos) {
  nuevos.forEach(e => {
    if (e.tipo === 'estado' && esCierre(e.a)) registrarCerrada(e, e.a);
    if (e.tipo === 'salio' && e.final && esCierre(e.final)) registrarCerrada(e, e.final);
  });
  podarCerradas();
}
function cerradasHtml(op) {
  const list = cerradasDe(op);
  if (!list.length) return '';
  return `<details class="cerr"><summary>Cerradas · últimos ${CERRADAS_DIAS} días (${list.length})</summary>
    ${list.map(c => `<div class="vh" data-key="${esc(c.key)}">
      <span class="vh-i st-d">✓</span><span class="vh-h">${esc(cuando(c.ts))}</span>
      <span class="vh-n"><span class="num mono">Nº ${esc(c.num)}</span></span>
      <span class="vh-s">${esc(c.sede || '—')}${c.motivo ? ` · <span class="vh-m">${esc(c.motivo.slice(0, 80))}</span>` : ''}</span>
      <span class="vh-st st-d">${esc(c.estado)}</span></div>`).join('')}
  </details>`;
}

// ===== 2. Material: PTE. MOVER MATERIAL y vuelta a PRESENCIAL =====
function esMaterial(e) { return norm(e) === norm(MATERIAL); }
function material() {
  const ahora = Date.now();
  const enMaterial = rows.filter(r => esMaterial(r.estado)).map(r => {
    const ev = eventos.find(e => e.key === tkey(r) && (e.tipo === 'estado' || e.tipo === 'nuevo') && esMaterial(e.a));
    return { r, ts: ev ? ev.ts : null };
  }).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  // Pasaron de PTE. MOVER MATERIAL a PRESENCIAL en los últimos 7 días y siguen en PRESENCIAL
  const vistos = new Set();
  const listos = eventos.filter(e => e.tipo === 'estado' && esMaterial(e.de) && norm(e.a) === norm('PRESENCIAL') && ahora - e.ts < 7 * 86400000)
    .filter(e => { if (vistos.has(e.key)) return false; vistos.add(e.key); const r = rows.find(x => tkey(x) === e.key); return r && esPresencial(r); })
    .map(e => ({ r: rows.find(x => tkey(x) === e.key), ts: e.ts }));
  return { enMaterial, listos };
}
function esAvisoMaterial(e) {
  return ((e.tipo === 'estado' || e.tipo === 'nuevo') && esMaterial(e.a)) || (e.tipo === 'estado' && esMaterial(e.de) && norm(e.a) === norm('PRESENCIAL'));
}

// ===== 3. Caducidad (SLA): se lee del hilo; manda el comentario más reciente =====
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const CAD_RE = /caduc|vencimiento|\bvence\b|fecha\s+l[ií]mite|\bsla\b/i;
function fechasEnTexto(t, refTs) {
  const out = [], ref = new Date(refTs || Date.now());
  const add = (idx, y, mo, d, hh, mm, conAnio) => {
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || hh > 23 || mm > 59) return;
    const dt = new Date(y, mo - 1, d, hh, mm);
    if (dt.getMonth() !== mo - 1) return;   // 31/02 y similares
    if (!conAnio && dt.getTime() < ref.getTime() - 60 * 86400000) dt.setFullYear(y + 1);
    out.push({ ts: dt.getTime(), idx, conHora: !(hh === 23 && mm === 59) });
  };
  const hora = '(?:[^\\d\\n]{0,14}?(\\d{1,2})[:h.](\\d{2}))?';
  let m;
  const re1 = new RegExp('(?<![\\d/])(\\d{1,2})[\\/\\-.](\\d{1,2})(?:[\\/\\-.](\\d{2,4}))?(?![\\d/])' + hora, 'g');
  while ((m = re1.exec(t))) {
    let y = m[3] ? +m[3] : ref.getFullYear(); if (y < 100) y += 2000;
    add(m.index, y, +m[2], +m[1], m[4] != null ? +m[4] : 23, m[5] != null ? +m[5] : 59, !!m[3]);
  }
  const re2 = new RegExp('(\\d{1,2})\\s+de\\s+(' + MESES.join('|') + ')(?:\\s+(?:de|del)\\s+(\\d{4}))?' + hora, 'gi');
  while ((m = re2.exec(t))) {
    add(m.index, m[3] ? +m[3] : ref.getFullYear(), MESES.indexOf(m[2].toLowerCase()) + 1, +m[1], m[4] != null ? +m[4] : 23, m[5] != null ? +m[5] : 59, !!m[3]);
  }
  return out.sort((a, b) => a.idx - b.idx);
}
function caducidadHilo(key) {
  const h = hilos[key]; if (!h) return null;
  let best = null;
  h.items.slice().sort((a, b) => a.ts - b.ts).forEach(i => {
    if (!CAD_RE.test(i.t)) return;
    const f = fechasEnTexto(i.t, i.ts);
    if (!f.length) return;
    const last = f[f.length - 1];   // "de X a Y": la nueva es la última que aparece
    best = { ts: last.ts, conHora: last.conHora, src: 'hilo', msgTs: i.ts, autor: i.n || i.u, texto: i.t };
  });
  return best;
}
function caducidad(r) {
  const k = tkey(r), n = notas[k];
  if (n && n.cad) { const d = new Date(n.cad); if (!isNaN(d)) return { ts: d.getTime(), conHora: true, src: 'manual' }; }
  const h = caducidadHilo(k); if (h) return h;
  if (r.fCaducidad) { const m = /^(\d{2})\/(\d{2})\/(\d{4})(?:\D+(\d{1,2}):(\d{2}))?/.exec(r.fCaducidad); if (m) return { ts: new Date(+m[3], +m[2] - 1, +m[1], m[4] ? +m[4] : 23, m[5] ? +m[5] : 59).getTime(), conHora: !!m[4], src: 'excel' }; }
  return null;
}
function cadTexto(c) {
  const d = new Date(c.ts), hoy = isoHoy(), dia = isoHoy(d);
  const hora = c.conHora ? ' ' + hhmm(c.ts) : '';
  if (dia === hoy) return 'hoy' + hora;
  if (dia === isoHoy(new Date(Date.now() + 86400000))) return 'mañana' + hora;
  return DIAS[d.getDay()].slice(0, 3) + ' ' + d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + hora;
}
function cadNivel(c) {
  const h = (c.ts - Date.now()) / 3600000;
  return h < 0 ? 'venc' : h < 24 ? 'urg' : h < 72 ? 'pronto' : 'ok';
}
function cadBadge(r) {
  if (esCierre(r.estado)) return '';
  const c = caducidad(r); if (!c) return '';
  const nv = cadNivel(c);
  const txt = nv === 'venc' ? 'caducada ' + cadTexto(c) : 'caduca ' + cadTexto(c);
  return `<span class="cad ${nv}" title="Caducidad (${c.src === 'manual' ? 'puesta a mano' : c.src === 'excel' ? 'del Excel' : 'del hilo'})">⏱ ${esc(txt)}</span>`;
}
function caducidadesProximas() {
  const lim = Date.now() + SLA_PRONTO_HORAS * 3600000;
  return rows.filter(r => !esCierre(r.estado)).map(r => ({ r, c: caducidad(r) })).filter(x => x.c && x.c.ts < lim).sort((a, b) => a.c.ts - b.c.ts);
}
function revisarSLA() {
  if (!avisos.sla) return;
  const lim = Date.now() + SLA_AVISO_HORAS * 3600000, list = [];
  rows.forEach(r => {
    if (esCierre(r.estado)) return;
    const c = caducidad(r); if (!c || c.ts > lim) return;
    const k = tkey(r); if (slaAvisados[k] === c.ts) return;
    slaAvisados[k] = c.ts;
    list.push({ tipo: 'sla', num: r.num, op: r.operario, a: (cadNivel(c) === 'venc' ? 'Caducada ' : 'Caduca ') + cadTexto(c) });
  });
  Object.keys(slaAvisados).forEach(k => { if (!rows.some(r => tkey(r) === k)) delete slaAvisados[k]; });
  lsSet(SLA_KEY, slaAvisados);
  if (list.length) notificarLista(list);
}
function caducidadFichaHtml(key, r) {
  if (!r) return '';
  const c = caducidad(r), n = notas[key] || {};
  const val = n.cad || (c ? isoLocal(c.ts) : '');
  return `<div class="dw-sec">
    <div class="dw-h">Caducidad (SLA) ${c ? `<small>${c.src === 'manual' ? 'puesta a mano' : c.src === 'excel' ? 'del Excel' : 'según comentario de ' + esc(nombreCorto(c.autor || '', '')) + ' · ' + esc(cuando(c.msgTs))}</small>` : ''}</div>
    <div class="dw-cad">${c ? `<span class="cad big ${cadNivel(c)}">⏱ ${esc((cadNivel(c) === 'venc' ? 'Caducada ' : 'Caduca ') + cadTexto(c))}</span>` : '<span class="dw-empty">No aparece en el hilo.</span>'}
      <input type="datetime-local" value="${esc(val)}" onchange="guardarNota(fichaKey,{cad:this.value});renderFicha();refreshVisible()" title="Corregir la caducidad a mano">
      ${n.cad ? '<button class="chip sm" onclick="guardarNota(fichaKey,{cad:\'\'});renderFicha();refreshVisible()">Usar la del hilo</button>' : ''}</div>
    ${c && c.src === 'hilo' ? `<div class="dw-cadtx">«${esc(c.texto.slice(0, 200))}»</div>` : ''}
  </div>`;
}
function isoLocal(ts) { const d = new Date(ts); return isoHoy(d) + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

// ===== 5. Ruta en Google Maps =====
const GLS_ZONA = { 'SEVILLA/HUELVA': 'GLS Sevilla', 'CÓRDOBA/JAÉN': 'GLS Córdoba', 'GRANADA': 'GLS Granada', 'ALMERÍA': 'GLS Almería', 'MÁLAGA': 'GLS Málaga', 'CÁDIZ': 'GLS Cádiz', 'CEUTA': 'GLS Ceuta', 'MELILLA': 'GLS Melilla', 'EXTREMADURA': 'GLS Badajoz' };
function glsDe(op) { return ((tecCfg.gls || {})[op] || '').trim() || GLS_ZONA[zonaDe(op)] || ''; }
function direccionMaps(r) { return [r.domicilio, r.provincia && r.provincia !== 'NULL' && !norm(r.domicilio).includes(norm(r.provincia)) ? r.provincia : ''].filter(Boolean).join(', ') || r.descSede || ''; }
// Orden: citas con hora en su hora; recogida GLS a las 9:00 (franja 9-10); sin hora, a mediodía.
function paradasRuta(op, f) {
  const vis = rows.filter(r => esPresencial(r) && r.fVisita === f && r.operario === op);
  const items = vis.map(r => ({ r, t: r.desdeHora ? horaMin(r.desdeHora) : 12 * 60 + 30, conHora: !!r.desdeHora }));
  const gls = glsDe(op);
  if (gls && tecCfg.rutaGls !== false && items.length) items.push({ gls: true, t: 9 * 60, label: gls });
  return items.sort((a, b) => a.t - b.t || (a.gls ? -1 : b.gls ? 1 : 0));
}
function urlRuta(op, f) {
  const p = paradasRuta(op, f); if (!p.some(x => !x.gls)) return '';
  // Origen vacío: Google Maps sale de la ubicación actual de quien lo abre (el técnico)
  return 'https://www.google.com/maps/dir//' + p.map(x => encodeURIComponent(x.gls ? x.label : direccionMaps(x.r))).join('/');
}
function abrirRuta(op, f) {
  const u = urlRuta(op, f || ddmmyyyy(manDate));
  if (!u) { toast('Sin visitas con dirección para ese día'); return; }
  if (paradasRuta(op, f || ddmmyyyy(manDate)).length > 10) toast('Más de 10 paradas: Google Maps puede no mostrarlas todas');
  window.open(u, 'maps-' + op);
}
function rutaTexto(op, f) {
  return paradasRuta(op, f).map((x, i) => `${i + 1}) ${x.gls ? '9:00-10:00 Recogida en ' + x.label : (x.conHora ? x.r.desdeHora : 'Sin hora') + ' · ' + (x.r.descSede || '')}`).join('\n');
}

// ===== 6. Sugerencia de técnico =====
const PROV_ZONA = { sevilla: 'SEVILLA/HUELVA', huelva: 'SEVILLA/HUELVA', cordoba: 'CÓRDOBA/JAÉN', jaen: 'CÓRDOBA/JAÉN', granada: 'GRANADA', almeria: 'ALMERÍA', malaga: 'MÁLAGA', cadiz: 'CÁDIZ', ceuta: 'CEUTA', melilla: 'MELILLA', badajoz: 'EXTREMADURA', caceres: 'EXTREMADURA' };
function zonaTicket(r) {
  for (const txt of [r.provincia, r.poblacion, r.domicilio]) {
    const p = norm(txt || ''); if (!p || p === 'null') continue;
    for (const [k, z] of Object.entries(PROV_ZONA)) if (p.includes(k)) return z;
  }
  const z = zonaDe(r.operario);
  return z === 'DISPATCHER' || z === 'SIN ZONA' ? null : z;
}
function poblacionDe(r) { return norm(r.poblacion || String(r.domicilio || '').split(',').pop()); }
function sugerirTecnico(r, fecha) {
  const z = zonaTicket(r); if (!z) return null;
  const zona = ZONAS.find(x => x.nombre === z); if (!zona) return null;
  const f = ddmmyyyy(fecha), pob = poblacionDe(r);
  const lista = zona.ops.map(op => {
    const vis = rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op && tkey(x) !== tkey(r));
    const juntos = pob ? vis.filter(x => poblacionDe(x) === pob).length : 0;
    return { op, carga: vis.length, juntos, score: vis.length - (juntos ? 1.5 : 0) };   // ir ya a esa población equivale a 1,5 visitas menos
  }).sort((a, b) => a.score - b.score || a.carga - b.carga || opIndex(a.op) - opIndex(b.op));
  return { zona: z, fecha, lista };
}
let sugDia = 'man';
function sugerenciaHtml(r) {
  if (!r || !esPresencial(r)) return '';
  const fecha = sugDia === 'hoy' ? new Date() : nextWorkday();
  const s = sugerirTecnico(r, fecha);
  if (!s) return '';
  const pob = (r.poblacion || String(r.domicilio || '').split(',').pop() || '').trim();
  return `<div class="dw-sec">
    <div class="dw-h">Técnico sugerido <small>${esc(s.zona)} · ${esc(diaLargo(fecha))}</small>
      <span class="seg mini" style="float:right">${[['hoy', 'Hoy'], ['man', 'Próximo laborable']].map(([v, l]) => `<button class="segb${sugDia === v ? ' on' : ''}" onclick="sugDia='${v}';renderFicha()">${l}</button>`).join('')}</span></div>
    <ul class="sug">${s.lista.slice(0, 3).map((x, i) => `<li${i === 0 ? ' class="best"' : ''}><b>${esc(x.op)}</b><span>${x.carga ? plural(x.carga, 'visita') : 'libre'}${x.juntos ? ` · ya va a ${esc(pob)}` : ''}${x.op === cleanInitials(r.operario) ? ' · asignado ahora' : ''}</span>${typeof fase2Activa === 'function' && fase2Activa(tkey(r)) && x.op !== cleanInitials(r.operario) ? `<button class="btn sm" style="margin-left:auto" onclick="preAsignar('${jsq(x.op)}')">Asignar</button>` : ''}</li>`).join('')}</ul>
    <div class="dw-empty">${typeof fase2Activa === 'function' && fase2Activa(tkey(r)) ? '«Asignar» rellena «Planificar en ATGO»; nada se guarda hasta que lo confirmes.' : 'Solo es una sugerencia: la asignación se hace en el ERP.'}</div>
  </div>`;
}

// ===== 7. Correos del día (Outlook) =====
const CORREO_DEF = {
  asunto: 'Visita técnica programada · Nº {num} · {sede}',
  cuerpo: 'Buenos días:\n\nLes confirmamos que la incidencia Nº {num}{ref} tiene visita técnica programada el {dia}{hora} en {sede} ({direccion}).\n\nTécnico asignado: {tecnico}.\n\nUn saludo.',
  cc: '', resumenPara: ''
};
function cfgCorreo() { return { ...CORREO_DEF, ...(tecCfg.correo || {}) }; }
function visitasCorreo(f) { return sortByHora(rows.filter(r => esPresencial(r) && r.fVisita === f && TECNICOS.includes(cleanInitials(r.operario)))).sort((a, b) => opIndex(a.operario) - opIndex(b.operario) || horaMin(a.desdeHora) - horaMin(b.desdeHora)); }
function varsCorreo(r) {
  const d = parseEs(r.fVisita);
  return {
    num: r.num, sede: r.descSede || '', direccion: r.domicilio || '', cliente: r.descCliente || '',
    dia: d ? diaLargo(d) + '/' + d.getFullYear() : r.fVisita,
    hora: r.desdeHora ? (r.hastaHora ? ` de ${r.desdeHora} a ${r.hastaHora}` : ` a las ${r.desdeHora}`) : '',
    ref: r.referencia ? ` (ref. ${r.referencia})` : '', tecnico: nombreTecnico(r) || r.operario
  };
}
function rellenar(s, v) { return String(s || '').replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m); }
function mailto(to, subject, body, cc) {
  const enc = s => encodeURIComponent(s || '').replace(/%40/g, '@').replace(/%2C/gi, ',').replace(/%3B/gi, ';');
  const q = [];
  if (cc) q.push('cc=' + enc(cc));
  q.push('subject=' + encodeURIComponent(subject || ''));
  if (body != null) q.push('body=' + encodeURIComponent(body));
  const a = document.createElement('a'); a.href = 'mailto:' + enc(to) + '?' + q.join('&'); a.click();
}
function abrirCorreo(key) {
  const r = rows.find(x => tkey(x) === key); if (!r) return;
  const c = cfgCorreo(), v = varsCorreo(r);
  mailto(r.email || '', rellenar(c.asunto, v), rellenar(c.cuerpo, v), c.cc);
  const f = r.fVisita; correosEnv[f] = correosEnv[f] || {}; correosEnv[f][key] = Date.now();
  Object.keys(correosEnv).forEach(k => { const d = parseEs(k); if (d && dias(d) > 15) delete correosEnv[k]; });
  lsSet(MAILS_KEY, correosEnv);
  renderCorreos();
}
function abrirSiguienteCorreo() {
  const f = ddmmyyyy(manDate), env = correosEnv[f] || {};
  const r = visitasCorreo(f).find(x => !env[tkey(x)]);
  if (!r) { toast('Ya has abierto el correo de todas las visitas de este día'); return; }
  abrirCorreo(tkey(r));
}
function correoResumen() {
  const f = ddmmyyyy(manDate), vis = visitasCorreo(f), c = cfgCorreo();
  if (!vis.length) { toast('Sin visitas ese día'); return; }
  const d = parseEs(f), out = [`Visitas técnicas programadas para el ${diaLargo(d)}/${d.getFullYear()}:`, ''];
  let opPrev = '';
  vis.forEach(r => {
    if (r.operario !== opPrev) { if (opPrev) out.push(''); out.push(`${r.operario} · ${nombreTecnico(r)}`); opPrev = r.operario; }
    out.push(`  ${r.desdeHora || 'Sin hora'} · Nº ${r.num} · ${r.descSede || ''} · ${r.domicilio || ''}${r.referencia ? ' · Ref ' + r.referencia : ''}`);
  });
  const body = out.join('\n').replace(/^\n+/, '') + `\n\nTotal: ${plural(vis.length, 'visita')}.`;
  const subject = `Visitas programadas · ${diaLargo(d)}`;
  // Windows corta los enlaces mailto muy largos: en ese caso el texto va al portapapeles
  if (encodeURIComponent(body).length > 1800) { copyText(body); mailto(c.resumenPara, subject, null, c.cc); toast('El resumen es largo: está copiado, pégalo en el correo'); }
  else mailto(c.resumenPara, subject, body, c.cc);
}
let correosAbierto = false;
function toggleCorreos() { correosAbierto = !correosAbierto; renderCorreos(); }
function renderCorreos() {
  const p = document.getElementById('mailPanel'); if (!p) return;
  p.style.display = correosAbierto ? '' : 'none';
  if (!correosAbierto) return;
  const f = ddmmyyyy(manDate), vis = visitasCorreo(f), env = correosEnv[f] || {}, c = cfgCorreo();
  const hechos = vis.filter(r => env[tkey(r)]).length;
  p.innerHTML = `<div class="mhead"><span>Correos de las visitas del ${esc(diaLargo(manDate))} <em>${hechos}/${vis.length} abiertos</em></span><button class="btn sm" onclick="toggleCorreos()">Cerrar</button></div>
  <div class="mbody">
    <div class="acts">
      <button class="btn pri" onclick="abrirSiguienteCorreo()">Abrir siguiente en Outlook</button>
      <button class="btn" onclick="correoResumen()" title="Un solo correo con todas las visitas del día">Correo resumen del día</button>
      <span class="hint">Un correo por visita al contacto del ticket en ATGO. Pulsa "Abrir siguiente" tras enviar cada uno.</span>
    </div>
    <ul class="mails">${vis.map(r => `<li class="${env[tkey(r)] ? 'ok' : ''}"><span class="ck">${env[tkey(r)] ? '✓' : ''}</span><b class="mono">${esc(r.num)}</b><span class="op">${esc(r.operario)}</span><span class="tx">${esc(r.desdeHora || '--:--')} · ${esc(r.descSede || '')}</span><span class="ml">${r.email ? esc(r.email) : '<i>sin correo en ATGO</i>'}</span><button class="btn sm" onclick="abrirCorreo('${jsq(tkey(r))}')">${env[tkey(r)] ? 'Reabrir' : 'Abrir'}</button></li>`).join('') || '<li class="none">Sin visitas presenciales ese día.</li>'}</ul>
    <details class="tp-det"><summary>Plantilla del correo</summary>
      <div class="mbody" style="padding:8px 0 0">
        <label class="fl">Asunto<input value="${esc(c.asunto)}" oninput="setCorreo('asunto',this.value)"></label>
        <label class="fl">Texto (campos: {num} {sede} {direccion} {dia} {hora} {ref} {tecnico} {cliente})<textarea rows="7" oninput="setCorreo('cuerpo',this.value)">${esc(c.cuerpo)}</textarea></label>
        <div class="fgrid"><label class="fl">CC (opcional)<input value="${esc(c.cc)}" oninput="setCorreo('cc',this.value)"></label>
        <label class="fl">Para del correo resumen<input value="${esc(c.resumenPara)}" oninput="setCorreo('resumenPara',this.value)" placeholder="responsable@empresa.com"></label></div>
      </div>
    </details>
  </div>`;
}
function setCorreo(k, v) { tecCfg.correo = { ...cfgCorreo(), [k]: v }; saveTec(); }

// ===== 8. Informe semanal =====
// Cada carga guarda la foto del día (por técnico) para poder sumar la semana.
function guardarJornada() {
  if (!rows.length) return;
  const ops = {};
  rutaHoy().forEach(x => {
    const op = cleanInitials(x.op); if (!TECNICOS.includes(op)) return;
    const o = ops[op] = ops[op] || { tot: 0, d: 0, t: 0, c: 0, p: 0 };
    o.tot++; o[x.st]++;
  });
  const venc = rows.filter(r => { const c = !esCierre(r.estado) && caducidad(r); return c && c.ts < Date.now(); }).map(tkey);
  const prev = jornadas[isoHoy()] || {};
  jornadas[isoHoy()] = { ops, venc: [...new Set([...(prev.venc || []), ...venc])], at: Date.now() };
  Object.keys(jornadas).forEach(k => { const d = parseIso(k); if (d && dias(d) > 40) delete jornadas[k]; });
  lsSet(JORN_KEY, jornadas);
}
let infSemana = 'esta';
function rangoSemana(cual) {
  const d = new Date(); d.setHours(12, 0, 0, 0);
  const lunes = new Date(d); lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  if (cual === 'pasada') { const ini = new Date(lunes); ini.setDate(lunes.getDate() - 7); const fin = new Date(ini); fin.setDate(ini.getDate() + 6); return [ini, fin]; }
  return [lunes, d];
}
function datosInforme() {
  const [ini, fin] = rangoSemana(infSemana);
  const a = isoHoy(ini), b = isoHoy(fin);
  const enRango = ts => { const k = isoHoy(new Date(ts)); return k >= a && k <= b; };
  const porOp = {}, diasCon = [];
  Object.entries(jornadas).filter(([k]) => k >= a && k <= b).forEach(([k, j]) => {
    diasCon.push(k);
    Object.entries(j.ops || {}).forEach(([op, o]) => { const t = porOp[op] = porOp[op] || { tot: 0, d: 0, t: 0 }; t.tot += o.tot; t.d += o.d; t.t += o.t; });
  });
  const cerr = Object.values(cerradas).filter(c => enRango(c.ts));
  cerr.forEach(c => { const t = porOp[c.op] = porOp[c.op] || { tot: 0, d: 0, t: 0 }; t.cerr = (t.cerr || 0) + 1; });
  const ev = eventos.filter(e => enRango(e.ts));
  const venc = new Set(); Object.entries(jornadas).filter(([k]) => k >= a && k <= b).forEach(([, j]) => (j.venc || []).forEach(x => venc.add(x)));
  const filas = TECNICOS.filter(op => porOp[op]).map(op => ({ op, zona: zonaDe(op), ...porOp[op] }));
  const tot = filas.reduce((s, f) => ({ tot: s.tot + f.tot, d: s.d + f.d, t: s.t + f.t, cerr: s.cerr + (f.cerr || 0) }), { tot: 0, d: 0, t: 0, cerr: 0 });
  return { ini, fin, diasCon: diasCon.sort(), filas, tot, nuevos: ev.filter(e => e.tipo === 'nuevo').length, escalados: ev.filter(e => norm(e.a) === norm('ESCALADO TIER1')).length, material: ev.filter(e => (e.tipo === 'estado' || e.tipo === 'nuevo') && esMaterial(e.a)).length, venc: venc.size };
}
function pct(a, b) { return b ? Math.round(a / b * 100) + '%' : '—'; }
function informeTexto(d) {
  const f = x => x.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  const out = [`Informe semanal Despacho · del ${f(d.ini)} al ${f(d.fin)}`, '',
    `Visitas enrutadas: ${d.tot.tot} · terminadas ${d.tot.d} (${pct(d.tot.d, d.tot.tot)}) · en trámite ${d.tot.t} · cerradas ${d.tot.cerr}`,
    `Tickets nuevos: ${d.nuevos} · escalados a TIER1: ${d.escalados} · a PTE. MOVER MATERIAL: ${d.material} · con caducidad vencida: ${d.venc}`, '',
    'Técnico · zona · enrutadas · terminadas · en trámite · cumplimiento · cerradas'];
  d.filas.forEach(x => out.push(`${x.op} · ${x.zona} · ${x.tot} · ${x.d} · ${x.t} · ${pct(x.d, x.tot)} · ${x.cerr || 0}`));
  return out.join('\n');
}
function informeHtml(d) {
  const th = 'style="text-align:left;padding:4px 10px;border-bottom:1px solid #ccc;font-weight:600"', td = 'style="padding:3px 10px;border-bottom:1px solid #eee"', tdr = 'style="padding:3px 10px;border-bottom:1px solid #eee;text-align:right"';
  const f = x => x.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  return `<div style="font:11pt Calibri,Arial,sans-serif"><p><b>Informe semanal · del ${f(d.ini)} al ${f(d.fin)}</b></p>
  <p>Visitas enrutadas: <b>${d.tot.tot}</b> · terminadas <b>${d.tot.d}</b> (${pct(d.tot.d, d.tot.tot)}) · en trámite <b>${d.tot.t}</b> · cerradas <b>${d.tot.cerr}</b><br>
  Tickets nuevos: ${d.nuevos} · escalados a TIER1: ${d.escalados} · a PTE. MOVER MATERIAL: ${d.material} · con caducidad vencida: ${d.venc}</p>
  <table style="border-collapse:collapse"><tr><th ${th}>Técnico</th><th ${th}>Zona</th><th ${th}>Enrutadas</th><th ${th}>Terminadas</th><th ${th}>En trámite</th><th ${th}>Cumplimiento</th><th ${th}>Cerradas</th></tr>
  ${d.filas.map(x => `<tr><td ${td}><b>${esc(x.op)}</b></td><td ${td}>${esc(x.zona)}</td><td ${tdr}>${x.tot}</td><td ${tdr}>${x.d}</td><td ${tdr}>${x.t}</td><td ${tdr}>${pct(x.d, x.tot)}</td><td ${tdr}>${x.cerr || 0}</td></tr>`).join('')}
  </table></div>`;
}
function abrirInforme() {
  const m = document.getElementById('modal'), d = datosInforme();
  const f = x => x.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  m.innerHTML = `<div class="md-box">
    <div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Informe semanal</div><div class="dw-sub">Del ${f(d.ini)} al ${f(d.fin)} · ${d.diasCon.length ? plural(d.diasCon.length, 'día') + ' con datos' : 'sin datos todavía'}</div></div>
      <div class="acts"><span class="seg mini">${[['esta', 'Esta semana'], ['pasada', 'Semana pasada']].map(([v, l]) => `<button class="segb${infSemana === v ? ' on' : ''}" onclick="infSemana='${v}';abrirInforme()">${l}</button>`).join('')}</span>
      <button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div></div>
    <div class="kpis inc-kpis">
      <div class="kpi"><b>${d.tot.tot}</b>visitas enrutadas</div>
      <div class="kpi"><b style="color:var(--done-tx)">${d.tot.d}</b>terminadas · ${pct(d.tot.d, d.tot.tot)}</div>
      <div class="kpi"><b style="color:var(--tra-tx)">${d.tot.t}</b>en trámite</div>
      <div class="kpi"><b>${d.tot.cerr}</b>cerradas</div>
      <div class="kpi"><b${d.venc ? ' style="color:#d9614f"' : ''}>${d.venc}</b>con caducidad vencida</div>
    </div>
    <div class="dw-sub">Tickets nuevos: ${d.nuevos} · escalados a TIER1: ${d.escalados} · a PTE. MOVER MATERIAL: ${d.material}</div>
    ${d.filas.length ? `<table class="inf"><thead><tr><th>Técnico</th><th>Zona</th><th>Enrutadas</th><th>Terminadas</th><th>En trámite</th><th>Cumplimiento</th><th>Cerradas</th></tr></thead><tbody>
      ${d.filas.map(x => `<tr><td><b>${esc(x.op)}</b></td><td>${esc(x.zona)}</td><td>${x.tot}</td><td>${x.d}</td><td>${x.t}</td><td><span class="pbar mini"><i class="d" style="width:${x.tot ? Math.round(x.d / x.tot * 100) : 0}%"></i></span> ${pct(x.d, x.tot)}</td><td>${x.cerr || 0}</td></tr>`).join('')}
    </tbody></table>` : '<div class="dempty">Aún no hay datos de esta semana. Despacho guarda la foto de cada día mientras está abierto con ATGO sincronizando.</div>'}
    <div class="acts"><button class="btn pri" onclick="copiarInforme()">Copiar para el correo</button><button class="btn" onclick="correoInforme()">Abrir en Outlook</button></div>
  </div>`;
  m.hidden = false;
}
function cerrarModal() { document.getElementById('modal').hidden = true; }
async function copiarInforme() {
  const d = datosInforme();
  try { await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([informeHtml(d)], { type: 'text/html' }), 'text/plain': new Blob([informeTexto(d)], { type: 'text/plain' }) })]); toast('Informe copiado · pégalo en el correo'); }
  catch (e) { copyText(informeTexto(d)); }
}
function correoInforme() {
  const d = datosInforme(), f = x => x.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  const subject = `Informe semanal Despacho · ${f(d.ini)} - ${f(d.fin)}`, body = informeTexto(d), c = cfgCorreo();
  if (encodeURIComponent(body).length > 1800) { copiarInforme(); mailto(c.resumenPara, subject, null, ''); toast('Informe copiado con formato: pégalo en el correo'); }
  else mailto(c.resumenPara, subject, body, '');
}

// ===== 4. Copia de seguridad automática en OneDrive (o cualquier carpeta) =====
const IDB = {
  open() { return new Promise((res, rej) => { const r = indexedDB.open('despacho', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async get(k) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('kv').objectStore('kv').get(k); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); }); },
  async set(k, v) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('kv', 'readwrite').objectStore('kv').put(v, k); t.onsuccess = () => res(); t.onerror = () => rej(t.error); }); },
  async del(k) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('kv', 'readwrite').objectStore('kv').delete(k); t.onsuccess = () => res(); t.onerror = () => rej(t.error); }); }
};
let odHandle = null, odEstado = 'off', odUltima = lsGet('dispatcher_od_ultima', 0);
function datosCopia() {
  return { app: 'panel-despacho', version: 4, fecha: new Date().toISOString(), tecnicos: tecCfg, notas, rutina: { items: rutina.items }, avisos: { ...avisos, on: false }, cerradas, jornadas, plantillas: lsGet('dispatcher_plantillas_v2', undefined) };
}
async function odElegir() {
  if (!window.showDirectoryPicker) { toast('Este navegador no permite elegir carpetas: usa Edge o Chrome'); return; }
  try {
    const h = await window.showDirectoryPicker({ id: 'despacho-copia', mode: 'readwrite', startIn: 'documents' });
    await IDB.set('odHandle', h); odHandle = h;
    await odGuardar(true);
    toast(odEstado === 'ok' ? 'Copia guardada en «' + h.name + '»' : 'No se pudo guardar en esa carpeta');
  } catch (e) { if (e.name !== 'AbortError') toast('No se pudo usar esa carpeta'); }
  renderCfg(); renderOdAviso();
}
async function odQuitar() { await IDB.del('odHandle'); odHandle = null; odEstado = 'off'; renderCfg(); renderOdAviso(); }
async function odReconectar() {
  if (!odHandle) return;
  try { const p = await odHandle.requestPermission({ mode: 'readwrite' }); odEstado = p === 'granted' ? 'ok' : 'permiso'; if (p === 'granted') await odGuardar(true); } catch (e) { odEstado = 'error'; }
  renderCfg(); renderOdAviso();
}
async function odIniciar() {
  try { odHandle = await IDB.get('odHandle'); } catch (e) { odHandle = null; }
  if (!odHandle) { odEstado = 'off'; return; }
  try { const p = await odHandle.queryPermission({ mode: 'readwrite' }); odEstado = p === 'granted' ? 'ok' : 'permiso'; if (p === 'granted') await odGuardar(); } catch (e) { odEstado = 'error'; }
  renderOdAviso();
}
async function odEscribir(nombre, txt) {
  const fh = await odHandle.getFileHandle(nombre, { create: true });
  const w = await fh.createWritable(); await w.write(txt); await w.close();
}
async function odGuardar(forzar) {
  if (!odHandle) return;
  if (!forzar && Date.now() - odUltima < 10 * 60000) return;
  try {
    if ((await odHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') { odEstado = 'permiso'; renderOdAviso(); return; }
    const txt = JSON.stringify(datosCopia(), null, 1);
    await odEscribir('Despacho-copia.json', txt);
    await odEscribir('Despacho-copia-' + isoHoy() + '.json', txt);   // una por día, se guardan 7
    for await (const [name] of odHandle.entries()) {
      const m = /^Despacho-copia-(\d{4}-\d{2}-\d{2})\.json$/.exec(name);
      if (m && dias(parseIso(m[1])) > 7) await odHandle.removeEntry(name);
    }
    odUltima = Date.now(); lsSet('dispatcher_od_ultima', odUltima); odEstado = 'ok';
  } catch (e) { odEstado = 'error'; console.warn('Copia en carpeta:', e); }
  renderOdAviso();
}
function odCfgHtml() {
  if (!window.showDirectoryPicker) return '<div class="cfg-t">Este navegador no permite la copia automática en una carpeta.</div>';
  if (!odHandle) return `<div class="cfg-t">Guarda sola una copia en una carpeta de OneDrive cada 10 minutos (y una por día de los últimos 7).</div><button class="btn sm pri" onclick="odElegir()">Elegir carpeta de OneDrive</button>`;
  const est = odEstado === 'ok' ? `Activa en «${esc(odHandle.name)}» · última ${odUltima ? esc(cuando(odUltima)) : '—'}` : odEstado === 'permiso' ? `Pausada: Windows pide permiso de nuevo para «${esc(odHandle.name)}»` : 'Error al escribir en la carpeta';
  return `<div class="cfg-t">${est}</div><div class="acts">${odEstado === 'permiso' ? '<button class="btn sm pri" onclick="odReconectar()">Reanudar</button>' : '<button class="btn sm" onclick="odGuardar(true).then(renderCfg)">Guardar ahora</button>'}<button class="btn sm ghost" onclick="odElegir()">Cambiar carpeta</button><button class="btn sm ghost" onclick="odQuitar()">Quitar</button></div>`;
}
function renderOdAviso() {
  const el = document.getElementById('odAviso'); if (!el) return;
  el.hidden = !(odHandle && odEstado === 'permiso');
  el.innerHTML = 'Copia en OneDrive pausada · <button class="btn sm pri" onclick="odReconectar()">Reanudar</button>';
}
setInterval(() => odGuardar(), 10 * 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') odGuardar(); });

// ===== Avisos de Windows de herramientas (material y caducidad) =====
async function notificarLista(list) {
  if (!avisos.on || !('Notification' in window) || Notification.permission !== 'granted' || !list.length) return;
  const title = list.length === 1 ? `Nº ${list[0].num} · ${list[0].op}` : `${list.length} avisos en Despacho`;
  const body = list.slice(0, 4).map(e => (list.length > 1 ? `Nº ${e.num} · ` : '') + e.a).join('\n') + (list.length > 4 ? `\n…y ${list.length - 4} más` : '');
  const opts = { body, tag: 'despacho-sla', renotify: true, icon: 'icon-192.png', data: { url: './#dia' } };
  try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.showNotification(title, opts); else new Notification(title, opts); } catch (e) {}
}
