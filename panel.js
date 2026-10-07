// ===== Panel: sin asignar y buzón, vigilancia de la sincronización, Vista Semana (arrastrar y soltar,
// planificación en bloque), replanificar vencidas, respuestas rápidas, carga en horas, línea de tiempo,
// conflictos, reincidencias, mapa, avisos de comentarios y secciones plegables de Mi día.
// Usa utilidades de index.html, dia.js, herramientas.js y edicion.js solo en tiempo de llamada.

const BUZON_KEY = 'dispatcher_buzon_v1', POOLV_KEY = 'dispatcher_pool_vistos_v1', DUR_KEY = 'dispatcher_duraciones_v1';
const GEO_KEY = 'dispatcher_geo_v1', PLIEGUE_KEY = 'dispatcher_pliegues_v1';
const JORNADA_MIN = 8 * 60;              // jornada de referencia para la carga en horas
const DURACION_DEF = 60;                 // minutos por visita si aún no hay datos reales
const SYNC_AVISO_MIN = 10;               // aviso si ATGO lleva más de estos minutos sin actualizar
// Operarios comodín "PENDIENTE ASIGNAR" de tus zonas (el resto son de otros dispatchers)
const MIS_POOLS = ['XXX-SVQ', 'XXX-CA', 'XXX-MA', 'XXX-G', 'XXX-AL', 'XXX-J', 'XXX-0EXTREM', 'XXX-0CEUTA', 'XXX-0MELILL'];
const POOL_ZONA = { 'XXX-SVQ': 'SEVILLA/HUELVA', 'XXX-CA': 'CÁDIZ', 'XXX-MA': 'MÁLAGA', 'XXX-G': 'GRANADA', 'XXX-AL': 'ALMERÍA', 'XXX-J': 'CÓRDOBA/JAÉN', 'XXX-0EXTREM': 'EXTREMADURA', 'XXX-0CEUTA': 'CEUTA', 'XXX-0MELILL': 'MELILLA' };

let poolRows = [], poolOpsDesc = {}, poolCargado = false;
let buzon = lsGet(BUZON_KEY, {});
let poolVistos = lsGet(POOLV_KEY, null);
let duraciones = lsGet(DUR_KEY, {});
let geoCache = lsGet(GEO_KEY, {});
let pliegues = lsGet(PLIEGUE_KEY, {});
let sinFiltro = 'mia', sinVista = 'pend';

// Ticket por clave, en tus incidencias o en las sin asignar
function ticketDe(key) { return rows.find(x => tkey(x) === key) || poolRows.find(x => tkey(x) === key) || null; }

