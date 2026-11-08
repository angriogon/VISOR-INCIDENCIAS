// ===== Modo COORD: panel de CONTROL =====
// El coordinador controla, no gestiona: qué hay sin asignar, qué ha caducado, qué caduca hoy y qué va en ruta hoy,
// de todos los DSP, con filtros por DSP y cliente y un Excel de cada lista (o de todo).
// Solo se ve con el perfil COORD (pestaña CONTROL). Se puede reasignar desde la ficha, Incidencias o Planificación.
// Usa utilidades de los demás archivos solo en tiempo de llamada.

const CTL_VISTAS = [['pres', 'Presencial'], ['cad', 'Caducadas'], ['hoy', 'Caducan hoy'], ['pron', 'Caducarán'], ['esta', 'Estancadas'], ['ruta', 'En ruta hoy'], ['todas', 'Todas']];
const CAD_PROXIMAS_H = 72, ESTANCADA_DIAS = 7;
const CTL_EDADES = [[0, 7, '0–7 días'], [8, 15, '8–15 días'], [16, 30, '16–30 días'], [31, Infinity, 'Más de 30']];
let ctl = { vista: 'cad', dsp: '', cli: '', proy: '', q: '', edad: '', ord: { main: null, ruta: null, pend: null, inc: null } };
function esCoord() { return PERFIL === 'COORD'; }
// Proyecto de cada incidencia: el que manda ATGO y, si no viene, el último conocido (se guarda en el equipo)
const PROY_KEY = 'dispatcher_proyectos_v1';
let proyGuardados = null;
function proyDe(r) {
  if (!proyGuardados) proyGuardados = lsGet(PROY_KEY, {}) || {};
  const k = tkey(r);
  if (r.proyecto) { const g = proyGuardados[k]; if (!g || g[0] !== r.proyecto || (r.desProyecto && g[1] !== r.desProyecto)) { proyGuardados[k] = [r.proyecto, r.desProyecto || (g && g[1]) || '']; proyCambiado = true; } return proyGuardados[k]; }
  return proyGuardados[k] || null;
}
let proyCambiado = false;
// Tras cada carga completa de ATGO, en cualquier perfil: se recuerda el proyecto de las abiertas y se olvida el de las demás
function recordarProyectos() {
  const abiertas = todasAbiertas(); abiertas.forEach(proyDe);
  if (!proyCambiado || !proyGuardados) return; proyCambiado = false;
  const vivas = new Set(abiertas.map(tkey)); Object.keys(proyGuardados).forEach(k => { if (!vivas.has(k)) delete proyGuardados[k]; });
  lsSet(PROY_KEY, proyGuardados);
}
function proyTexto(p) { return p ? (p[1] ? p[1] + ' (' + p[0] + ')' : 'Proyecto ' + p[0]) : 'Sin proyecto'; }

