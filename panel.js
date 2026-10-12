// ===== Panel: sin asignar y buzón, vigilancia de la sincronización, Vista Semana (arrastrar y soltar,
// planificación en bloque), replanificar vencidas, respuestas rápidas, carga en horas, línea de tiempo,
// conflictos, reincidencias, mapa, avisos de comentarios y secciones plegables de Mi día.
// Usa utilidades de index.html, dia.js, herramientas.js y edicion.js solo en tiempo de llamada.

const BUZON_KEY = 'dispatcher_buzon_v1', POOLV_KEY = 'dispatcher_pool_vistos_v1', DUR_KEY = 'dispatcher_duraciones_v1';
const GEO_KEY = 'dispatcher_geo_v1', PLIEGUE_KEY = 'dispatcher_pliegues_v1';
const JORNADA_MIN = 8 * 60;              // jornada de referencia para la carga en horas
const SYNC_AVISO_MIN = 10;               // aviso si ATGO lleva más de estos minutos sin actualizar
// Operarios comodín "PENDIENTE ASIGNAR" de tus zonas (el resto son de otros dispatchers)
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
// Zona de una incidencia sin asignar: por el código del comodín (Andalucía), por su nombre en ATGO
// ("PENDIENTE ASIGNAR MURCIA" → MURCIA) y, si no, por la provincia del ticket.
function zonaComodin(op) {
  op = cleanInitials(op);
  return POOL_ZONA[op] || zonaDeTexto(String(poolOpsDesc[op] || '').replace(/^PENDIENTE( DE)? ASIGNAR\s*/i, ''));
}
function zonaPool(r) {
  const z = zonaComodin(r.operario) || zonaDeTexto(String(r.desOperario || '').replace(/^PENDIENTE( DE)? ASIGNAR\s*/i, ''));
  if (z) return z;
  const t = zonaTicket(r);   // por provincia
  if (t) return t;
  // Otras zonas: el nombre del comodín sin 'PENDIENTE ASIGNAR' (p. ej. MADRID)
  const d = String(poolOpsDesc[cleanInitials(r.operario)] || r.desOperario || '').replace(/^PENDIENTE( DE)? ASIGNAR\s*/i, '').replace(/[()]/g, '').trim();
  return d ? d.toUpperCase() : 'OTRA ZONA';
}
function esMiZonaPool(r) { return ZONAS_TEC.some(z => z.nombre === zonaPool(r)); }   // zonas con técnicos en tu perfil
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
  Object.keys(sinElec).forEach(k => { if (!vivos.has(k)) delete sinElec[k]; });
  lsSet(BUZON_KEY, buzon);
  // Aviso de nuevos sin asignar en tu zona (no la primera vez)
  if (poolVistos) {
    const nuevos = poolRows.filter(r => esMiZonaPool(r) && !poolVistos.includes(tkey(r)) && !antes.has(tkey(r)));
    if (nuevos.length && avisos.sinAsignar !== false) notificarLista(nuevos.map(r => ({ num: r.num, op: zonaPool(r), a: 'Sin asignar · ' + (r.descSede || r.domicilio || '') })));
  }
  poolVistos = [...vivos]; lsSet(POOLV_KEY, poolVistos);
  pedirHilos(poolRows.filter(r => !hilos[tkey(r)] || hilos[tkey(r)].at < Date.now() - 10 * 60000).map(tkey));
  updateSinBadge();
  if (document.getElementById('viewSin').style.display !== 'none') { if (ocupado()) refrescoPendiente = true; else renderSin(); }
}
// Orden por urgencia: primero las que caducan antes (las vencidas, arriba del todo); después, la más antigua.
// conDsp: aplica el filtro por DSP (lo que se ve en la pantalla); sin él, para contadores y avisos.
function sinListas(conDsp) {
  const cad = r => { const c = caducidad(r); return c ? c.ts : Infinity; }, reg = r => { const d = registro(r); return d ? d.getTime() : Infinity; };
  const ord = l => l.slice().sort((a, b) => { const x = cad(a), y = cad(b); return x !== y ? (x < y ? -1 : 1) : reg(a) - reg(b) || 0; });
  const ok = r => !conDsp || zonaEnDsp(zonaPool(r));
  const pend = poolRows.filter(r => !buzon[tkey(r)] && ok(r));
  return { pend: ord(pend), mias: ord(pend.filter(esMiZonaPool)), buzon: ord(poolRows.filter(r => buzon[tkey(r)] && ok(r))) };
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
// Misma sede: técnicos que ya tienen abierta otra incidencia de esa sede/centro → { op: nº }
function mismaSede(r) {
  const out = {}; if (!r || !r.descSede) return out;
  const k = sedeKey(r), disp = ZONAS_BASE.filter(z => z.dispatcher).flatMap(z => z.ops);
  rows.forEach(x => { const op = cleanInitials(x.operario); if (tkey(x) !== tkey(r) && sedeKey(x) === k && !disp.includes(op)) out[op] = (out[op] || 0) + 1; });
  return out;
}
function mismaSedeTexto(op, n) { return `${op} ya tiene ${n === 1 ? 'otra incidencia abierta' : n + ' incidencias abiertas'} en esta sede`; }
// Al asignar: bocadillo con el técnico que ya va a esa sede (ámbar si el elegido es otro)
function sedeAvisoHtml(r, elegido) {
  const ms = mismaSede(r), ops = Object.keys(ms).sort((a, b) => ms[b] - ms[a]); if (!ops.length) return '';
  const otro = elegido && !ops.includes(elegido);
  return `<span class="sede-aviso${otro ? ' warn' : ''}" title="${esc(ops.map(op => mismaSedeTexto(op, ms[op])).join('\n') + '\nSugerencia: asígnala al mismo técnico.')}">📍 ${esc(ops[0])}${ops.length > 1 ? ' +' + (ops.length - 1) : ''}</span>`;
}
// En la confirmación de cualquier asignación
function sedeConfirmHtml(r, op) {
  const ms = mismaSede(r), ops = Object.keys(ms); if (!ops.length) return '';
  return ops.includes(op) ? `<p class="sede-ok">📍 ${esc(mismaSedeTexto(op, ms[op]))}: buena elección.</p>`
    : `<p class="sede-warn">📍 ${esc(ops.map(o => mismaSedeTexto(o, ms[o])).join(' · '))}. Sugerencia: asígnala a ${esc(ops.join(' o '))}.</p>`;
}
// Recomendación: técnico de la zona (y de apoyo: Cádiz para Ceuta, Málaga para Melilla) con menos visitas ese día.
// Si un técnico ya tiene abierta otra incidencia de la misma sede, va primero.
function recomendar(r, fecha) {
  const z = zonaPool(r), zona = ZONAS_BASE.find(x => x.nombre === z);
  if (!zona) return null;
  const f = ddmmyyyy(fecha), pob = poblacionDe(r), ms = mismaSede(r);
  return zonaOps(z).filter(op => !enBaja(op)).map(op => {
    const vis = rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op && tkey(x) !== tkey(r));
    const abiertas = rows.filter(x => x.operario === op).length;
    const juntos = pob ? vis.filter(x => poblacionDe(x) === pob).length : 0;
    const apoyo = !zona.ops.includes(op), sede = ms[op] || 0;
    return { op, carga: vis.length, min: cargaMin(op, f), abiertas, juntos, apoyo, sede, score: vis.length - (juntos ? 1.5 : 0) - (sede ? 3 : 0) + (apoyo ? 0.5 : 0) + abiertas / 100 };
  }).sort((a, b) => a.score - b.score || a.min - b.min || opIndex(a.op) - opIndex(b.op));
}
// Elección de cada fila (técnico, fecha, marcada): se conserva aunque ATGO refresque la lista cada 2 min
let sinElec = {};
function sinSet(k, campo, v) {
  const e = sinElec[k] = sinElec[k] || {};
  e[campo] = v;
  // Elegir técnico o fecha marca la fila, siempre que tenga técnico
  if (campo !== 'on') { const sel = document.getElementById('sa-op-' + k); e.on = !!(e.op || (sel && sel.value)); }
  const ck = document.getElementById('sa-ck-' + k); if (ck) { ck.checked = !!e.on; const row = ck.closest('.sa-row'); if (row) row.classList.toggle('marcada', !!e.on); }
  renderSinBarra();
}
// Todas las de la lista visible se pueden asignar, de cualquier zona y a cualquier técnico de cualquier perfil
function sinAsignables() { const L = sinListas(true); return sinVista === 'buzon' ? L.buzon : sinFiltro === 'mia' ? L.mias : L.pend; }
function sinMarcadas() { return sinAsignables().filter(r => sinElec[tkey(r)] && sinElec[tkey(r)].on); }
function sinMarcarTodas(si) {
  let sinTec = 0;
  sinAsignables().forEach(r => {
    const k = tkey(r), sel = document.getElementById('sa-op-' + k), op = (sinElec[k] || {}).op || (sel && sel.value);
    if (si && !op) { sinTec++; return; }   // sin técnico elegido (zona sin recomendación): no se marca
    sinElec[k] = { ...(sinElec[k] || {}), on: si };
  });
  renderSin();
  if (sinTec) toast(`${plural(sinTec, 'incidencia')} sin marcar: elige su técnico primero`);
}
// Opciones del selector de técnico (igual en Sin asignar y en la ficha). Se puede elegir a cualquiera:
// recomendados de su zona primero (★ el mejor), después tus técnicos y, en grupos, los de los demás perfiles.
// En listas largas (Sin asignar) el selector se pinta solo con los recomendados y el elegido, y se completa
// con todos los técnicos al abrirlo (completarSelect): con 100 filas × 70 técnicos, el repintado era pesado.
function opcionesCortas(rec, elegido, vacia) {
  const l = [...new Set([...(rec || []).map(x => x.op), ...(elegido ? [elegido] : [])])];
  const recOp = Object.fromEntries((rec || []).map((x, i) => [x.op, { ...x, i }]));
  const lab = op => { const x = recOp[op]; return x ? `${x.i === 0 ? '★ ' : ''}${op} · ${x.sede ? 'ya va a la sede' : x.carga ? plural(x.carga, 'visita') : 'libre'}${x.apoyo ? ' · apoyo' : ''}` : op; };
  return (vacia ? `<option value=""${elegido ? '' : ' selected'}>${esc(typeof vacia === 'string' ? vacia : 'Elige técnico…')}</option>` : '') +
    l.map(op => `<option value="${esc(op)}"${op === elegido ? ' selected' : ''}>${esc(lab(op))}</option>`).join('') + '<option value="" disabled>— más técnicos al abrir —</option>';
}
function completarSelect(sel) {
  if (!sel || sel.dataset.lleno) return;
  const k = sel.dataset.k, r = ticketDe(k); if (!r) return;
  const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
  const rec = recomendar(r, hoy) || [], v = sel.value;
  sel.innerHTML = opcionesTecnico(rec, v, !rec.length); sel.value = v; sel.dataset.lleno = '1';
}
function opcionesTecnico(rec, elegido, vacia) {
  rec = rec || [];
  const recOp = Object.fromEntries(rec.map((x, i) => [x.op, { ...x, i }]));
  const lab = op => { const x = recOp[op]; return x ? `${x.i === 0 ? '★ ' : ''}${op} · ${x.sede ? 'ya va a la sede' : x.carga ? plural(x.carga, 'visita') : 'libre'}${x.apoyo ? ' · apoyo' : ''}` : op; };
  const vistos = new Set();
  const grupo = (titulo, ops) => {
    const l = ops.filter(op => !vistos.has(op) && (!enBaja(op) || op === elegido)); l.forEach(op => vistos.add(op));   // los de baja no se proponen
    const o = l.map(op => `<option value="${esc(op)}"${op === elegido ? ' selected' : ''}>${esc(lab(op))}</option>`).join('');
    return !l.length ? '' : titulo ? `<optgroup label="${esc(titulo)}">${o}</optgroup>` : o;
  };
  let h = vacia ? `<option value=""${elegido ? '' : ' selected'}>${esc(typeof vacia === 'string' ? vacia : 'Elige técnico…')}</option>` : '';
  h += grupo(rec.length ? 'Recomendados de su zona' : '', rec.map(x => x.op));
  h += grupo(`Mis técnicos (${PERFIL})`, [...dispatcherOps(), ...TECNICOS]);
  PERFILES.filter(p => p !== PERFIL && p !== 'COORD').forEach(p => { h += grupo('Técnicos de ' + p, perfilCfg.tecs[p]); });
  h += grupo('Otros', TODOS_OPS);
  return h;
}
function renderSinBarra() {
  const b = document.getElementById('saBarra'); if (!b) return;
  const tot = sinAsignables().length, n = sinMarcadas().length;
  b.innerHTML = `<label class="sa-todas"><input type="checkbox" ${n && n === tot ? 'checked' : ''} onchange="sinMarcarTodas(this.checked)"> Marcar todas</label>
    <span>${n ? plural(n, 'marcada') : 'Elige técnico (y fecha si quieres) en cada una: se marcan solas'}</span>
    <button class="btn sm pri" onclick="asignarMarcadas()"${n ? '' : ' disabled'}>Asignar ${n ? plural(n, 'marcada') : 'marcadas'}</button>`;
}
// Asignación masiva: cada fila con su técnico y su fecha (opcional); se guardan una a una con comprobación
async function asignarMarcadas() {
  const items = sinMarcadas().map(r => {
    const k = tkey(r), e = sinElec[k] || {}, sel = document.getElementById('sa-op-' + k);
    const op = e.op || (sel && sel.value); return op ? { key: k, codOpe: op, ...(e.f ? { fechaVisita: e.f } : {}) } : null;
  }).filter(Boolean);
  if (!items.length) { toast('Marca al menos una'); return; }
  const res = await asignarLote(items, 'Asignar sin asignar en ATGO');
  if (res && res.okKeys.length) quitarDeSinAsignar(res.okKeys);
}
function sinFila(r, enBuzon) {
  const k = tkey(r), mia = esMiZonaPool(r), mot = motivoTexto(k), act = actualizado(r);
  const hoy = new Date(); hoy.setHours(12, 0, 0, 0);
  const rec = recomendar(r, hoy) || [];   // zona conocida: recomendados primero; si no, "Elige técnico…"
  const lugar = [r.poblacion, r.provincia].filter(Boolean).join(', ') || r.domicilio || '';
  const e = sinElec[k] || {};
  return `<div class="sa-row${mia ? '' : ' otra'}${e.on ? ' marcada' : ''}${olvidada(r) ? ' olvidada' : ''}" data-key="${esc(k)}" title="${esc(mot || '')}">
    <span class="sa-num"><input type="checkbox" class="sa-ck" id="sa-ck-${esc(k)}" ${e.on ? 'checked' : ''} onchange="if(this.checked&&!document.getElementById('sa-op-${jsq(k)}').value){this.checked=false;toast('Elige primero el técnico');return}sinSet('${jsq(k)}','on',this.checked);this.closest('.sa-row').classList.toggle('marcada',this.checked)" aria-label="Marcar para asignar">${numHtml(r)}</span>
    <span class="sa-zona${mia ? ' mia' : ''}">${esc(zonaPool(r))}</span>
    <span class="sa-tx"><b>${esc(r.descSede || '—')}</b> · ${esc(r.descCliente || '')} · ${esc(lugar)}${mot ? ` · <i>${esc(mot.slice(0, 90))}</i>` : ''}</span>
    <span class="sa-badges">${olvidoBadge(r)}${cadBadge(r)}${reincBadge(r)}</span>
    <span class="sa-act">${act ? esc(cuando(act)) : ''}</span>
    <span class="sa-acc">${sedeAvisoHtml(r)}<select id="sa-op-${esc(k)}" data-k="${esc(k)}" onfocus="completarSelect(this)" onmousedown="completarSelect(this)" onchange="sinSet('${jsq(k)}','op',this.value)" title="Cualquier técnico de cualquier perfil. Primero los recomendados de su zona (misma sede o menos visitas hoy)">${opcionesCortas(rec, e.op || '', !rec.length)}</select>
      <input type="date" id="sa-f-${esc(k)}" value="${esc(e.f || '')}" onchange="sinSet('${jsq(k)}','f',this.value)" title="Fecha de visita (opcional)">
      <button class="btn sm pri" onclick="asignarSin('${jsq(k)}')">Asignar</button>
      <button class="iconbtn sm" onclick="archivar('${jsq(k)}', ${enBuzon ? 'false' : 'true'})" title="${enBuzon ? 'Recuperar a pendientes' : 'Archivar en el buzón'}" aria-label="${enBuzon ? 'Recuperar' : 'Archivar'}">${enBuzon ? '↩' : '⤓'}</button></span>
  </div>`;
}
function renderSin() {
  const root = document.getElementById('viewSin');
  const L = sinListas(true);
  const lista = sinVista === 'buzon' ? L.buzon : (sinFiltro === 'mia' ? L.mias : L.pend);
  root.innerHTML = `<div class="dia-top"><h1>Sin asignar</h1>
      <div class="acts">${dspChipsHtml('renderSin()')}<span class="seg mini">${[['pend', `Pendientes · ${L.pend.length}`], ['buzon', `Buzón · ${L.buzon.length}`]].map(([v, l]) => `<button class="segb${sinVista === v ? ' on' : ''}" onclick="sinVista='${v}';renderSin()">${l}</button>`).join('')}</span>
      ${sinVista === 'pend' ? `<span class="seg mini">${[['mia', `Mi zona · ${L.mias.length}`], ['todas', 'Todas las zonas']].map(([v, l]) => `<button class="segb${sinFiltro === v ? ' on' : ''}" onclick="sinFiltro='${v}';renderSin()">${l}</button>`).join('')}</span>` : ''}</div></div>
    <div class="dnote" style="margin:0">Visitas en PRESENCIAL que siguen en un operario «PENDIENTE ASIGNAR». Las más urgentes arriba: primero las que caducan antes y, después, las más antiguas. Al asignarse desaparecen solas, también del buzón.</div>
    ${!poolCargado ? '<div class="empty">Esperando la próxima actualización de ATGO (recarga la pestaña de ATGO y pulsa el favorito si no aparece).</div>'
      : lista.length ? `${sinAsignables().length ? '<div class="sa-barra" id="saBarra"></div>' : ''}<div class="sa-list">${lista.map(r => sinFila(r, sinVista === 'buzon')).join('')}</div>`
      : `<div class="empty">${sinVista === 'buzon' ? 'El buzón está vacío.'
          : sinFiltro === 'mia' && L.pend.length ? `<h2>Ninguna pendiente en tu zona</h2><div>Hay ${plural(L.pend.length, 'visita')} sin asignar en otras zonas.</div><div class="acts" style="justify-content:center;margin-top:10px"><button class="btn" onclick="sinFiltro='todas';renderSin()">Ver todas las zonas</button></div>`
          : 'No hay visitas pendientes de asignar en ninguna zona.'}</div>`}
    ${poolCargado ? `<div class="dnote">Actualizado ${esc(syncUltima ? cuando(syncUltima) : '—')} · ${plural(poolRows.length, 'visita')} sin asignar en toda España.</div>` : ''}`;
  renderSinBarra();
}
async function asignarSin(key) {
  const r = ticketDe(key); if (!r) return;
  // Misma confirmación y guardado que la asignación masiva (una sola pieza para todo)
  const op = document.getElementById('sa-op-' + key).value, fEl = document.getElementById('sa-f-' + key), f = fEl ? fEl.value : '';
  if (!op) { toast('Elige el técnico'); return; }
  const res = await asignarLote([{ key, codOpe: op, ...(f ? { fechaVisita: f } : {}) }], 'Asignar en ATGO');
  if (res && res.okKeys.length) quitarDeSinAsignar(res.okKeys);
}
// Tras asignar (desde Sin asignar o arrastrando en Planificación) desaparece al momento, sin esperar a ATGO
function quitarDeSinAsignar(keys) {
  const ok = new Set(keys); if (!ok.size) return;
  poolRows = poolRows.filter(x => !ok.has(tkey(x))); ok.forEach(k => delete sinElec[k]);
  updateSinBadge();
  if (document.getElementById('viewSin').style.display !== 'none') renderSin();
  if (document.getElementById('viewSem').style.display !== 'none') renderSemana();
}