// ===== Sin asignar (operarios comodín) y buzón =====
function zonaPool(r) {
  const z = POOL_ZONA[cleanInitials(r.operario)];
  if (z) return z;
  const t = zonaTicket(r);   // por provincia
  if (t) return t;
  // Otras zonas: el nombre del comodín sin 'PENDIENTE ASIGNAR' (p. ej. MADRID)
  const d = String(poolOpsDesc[cleanInitials(r.operario)] || r.desOperario || '').replace(/^PENDIENTE( DE)? ASIGNAR\s*/i, '').replace(/[()]/g, '').trim();
  return d ? d.toUpperCase() : 'OTRA ZONA';
}
function esMiZonaPool(r) { return MIS_POOLS.includes(cleanInitials(r.operario)) || ZONAS_TEC.some(z => z.nombre === zonaPool(r)); }
function actualizado(r) {
  const h = hilos[tkey(r)];
  const ult = h && h.items.length ? Math.max(...h.items.map(i => i.ts || 0)) : 0;
  const reg = registro(r);
  return Math.max(ult, reg ? reg.getTime() : 0);
}
function recibirPool(m) {
  marcarSync(m);
  if (!Array.isArray(m.pool) || m.partial) return;
  poolOpsDesc = m.poolOps || poolOpsDesc;
  const antes = new Set(poolRows.map(tkey));
  poolRows = m.pool;
  poolCargado = true;
  // Los que ya tienen técnico desaparecen solos del panel y del buzón
  const vivos = new Set(poolRows.map(tkey));
  Object.keys(buzon).forEach(k => { if (!vivos.has(k)) delete buzon[k]; });
  lsSet(BUZON_KEY, buzon);
  // Aviso de nuevos sin asignar en tu zona (no la primera vez)
  if (poolVistos) {
    const nuevos = poolRows.filter(r => esMiZonaPool(r) && !poolVistos.includes(tkey(r)) && !antes.has(tkey(r)));
    if (nuevos.length && avisos.sinAsignar !== false) notificarLista(nuevos.map(r => ({ num: r.num, op: zonaPool(r), a: 'Sin asignar · ' + (r.descSede || r.domicilio || '') })));
  }
  poolVistos = [...vivos]; lsSet(POOLV_KEY, poolVistos);
  pedirHilos(poolRows.filter(r => !hilos[tkey(r)] || hilos[tkey(r)].at < Date.now() - 10 * 60000).map(tkey));
  updateSinBadge();
  if (document.getElementById('viewSin').style.display !== 'none') renderSin();
}
function sinListas() {
  const ord = l => l.slice().sort((a, b) => actualizado(b) - actualizado(a));
  const pend = poolRows.filter(r => !buzon[tkey(r)]);
  return { pend: ord(pend), mias: ord(pend.filter(esMiZonaPool)), buzon: ord(poolRows.filter(r => buzon[tkey(r)])) };
}
function updateSinBadge() {
  const b = document.getElementById('sinBadge'); if (!b) return;
  const n = sinListas().mias.length; b.textContent = n; b.hidden = !n;
}
function archivar(key, si) {
  if (si) buzon[key] = Date.now(); else delete buzon[key];
  lsSet(BUZON_KEY, buzon); renderSin(); updateSinBadge();
  toast(si ? 'Archivada en el buzón · desaparecerá sola al asignarse' : 'Recuperada a pendientes');
}
// Recomendación: técnico de la zona con menos visitas ese día (y menos abiertas para desempatar)
function recomendar(r, fecha) {
  const z = zonaPool(r), zona = ZONAS_TEC.find(x => x.nombre === z);
  if (!zona) return null;
  const f = ddmmyyyy(fecha), pob = poblacionDe(r);
  return zona.ops.map(op => {
    const vis = rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op);
    const abiertas = rows.filter(x => x.operario === op).length;
    const juntos = pob ? vis.filter(x => poblacionDe(x) === pob).length : 0;
    return { op, carga: vis.length, min: cargaMin(op, f), abiertas, juntos, score: vis.length - (juntos ? 1.5 : 0) + abiertas / 100 };
  }).sort((a, b) => a.score - b.score || a.min - b.min || opIndex(a.op) - opIndex(b.op));
}
function sinFila(r, enBuzon) {
  const k = tkey(r), mia = esMiZonaPool(r), mot = motivoTexto(k), act = actualizado(r);
  const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
  const rec = mia ? recomendar(r, hoy) : null;
  const best = rec && rec[0];
  return `<div class="sa-row${mia ? '' : ' otra'}" data-key="${esc(k)}">
    <div class="sa-main">
      <div class="sa-l1">${numHtml(r)}${cadBadge(r)}${reincBadge(r)}<span class="sa-zona${mia ? ' mia' : ''}">${esc(zonaPool(r))}</span><span class="sa-act" title="Última actualización">${act ? esc(cuando(act)) : ''}</span></div>
      <div class="sa-l2">${esc(r.descCliente || '')} · <b>${esc(r.descSede || '—')}</b> · ${esc([r.poblacion, r.provincia].filter(Boolean).join(', ') || r.domicilio || '')}</div>
      ${mot ? `<div class="sa-mot">${esc(mot.slice(0, 160))}</div>` : ''}
    </div>
    <div class="sa-acc">
      ${mia && best ? `<div class="sa-rec">Recomendado: <b>${esc(best.op)}</b> · ${best.carga ? plural(best.carga, 'visita') : 'libre'} hoy${best.juntos ? ' · ya va a ' + esc(r.poblacion || '') : ''}</div>
        <div class="sa-asig"><select id="sa-op-${esc(k)}">${rec.map(x => `<option value="${esc(x.op)}">${esc(x.op)} · ${x.carga ? x.carga + ' hoy' : 'libre hoy'} · ${x.abiertas} abiertas</option>`).join('')}</select>
        <input type="date" id="sa-f-${esc(k)}" title="Fecha de visita (opcional)">
        <button class="btn sm pri" onclick="asignarSin('${jsq(k)}')">Asignar</button></div>` : ''}
      <button class="btn sm ghost" onclick="archivar('${jsq(k)}', ${enBuzon ? 'false' : 'true'})">${enBuzon ? 'Recuperar' : 'Archivar'}</button>
    </div>
  </div>`;
}
function renderSin() {
  const root = document.getElementById('viewSin');
  const L = sinListas();
  const lista = sinVista === 'buzon' ? L.buzon : (sinFiltro === 'mia' ? L.mias : L.pend);
  root.innerHTML = `<div class="dia-top"><h1>Sin asignar</h1>
      <div class="acts"><span class="seg mini">${[['pend', `Pendientes · ${L.pend.length}`], ['buzon', `Buzón · ${L.buzon.length}`]].map(([v, l]) => `<button class="segb${sinVista === v ? ' on' : ''}" onclick="sinVista='${v}';renderSin()">${l}</button>`).join('')}</span>
      ${sinVista === 'pend' ? `<span class="seg mini">${[['mia', `Mi zona · ${L.mias.length}`], ['todas', 'Todas las zonas']].map(([v, l]) => `<button class="segb${sinFiltro === v ? ' on' : ''}" onclick="sinFiltro='${v}';renderSin()">${l}</button>`).join('')}</span>` : ''}</div></div>
    <div class="dnote" style="margin:0">Visitas en PRESENCIAL que siguen en un operario «PENDIENTE ASIGNAR». La más reciente arriba. Al asignarse desaparecen solas, también del buzón.</div>
    ${!poolCargado ? '<div class="empty">Esperando la próxima actualización de ATGO (recarga la pestaña de ATGO y pulsa el favorito si no aparece).</div>'
      : lista.length ? `<div class="sa-list">${lista.map(r => sinFila(r, sinVista === 'buzon')).join('')}</div>`
      : `<div class="empty">${sinVista === 'buzon' ? 'El buzón está vacío.' : 'No hay visitas pendientes de asignar.'}</div>`}`;
}
async function asignarSin(key) {
  const r = ticketDe(key); if (!r) return;
  const op = document.getElementById('sa-op-' + key).value, f = document.getElementById('sa-f-' + key).value;
  const ok = await confirmar(`<b>Asignar en ATGO</b><p>Nº ${esc(r.num)} · ${esc(r.descSede || '')}</p>
    <table class="md-tab"><tr><td>Técnico</td><td><span>${esc(r.operario)}</span> → <b>${esc(op)}</b></td></tr>${f ? `<tr><td>Fecha de visita</td><td><b>${esc(f.split('-').reverse().join('/'))}</b></td></tr>` : ''}</table>
    <p class="hint">Despacho reenvía la ficha tal cual cambiando solo esto y lo comprueba campo a campo.</p>`, 'Asignar');
  if (!ok) return;
  const res = await enviarEdicion('asignar', key, { codOpe: op, ...(f ? { fechaVisita: f } : {}), resumen: `Asignado: ${r.operario} → ${op}${f ? ' · visita ' + f : ''}` });
  if (res && res.ok) { poolRows = poolRows.filter(x => tkey(x) !== key); renderSin(); updateSinBadge(); }
}