// DSP de un ticket: el de su técnico o, si está sin asignar, el de la zona de su comodín/provincia
function dspTicket(r) {
  if (/^XXX/i.test(r.operario || '')) { const z = ZONAS_BASE.find(x => x.nombre === zonaPool(r)); return z ? dspZona(z) : '—'; }
  const p = perfilDeOp(cleanInitials(r.operario)); return p === 'OTROS' ? '—' : p;
}
function todasAbiertas() {
  const m = new Map(); [...rows, ...poolRows].forEach(r => { if (!esCierre(r.estado)) m.set(tkey(r), r); });
  return [...m.values()];
}
// Estados sin SLA: FUERA DE MANTENIMIENTO son peticiones de clientes; su caducidad no cuenta (ni caducadas ni caducan hoy)
const ESTADOS_SIN_SLA = ['FUERA DE MANTENIMIENTO'];
function sinSla(r) { return ESTADOS_SIN_SLA.some(e => norm(e) === norm(r.estado)); }
// Las cuatro listas, sin filtros
function ctlListas() {
  const ahora = Date.now(), hoy = isoHoy(), todas = todasAbiertas(), cad = [], hoyL = [], pron = [], lim = ahora + CAD_PROXIMAS_H * 3600000;
  todas.forEach(r => { if (sinSla(r)) return; const c = caducidad(r); if (!c) return; if (c.ts < ahora) cad.push(r); else if (isoHoy(new Date(c.ts)) === hoy) hoyL.push(r); else if (c.ts < lim) pron.push(r); });
  const porCad = (a, b) => (caducidad(a) || { ts: 0 }).ts - (caducidad(b) || { ts: 0 }).ts;
  const porCadF = (a, b) => ((caducidad(a) || { ts: 9e15 }).ts - (caducidad(b) || { ts: 9e15 }).ts);
  return { todas: todas.slice().sort(porCadF), pres: todas.filter(esPresencial).sort(porCadF), pend: sinListas().pend, cad: cad.sort(porCad), hoy: hoyL.sort(porCad), pron: pron.sort(porCad), esta: todas.filter(estancada).sort((a, b) => ultimoMovimiento(a) - ultimoMovimiento(b)), ruta: rutaHoy().sort((a, b) => horaMin(a.r.desdeHora) - horaMin(b.r.desdeHora)) };
}
// Último movimiento según el hilo; 0 si aún no se ha leído (entonces no cuenta como estancada)
function ultimoMovimiento(r) { const h = hilos[tkey(r)]; return h && h.items.length ? Math.max(...h.items.map(i => i.ts || 0)) : 0; }
function estancada(r) { const u = ultimoMovimiento(r); return !sinSla(r) && !!u && Date.now() - u >= ESTANCADA_DIAS * 86400000; }
function ctlEdad(r) { const d = registro(r); if (!d) return -1; const n = Math.floor((Date.now() - d.getTime()) / 86400000); return CTL_EDADES.findIndex(e => n >= e[0] && n <= e[1]); }
function ctlPasa(r, sin) {
  if (ctl.dsp && !(sin && sin.dsp) && dspTicket(r) !== ctl.dsp) return false;
  if (ctl.edad !== '' && !(sin && sin.edad) && ctlEdad(r) !== Number(ctl.edad)) return false;
  if (ctl.cli && (r.descCliente || '') !== ctl.cli) return false;
  if (ctl.proy) { const p = proyDe(r); if (ctl.proy === '-' ? !!p : !p || p[0] !== ctl.proy) return false; }
  if (ctl.q) { const pq = proyDe(r); const t = norm([r.num, r.descSede, r.descCliente, r.operario, r.poblacion, r.provincia, r.referencia, pq && pq[0], pq && pq[1]].join(' ')); if (!norm(ctl.q).split(/\s+/).every(w => t.includes(w))) return false; }
  return true;
}
const ctlCadTs = r => (caducidad(r) || { ts: 9e15 }).ts;
const ctlCliSede = r => norm((r.descCliente || '') + ' ' + (r.descSede || ''));
const CTL_COLS = {
  main: [r => Number(r.num) || 0, ctlCadTs, ctlCliSede, r => /^XXX/i.test(r.operario || '') ? '~' : r.operario, r => dspTicket(r), r => norm(r.estado)],
  ruta: [x => horaMin(x.r.desdeHora), x => ['c', 'p', 't', 'd'].indexOf(x.st), x => Number(x.r.num) || 0, x => ctlCliSede(x.r), x => x.r.operario, x => dspTicket(x.r)],
  pend: [r => Number(r.num) || 0, ctlCadTs, ctlCliSede, r => norm(zonaPool(r) || '~'), r => { const d = registro(r); return d ? d.getTime() : 9e15; }],
  inc: [r => Number(r.num) || 0, r => { const d = parseEs(r.fVisita); return d ? d.getTime() : 9e15; }, ctlCadTs, ctlCliSede, r => r.operario, r => norm(r.estado)]
};
function ctlOrdenar(lista, t) {
  const o = ctl.ord[t]; if (!o) return lista;
  const f = CTL_COLS[t][o.i];
  return lista.map((x, i) => [f(x), i, x]).sort((a, b) => (typeof a[0] === 'number' && typeof b[0] === 'number' ? a[0] - b[0] : String(a[0]).localeCompare(String(b[0]), 'es')) * o.dir || a[1] - b[1]).map(x => x[2]);
}
function ctlOrden(t, i) { const o = ctl.ord[t]; ctl.ord[t] = o && o.i === i ? (o.dir === 1 ? { i, dir: -1 } : null) : { i, dir: 1 }; if (t === 'inc') render(); else renderControl(); }
function ctlFiltradas() {
  const L = ctlListas();
  const m = l => ctlOrdenar(l.filter(ctlPasa), 'main');
  return { todas: m(L.todas), pres: m(L.pres), pend: ctlOrdenar(L.pend.filter(ctlPasa), 'pend'), cad: m(L.cad), hoy: m(L.hoy), pron: m(L.pron), esta: m(L.esta), ruta: ctlOrdenar(L.ruta.filter(x => ctlPasa(x.r)), 'ruta'), clientes: L.todas };
}
function ctlSet(k, v) { ctl[k] = v; if (k === 'cli') ctl.proy = ''; if ((k === 'cli' || k === 'proy' || k === 'edad') && v !== '') ctl.vista = 'todas'; renderControl(); }