// ===== Sin asignar olvidadas: de tu zona y con más de X horas sin técnico (aviso en ajustes.js) =====
const OLVIDO_KEY = 'dispatcher_olvidos_v1';
function horasOlvido() { return Math.max(1, Number(tecCfg.olvidoHoras) || 4); }
function horasSinAsignar(r) { const d = registro(r); return d ? (Date.now() - d.getTime()) / 3600000 : 0; }
function olvidada(r) { return esMiZonaPool(r) && !buzon[tkey(r)] && horasSinAsignar(r) >= horasOlvido(); }
function olvidoBadge(r) {
  if (!olvidada(r)) return '';
  const h = horasSinAsignar(r), t = h >= 48 ? Math.floor(h / 24) + ' d' : Math.floor(h) + ' h';
  return `<span class="olv" title="Lleva ${esc(t)} sin técnico (aviso a partir de ${horasOlvido()} h)">⏰ ${esc(t)}</span>`;
}

// ===== Vigilancia de la sincronización =====
let syncUltima = 0, syncAvisado = false;
function marcarSync(m) { if (m && !m.partial && m.at) { syncUltima = m.at; syncAvisado = !!m.desdeCache; renderSyncAviso(); } }   // con datos guardados no se manda aviso de Windows
function renderSyncAviso() {
  const el = document.getElementById('syncAviso'); if (!el || (typeof caidaSeguida !== 'undefined' && caidaSeguida)) return;   // aviso de carga sospechosa a la vista
  if (typeof perfilEsperando !== 'undefined' && perfilEsperando) {
    el.hidden = false; el.className = 'sync-aviso cargando';
    el.innerHTML = `⏳ Cargando los técnicos de ${esc(PERFIL)}… (unos segundos; necesita la pestaña de ATGO abierta)`;
    return;
  }
  el.className = 'sync-aviso';
  if (typeof syncVieja !== 'undefined' && syncVieja) {
    el.hidden = false;
    el.innerHTML = syncVieja === 'app'
      ? `⚠ Despacho no está actualizado (la pestaña de ATGO ya tiene la versión nueva) <button class="btn sm" onclick="actualizarDespacho()">Actualizar Despacho</button>`
      : `⚠ La pestaña de ATGO tiene una versión antigua de la sincronización: recárgala (F5) <button class="btn sm" onclick="document.getElementById('atgoBtn').click()">Ir a ATGO</button>`;
    return;
  }
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

// ===== Duración de las visitas y carga en horas =====
// 1) Lo que diga el hilo del ticket: "duración estimada 2 h", "despliegue de 7 a 15 horas", "jornada completa"…
// 2) Si no, lo que han durado de verdad visitas de la misma sede (2+) o del mismo tipo (3+):
//    "El usuario X ha iniciado el ticket" → "El usuario X ha finalizado el ticket", mismo técnico y día.
// 3) Sin datos no se estima nada: solo cuenta la hora de inicio.
Object.keys(duraciones).forEach(k => { if (!('sede' in duraciones[k])) delete duraciones[k]; });   // datos del cálculo antiguo (mezclaba usuarios)
function registrarDuraciones(key) {
  const h = hilos[key], r = ticketDe(key); if (!h || !r) return;
  const it = h.items.slice().sort((a, b) => a.ts - b.ts);
  const ini = {}; let cambio = false;
  it.forEach(i => {
    const m = /el usuario (\S+) ha (iniciado|finalizado) el ticket/i.exec(i.t || ''); if (!m) return;
    const u = cleanInitials(m[1]);
    if (/^inic/i.test(m[2])) { if (!ini[u]) ini[u] = i.ts; return; }   // varios "iniciado" seguidos: cuenta el primero
    const a = ini[u]; delete ini[u];
    if (!a || !TODOS_OPS.includes(u) || isoHoy(new Date(a)) !== isoHoy(new Date(i.ts))) return;   // solo técnicos de campo, mismo día
    const min = Math.round((i.ts - a) / 60000);
    if (min >= 5 && min <= 600) { duraciones[key + '@' + a] = { op: u, tipo: norm(r.tipo || ''), sede: sedeKey(r), min, ts: i.ts }; cambio = true; }
  });
  if (cambio) {
    Object.keys(duraciones).forEach(k => { if (Date.now() - duraciones[k].ts > 90 * 86400000) delete duraciones[k]; });
    lsSet(DUR_KEY, duraciones);
  }
}
function mediana(a) { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); }
const DUR_CTX = /(duraci|durar|tardar|estimad|aprox|previst|se preve|necesit|requier|intervenci|trabajo|despliegue|montaje|instalaci|ocupar|estara)/;
const NUM_PAL = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8 };
// Minutos que indica un texto, o null. Solo frases con contexto de duración (evita "llamar en 15 minutos").
function minutosTexto(t) {
  for (const fr of norm(t).split(/[.;\n]+/)) {
    if (/jornada completa|toda la jornada/.test(fr)) return 480;
    if (!DUR_CTX.test(fr)) continue;
    // Franja: "de 7 a 15 horas", "de 9:00 a 13:30", "de 9h a 14h"
    let m = /\bde (\d{1,2})(?:[:.h](\d{2}))?\s*h?\s+a\s+(\d{1,2})(?:[:.h](\d{2}))?\s*(h\b|horas?|hrs?)?/.exec(fr);
    if (m && (m[5] || (m[2] && m[4]))) { const d = (+m[3] * 60 + +(m[4] || 0)) - (+m[1] * 60 + +(m[2] || 0)); if (d >= 15 && d <= 720) return d; }
    if (/todo el dia/.test(fr)) return 480;
    if (/toda la manana/.test(fr)) return 300;
    if (/toda la tarde/.test(fr)) return 240;
    if (/hora y media/.test(fr)) return 90;
    if (/media hora/.test(fr)) return 30;
    // Duración suelta: "2 h", "unas 3 horas", "90 minutos". No vale una hora del día ("a las 9 horas", "10:00 horas")
    for (const m2 of fr.matchAll(/(\d+(?:[.,]\d+)?|\bun|\buna|\bdos|\btres|\bcuatro|\bcinco|\bseis|\bsiete|\bocho)\s*(h\b|hrs?\b|horas?|min\b|mins\b|minutos)/g)) {
      const antes = fr.slice(0, m2.index);
      if (/(\ben|dentro de|hace|cada|las|sobre la|desde la|hasta la)\s*$|[:.]$/.test(antes)) continue;
      const w = m2[1].trim(), n = NUM_PAL[w] || parseFloat(w.replace(',', '.')), d = Math.round(/^m/.test(m2[2]) ? n : n * 60);
      if (d >= 10 && d <= 720) return d;
    }
  }
  return null;
}
let durHiloCache = {};
function duracionHilo(key) {
  const u = hiloUtil(key); if (!u) return null;
  const c = durHiloCache[key]; if (c && c.at === u.at) return c.v;
  let v = null;
  for (const i of u.utiles.slice().reverse()) { const min = minutosTexto(i.tn); if (min) { v = { min, src: 'hilo', texto: i.tn }; break; } }   // manda el comentario más reciente
  durHiloCache[key] = { at: u.at, v }; return v;
}
// { min, src: 'hilo' | 'sede' | 'tipo', texto?, n? } o null si no se sabe
function duracionInfo(r) {
  const h = duracionHilo(tkey(r)); if (h) return h;
  const d = Object.values(duraciones), sk = sedeKey(r), tipo = norm(r.tipo || '');
  const sede = r.descSede ? d.filter(x => x.sede === sk).map(x => x.min) : [];
  if (sede.length >= 2) return { min: mediana(sede), src: 'sede', n: sede.length };
  const porTipo = tipo ? d.filter(x => x.tipo === tipo).map(x => x.min) : [];
  if (porTipo.length >= 3) return { min: mediana(porTipo), src: 'tipo', n: porTipo.length };
  return null;
}
function estimarMin(r) { const d = duracionInfo(r); return d ? d.min : null; }
function duracionTexto(r) {
  const d = duracionInfo(r); if (!d) return 'Sin estimar: el hilo no indica cuánto dura';
  return '≈ ' + fmtMin(d.min) + (d.src === 'hilo' ? ' · según el hilo' : d.src === 'sede' ? ` · lo que duraron ${d.n} visitas a esta sede` : ` · lo que duran las visitas de este tipo (${d.n})`);
}
function cargaInfo(op, f) {
  const vis = rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op);
  let min = 0, sin = 0; vis.forEach(x => { const m = estimarMin(x); if (m) min += m; else sin++; });
  return { min, sin, n: vis.length };
}
function cargaMin(op, f) { return cargaInfo(op, f).min; }
function fmtMin(m) { const h = Math.floor(m / 60), mm = m % 60; return h ? h + ' h' + (mm ? ' ' + String(mm).padStart(2, '0') : '') : mm + ' min'; }
function cargaHtml(op, f) {
  const c = cargaInfo(op, f); if (!c.min) return c.sin ? `<span class="ch-h" title="El hilo no indica cuánto duran: solo cuenta la hora de inicio">${plural(c.sin, 'visita')} sin estimar</span>` : '';
  return `<span class="ch-h${c.min > JORNADA_MIN ? ' over' : ''}" title="Según el hilo de cada ticket o lo que han durado visitas parecidas${c.sin ? '. ' + plural(c.sin, 'visita') + ' sin estimar' : ''}">≈ ${fmtMin(c.min)}${c.sin ? ' + ' + c.sin + ' s/e' : ''} de ${JORNADA_MIN / 60} h</span>`;
}