// ===== Vigilancia de la sincronización =====
let syncUltima = 0, syncAvisado = false;
function marcarSync(m) { if (m && !m.partial && m.at) { syncUltima = m.at; syncAvisado = !!m.desdeCache; renderSyncAviso(); } }   // con datos guardados no se manda aviso de Windows
function renderSyncAviso() {
  const el = document.getElementById('syncAviso'); if (!el) return;
  const viejo = source === 'atgo' && syncUltima && Date.now() - syncUltima > SYNC_AVISO_MIN * 60000;
  el.hidden = !viejo;
  if (viejo) el.innerHTML = `⚠ ATGO sin actualizar desde las ${esc(hhmm(syncUltima))} <button class="btn sm" onclick="document.getElementById('atgoBtn').click()">Abrir ATGO</button>`;
  if (viejo && !syncAvisado) { syncAvisado = true; notificarLista([{ num: '—', op: 'ATGO', a: 'Lleva más de ' + SYNC_AVISO_MIN + ' min sin actualizar: revisa la pestaña de ATGO o la sesión' }]); }
}
setInterval(renderSyncAviso, 60000);

// ===== Avisos de comentarios nuevos en el hilo (técnicos) =====
// Se llama desde recibirHilos antes de guardar el hilo nuevo.
function detectarComentarios(key, prev, nuevo) {
  if (!prev || !nuevo) return;
  const maxPrev = Math.max(0, ...prev.items.map(i => i.ts || 0));
  const disp = dispatcherOps();
  const nuevos = nuevo.items.filter(i => (i.ts || 0) > maxPrev && i.t && !HILO_SISTEMA.some(re => re.test(i.t.trim())) && !disp.includes(cleanInitials(i.u)) && !/administrador/i.test(i.u));
  if (!nuevos.length) return;
  const r = ticketDe(key) || {};
  const evs = nuevos.map(i => ({ id: hash('com' + key + i.ts), ts: Date.now(), key, num: r.num || key, tipo: 'comentario', de: '', a: i.t.replace(/\s+/g, ' ').slice(0, 200), op: cleanInitials(i.u), autor: nombreCorto(i.n, i.u), sede: r.descSede || '', cli: r.descCliente || '', f: r.fVisita || '', visto: false }));
  eventos = [...evs, ...eventos].slice(0, 600); lsSet(EVT_KEY, eventos);
  if (avisos.comentarios !== false) notificarLista(evs.map(e => ({ num: e.num, op: e.op, a: 'Comentario: ' + e.a.slice(0, 120) })));
  updateDiaBadge();
}

// ===== Respuestas rápidas para el hilo =====
const FRASES_DEF = ['Material enviado a GLS. Recógelo antes de ir.', 'Contacta con el encargado antes de acudir.', 'Visita confirmada con el cliente para el {fecha}.', 'Por favor, finaliza el ticket en ATGO al terminar.', 'Cliente ilocalizable: reintenta mañana y deja comentario.'];
function frases() { return Array.isArray(tecCfg.frases) ? tecCfg.frases : FRASES_DEF; }
let frasesEdit = false;
function frasesHtml(r) {
  const v = { tecnico: nombreTecnico(r) || r.operario || '', fecha: r.fVisita || '', num: r.num || '', sede: r.descSede || '' };
  if (frasesEdit) return `<ul class="fr-edit">${frases().map((f, i) => `<li><input value="${esc(f)}" oninput="setFrase(${i}, this.value)"><button class="iconbtn" onclick="delFrase(${i})" title="Quitar">✕</button></li>`).join('')}
    <li><input id="frNueva" placeholder="Nueva respuesta (campos: {tecnico} {fecha} {num} {sede})" onkeydown="if(event.key==='Enter')addFrase()"><button class="iconbtn" onclick="addFrase()">+</button></li>
    <li><button class="btn sm" onclick="frasesEdit=false;renderFicha()">Listo</button></li></ul>`;
  return `<div class="fr">${frases().map(f => `<button class="chip sm" title="${esc(f)}" onclick="usarFrase(this)" data-t="${esc(rellenar(f, v))}">${esc(rellenar(f, v).slice(0, 34))}${f.length > 34 ? '…' : ''}</button>`).join('')}<button class="chip sm" onclick="frasesEdit=true;renderFicha()" title="Editar respuestas rápidas">✎</button></div>`;
}
function usarFrase(b) { const ta = document.getElementById('edCom'); if (!ta) return; ta.value = (ta.value ? ta.value.trim() + ' ' : '') + b.dataset.t; ta.focus(); }
function setFrase(i, t) { const l = frases().slice(); l[i] = t; tecCfg.frases = l; saveTec(); }
function delFrase(i) { const l = frases().slice(); l.splice(i, 1); tecCfg.frases = l; saveTec(); renderFicha(); }
function addFrase() { const el = document.getElementById('frNueva'); const t = (el && el.value || '').trim(); if (!t) return; tecCfg.frases = [...frases(), t]; saveTec(); renderFicha(); }

