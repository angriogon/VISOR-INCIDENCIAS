// ===== Modo COORD: panel de CONTROL =====
// El coordinador controla, no gestiona: qué hay sin asignar, qué ha caducado, qué caduca hoy y qué va en ruta hoy,
// de todos los DSP, con filtros por DSP y cliente y un Excel de cada lista (o de todo).
// Solo se ve con el perfil COORD (pestaña CONTROL). Se puede reasignar desde la ficha, Incidencias o Planificación.
// Usa utilidades de los demás archivos solo en tiempo de llamada.

const CTL_VISTAS = [['cad', 'Caducadas'], ['hoy', 'Caducan hoy'], ['ruta', 'En ruta hoy']];
let ctl = { vista: 'cad', dsp: '', cli: '', q: '' };
function esCoord() { return PERFIL === 'COORD'; }

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
  const ahora = Date.now(), hoy = isoHoy(), todas = todasAbiertas(), cad = [], hoyL = [];
  todas.forEach(r => { if (sinSla(r)) return; const c = caducidad(r); if (!c) return; if (c.ts < ahora) cad.push(r); else if (isoHoy(new Date(c.ts)) === hoy) hoyL.push(r); });
  const porCad = (a, b) => (caducidad(a) || { ts: 0 }).ts - (caducidad(b) || { ts: 0 }).ts;
  return { todas, pend: sinListas().pend, cad: cad.sort(porCad), hoy: hoyL.sort(porCad), ruta: rutaHoy().sort((a, b) => horaMin(a.r.desdeHora) - horaMin(b.r.desdeHora)) };
}
function ctlPasa(r) {
  if (ctl.dsp && dspTicket(r) !== ctl.dsp) return false;
  if (ctl.cli && (r.descCliente || '') !== ctl.cli) return false;
  if (ctl.q) { const t = norm([r.num, r.descSede, r.descCliente, r.operario, r.poblacion, r.provincia, r.referencia].join(' ')); if (!norm(ctl.q).split(/\s+/).every(w => t.includes(w))) return false; }
  return true;
}
function ctlFiltradas() {
  const L = ctlListas();
  return { todas: L.todas.filter(ctlPasa), pend: L.pend.filter(ctlPasa), cad: L.cad.filter(ctlPasa), hoy: L.hoy.filter(ctlPasa), ruta: L.ruta.filter(x => ctlPasa(x.r)), clientes: L.todas };
}
function ctlSet(k, v) { ctl[k] = v; renderControl(); }