// ===== Conflictos de planificación =====
function conflictos(f) {
  const out = [];
  TECNICOS.forEach(op => {
    const vis = sortByHora(rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op));
    if (!vis.length) return;
    const tot = vis.reduce((s, x) => s + (estimarMin(x) || 0), 0);
    if (tot > JORNADA_MIN) out.push({ op, tipo: 'sobrecarga', texto: `${fmtMin(tot)} estimadas (más de ${JORNADA_MIN / 60} h)`, keys: vis.map(tkey) });
    const con = vis.filter(x => x.desdeHora).map(x => { const a = horaMin(x.desdeHora), b = x.hastaHora ? horaMin(x.hastaHora) : a + (estimarMin(x) || 1); return { x, a, b }; });
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
  // 📍 si otro técnico ya tiene abierta una incidencia de esa sede
  const sedeLote = (r, op) => { const ms = mismaSede(r), ops = Object.keys(ms); return ops.length && op && !ops.includes(op) ? ` <span class="sede-aviso warn" title="${esc(ops.map(o => mismaSedeTexto(o, ms[o])).join('\n'))}">📍 ${esc(ops.join(', '))}</span>` : ''; };
  const ok = await confirmar(`<b>${esc(titulo || 'Planificar en ATGO')}</b><p>${plural(items.length, 'ticket')}:</p>
    <table class="md-tab">${items.slice(0, 25).map(it => { const r = ticketDe(it.key) || {}; return `<tr><td>Nº ${esc(r.num || it.key)}</td><td><span>${esc(r.operario || '')}${r.fVisita ? ' · ' + esc(r.fVisita) : ''}</span> → <b>${esc(it.codOpe || r.operario)}${it.fechaVisita ? ' · ' + esc(it.fechaVisita.split('-').reverse().join('/')) : ''}</b>${sedeLote(r, it.codOpe)}</td></tr>`; }).join('')}${items.length > 25 ? `<tr><td colspan="2">…y ${items.length - 25} más</td></tr>` : ''}</table>
    <p class="hint">Se guardan uno a uno, comprobando cada ficha campo a campo. Si alguno falla, los demás siguen.</p>`, 'Guardar ' + plural(items.length, 'cambio'));
  if (!ok) return;
  loteEnCurso = true;
  const enLote = items.length > 1;   // «Deshacer» solo tiene sentido para una asignación suelta
  let bien = 0; const mal = [], okKeys = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i], r = ticketDe(it.key) || {};
    toast(`Guardando ${i + 1}/${items.length} en ATGO…`);
    const res = await enviarEdicion('asignar', it.key, { ...(it.codOpe && it.codOpe !== cleanInitials(r.operario) ? { codOpe: it.codOpe } : {}), ...(it.fechaVisita ? { fechaVisita: it.fechaVisita } : {}), ...(enLote ? { sinDeshacer: true } : {}), resumen: `${r.operario || ''} → ${it.codOpe || r.operario}${it.fechaVisita ? ' · ' + it.fechaVisita.split('-').reverse().join('/') : ''}` });
    if (res && res.ok) { bien++; okKeys.push(it.key); } else mal.push((r.num || it.key) + ': ' + ((res && res.error) || 'sin respuesta'));
    // Sin pestaña de ATGO o con la sesión caducada no tiene sentido seguir: el resto ni se intenta
    if (res && res.sinAtgo && i < items.length - 1) { items.slice(i + 1).forEach(x => mal.push((((ticketDe(x.key) || {}).num) || x.key) + ': no se intentó (' + res.error + ')')); break; }
  }
  loteEnCurso = false;
  seleccion.clear();
  if (enLote) toast(`${bien}/${items.length} guardados en ATGO${mal.length ? ' · fallaron ' + mal.length : ''}`);
  if (mal.length) confirmar(`<b>No se guardaron ${mal.length}</b><ul>${mal.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`, 'Entendido');
  refreshVisible(); if (document.getElementById('viewSem').style.display !== 'none') renderSemana();
  return { bien, okKeys, mal };
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
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + (d.getDay() % 6 ? 0 : 7) + semOff * 7);   // sábado y domingo: la semana que viene
  return Array.from({ length: 5 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return x; });
}
let semDet = null;   // casilla con el detalle abierto: "OP|yyyy-mm-dd"
let semGrupos = { pool: true, sinF: true, venc: true };
function semPendGrupos() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const tec = rows.filter(r => esPresencial(r) && TECNICOS.includes(cleanInitials(r.operario)) && enZona(r) && enDsp(r.operario));
  return [
    { id: 'pool', titulo: 'Sin asignar', l: sinListas(true).mias.filter(r => !zonaSel || zonaPool(r) === zonaSel) },
    { id: 'venc', titulo: 'Vencidas', l: tec.filter(r => r.fVisita && parseEs(r.fVisita) < hoy) },
    { id: 'sinF', titulo: 'Sin fecha', l: tec.filter(r => !r.fVisita) }
  ];
}
function nivelCarga(m, n) { return !m ? (n ? 'l1' : 'l0') : m > JORNADA_MIN ? 'l3' : m > JORNADA_MIN * 0.75 ? 'l2' : 'l1'; }
function renderSemana() {
  const root = document.getElementById('viewSem');
  if (!rows.length && !poolRows.length) { root.innerHTML = `<div class="empty"><h2>Sin incidencias cargadas</h2><div>Abre ATGO (⚙ › General › Abrir ATGO) y deja su pestaña abierta: la semana se llena sola.</div></div>`; return; }
  if (!ZONAS_TEC.length) { root.innerHTML = `<div class="empty"><h2>El perfil ${esc(PERFIL)} no tiene técnicos</h2><div>Añádelos en ⚙ › Perfiles.</div></div>`; return; }
  const dias = diasSemana(), act = fase2Activa('*');
  const zonas = zonasVisibles();
  const grupos = semPendGrupos(), nPend = grupos.reduce((s, g) => s + g.l.length, 0), nVenc = grupos[1].l.length;
  const fmtD = d => DIAS[d.getDay()].slice(0, 3) + ' ' + d.getDate();
  const confDia = Object.fromEntries(dias.map(d => [isoHoy(d), conflictos(ddmmyyyy(d))]));
  root.innerHTML = `<div class="sem-top">
      <div class="daynav"><button class="iconbtn" onclick="semOff--;semDet=null;renderSemana()" aria-label="Semana anterior">◀</button>
        <span class="day">${esc(dias[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))} – ${esc(dias[4].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }))}</span>
        <button class="iconbtn" onclick="semOff++;semDet=null;renderSemana()" aria-label="Semana siguiente">▶</button>
        ${semOff ? '<button class="btn sm ghost" onclick="semOff=0;semDet=null;renderSemana()">Hoy</button>' : ''}</div>
      ${dspChipsHtml('semDet=null;renderSemana()')}<div id="semChips"></div>
      <div class="acts">${nVenc && act ? `<button class="btn sm" onclick="replanificarVencidas()" title="Técnico con menos carga de la zona y el próximo laborable">Replanificar ${nVenc} vencidas</button>` : ''}<button class="btn sm" onclick="abrirMapa(manDate)">Mapa</button></div>
    </div>
    ${act ? '' : '<div class="od-aviso">Para planificar desde aquí, activa «Planificar en ATGO» para todos los tickets en ⚙.</div>'}
    <div class="sem">
      <aside class="sem-pend">
        <div class="sp-head">Por planificar <b>${nPend}</b></div>
        ${grupos.map(g => g.l.length ? `<div class="sp-g">
          <button class="sp-gh" onclick="semGrupos['${g.id}']=!semGrupos['${g.id}'];renderSemana()"><span class="pl-chev"${semGrupos[g.id] ? '' : ' style="transform:rotate(-90deg)"'}>▾</span>${esc(g.titulo)} <i>${g.l.length}</i></button>
          ${semGrupos[g.id] ? g.l.map(r => `<div class="sp-it${seleccion.has(tkey(r)) ? ' sel' : ''}" draggable="true" data-drag="${esc(tkey(r))}" data-key="${esc(tkey(r))}" title="${esc([r.descSede, r.domicilio, motivoTexto(tkey(r))].filter(Boolean).join(' · '))}">
              <input type="checkbox" ${seleccion.has(tkey(r)) ? 'checked' : ''} onclick="event.stopPropagation();selToggle('${jsq(tkey(r))}',this.checked)" aria-label="Seleccionar">
              <b class="mono">${esc(String(r.num).slice(-5))}</b><span>${esc(r.descSede || r.domicilio || '—')}</span>
              <em>${esc(g.id === 'pool' ? zonaPool(r).split('/')[0] : r.operario)}</em></div>`).join('') : ''}
        </div>` : '').join('') || '<div class="dempty">Todo planificado.</div>'}
        ${seleccion.size ? `<div class="sp-lote"><b>${plural(seleccion.size, 'seleccionado')}</b>
          <div class="sp-lote-f"><select id="loteOp">${TECNICOS.filter(op => !zonaSel || zonaDe(op) === zonaSel).map(op => `<option${op === loteOp ? ' selected' : ''}>${op}</option>`).join('')}</select>
          <select id="loteDia">${dias.map(d => `<option value="${isoHoy(d)}"${isoHoy(d) === loteDia ? ' selected' : ''}>${fmtD(d)}</option>`).join('')}</select></div>
          <div class="acts"><button class="btn sm pri" onclick="loteOp=document.getElementById('loteOp').value;loteDia=document.getElementById('loteDia').value;asignarLote([...seleccion].map(k=>({key:k,codOpe:loteOp,fechaVisita:loteDia})),'Planificación en bloque')">Asignar</button>
          <button class="btn sm ghost" onclick="seleccion.clear();renderSemana()">Cancelar</button></div></div>` : `<div class="sp-hint">Arrastra a un técnico y día, o marca varios.</div>`}
      </aside>
      <div class="sem-main">
        <div class="sem-grid">
          <div class="sg-row sg-head"><div></div>${dias.map(d => { const fe = festivo(d); return `<div class="sg-dia${isoHoy(d) === isoHoy() ? ' hoy' : ''}${fe ? ' fest' : ''}" onclick="verDia('${isoHoy(d)}')" title="${esc(fe ? 'Festivo: ' + fe : 'Ver el día: técnicos, rutas, WhatsApp y correos')}">${esc(fmtD(d))}${fe ? ' · festivo' : ' ›'}</div>`; }).join('')}</div>
          ${zonas.map(z => `<div class="sg-zona">${esc(z.nombre)}</div>` + z.ops.map(op => `<div class="sg-row"><div class="sg-op">${esc(op)}</div>${dias.map(d => {
            const f = ddmmyyyy(d), n = rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op).length;
            const ci = cargaInfo(op, f), m = ci.min, conf = confDia[isoHoy(d)].filter(c => c.op === op), id = op + '|' + isoHoy(d);
            const durTx = m ? '≈ ' + fmtMin(m) + (ci.sin ? ' + ' + ci.sin + ' sin estimar' : '') : 'duración sin estimar';
            const fe = festivo(d, z.nombre);
            return `<div class="sg-cell ${nivelCarga(m, n)}${semDet === id ? ' on' : ''}${fe ? ' fest' : ''}" data-drop="${esc(id)}" onclick="semDet=semDet==='${jsq(id)}'?null:'${jsq(id)}';renderSemana()" title="${esc((fe ? 'Festivo: ' + fe + '\n' : '') + (n ? plural(n, 'visita') + ' · ' + durTx : 'Libre') + (conf.length ? '\n⚠ ' + conf.map(c => c.texto).join('\n⚠ ') : ''))}">
              ${n ? `<b>${n}</b>${m ? `<small>${esc(fmtMin(m))}${ci.sin ? '+' : ''}</small>` : ''}` : '<span class="lib">·</span>'}${conf.length ? '<i class="cf">⚠</i>' : ''}</div>`;
          }).join('')}</div>`).join('')).join('')}
        </div>
        <div class="sg-ley"><span><i class="l1"></i>holgado</span><span><i class="l2"></i>más del 75 % de la jornada</span><span><i class="l3"></i>más de ${JORNADA_MIN / 60} h</span><span><i class="cf">⚠</i> conflicto</span></div>
        ${semDet ? semDetalleHtml(semDet) : ''}
      </div>
    </div>`;
  document.getElementById('semChips').appendChild(zoneChips(() => { semDet = null; renderSemana(); }, Object.fromEntries(ZONAS_TEC.map(z => [z.nombre, rows.filter(r => zonaDe(r.operario) === z.nombre && esPresencial(r)).length || '0'])), ZONAS_TEC.filter(z => z.ops.some(op => enDsp(op)))));
}
// ===== Rellenar el día de un técnico =====
// Candidatas: sus incidencias sin fecha o vencidas y las sin asignar de su zona. Primero las de poblaciones a las
// que ya va ese día, después las que caducan antes y, al final, las más antiguas. Se marcan hasta llegar a 6 visitas.
const VISITAS_DIA = 6;
function candidatosDia(op, iso) {
  const f = ddmmyyyy(parseIso(iso)), zona = zonaDe(op), hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const yaVa = new Set(rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op).map(poblacionDe).filter(Boolean));
  const suyas = rows.filter(r => esPresencial(r) && cleanInitials(r.operario) === op && (!r.fVisita || parseEs(r.fVisita) < hoy))
    .map(r => ({ r, origen: r.fVisita ? 'vencida ' + r.fVisita.slice(0, 5) : 'sin fecha' }));
  const pool = poolRows.filter(r => !buzon[tkey(r)] && zonaPool(r) === zona).map(r => ({ r, origen: 'sin asignar' }));
  const cad = r => { const c = caducidad(r); return c ? c.ts : Infinity; }, reg = r => { const d = registro(r); return d ? d.getTime() : Infinity; };
  return [...suyas, ...pool].map(x => ({ ...x, junto: yaVa.has(poblacionDe(x.r)) }))
    .sort((a, b) => (b.junto - a.junto) || (cad(a.r) !== cad(b.r) ? (cad(a.r) < cad(b.r) ? -1 : 1) : reg(a.r) - reg(b.r) || 0));
}
function rellenarDia(op, iso) {
  const d = parseIso(iso), f = ddmmyyyy(d), ya = rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op).length;
  const l = candidatosDia(op, iso), hueco = Math.max(0, VISITAS_DIA - ya), fe = festivo(d, zonaDe(op));
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="md-box md-camb"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Rellenar el día · ${esc(op)}</div>
      <div class="dw-sub">${esc(diaLargo(d))} · ya tiene ${plural(ya, 'visita')}${fe ? ` · <b style="color:#d9614f">festivo: ${esc(fe)}</b>` : ''} · se proponen hasta ${VISITAS_DIA} en total</div></div>
      <button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div>
    ${l.length ? `<div class="rd-l">${l.map((x, i) => `<label class="rd-it"><input type="checkbox" data-k="${esc(tkey(x.r))}" ${i < hueco ? 'checked' : ''}>
        <span class="mono">${esc(String(x.r.num).slice(-5))}</span><span class="rd-s"><b>${esc(x.r.descSede || '—')}</b> · ${esc(x.r.poblacion || x.r.domicilio || '')}</span>
        <span class="rd-o${x.origen === 'sin asignar' ? ' sa' : ''}">${esc(x.origen)}</span>${x.junto ? '<span class="rd-j" title="Ese día ya va a esta población">misma población</span>' : ''}${cadBadge(x.r)}</label>`).join('')}</div>
      <div class="acts" style="justify-content:flex-end"><button class="btn" onclick="cerrarModal()">Cancelar</button><button class="btn pri" onclick="confirmarRelleno('${jsq(op)}','${iso}')">Planificar las marcadas</button></div>`
      : '<div class="dempty">No hay incidencias sin fecha, vencidas ni sin asignar de su zona.</div>'}
  </div>`;
  m.hidden = false;
}
async function confirmarRelleno(op, iso) {
  const keys = [...document.querySelectorAll('#modal .rd-it input:checked')].map(i => i.dataset.k);
  if (!keys.length) { toast('Marca al menos una'); return; }
  cerrarModal();
  const res = await asignarLote(keys.map(key => ({ key, codOpe: op, fechaVisita: iso })), `Planificar ${keys.length} para ${op} · ${iso.split('-').reverse().join('/')}`);
  if (res) { quitarDeSinAsignar(res.okKeys); renderSemana(); }
}
function verDia(iso) { manDate = parseIso(iso); manDate.setHours(12, 0, 0, 0); showTab("man"); }
function semDetalleHtml(id) {
  const [op, iso] = id.split('|'), d = parseIso(iso), f = ddmmyyyy(d);
  const vis = sortByHora(rows.filter(x => esPresencial(x) && x.fVisita === f && x.operario === op));
  const conf = conflictos(f).filter(c => c.op === op);
  return `<div class="sem-det" data-drop="${esc(id)}">
    <div class="sd-h"><b>${esc(op)}</b> · ${esc(diaLargo(d))} · ${vis.length ? plural(vis.length, 'visita') + (cargaMin(op, f) ? ' · ≈ ' + fmtMin(cargaMin(op, f)) : '') : 'libre'}
      ${fase2Activa('*') ? `<button class="btn sm" onclick="rellenarDia('${jsq(op)}','${iso}')" title="Propone incidencias sin fecha, vencidas o sin asignar de su zona para este día">Rellenar el día</button>` : ''}${vis.length ? `<button class="btn sm ghost" onclick="abrirRuta('${jsq(op)}','${f}')">Ruta</button>` : ''}<button class="iconbtn sm" onclick="semDet=null;renderSemana()" aria-label="Cerrar">✕</button></div>
    ${conf.map(c => `<div class="sd-conf">⚠ ${esc(c.texto)}</div>`).join('')}
    ${vis.length ? vis.map(r => { const e = estimarMin(r); return `<div class="sd-it" draggable="true" data-drag="${esc(tkey(r))}" data-key="${esc(tkey(r))}"><span class="h">${esc(r.desdeHora || '--:--')}</span><b class="mono">${esc(String(r.num).slice(-5))}</b><span>${esc(r.descSede || '')}</span><em title="${esc(duracionTexto(r))}">${e ? '≈ ' + esc(fmtMin(e)) + ' · ' : ''}${esc(r.tipo || '')}</em></div>`; }).join('') : '<div class="dempty">Sin visitas. Arrastra aquí un ticket para planificarlo.</div>'}
    ${vis.length ? '<div class="sp-hint">Arrastra una visita a otra casilla para moverla de técnico o de día.</div>' : ''}
  </div>`;
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
  asignarLote([{ key, codOpe: op, fechaVisita: f }], `Planificar Nº ${r.num}`).then(res => { if (res) quitarDeSinAsignar(res.okKeys); });
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
        const est = estimarMin(r), b = r.hastaHora ? horaMin(r.hastaHora) : est ? a + est : null;
        if (b == null) return `<span class="tl-b st-${x.st}${x.late ? ' late' : ''} sin-dur" data-key="${esc(tkey(r))}" style="left:${pos(a)}%" title="${esc(r.desdeHora + ' · Nº ' + r.num + ' · ' + (r.descSede || '') + ' · duración sin estimar · ' + (x.label || ST_LAB[x.st]))}"></span>`;
        const real = x.ts ? new Date(x.ts) : null, realM = real ? real.getHours() * 60 + real.getMinutes() : null;
        return `<span class="tl-b st-${x.st}${x.late ? ' late' : ''}" data-key="${esc(tkey(r))}" style="left:${pos(a)}%;width:${Math.max(1.5, pos(b) - pos(a))}%" title="${esc(r.desdeHora + ' · Nº ' + r.num + ' · ' + (r.descSede || '') + ' · ' + (x.label || ST_LAB[x.st]))}"></span>${realM != null ? `<i class="tl-real" style="left:${pos(realM)}%" title="Real: ${esc(hhmm(x.ts))}"></i>` : ''}`;
      }).join('')}
      ${byOp[op].filter(x => !x.r.desdeHora).length ? `<span class="tl-sh">+${byOp[op].filter(x => !x.r.desdeHora).length} sin hora</span>` : ''}
    </div></div>`).join('')}
  </div>`;
}

// ===== Secciones adicionales de Mi día =====
function seccionesExtra() {
  const fM = ddmmyyyy(nextWorkday()), cM = conflictos(fM);
  return `<section class="dsec" id="secConf">
      <div class="dsh"><h2>Conflictos</h2><small>${esc(diaLargo(nextWorkday()))} · ${cM.length}</small></div>
      ${cM.length ? `<ul class="tlist">${cM.map(c => `<li class="due" data-key="${esc(c.keys[0])}"><b class="mono">${esc(c.op)}</b><span class="tx">${esc(c.texto)}</span><span class="ex">${esc(c.tipo === 'solape' ? 'solape' : c.tipo === 'gls' ? 'GLS' : 'carga')}</span></li>`).join('')}</ul>` : '<div class="dempty">Sin solapes, sobrecargas ni choques con la recogida en GLS.</div>'}
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
  return cargarLibreria('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', () => window.L, 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
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
// Dirección completa; si Nominatim no la encuentra, la población (se marca como aproximada).
async function situar(r) {
  let ll = await geocodificar(direccionMaps(r));
  if (ll) return { ll, aprox: false };
  const pob = [r.poblacion, r.provincia].filter(Boolean).join(', ');
  if (pob) { ll = await geocodificar(pob); if (ll) return { ll, aprox: true }; }
  return null;
}
// Kilómetros y tiempo de coche entre las visitas (OSRM, servicio gratuito de OpenStreetMap)
const osrmCache = {};
async function distanciaRuta(lls) {
  const k = lls.map(p => p[1].toFixed(5) + ',' + p[0].toFixed(5)).join(';');
  if (k in osrmCache) return osrmCache[k];
  try {
    const r = await fetch('https://router.project-osrm.org/route/v1/driving/' + k + '?overview=false');
    const d = await r.json(), ro = d && d.routes && d.routes[0];
    osrmCache[k] = ro ? { km: Math.round(ro.distance / 1000), min: Math.round(ro.duration / 60) } : null;
  } catch (e) { return null; }
  return osrmCache[k];
}

// Vista general: una burbuja por técnico (visitas de ese día). Al pulsar un técnico se ven TODAS sus
// incidencias: las del día numeradas en orden de ruta y el resto con su fecha. Clic en el mapa: volver.
async function abrirMapa(fecha) {
  const f = ddmmyyyy(fecha || manDate), m = document.getElementById('modal');
  const delOp = op => rows.filter(x => x.operario === op);
  const diaDe = op => paradasRuta(op, f).filter(x => !x.gls);
  const ops = TECNICOS.filter(op => (!zonaSel || zonaDe(op) === zonaSel) && delOp(op).length);
  const color = op => COLORES_MAPA[ops.indexOf(op) % COLORES_MAPA.length];
  m.innerHTML = `<div class="md-box md-mapa"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Mapa · ${esc(diaLargo(parseEs(f)))}</div><div class="dw-sub" id="mapaEst">Cargando…</div></div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div><div id="mapa"></div><div class="mapa-leg" id="mapaLeg"></div><div class="mapa-nota" id="mapaNota"></div></div>`;
  m.hidden = false;
  const est = t => { const e = document.getElementById('mapaEst'); if (e) e.textContent = t; };
  const nota = h => { const e = document.getElementById('mapaNota'); if (e) e.innerHTML = h; };
  if (!ops.length) { est('Sin incidencias asignadas.'); return; }
  try { await cargarLeaflet(); } catch (e) { est('No se pudo cargar el mapa (sin conexión).'); return; }
  const datos = {}, noSit = {}, completo = {};
  const conDia = ops.filter(op => diaDe(op).length);
  const total = conDia.reduce((s, op) => s + diaDe(op).length, 0);
  let hechos = 0;
  for (const op of conDia) {
    datos[op] = []; noSit[op] = [];
    for (const [n, x] of diaDe(op).entries()) {
      const s = await situar(x.r);
      hechos++; est(`Situando direcciones ${hechos}/${total}…`);
      if (!document.getElementById('mapa')) return;
      if (s) datos[op].push({ ...s, r: x.r, n: n + 1, dia: true }); else noSit[op].push(x.r);
    }
  }
  const mapa = L.map('mapa', { zoomControl: true }).setView([37.4, -4.5], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(mapa);
  setTimeout(() => mapa.invalidateSize(), 150);
  const capa = L.layerGroup().addTo(mapa);
  let modo = 'todos';
  const centro = l => [l.reduce((s, p) => s + p.ll[0], 0) / l.length, l.reduce((s, p) => s + p.ll[1], 0) / l.length];
  function leyenda(sel) {
    document.getElementById('mapaLeg').innerHTML = ops.map(op => { const nd = diaDe(op).length; return `<button class="mapa-tec${sel === op ? ' on' : ''}" onclick="window.__mapaVer('${jsq(op)}')" title="${esc(plural(nd, 'visita') + ' este día · ' + plural(delOp(op).length, 'incidencia') + ' asignadas')}"><i style="background:${color(op)}"></i>${esc(op)} <small>${nd}/${delOp(op).length}</small></button>`; }).join('') + (sel ? '<button class="mapa-tec" onclick="window.__mapaVer(null)">Ver todos</button>' : '');
  }
  function verTodos() {
    modo = 'todos'; capa.clearLayers(); nota(''); const pts = [];
    conDia.filter(op => datos[op].some(p => p.dia)).forEach(op => {
      const dia = datos[op].filter(p => p.dia), c = centro(dia); pts.push(c);
      L.marker(c, { icon: L.divIcon({ className: 'mapa-burbuja', html: `<div style="background:${color(op)}"><b>${esc(op)}</b><span>${dia.length}</span></div>`, iconSize: [58, 38], iconAnchor: [29, 19] }), bubblingMouseEvents: false })
        .on('click', ev => { L.DomEvent.stopPropagation(ev); verTecnico(op); }).addTo(capa);
    });
    if (pts.length) mapa.fitBounds(pts, { padding: [60, 60], maxZoom: 11 });
    est(`${plural(conDia.length, 'técnico')} con visitas este día · pulsa una burbuja o un técnico para ver todas sus incidencias`); leyenda(null);
  }
  async function verTecnico(op) {
    modo = op; capa.clearLayers(); leyenda(op);
    datos[op] = datos[op] || []; noSit[op] = noSit[op] || [];
    if (!completo[op]) {
      const resto = delOp(op).filter(r => !diaDe(op).some(x => tkey(x.r) === tkey(r)));
      for (const [i, r] of resto.entries()) {
        est(`${op}: situando sus incidencias ${i + 1}/${resto.length}…`);
        const s = await situar(r);
        if (!document.getElementById('mapa')) return;
        if (s) datos[op].push({ ...s, r, dia: false }); else noSit[op].push(r);
      }
      completo[op] = true;
      if (modo !== op) return;
    }
    const c = color(op), lista = datos[op];
    if (!lista.length) { est(op + ': no se encontraron sus direcciones'); nota(noSitHtml(noSit[op])); return; }
    // Incidencias en el mismo sitio (misma dirección o misma población si es aproximada): un solo marcador con todas
    const grupos = new Map();
    lista.forEach(p => { const k = p.ll[0].toFixed(3) + ',' + p.ll[1].toFixed(3); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(p); });
    const lin = p => `<b>${p.dia ? p.n + '. ' + esc(p.r.desdeHora || 'Sin hora') : esc(p.r.fVisita ? p.r.fVisita + (p.r.desdeHora ? ' ' + p.r.desdeHora : '') : 'Sin fecha')} · Nº ${esc(p.r.num)}</b> · ${esc(p.r.estado || '')}<br>${esc(p.r.descSede || '')} · ${esc(p.r.domicilio || '')}<br><a href="#" onclick="cerrarModal();openTicket('${jsq(tkey(p.r))}');return false">Abrir ficha</a>`;
    grupos.forEach(g => {
      g.sort((a, b) => (b.dia - a.dia) || ((a.n || 0) - (b.n || 0)));
      const p = g[0], pres = g.some(x => esPresencial(x.r)), dia = g.filter(x => x.dia);
      const cls = 'mapa-punto' + (dia.length ? '' : pres ? ' otra' : ' gris') + (g.every(x => x.aprox) ? ' aprox' : '') + (g.length > 1 ? ' multi' : '');
      const txt = dia.length ? dia.map(x => x.n).join('·') + (g.length > dia.length ? '+' + (g.length - dia.length) : '') : g.length > 1 ? g.length + ' inc.' : pres ? (p.r.fVisita ? p.r.fVisita.slice(0, 5) : '·') : '';
      const w = dia.length ? Math.max(24, 10 + String(txt).length * 7) : pres || g.length > 1 ? 38 : 14, hgt = dia.length ? 24 : pres || g.length > 1 ? 20 : 14;
      L.marker(p.ll, { icon: L.divIcon({ className: cls, html: `<div style="--c:${c};width:${w}px">${esc(String(txt))}</div>`, iconSize: [w, hgt], iconAnchor: [w / 2, hgt / 2] }), bubblingMouseEvents: false, zIndexOffset: dia.length ? 1000 : pres ? 500 : 0 })
        .bindPopup(g.map(lin).join('<hr>') + (g.every(x => x.aprox) ? '<br><i>Ubicación aproximada (población)</i>' : ''), { maxHeight: 260 }).addTo(capa);
    });
    const ruta = lista.filter(p => p.dia).sort((a, b) => a.n - b.n).map(p => p.ll);
    if (ruta.length > 1) L.polyline(ruta, { color: c, weight: 3, opacity: .75 }).addTo(capa);
    // Encuadre: la ruta del día si la hay (el resto queda alrededor); si no, todas
    mapa.fitBounds(ruta.length ? ruta : lista.map(p => p.ll), { padding: [50, 50], maxZoom: 13 });
    const nd = lista.filter(p => p.dia).length, otras = lista.length - nd;
    const txt = `${op} · ${plural(nd, 'visita')} este día (numeradas en orden de ruta)${otras ? ' · ' + plural(otras, 'incidencia') + ' más con su fecha' : ''}`;
    est(txt + ' · pulsa en el mapa para volver');
    const llRuta = lista.filter(p => p.dia).sort((a, b) => a.n - b.n).map(p => p.ll);
    if (llRuta.length > 1) distanciaRuta(llRuta).then(d => { if (d && modo === op) est(`${txt} · ≈ ${d.km} km y ${fmtMin(d.min)} de coche entre visitas · pulsa en el mapa para volver`); });
    nota(`<span><i class="lg dia" style="background:${c}"></i>Visita del día</span><span><i class="lg otra" style="border-color:${c}"></i>Otra visita (fecha)</span><span><i class="lg gris"></i>Otro estado</span><span><i class="lg aprox"></i>Aproximada</span>${noSitHtml(noSit[op])}`);
  }
  function noSitHtml(l) { return l && l.length ? `<span class="mapa-nosit">Sin situar (${l.length}): ${l.map(r => `<a href="#" onclick="cerrarModal();openTicket('${jsq(tkey(r))}');return false">${esc(String(r.num).slice(-5))}</a>`).join(', ')}</span>` : ''; }
  window.__mapaVer = op => op ? verTecnico(op) : verTodos();
  mapa.on('click', () => { if (modo !== 'todos') verTodos(); });
  mapa.invalidateSize();
  verTodos();
}