// ===== Duración real de las visitas y carga en horas =====
// Del hilo: "ha iniciado el ticket" → siguiente "ha finalizado el ticket" del mismo día.
function registrarDuraciones(key) {
  const h = hilos[key], r = ticketDe(key); if (!h || !r) return;
  const it = h.items.slice().sort((a, b) => a.ts - b.ts);
  let ini = null, cambio = false;
  it.forEach(i => {
    if (/ha iniciado el ticket/i.test(i.t)) ini = i.ts;
    else if (/ha finalizado el ticket/i.test(i.t) && ini && isoHoy(new Date(ini)) === isoHoy(new Date(i.ts))) {
      const min = Math.round((i.ts - ini) / 60000);
      if (min >= 5 && min <= 600) { duraciones[key + '@' + ini] = { op: cleanInitials(r.operario), tipo: norm(r.tipo || ''), min, ts: i.ts }; cambio = true; }
      ini = null;
    }
  });
  if (cambio) {
    Object.keys(duraciones).forEach(k => { if (Date.now() - duraciones[k].ts > 90 * 86400000) delete duraciones[k]; });
    lsSet(DUR_KEY, duraciones);
  }
}
function mediana(a) { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); }
function estimarMin(r) {
  const d = Object.values(duraciones), tipo = norm(r.tipo || ''), op = cleanInitials(r.operario);
  const porTipo = tipo ? d.filter(x => x.tipo === tipo).map(x => x.min) : [];
  if (porTipo.length >= 3) return mediana(porTipo);
  const porOp = d.filter(x => x.op === op).map(x => x.min);
  if (porOp.length >= 3) return mediana(porOp);
  return d.length >= 5 ? mediana(d.map(x => x.min)) : DURACION_DEF;
}
function cargaMin(op, f) { return rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op).reduce((s, x) => s + estimarMin(x), 0); }
function fmtMin(m) { const h = Math.floor(m / 60), mm = m % 60; return h ? h + ' h' + (mm ? ' ' + String(mm).padStart(2, '0') : '') : mm + ' min'; }
function cargaHtml(op, f) {
  const m = cargaMin(op, f); if (!m) return '';
  const pc = Math.min(100, Math.round(m / JORNADA_MIN * 100));
  return `<span class="ch-h${m > JORNADA_MIN ? ' over' : ''}" title="Estimado con la duración real de las visitas (iniciar → finalizar en ATGO)">≈ ${fmtMin(m)} de ${JORNADA_MIN / 60} h</span>`;
}

// ===== Conflictos de planificación =====
function conflictos(f) {
  const out = [];
  TECNICOS.forEach(op => {
    const vis = sortByHora(rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op));
    if (!vis.length) return;
    const tot = vis.reduce((s, x) => s + estimarMin(x), 0);
    if (tot > JORNADA_MIN) out.push({ op, tipo: 'sobrecarga', texto: `${fmtMin(tot)} estimadas (más de ${JORNADA_MIN / 60} h)`, keys: vis.map(tkey) });
    const con = vis.filter(x => x.desdeHora).map(x => { const a = horaMin(x.desdeHora), b = x.hastaHora ? horaMin(x.hastaHora) : a + estimarMin(x); return { x, a, b }; });
    for (let i = 0; i < con.length; i++) for (let j = i + 1; j < con.length; j++) {
      if (con[j].a < con[i].b && con[i].a < con[j].b && !con[i].x.hastaHora && !con[j].x.hastaHora || (con[i].x.hastaHora && con[j].x.hastaHora && con[j].a < con[i].b && con[i].a < con[j].b && con[i].b - con[i].a < 180 && con[j].b - con[j].a < 180))
        out.push({ op, tipo: 'solape', texto: `${con[i].x.desdeHora} (Nº ${con[i].x.num}) se solapa con ${con[j].x.desdeHora} (Nº ${con[j].x.num})`, keys: [tkey(con[i].x), tkey(con[j].x)] });
    }
    if (tecCfg.rutaGls !== false) con.filter(c => c.a >= 9 * 60 && c.a < 10 * 60).forEach(c => out.push({ op, tipo: 'gls', texto: `cita a las ${c.x.desdeHora} (Nº ${c.x.num}) en la franja de recogida en GLS`, keys: [tkey(c.x)] }));
  });
  return out;
}