// Semáforo y equilibrio de carga por DSP: lo asignado en PRESENCIAL entre los técnicos disponibles
function ctlPorDsp(L) {
  const cuenta = (l, p) => l.filter(x => { const r = x.r || x; return dspTicket(r) === p && ctlPasa(r, { dsp: true }); }).length;
  const l = PERFILES.filter(p => p !== 'COORD').map(p => {
    const tec = perfilCfg.tecs[p].filter(op => !noDisponible(op) && !dispatcherOps().includes(op)).length;
    const pres = cuenta(L.pres.filter(r => !/^XXX/i.test(r.operario || '')), p), cad = cuenta(L.cad, p), hoy = cuenta(L.hoy, p), pend = cuenta(L.pend, p);
    return { p, tec, pres, cad, hoy, pend, carga: tec ? pres / tec : 0, nivel: cad ? 'mal' : hoy || pend ? 'warn' : 'bien' };
  });
  const tecs = l.reduce((s, x) => s + x.tec, 0), media = tecs ? l.reduce((s, x) => s + x.pres, 0) / tecs : 0;
  l.forEach(x => { x.alta = media > 0 && x.carga > media * 1.3; });
  return { l, media };
}
function ctlResumenHtml(L) {
  const { l, media } = ctlPorDsp(L), nomb = { mal: 'Con caducadas', warn: 'Con avisos', bien: 'Al día' };
  const base = L.todas.filter(r => ctlPasa(r, { edad: true })), edades = CTL_EDADES.map((e, i) => base.filter(r => ctlEdad(r) === i).length), max = Math.max(1, ...edades);
  return `<div class="ctl-res">
    <section class="ctl-card"><div class="ctl-card-h"><h3>Por DSP <small>carga media ${media.toFixed(1).replace('.', ',')} por técnico</small></h3></div>
      <div class="ctl-tabla ctl-sem"><table><thead><tr><th scope="col">DSP</th><th scope="col">Caducadas</th><th scope="col">Caducan hoy</th><th scope="col">Sin asignar</th><th scope="col">Técnicos</th><th scope="col">Carga / técnico</th></tr></thead><tbody>${l.map(x => `<tr class="${ctl.dsp === x.p ? 'on' : ''}"><td><button class="ctl-ord" onclick="ctlSet('dsp','${ctl.dsp === x.p ? '' : x.p}')" title="${nomb[x.nivel]} · pulsa para filtrar"><span class="sem-dot ${x.nivel}"></span><span class="sr">${nomb[x.nivel]}: </span>${x.p}</button></td><td>${x.cad}</td><td>${x.hoy}</td><td>${x.pend}</td><td>${x.tec}</td><td class="${x.alta ? 'ctl-alta' : ''}" title="${x.alta ? 'Más de un 30 % por encima de la media' : ''}">${x.tec ? x.carga.toFixed(1).replace('.', ',') : '—'}</td></tr>`).join('')}</tbody></table></div></section>
    <section class="ctl-card"><div class="ctl-card-h"><h3>Antigüedad <small>desde el registro</small></h3></div>
      <div class="ctl-edad">${CTL_EDADES.map((e, i) => `<button class="${ctl.edad === String(i) ? 'on' : ''}" aria-pressed="${ctl.edad === String(i)}" onclick="ctlSet('edad','${ctl.edad === String(i) ? '' : i}')"><span>${e[2]}</span><i style="width:${Math.round(edades[i] / max * 100)}%"></i><b>${edades[i]}</b></button>`).join('')}</div></section>
  </div>`;
}