// ---- Filas ----
function fechaCorta(ts) { return new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ' + hhmm(ts); }
function ctlCadHtml(r) {
  const c = caducidad(r); if (!c) return '<span class="fch">—</span>';
  const nv = cadNivel(c);
  return `<span class="fch cad-${nv}" title="${esc(cadTexto(c))}"><i>${nv === 'venc' ? 'Caducó' : 'Caduca'}</i>${esc(fechaCorta(c.ts))}</span>`;
}
function ctlTecHtml(r) { return /^XXX/i.test(r.operario || '') ? '<span class="ctl-sin">Sin asignar</span>' : `<b>${esc(r.operario)}</b>`; }
function ctlFila(r) {
  return `<tr data-key="${esc(tkey(r))}" style="--c:${estadoColor(r.estado)}">
    <td class="mono ctl-n">${esc(r.num || '—')}</td><td>${ctlCadHtml(r)}</td>
    <td class="ctl-sede"><b>${esc(r.descCliente || '—')}</b><small>${esc(r.descSede || '')}${r.poblacion ? ' · ' + esc(r.poblacion) : ''}</small></td>
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
function ctlTabla(cab, filas, vacio) {
  return filas.length ? `<div class="ctl-tabla"><table><thead><tr>${cab.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${filas.join('')}</tbody></table></div>` : `<div class="dempty">${vacio}</div>`;
}

// ---- Vista ----
function renderControl() {
  const root = document.getElementById('viewCtl'); if (!root) return;
  if (!rows.length && !poolRows.length) { root.innerHTML = `<div class="empty"><h2>Esperando los datos de ATGO</h2><div>Abre ATGO (⚙ › General) para cargar las incidencias de todos los DSP.</div></div>`; return; }
  const F = ctlFiltradas(), L = ctlListas();
  const hechas = F.ruta.filter(x => x.st === 'd').length;
  const clientes = Object.entries(L.todas.reduce((m, r) => { const c = r.descCliente || ''; if (c) m[c] = (m[c] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
  const kpi = (id, n, t, sub, cls) => `<button class="ctl-kpi ${cls || ''}${ctl.vista === id ? ' on' : ''}" onclick="${id === 'pend' ? "document.getElementById('ctlPend').scrollIntoView({behavior:'smooth',block:'start'})" : id === 'todas' ? "showTab('inc')" : `ctlSet('vista','${id}')`}"><b>${n}</b><span>${t}</span>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const vista = ctl.vista;
  const lista = vista === 'ruta' ? ctlTabla(['Hora', 'Situación', 'Nº', 'Cliente · sede', 'Técnico', 'DSP'], F.ruta.map(ctlFilaRuta), 'Nadie en ruta hoy con estos filtros.')
    : ctlTabla(['Nº', 'Caducidad', 'Cliente · sede', 'Técnico', 'DSP', 'Estado'], (vista === 'cad' ? F.cad : F.hoy).map(ctlFila), vista === 'cad' ? 'Ninguna caducada con estos filtros. 👍' : 'Ninguna caduca hoy con estos filtros.');
  root.innerHTML = `
    <div class="ctl-cab"><div><h2>Control</h2><span>${esc(diaLargo(new Date()))} · todos los DSP${syncUltima ? ' · ATGO ' + esc(hhmm(syncUltima)) : ''}</span></div>
      <button class="btn pri" onclick="ctlInforme()" title="Un Excel con el resumen por DSP y una hoja por lista (con los filtros puestos)">↓ Informe completo (Excel)</button></div>
    <div class="ctl-kpis">
      ${kpi('todas', F.todas.length, 'Abiertas', 'el bloque total')}
      ${kpi('pend', F.pend.length, 'Sin asignar', '', F.pend.length ? 'warn' : '')}
      ${kpi('cad', F.cad.length, 'Caducadas', 'sin fuera de mantenimiento', F.cad.length ? 'mal' : 'bien')}
      ${kpi('hoy', F.hoy.length, 'Caducan hoy', 'sin fuera de mantenimiento', F.hoy.length ? 'warn' : '')}
      ${kpi('ruta', `${hechas}/${F.ruta.length}`, 'En ruta hoy', F.ruta.filter(x => x.late).length ? F.ruta.filter(x => x.late).length + ' con retraso' : 'hechas / total')}
    </div>
    <div class="ctl-filtros">
      <span class="seg mini" role="group" aria-label="DSP">${[['', 'Todos'], ...PERFILES.filter(p => p !== 'COORD').map(p => [p, p])].map(([v, t]) => `<button class="segb${ctl.dsp === v ? ' on' : ''}" aria-pressed="${ctl.dsp === v}" onclick="ctlSet('dsp','${v}')">${t}</button>`).join('')}</span>
      <select aria-label="Cliente" onchange="ctlSet('cli',this.value)"><option value="">Todos los clientes</option>${clientes.map(([c, n]) => `<option value="${esc(c)}"${ctl.cli === c ? ' selected' : ''}>${esc(c)} (${n})</option>`).join('')}</select>
      <input type="search" placeholder="Buscar Nº, sede, técnico, población…" aria-label="Buscar" value="${esc(ctl.q)}" oninput="ctl.q=this.value;clearTimeout(window.ctlT);window.ctlT=setTimeout(()=>{renderControl();const i=document.querySelector('.ctl-filtros input');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250)">
      ${ctl.dsp || ctl.cli || ctl.q ? `<button class="btn sm ghost" onclick="ctl.dsp='';ctl.cli='';ctl.q='';renderControl()">Quitar filtros</button>` : ''}
    </div>
    <div class="ctl-cols">
      <section class="ctl-card" id="ctlPend">
        <div class="ctl-card-h"><h3>Pendientes de asignar <small>${F.pend.length}</small></h3><button class="btn sm" onclick="ctlExcel('pend')">↓ Excel</button></div>
        ${ctlTabla(['Nº', 'Caducidad', 'Cliente · sede', 'Zona · DSP', 'Esperando'], F.pend.map(ctlFilaPend), 'Nada pendiente de asignar con estos filtros. 👍')}
      </section>
      <section class="ctl-card">
        <div class="ctl-card-h"><span class="seg" role="tablist">${CTL_VISTAS.map(([v, t]) => `<button class="segb${vista === v ? ' on' : ''}" role="tab" aria-selected="${vista === v}" onclick="ctlSet('vista','${v}')">${t} <small>${v === 'cad' ? F.cad.length : v === 'hoy' ? F.hoy.length : F.ruta.length}</small></button>`).join('')}</span>
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
    DSP: dspTicket(r), Zona: /^XXX/i.test(r.operario || '') ? zonaPool(r) : zonaDe(r.operario), Estado: r.estado, Caducidad: c ? new Date(c.ts).toLocaleString('es-ES') : '', 'Caduca': c ? cadTexto(c) : '',
    Visita: r.fVisita, Desde: r.desdeHora, Hasta: r.hastaHora, Registro: d ? d.toLocaleString('es-ES') : '', Tipo: r.tipo, Referencia: r.referencia,
    Motivo: (typeof motivoTexto === 'function' ? motivoTexto(tkey(r)) : '').slice(0, 300), Enlace: r.url || ATGO_URL + tkey(r) };
}
function ctlHoja(que, F) {
  if (que === 'ruta') return F.ruta.map(x => ({ Hora: x.r.desdeHora, Hasta: x.r.hastaHora, Situación: x.label || ST_LAB[x.st], Retraso: x.late ? 'Sí' : '', ...ctlFilaExcel(x.r) }));
  return (F[que] || []).map(ctlFilaExcel);
}
const CTL_NOMBRES = { pend: 'Pendientes de asignar', cad: 'Caducadas', hoy: 'Caducan hoy', ruta: 'En ruta hoy', todas: 'Abiertas' };
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
// Informe completo: resumen por DSP y una hoja por lista (con los filtros que estén puestos)
async function ctlInforme() {
  try { await cargarXLSX(); } catch (e) { toast('No se pudo cargar el módulo de Excel (sin conexión)'); return; }
  const F = ctlFiltradas(), wb = XLSX.utils.book_new();
  const dsps = [...PERFILES.filter(p => p !== 'COORD'), '—'];
  const cuenta = (l, p, f) => l.filter(x => dspTicket(x.r || x) === p && (!f || f(x))).length;
  const resumen = dsps.map(p => ({ DSP: p === '—' ? 'Sin DSP' : p, Abiertas: cuenta(F.todas, p), 'Sin asignar': cuenta(F.pend, p), Caducadas: cuenta(F.cad, p), 'Caducan hoy': cuenta(F.hoy, p), 'En ruta hoy': cuenta(F.ruta, p), 'Hechas hoy': cuenta(F.ruta, p, x => x.st === 'd'), 'Con retraso': cuenta(F.ruta, p, x => x.late) })).filter(x => x.Abiertas || x['Sin asignar'] || x['En ruta hoy']);
  const tot = { DSP: 'TOTAL' }; Object.keys(resumen[0] || { Abiertas: 0 }).filter(k => k !== 'DSP').forEach(k => tot[k] = resumen.reduce((s, x) => s + x[k], 0)); resumen.push(tot);
  const filtros = [ctl.dsp && 'DSP ' + ctl.dsp, ctl.cli && 'Cliente ' + ctl.cli, ctl.q && 'Búsqueda «' + ctl.q + '»'].filter(Boolean).join(' · ') || 'sin filtros';
  const ws0 = XLSX.utils.json_to_sheet(resumen); XLSX.utils.sheet_add_aoa(ws0, [[], [`Informe de control · ${new Date().toLocaleString('es-ES')} · ${filtros}`]], { origin: -1 }); ctlAnchos(ws0, resumen);
  XLSX.utils.book_append_sheet(wb, ws0, 'Resumen');
  // Por estado: el bloque total desglosado
  const est = Object.entries(F.todas.reduce((m, r) => { m[r.estado || '—'] = (m[r.estado || '—'] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).map(([e, n]) => ({ Estado: e, Incidencias: n }));
  if (est.length) { const w = XLSX.utils.json_to_sheet(est); ctlAnchos(w, est); XLSX.utils.book_append_sheet(wb, w, 'Por estado'); }
  ['pend', 'cad', 'hoy', 'ruta', 'todas'].forEach(q => { const d = ctlHoja(q, F); const w = XLSX.utils.json_to_sheet(d.length ? d : [{ 'Nº': 'Ninguna' }]); ctlAnchos(w, d); XLSX.utils.book_append_sheet(wb, w, CTL_NOMBRES[q].slice(0, 31)); });
  XLSX.writeFile(wb, ctlArchivo('informe'));
  toast('Informe de control descargado');
}