// ===== Reincidencias (misma sede, varios tickets en 30 días) =====
function sedeKey(r) { return norm((r.descCliente || r.cli || '') + '|' + (r.descSede || r.sede || '')); }
function reincidencias() {
  const lim = Date.now() - 30 * 86400000, m = {};
  const add = (k, info) => { (m[k] = m[k] || new Map()).set(info.key, info); };
  [...rows, ...poolRows].forEach(r => { const d = registro(r); if (d && d.getTime() >= lim && (r.descSede)) add(sedeKey(r), { key: tkey(r), num: r.num, sede: r.descSede, cli: r.descCliente, estado: r.estado, ts: d.getTime() }); });
  Object.values(cerradas).forEach(c => { if (c.ts >= lim && c.sede) add(sedeKey(c), { key: c.key, num: c.num, sede: c.sede, cli: c.cli, estado: c.estado, ts: c.ts }); });
  return Object.values(m).map(x => [...x.values()]).filter(l => l.length >= 2).sort((a, b) => b.length - a.length);
}
let reincCache = { at: 0, idx: {} };
function reincBadge(r) {
  if (Date.now() - reincCache.at > 30000) { const idx = {}; reincidencias().forEach(l => l.forEach(t => idx[t.key] = l.length)); reincCache = { at: Date.now(), idx }; }
  const n = reincCache.idx[tkey(r)];
  return n ? `<span class="reinc" title="Misma sede con ${n} tickets en 30 días">↻ ${n}</span>` : '';
}

// ===== Planificación en bloque (secuencial: cada uno se guarda y se comprueba por separado) =====
let loteEnCurso = false;
async function asignarLote(items, titulo) {
  if (loteEnCurso || !items.length) return;
  const ok = await confirmar(`<b>${esc(titulo || 'Planificar en ATGO')}</b><p>${plural(items.length, 'ticket')}:</p>
    <table class="md-tab">${items.slice(0, 15).map(it => { const r = ticketDe(it.key) || {}; return `<tr><td>Nº ${esc(r.num || it.key)}</td><td><span>${esc(r.operario || '')}${r.fVisita ? ' · ' + esc(r.fVisita) : ''}</span> → <b>${esc(it.codOpe || r.operario)}${it.fechaVisita ? ' · ' + esc(it.fechaVisita.split('-').reverse().join('/')) : ''}</b></td></tr>`; }).join('')}${items.length > 15 ? `<tr><td colspan="2">…y ${items.length - 15} más</td></tr>` : ''}</table>
    <p class="hint">Se guardan uno a uno, comprobando cada ficha campo a campo. Si alguno falla, los demás siguen.</p>`, 'Guardar ' + plural(items.length, 'cambio'));
  if (!ok) return;
  loteEnCurso = true;
  let bien = 0; const mal = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i], r = ticketDe(it.key) || {};
    toast(`Guardando ${i + 1}/${items.length} en ATGO…`);
    const res = await enviarEdicion('asignar', it.key, { ...(it.codOpe && it.codOpe !== cleanInitials(r.operario) ? { codOpe: it.codOpe } : {}), ...(it.fechaVisita ? { fechaVisita: it.fechaVisita } : {}), resumen: `${r.operario || ''} → ${it.codOpe || r.operario}${it.fechaVisita ? ' · ' + it.fechaVisita : ''}` });
    if (res && res.ok) bien++; else mal.push((r.num || it.key) + ': ' + ((res && res.error) || 'sin respuesta'));
  }
  loteEnCurso = false;
  seleccion.clear();
  toast(`${bien}/${items.length} guardados en ATGO${mal.length ? ' · fallaron ' + mal.length : ''}`);
  if (mal.length) confirmar(`<b>No se guardaron ${mal.length}</b><ul>${mal.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`, 'Entendido');
  refreshVisible(); if (document.getElementById('viewSem').style.display !== 'none') renderSemana();
}

// ===== Replanificar visitas vencidas =====
function propuestaVencida(r) {
  const s = sugerirTecnico(r, nextWorkday()); if (!s || !s.lista.length) return null;
  return { key: tkey(r), codOpe: s.lista[0].op, fechaVisita: isoHoy(nextWorkday()) };
}
function replanificarVencidas() {
  const items = sinPlanificar().vencidas.map(propuestaVencida).filter(Boolean);
  if (!items.length) { toast('No hay visitas vencidas con propuesta'); return; }
  asignarLote(items, 'Replanificar visitas vencidas al ' + diaLargo(nextWorkday()));
}