// ---- Filas ----
function fechaHoraCorta(ts) { return new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ' + hhmm(ts); }
function ctlCadHtml(r) {
  const c = caducidad(r); if (!c) return '<span class="fch">—</span>';
  const nv = cadNivel(c);
  return `<span class="fch cad-${nv}" title="${esc(cadTexto(c))}"><i>${nv === 'venc' ? 'Caducó' : 'Caduca'}</i>${esc(fechaHoraCorta(c.ts))}</span>`;
}
function ctlTecHtml(r) { return /^XXX/i.test(r.operario || '') ? '<span class="ctl-sin">Sin asignar</span>' : `<b>${esc(r.operario)}</b>`; }
function ctlFila(r) {
  const pr = proyDe(r);
  return `<tr data-key="${esc(tkey(r))}" style="--c:${estadoColor(r.estado)}">
    <td class="mono ctl-n">${esc(r.num || '—')}</td><td>${ctlCadHtml(r)}</td>
    <td class="ctl-sede"><b>${esc(r.descCliente || '—')}</b><small>${esc(r.descSede || '')}${r.poblacion ? ' · ' + esc(r.poblacion) : ''}${pr ? ' · ' + esc(proyTexto(pr)) : ''}</small></td>
    <td>${ctlTecHtml(r)}</td><td class="ctl-dsp">${esc(dspTicket(r))}</td><td>${estadoPill(r.estado)}</td></tr>`;
}
function ctlFilaRuta(x) {
  const r = x.r, hora = (r.desdeHora || '--:--') + (r.hastaHora ? '–' + r.hastaHora : '');
  return `<tr data-key="${esc(tkey(r))}"><td class="mono">${esc(hora)}</td><td><span class="vh-st st-${x.st}">${esc(x.label || ST_LAB[x.st])}${x.late ? ' · retraso' : ''}</span></td>
    <td class="mono ctl-n">${esc(r.num || '—')}</td><td class="ctl-sede"><b>${esc(r.descCliente || '—')}</b><small>${esc(r.descSede || '')}${r.poblacion ? ' · ' + esc(r.poblacion) : ''}</small></td>
    <td><b>${esc(r.operario)}</b></td><td class="ctl-dsp">${esc(dspTicket(r))}</td></tr>`;
}
function ctlFilaPend(r) {
  const d = registro(r), h = d ? Math.round((Date.now() - d.getTime()) / 3600000) : null;
  return `<tr data-key="${esc(tkey(r))}"><td class="mono ctl-n">${esc(r.num || '—')}</td><td>${ctlCadHtml(r)}</td>
    <td class="ctl-sede"><b>${esc(r.descCliente || '—')}</b><small>${esc(r.descSede || '')}${r.poblacion ? ' · ' + esc(r.poblacion) : ''}</small></td>
    <td class="ctl-zona">${esc(zonaPool(r) || '—')}<small>${esc(dspTicket(r))}</small></td><td class="ctl-esp${h != null && h >= (typeof horasOlvido === 'function' ? horasOlvido() : 4) ? ' late' : ''}">${h == null ? '—' : h < 48 ? h + ' h' : Math.round(h / 24) + ' d'}</td></tr>`;
}
function ctlTabla(cab, filas, vacio, t) {
  const o = t && ctl.ord[t];
  const th = (c, i) => !t ? `<th scope="col">${c}</th>` : `<th scope="col" aria-sort="${o && o.i === i ? (o.dir === 1 ? 'ascending' : 'descending') : 'none'}"><button class="ctl-ord${o && o.i === i ? ' on' : ''}" onclick="ctlOrden('${t}',${i})" title="Ordenar por ${esc(c)}${o && o.i === i ? (o.dir === 1 ? ' (otra vez: al revés)' : ' (otra vez: orden normal)') : ''}">${c}<i>${o && o.i === i ? (o.dir === 1 ? '▲' : '▼') : '↕'}</i></button></th>`;
  return filas.length ? `<div class="ctl-tabla"><table><thead><tr>${cab.map(th).join('')}</tr></thead><tbody>${filas.join('')}</tbody></table></div>` : `<div class="dempty">${vacio}</div>`;
}

// ---- Vista ----
function renderControl() {
  const root = document.getElementById('viewCtl'); if (!root) return;
  if (!rows.length && !poolRows.length) { root.innerHTML = `<div class="empty"><h2>Esperando los datos de ATGO</h2><div>Abre ATGO (Ajustes › General) para cargar las incidencias de todos los DSP.</div></div>`; return; }
  const F = ctlFiltradas(), L = ctlListas();
  const hechas = F.ruta.filter(x => x.st === 'd').length;
  const baseProy = L.todas.filter(r => (!ctl.cli || (r.descCliente || '') === ctl.cli) && (!ctl.dsp || dspTicket(r) === ctl.dsp));
  const proyectos = {}; let sinProy = 0; baseProy.forEach(r => { const p = proyDe(r); if (!p) { sinProy++; return; } (proyectos[p[0]] = proyectos[p[0]] || { p, n: 0 }).n++; });
  const listaProy = Object.values(proyectos).sort((a, b) => b.n - a.n);
  const clientes = Object.entries(L.todas.reduce((m, r) => { const c = r.descCliente || ''; if (c) m[c] = (m[c] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const kpi = (id, n, t, sub, cls) => `<button class="ctl-kpi ${cls || ''}${ctl.vista === id ? ' on' : ''}" onclick="${id === 'pend' ? "document.getElementById('ctlPend').scrollIntoView({behavior:'smooth',block:'start'})" : `ctlSet('vista','${id}')`}"><b>${n}</b><span>${t}</span>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const vista = ctl.vista;
  const lista = vista === 'ruta' ? ctlTabla(['Hora', 'Situación', 'Nº', 'Cliente · sede', 'Técnico', 'DSP'], F.ruta.map(ctlFilaRuta), 'Nadie en ruta hoy con estos filtros.', 'ruta')
    : ctlTabla(['Nº', 'Caducidad', 'Cliente · sede', 'Técnico', 'DSP', 'Estado'], (F[vista] || F.cad).map(ctlFila), { cad: 'Ninguna caducada con estos filtros.', hoy: 'Ninguna caduca hoy con estos filtros.', pron: 'Ninguna caduca en los próximos tres días.', esta: `Ninguna lleva más de ${ESTANCADA_DIAS} días sin movimiento.`, pres: 'Ninguna en PRESENCIAL con estos filtros.', todas: 'Ninguna incidencia abierta con estos filtros.' }[vista] || 'Nada con estos filtros.', 'main');
  root.innerHTML = `
    <div class="ctl-cab"><div><h2>Control</h2><span>${esc(diaLargo(new Date()))} · todos los DSP${syncUltima ? ' · ATGO ' + esc(hhmm(syncUltima)) : ''}</span></div>
      <span class="acts">${typeof revisionBotonHtml === 'function' ? revisionBotonHtml() : ''}<button class="btn pri" onclick="ctlInforme()" title="Un Excel con el resumen por DSP y una hoja por lista (con los filtros puestos)">↓ Informe completo (Excel)</button></span></div>
    <div class="ctl-kpis">
      ${kpi('pres', F.pres.length, 'Presencial', `de ${F.todas.length} abiertas en total`)}
      ${kpi('pend', F.pend.length, 'Sin asignar', '', F.pend.length ? 'warn' : '')}
      ${kpi('cad', F.cad.length, 'Caducadas', 'sin fuera de mantenimiento', F.cad.length ? 'mal' : 'bien')}
      ${kpi('hoy', F.hoy.length, 'Caducan hoy', 'sin fuera de mantenimiento', F.hoy.length ? 'warn' : '')}
      ${kpi('ruta', `${hechas}/${F.ruta.length}`, 'En ruta hoy', F.ruta.filter(x => x.late).length ? F.ruta.filter(x => x.late).length + ' con retraso' : 'hechas / total')}
    </div>
    ${ctlResumenHtml(L)}
    <div class="ctl-filtros">
      <span class="seg mini" role="group" aria-label="DSP">${[['', 'Todos'], ...PERFILES.filter(p => p !== 'COORD').map(p => [p, p])].map(([v, t]) => `<button class="segb${ctl.dsp === v ? ' on' : ''}" aria-pressed="${ctl.dsp === v}" onclick="ctlSet('dsp','${v}')">${t}</button>`).join('')}</span>
      <select class="ctl-cli" aria-label="Cliente" onchange="ctlSet('cli',this.value)"><option value="">Todos los clientes</option>${clientes.map(([c, n]) => `<option value="${esc(c)}"${ctl.cli === c ? ' selected' : ''}>${esc(c)} (${n})</option>`).join('')}</select>
      <select class="ctl-proy" aria-label="Proyecto" onchange="ctlSet('proy',this.value)"${listaProy.length || sinProy ? '' : ' disabled'} title="${listaProy.length ? 'Proyectos de las incidencias' + (ctl.cli ? ' de ' + esc(ctl.cli) : '') : 'Aún no se conoce el proyecto de estas incidencias: llega con las próximas cargas de ATGO'}"><option value="">${listaProy.length ? 'Todos los proyectos (' + listaProy.length + ')' : 'Proyecto: sin datos aún'}</option>${listaProy.map(x => `<option value="${esc(x.p[0])}"${ctl.proy === x.p[0] ? ' selected' : ''}>${esc(proyTexto(x.p))} · ${x.n}</option>`).join('')}${listaProy.length && sinProy ? `<option value="-"${ctl.proy === '-' ? ' selected' : ''}>Sin proyecto conocido · ${sinProy}</option>` : ''}</select>
      <input type="search" placeholder="Buscar Nº, sede, técnico…" aria-label="Buscar" value="${esc(ctl.q)}" oninput="ctl.q=this.value;clearTimeout(window.ctlT);window.ctlT=setTimeout(()=>{renderControl();const i=document.querySelector('.ctl-filtros input');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250)">
      ${ctl.dsp || ctl.cli || ctl.proy || ctl.q || ctl.edad !== '' ? `<button class="btn sm ghost" onclick="ctl.dsp='';ctl.cli='';ctl.proy='';ctl.q='';ctl.edad='';renderControl()">Quitar filtros</button>` : ''}
    </div>
    <div class="ctl-cols">
      <section class="ctl-card" id="ctlPend">
        <div class="ctl-card-h"><h3>Pendientes de asignar <small>${F.pend.length}</small></h3><button class="btn sm" onclick="ctlExcel('pend')">↓ Excel</button></div>
        ${ctlTabla(['Nº', 'Caducidad', 'Cliente · sede', 'Zona · DSP', 'Esperando'], F.pend.map(ctlFilaPend), 'Nada pendiente de asignar con estos filtros.', 'pend')}
      </section>
      <section class="ctl-card">
        <div class="ctl-card-h"><span class="seg" role="tablist">${CTL_VISTAS.map(([v, t]) => `<button class="segb${vista === v ? ' on' : ''}" role="tab" aria-selected="${vista === v}" onclick="ctlSet('vista','${v}')">${t} <small>${F[v].length}</small></button>`).join('')}</span>
          <button class="btn sm" onclick="ctlExcel('${vista}')">↓ Excel</button></div>
        ${lista}
      </section>
    </div>
    <div class="ctl-pie">Pulsa una incidencia para ver su ficha (desde ahí se puede reasignar). Para mover varias, usa Planificación.</div>`;
}

// ---- Excel ----
function ctlFilaExcel(r) {
  const c = caducidad(r), d = registro(r);
  return { 'Nº': r.num, Cliente: r.descCliente, Sede: r.descSede, Población: r.poblacion, Provincia: r.provincia, Técnico: /^XXX/i.test(r.operario || '') ? 'Sin asignar' : r.operario,
    DSP: dspTicket(r), Zona: /^XXX/i.test(r.operario || '') ? zonaPool(r) : zonaDe(r.operario), Estado: r.estado, Proyecto: (p => p ? p[0] : '')(proyDe(r)), 'Nombre del proyecto': (p => p ? p[1] : '')(proyDe(r)), Caducidad: c ? new Date(c.ts).toLocaleString('es-ES') : '', 'Caduca': c ? cadTexto(c) : '',
    Visita: r.fVisita, Desde: r.desdeHora, Hasta: r.hastaHora, Registro: d ? d.toLocaleString('es-ES') : '', Tipo: r.tipo, Referencia: r.referencia,
    Motivo: (typeof motivoTexto === 'function' ? motivoTexto(tkey(r)) : '').slice(0, 300), Enlace: r.url || ATGO_URL + tkey(r) };
}
function ctlHoja(que, F) {
  if (que === 'ruta') return F.ruta.map(x => ({ Hora: x.r.desdeHora, Hasta: x.r.hastaHora, Situación: x.label || ST_LAB[x.st], Retraso: x.late ? 'Sí' : '', ...ctlFilaExcel(x.r) }));
  return (F[que] || []).map(ctlFilaExcel);
}
const CTL_NOMBRES = { pres: 'Presencial', pend: 'Pendientes de asignar', cad: 'Caducadas', hoy: 'Caducan hoy', pron: 'Caducarán', esta: 'Estancadas', ruta: 'En ruta hoy', todas: 'Todas abiertas' };
function ctlArchivo(nombre) { const d = new Date(); return `despacho-COORD-${nombre}-${isoHoy()}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${ctl.dsp ? '-' + ctl.dsp : ''}.xlsx`; }
function ctlAnchos(ws, datos) { if (datos.length) ws['!cols'] = Object.keys(datos[0]).map(k => ({ wch: Math.min(50, Math.max(k.length, ...datos.slice(0, 200).map(x => String(x[k] == null ? '' : x[k]).length)) + 2) })); }
async function ctlExcel(que) {
  try { await cargarXLSX(); } catch (e) { toast('No se pudo cargar el módulo de Excel (sin conexión)'); return; }
  const datos = ctlHoja(que, ctlFiltradas());
  if (!datos.length) { toast('No hay datos que exportar'); return; }
  const ws = XLSX.utils.json_to_sheet(datos), wb = XLSX.utils.book_new(); ctlAnchos(ws, datos);
  XLSX.utils.book_append_sheet(wb, ws, CTL_NOMBRES[que].slice(0, 31));
  XLSX.writeFile(wb, ctlArchivo(CTL_NOMBRES[que].toLowerCase().replace(/\s+/g, '-')));
  toast(`Excel de ${CTL_NOMBRES[que].toLowerCase()} descargado (${datos.length})`);
}
// Informe diario: se descarga solo a la hora elegida si Despacho está abierto y con datos recientes (sin los filtros de la pantalla)
const INFORME_KEY = 'dispatcher_informe_v1';
async function revisarInformeAuto() {
  if (!esCoord() || !tecCfg.informeOn || !horaPasada(tecCfg.informeHora || '09:00') || lsTexto(INFORME_KEY) === isoHoy()) return;
  if (!syncUltima || Date.now() - syncUltima > 10 * 60000) return;
  lsPonTexto(INFORME_KEY, isoHoy());
  const antes = ctl; ctl = { ...ctl, dsp: '', cli: '', proy: '', q: '', edad: '' };
  try { await ctlInforme(); } catch (e) { diagLog('Informe diario: ' + e.message); } finally { ctl = antes; }
}
// Tabla densa de Incidencias: los mismos filtros, una fila por incidencia
function incFila(r) {
  return `<tr data-key="${esc(tkey(r))}" style="--c:${estadoColor(r.estado)}"><td class="mono ctl-n">${esc(r.num || '—')}</td><td class="mono">${esc(r.fVisita || '—')}${r.desdeHora ? ' ' + esc(r.desdeHora) : ''}</td><td>${ctlCadHtml(r)}</td>
    <td class="ctl-sede"><b>${esc(r.descCliente || '—')}</b><small>${esc(r.descSede || '')}${r.poblacion ? ' · ' + esc(r.poblacion) : ''}</small></td><td>${ctlTecHtml(r)}</td><td>${estadoPill(r.estado)}</td></tr>`;
}
function incTablaHtml(lista) {
  return `<div class="inc-tabla">${ctlTabla(['Nº', 'Visita', 'Caducidad', 'Cliente · sede', 'Técnico', 'Estado'], ctlOrdenar(lista, 'inc').map(incFila), 'Nada con este filtro.', 'inc')}</div>`;
}
// Informe completo: resumen por DSP y una hoja por lista (con los filtros que estén puestos)
async function ctlInforme() {
  try { await cargarXLSX(); } catch (e) { toast('No se pudo cargar el módulo de Excel (sin conexión)'); return; }
  const F = ctlFiltradas(), wb = XLSX.utils.book_new();
  const dsps = [...PERFILES.filter(p => p !== 'COORD'), '—'];
  const cuenta = (l, p, f) => l.filter(x => dspTicket(x.r || x) === p && (!f || f(x))).length;
  const resumen = dsps.map(p => ({ DSP: p === '—' ? 'Sin DSP' : p, Abiertas: cuenta(F.todas, p), Presencial: cuenta(F.pres, p), 'Sin asignar': cuenta(F.pend, p), Caducadas: cuenta(F.cad, p), 'Caducan hoy': cuenta(F.hoy, p), 'En ruta hoy': cuenta(F.ruta, p), 'Hechas hoy': cuenta(F.ruta, p, x => x.st === 'd'), 'Con retraso': cuenta(F.ruta, p, x => x.late) })).filter(x => x.Abiertas || x['Sin asignar'] || x['En ruta hoy']);
  const tot = { DSP: 'TOTAL' }; Object.keys(resumen[0] || { Abiertas: 0 }).filter(k => k !== 'DSP').forEach(k => tot[k] = resumen.reduce((s, x) => s + x[k], 0)); resumen.push(tot);
  const filtros = [ctl.dsp && 'DSP ' + ctl.dsp, ctl.cli && 'Cliente ' + ctl.cli, ctl.proy && 'Proyecto ' + (ctl.proy === '-' ? 'sin proyecto' : ctl.proy), ctl.q && 'Búsqueda «' + ctl.q + '»'].filter(Boolean).join(' · ') || 'sin filtros';
  const ws0 = XLSX.utils.json_to_sheet(resumen); XLSX.utils.sheet_add_aoa(ws0, [[], [`Informe de control · ${new Date().toLocaleString('es-ES')} · ${filtros}`]], { origin: -1 }); ctlAnchos(ws0, resumen);
  XLSX.utils.book_append_sheet(wb, ws0, 'Resumen');
  // Por estado: el bloque total desglosado
  const est = Object.entries(F.todas.reduce((m, r) => { m[r.estado || '—'] = (m[r.estado || '—'] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).map(([e, n]) => ({ Estado: e, Incidencias: n }));
  if (est.length) { const w = XLSX.utils.json_to_sheet(est); ctlAnchos(w, est); XLSX.utils.book_append_sheet(wb, w, 'Por estado'); }
  ['pres', 'pend', 'cad', 'hoy', 'pron', 'esta', 'ruta', 'todas'].forEach(q => { const d = ctlHoja(q, F); const w = XLSX.utils.json_to_sheet(d.length ? d : [{ 'Nº': 'Ninguna' }]); ctlAnchos(w, d); XLSX.utils.book_append_sheet(wb, w, CTL_NOMBRES[q].slice(0, 31)); });
  XLSX.writeFile(wb, ctlArchivo('informe'));
  toast('Informe de control descargado');
}