// ===== Vista Semana: carga por técnico y día, con arrastrar y soltar =====
let semOff = 0, semAbierta = {}, seleccion = new Set(), loteOp = '', loteDia = '';
function diasSemana() {
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + semOff * 7);
  return Array.from({ length: 5 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return x; });
}
function semPendientes() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const sinF = rows.filter(r => esPresencial(r) && TECNICOS.includes(cleanInitials(r.operario)) && enZona(r) && (!r.fVisita || parseEs(r.fVisita) < hoy));
  const pool = poolRows.filter(r => esMiZonaPool(r) && !buzon[tkey(r)] && (!zonaSel || zonaPool(r) === zonaSel));
  return [...pool.map(r => ({ r, pool: true })), ...sinF.map(r => ({ r, pool: false }))];
}
function chipTicket(r, extra) {
  const k = tkey(r);
  return `<div class="tk" draggable="true" data-drag="${esc(k)}" title="${esc([r.descSede, motivoTexto(k)].filter(Boolean).join(' · '))}">${extra || ''}<b class="mono">${esc(String(r.num).slice(-5))}</b><span>${esc(r.desdeHora || '')}</span></div>`;
}
function renderSemana() {
  const root = document.getElementById('viewSem');
  const dias = diasSemana(), act = fase2Activa('*');
  const zonas = zonaSel ? ZONAS_TEC.filter(z => z.nombre === zonaSel) : ZONAS_TEC;
  const pend = semPendientes();
  const fmtD = d => DIAS[d.getDay()].slice(0, 3) + ' ' + d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  root.innerHTML = `<div class="dia-top"><h1>Semana</h1>
      <div class="daynav"><button class="iconbtn" onclick="semOff--;renderSemana()" aria-label="Semana anterior">◀</button><span class="day">${esc(fmtD(dias[0]))} – ${esc(fmtD(dias[4]))}</span><button class="iconbtn" onclick="semOff++;renderSemana()" aria-label="Semana siguiente">▶</button>${semOff ? '<button class="btn sm" onclick="semOff=0;renderSemana()">Esta semana</button>' : ''}<button class="btn sm" onclick="abrirMapa(manDate)">Mapa</button></div></div>
    <div id="semChips"></div>
    ${act ? '' : '<div class="od-aviso">Para arrastrar y planificar, activa «Planificar en ATGO» para todos los tickets en ⚙.</div>'}
    <div class="sem">
      <aside class="sem-pend">
        <div class="dsh"><h2>Por planificar</h2><small>${pend.length}</small></div>
        <div class="dnote" style="margin:0 0 6px">Arrastra a una casilla, o marca varios y asígnalos de una vez.</div>
        ${pend.length ? pend.map(({ r, pool }) => `<label class="sp-it" data-key="${esc(tkey(r))}"><input type="checkbox" ${seleccion.has(tkey(r)) ? 'checked' : ''} onclick="event.stopPropagation();selToggle('${jsq(tkey(r))}',this.checked)">${chipTicket(r, pool ? '<i class="pool">sin asignar</i>' : '')}<span class="sp-tx">${esc(cleanInitials(r.operario).startsWith('XXX') ? zonaPool(r) : r.operario)} · ${esc(r.descSede || '')}${r.fVisita ? ' · <span class="venc">vencida ' + esc(r.fVisita.slice(0, 5)) + '</span>' : ''}</span></label>`).join('') : '<div class="dempty">Nada por planificar.</div>'}
        ${seleccion.size ? `<div class="sp-lote"><b>${plural(seleccion.size, 'seleccionado')}</b>
          <select id="loteOp">${TECNICOS.map(op => `<option${op === loteOp ? ' selected' : ''}>${op}</option>`).join('')}</select>
          <select id="loteDia">${dias.map(d => `<option value="${isoHoy(d)}"${isoHoy(d) === loteDia ? ' selected' : ''}>${fmtD(d)}</option>`).join('')}</select>
          <button class="btn sm pri" onclick="loteOp=document.getElementById('loteOp').value;loteDia=document.getElementById('loteDia').value;asignarLote([...seleccion].map(k=>({key:k,codOpe:loteOp,fechaVisita:loteDia})),'Planificación en bloque')">Asignar</button>
          <button class="btn sm ghost" onclick="seleccion.clear();renderSemana()">Quitar selección</button></div>` : ''}
      </aside>
      <div class="sem-grid">
        <div class="sg-row sg-head"><div></div>${dias.map(d => `<div class="${isoHoy(d) === isoHoy() ? 'hoy' : ''}">${esc(fmtD(d))}</div>`).join('')}</div>
        ${zonas.map(z => `<div class="sg-zona">${esc(z.nombre)}</div>` + z.ops.map(op => `<div class="sg-row"><div class="sg-op"><b>${esc(op)}</b></div>${dias.map(d => {
          const f = ddmmyyyy(d), vis = sortByHora(rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op));
          const m = cargaMin(op, f), pc = Math.min(100, Math.round(m / JORNADA_MIN * 100));
          const conf = conflictos(f).filter(c => c.op === op);
          const id = op + '|' + isoHoy(d), abierta = semAbierta[id];
          return `<div class="sg-cell${conf.length ? ' conf' : ''}" data-drop="${esc(op)}|${isoHoy(d)}" title="${esc(conf.map(c => c.texto).join('\n'))}">
            <div class="sg-n" onclick="semAbierta['${jsq(id)}']=!semAbierta['${jsq(id)}'];renderSemana()">${vis.length ? `<b>${vis.length}</b>${m ? ' · ' + fmtMin(m) : ''}` : '<span class="lib">—</span>'}${conf.length ? ' <span class="cf">⚠</span>' : ''}</div>
            <div class="sg-bar"><i class="${m > JORNADA_MIN ? 'over' : ''}" style="width:${pc}%"></i></div>
            ${abierta || vis.length <= 3 ? `<div class="sg-tks">${vis.map(r => chipTicket(r)).join('')}</div>` : ''}
          </div>`;
        }).join('')}</div>`).join('')).join('')}
      </div>
    </div>`;
  document.getElementById('semChips').appendChild(zoneChips(() => renderSemana(), Object.fromEntries(ZONAS_TEC.map(z => [z.nombre, rows.filter(r => zonaDe(r.operario) === z.nombre && esPresencial(r)).length || '0'])), ZONAS_TEC));
}
function selToggle(k, on) { on ? seleccion.add(k) : seleccion.delete(k); renderSemana(); }
// Arrastrar y soltar
document.addEventListener('dragstart', e => { const t = e.target.closest && e.target.closest('[data-drag]'); if (!t) return; e.dataTransfer.setData('text/plain', t.dataset.drag); e.dataTransfer.effectAllowed = 'move'; t.classList.add('drag'); });
document.addEventListener('dragend', e => { const t = e.target.closest && e.target.closest('[data-drag]'); if (t) t.classList.remove('drag'); document.querySelectorAll('.sg-cell.over').forEach(c => c.classList.remove('over')); });
document.addEventListener('dragover', e => { const c = e.target.closest && e.target.closest('[data-drop]'); if (!c) return; e.preventDefault(); e.stopPropagation(); document.querySelectorAll('.sg-cell.over').forEach(x => x !== c && x.classList.remove('over')); c.classList.add('over'); }, true);
document.addEventListener('drop', e => {
  const c = e.target.closest && e.target.closest('[data-drop]'); if (!c) return;
  e.preventDefault(); e.stopPropagation(); c.classList.remove('over');
  const key = e.dataTransfer.getData('text/plain'); if (!key) return;
  if (!fase2Activa('*')) { toast('Activa «Planificar en ATGO» para todos en ⚙'); return; }
  const [op, f] = c.dataset.drop.split('|'), r = ticketDe(key); if (!r) return;
  if (cleanInitials(r.operario) === op && fechaIsoDe(r) === f) return;
  asignarLote([{ key, codOpe: op, fechaVisita: f }], `Planificar Nº ${r.num}`);
}, true);

// ===== Línea de tiempo del día (Mi día) =====
function lineaTiempoHtml() {
  const ruta = rutaHoy().filter(x => TECNICOS.includes(cleanInitials(x.op)) && (!zonaSel || zonaDe(x.op) === zonaSel));
  if (!ruta.length) return '<div class="dempty">Sin visitas enrutadas para hoy.</div>';
  const H0 = 8 * 60, H1 = 20 * 60, pos = m => Math.max(0, Math.min(100, (m - H0) / (H1 - H0) * 100));
  const now = new Date(), nowM = now.getHours() * 60 + now.getMinutes();
  const byOp = {}; ruta.forEach(x => (byOp[x.op] = byOp[x.op] || []).push(x));
  const horas = []; for (let h = 8; h <= 20; h += 2) horas.push(h);
  return `<div class="tl">
    <div class="tl-row tl-head"><div></div><div class="tl-axis">${horas.map(h => `<span style="left:${pos(h * 60)}%">${h}:00</span>`).join('')}</div></div>
    ${Object.keys(byOp).sort((a, b) => opIndex(a) - opIndex(b)).map(op => `<div class="tl-row"><div class="tl-op">${esc(op)}</div><div class="tl-track">
      ${nowM > H0 && nowM < H1 ? `<i class="tl-now" style="left:${pos(nowM)}%"></i>` : ''}
      ${byOp[op].map(x => {
        const r = x.r, a = r.desdeHora ? horaMin(r.desdeHora) : null;
        if (a == null) return '';
        const b = r.hastaHora ? horaMin(r.hastaHora) : a + estimarMin(r);
        const real = x.ts ? new Date(x.ts) : null, realM = real ? real.getHours() * 60 + real.getMinutes() : null;
        return `<span class="tl-b st-${x.st}${x.late ? ' late' : ''}" data-key="${esc(tkey(r))}" style="left:${pos(a)}%;width:${Math.max(1.5, pos(b) - pos(a))}%" title="${esc(r.desdeHora + ' · Nº ' + r.num + ' · ' + (r.descSede || '') + ' · ' + (x.label || ST_LAB[x.st]))}"></span>${realM != null ? `<i class="tl-real" style="left:${pos(realM)}%" title="Real: ${esc(hhmm(x.ts))}"></i>` : ''}`;
      }).join('')}
      ${byOp[op].filter(x => !x.r.desdeHora).length ? `<span class="tl-sh">+${byOp[op].filter(x => !x.r.desdeHora).length} sin hora</span>` : ''}
    </div></div>`).join('')}
  </div>`;
}

// ===== Secciones adicionales de Mi día =====
function seccionesExtra() {
  const fM = ddmmyyyy(nextWorkday()), cM = conflictos(fM), reinc = reincidencias();
  return `<section class="dsec" id="secConf">
      <div class="dsh"><h2>Conflictos</h2><small>${esc(diaLargo(nextWorkday()))} · ${cM.length}</small></div>
      ${cM.length ? `<ul class="tlist">${cM.map(c => `<li class="due" data-key="${esc(c.keys[0])}"><b class="mono">${esc(c.op)}</b><span class="tx">${esc(c.texto)}</span><span class="ex">${esc(c.tipo === 'solape' ? 'solape' : c.tipo === 'gls' ? 'GLS' : 'carga')}</span></li>`).join('')}</ul>` : '<div class="dempty">Sin solapes, sobrecargas ni choques con la recogida en GLS.</div>'}
    </section>
    <section class="dsec" id="secReinc">
      <div class="dsh"><h2>Reincidencias</h2><small>misma sede · 30 días · ${reinc.length}</small></div>
      ${reinc.length ? `<ul class="tlist">${reinc.slice(0, 15).map(l => `<li data-key="${esc(l[0].key)}"><b class="mono">${l.length}×</b><span class="tx">${esc(l[0].sede)} · ${esc(l[0].cli || '')}</span><span class="ex">${esc(l.map(t => String(t.num).slice(-5)).join(', '))}</span></li>`).join('')}</ul>` : '<div class="dempty">Ninguna sede con varios tickets en 30 días.</div>'}
    </section>`;
}

// ===== Secciones plegables de Mi día =====
const PLIEGUE_DEF = { secNov: false, secTL: false };   // abiertas por defecto; el resto, plegadas
function plegada(id) { return id in pliegues ? pliegues[id] : !(id in PLIEGUE_DEF); }
function aplicarPliegues(root) {
  root.querySelectorAll('.dsec[id]').forEach(s => {
    s.classList.toggle('cerrada', plegada(s.id));
    const h = s.querySelector('.dsh');
    if (h && !h.querySelector('.pl-chev')) h.insertAdjacentHTML('afterbegin', '<span class="pl-chev">▾</span>');
  });
}
function plegar(id, v) { pliegues[id] = v; lsSet(PLIEGUE_KEY, pliegues); const s = document.getElementById(id); if (s) s.classList.toggle('cerrada', v); }
function plegarTodo(v) { document.querySelectorAll('#viewDia .dsec[id]').forEach(s => { pliegues[s.id] = v; s.classList.toggle('cerrada', v); }); lsSet(PLIEGUE_KEY, pliegues); }
document.addEventListener('click', e => {
  const h = e.target.closest && e.target.closest('#viewDia .dsh');
  if (!h || e.target.closest('button,input,select,a,label')) return;
  const s = h.closest('.dsec[id]'); if (s) plegar(s.id, !s.classList.contains('cerrada'));
}, true);

// ===== Mapa del día (Leaflet + OpenStreetMap) =====
// Las direcciones se convierten en coordenadas con Nominatim (OpenStreetMap), 1 por segundo, y se guardan.
function cargarLeaflet() {
  if (window.L) return Promise.resolve();
  return new Promise((res, rej) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
}
async function geocodificar(dir) {
  const k = norm(dir); if (k in geoCache) return geoCache[k];
  await new Promise(r => setTimeout(r, 1100));   // límite de uso de Nominatim: 1 petición por segundo
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=es,pt&q=' + encodeURIComponent(dir), { headers: { 'Accept-Language': 'es' } });
    const d = await r.json(); geoCache[k] = d && d[0] ? [+d[0].lat, +d[0].lon] : null;
  } catch (e) { return null; }
  lsSet(GEO_KEY, geoCache); return geoCache[k];
}
const COLORES_MAPA = ['#2f8f87', '#c9862b', '#5b8dd9', '#a97fd1', '#c9527a', '#5ea86f', '#d9614f', '#7a6f5a', '#3b8bba', '#b07d2b'];
async function abrirMapa(fecha) {
  const f = ddmmyyyy(fecha || manDate), m = document.getElementById('modal');
  const ops = TECNICOS.filter(op => (!zonaSel || zonaDe(op) === zonaSel) && rows.some(x => esPresencial(x) && x.fVisita === f && x.operario === op));
  m.innerHTML = `<div class="md-box md-mapa"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Mapa · ${esc(diaLargo(parseEs(f)))}</div><div class="dw-sub" id="mapaEst">Cargando…</div></div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div><div id="mapa"></div><div class="mapa-leg">${ops.map((op, i) => `<span><i style="background:${COLORES_MAPA[i % COLORES_MAPA.length]}"></i>${esc(op)}</span>`).join('')}</div></div>`;
  m.hidden = false;
  if (!ops.length) { document.getElementById('mapaEst').textContent = 'Sin visitas ese día.'; return; }
  try { await cargarLeaflet(); } catch (e) { document.getElementById('mapaEst').textContent = 'No se pudo cargar el mapa (sin conexión).'; return; }
  const mapa = L.map('mapa').setView([37.4, -4.5], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(mapa);
  setTimeout(() => mapa.invalidateSize(), 150);   // la ventana acaba de abrirse: Leaflet recalcula su tamaño
  const puntos = [];
  let hechos = 0, total = ops.reduce((s, op) => s + paradasRuta(op, f).filter(x => !x.gls).length, 0);
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i], color = COLORES_MAPA[i % COLORES_MAPA.length], linea = [];
    for (const [n, x] of paradasRuta(op, f).filter(x => !x.gls).entries()) {
      const ll = await geocodificar(direccionMaps(x.r));
      hechos++; const est = document.getElementById('mapaEst'); if (est) est.textContent = `Situando direcciones ${hechos}/${total}…`;
      if (!ll || !document.getElementById('mapa')) continue;
      linea.push(ll); puntos.push(ll);
      L.circleMarker(ll, { radius: 9, color, fillColor: color, fillOpacity: .85, weight: 2 }).addTo(mapa)
        .bindTooltip(`${n + 1}`, { permanent: true, direction: 'center', className: 'mapa-num' })
        .bindPopup(`<b>${esc(op)} · ${esc(x.r.desdeHora || 'sin hora')}</b><br>Nº ${esc(x.r.num)}<br>${esc(x.r.descSede || '')}<br>${esc(x.r.domicilio || '')}`);
    }
    if (linea.length > 1) L.polyline(linea, { color, weight: 3, opacity: .7 }).addTo(mapa);
  }
  mapa.invalidateSize();
  if (puntos.length) mapa.fitBounds(puntos, { padding: [30, 30] });
  const est = document.getElementById('mapaEst'); if (est) est.textContent = `${puntos.length}/${total} visitas situadas${puntos.length < total ? ' (algunas direcciones no se encontraron)' : ''}`;
}
