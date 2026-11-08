// ===== Análisis: informes, tendencias, indicadores, equilibrio y mapa nacional (perfil COORD) =====
// Todo sale de lo que Despacho ya tiene en este equipo: incidencias abiertas, cerradas de 15 días, jornadas e hilos.
// La primera visita resuelta también se usa en el informe semanal de los DSP.
const HIST_COORD_KEY = 'dispatcher_historico_coord_v1', HIST_COORD_DIAS = 400, MAPA_NUEVAS_MAX = 120;
const DSP_COLORES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'], DSP_SIN_COLOR = '#8a8d91';   // orden fijo, validado para daltonismo
let anOrd = {};

function anBotonesHtml() {
  return [['abrirInformes', 'Clientes y proyectos'], ['abrirTendencias', 'Tendencias'], ['abrirIndicadores', 'Técnicos'], ['abrirEquilibrio', 'Equilibrio'], ['abrirMapaNacional', 'Mapa nacional']]
    .map(([f, t]) => `<button class="btn sm" onclick="${f}()">${t}</button>`).join('');
}
function anAbrir(cls) {
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="md-box md-an ${cls || ''}" id="anBox"></div>`; m.hidden = false;
  return document.getElementById('anBox');
}
function anCab(titulo, sub, extra) {
  return `<div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">${titulo}</div><div class="dw-sub">${sub}</div></div><div class="acts">${extra || ''}<button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div></div>`;
}
function anSegDsp(actual, fn) {
  return `<span class="seg mini" role="group" aria-label="DSP">${[['', 'Todos'], ...PERFILES.filter(p => p !== 'COORD').map(p => [p, p])].map(([v, t]) => `<button class="segb${actual === v ? ' on' : ''}" aria-pressed="${actual === v}" onclick="${fn}('${v}')">${t}</button>`).join('')}</span>`;
}
// Tabla ordenable: columnas [{ t: título, v: fila => valor para ordenar, h: fila => html }]
function anTabla(id, cols, filas, vacio, repinta) {
  const o = anOrd[id];
  const l = o ? filas.slice().sort((a, b) => { const x = cols[o.i].v(a), y = cols[o.i].v(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es', { numeric: true })) * o.dir; }) : filas;
  if (!l.length) return `<div class="dempty">${vacio}</div>`;
  return `<div class="ctl-tabla an-tabla"><table><thead><tr>${cols.map((c, i) => `<th scope="col" aria-sort="${o && o.i === i ? (o.dir === 1 ? 'ascending' : 'descending') : 'none'}"><button class="ctl-ord${o && o.i === i ? ' on' : ''}" onclick="anOrdenar('${id}',${i},'${repinta}')">${c.t}${o && o.i === i ? (o.dir === 1 ? ' ▲' : ' ▼') : ''}</button></th>`).join('')}</tr></thead><tbody>${l.map(f => `<tr>${cols.map(c => `<td>${c.h(f)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function anOrdenar(id, i, repinta) {
  const o = anOrd[id];
  anOrd[id] = o && o.i === i ? (o.dir === -1 ? { i, dir: 1 } : null) : { i, dir: -1 };
  window[repinta]();
}
const anPct = (a, b) => b ? Math.round(a / b * 100) : -1;
const anPctTxt = v => v < 0 ? '—' : v + ' %';
async function anExcel(nombre, datos) {
  try { await cargarXLSX(); } catch (e) { toast('No se pudo cargar el módulo de Excel (sin conexión)'); return; }
  if (!datos.length) { toast('No hay datos que exportar'); return; }
  const ws = XLSX.utils.json_to_sheet(datos), wb = XLSX.utils.book_new(); ctlAnchos(ws, datos);
  XLSX.utils.book_append_sheet(wb, ws, nombre.slice(0, 31)); XLSX.writeFile(wb, ctlArchivo(nombre));
}

// ---- Primera visita resuelta ----
// Aproximada: una cerrada con visita cuenta como resuelta si después no se abrió otra incidencia del mismo equipo
// y el técnico no inició el ticket en dos días distintos.
function primeraVisitaOk(c, idx) {
  if (!c.fVisita) return null;
  const x = idx[c.key];
  if (x && x.otros.some(o => o.ts > (c.reg || 0))) return false;
  const h = hilos[c.key];
  if (h && new Set(h.items.filter(i => /ha iniciado el ticket/i.test(i.t || '')).map(i => isoHoy(new Date(i.ts)))).size >= 2) return false;
  return true;
}
function primeraVisitaResumen(lista, idx) {
  idx = idx || reincidencias();
  const r = lista.map(c => primeraVisitaOk(c, idx)).filter(v => v !== null);
  return { ok: r.filter(Boolean).length, n: r.length };
}

// ---- Informes por cliente y por proyecto ----
let infAn = { modo: 'cli', dsp: '' };
function infGrupos() {
  const L = ctlListas(), cad = new Set(L.cad.map(tkey)), hoy = new Set(L.hoy.map(tkey)), g = {}, m = infAn.modo;
  const de = (k, t) => g[k] = g[k] || { k, t, ab: 0, pres: 0, sin: 0, cad: 0, hoy: 0, cerr: 0, conCad: 0, aTiempo: 0 };
  L.todas.filter(r => !infAn.dsp || dspTicket(r) === infAn.dsp).forEach(r => {
    const p = proyDe(r), x = m === 'cli' ? de(r.descCliente || 'Sin cliente', r.descCliente || 'Sin cliente') : de(p ? p[0] : '-', proyTexto(p)), k = tkey(r);
    x.ab++; if (esPresencial(r)) x.pres++; if (/^XXX/i.test(r.operario || '')) x.sin++; if (cad.has(k)) x.cad++; if (hoy.has(k)) x.hoy++;
  });
  Object.values(cerradas).filter(c => !infAn.dsp || dspTicket({ operario: c.op }) === infAn.dsp).forEach(c => {
    const x = m === 'cli' ? de(c.cli || 'Sin cliente', c.cli || 'Sin cliente') : de(c.proy ? c.proy[0] : '-', proyTexto(c.proy || null));
    x.cerr++; if (c.cad) { x.conCad++; if (c.ts <= c.cad) x.aTiempo++; }
  });
  return Object.values(g).sort((a, b) => b.ab - a.ab);
}
function abrirInformes() { anAbrir('md-an-g'); renderInformes(); }
function infCambia(k, v) { infAn[k] = v; renderInformes(); }
function infCambiaDsp(v) { infCambia('dsp', v); }
function renderInformes() {
  const box = document.getElementById('anBox'); if (!box) return;
  const l = infGrupos(), m = infAn.modo, nom = m === 'cli' ? 'Cliente' : 'Proyecto';
  const cols = [
    { t: nom, v: x => x.t, h: x => m === 'cli' && x.k !== 'Sin cliente' ? `<a href="#" onclick="cerrarModal();ctlSet('cli','${jsq(x.k)}');return false"><b>${esc(x.t)}</b></a>` : `<b>${esc(x.t)}</b>` },
    ...[['Abiertas', 'ab'], ['Presencial', 'pres'], ['Sin asignar', 'sin'], ['Caducadas', 'cad'], ['Caducan hoy', 'hoy'], ['Cerradas 15 días', 'cerr']].map(([t, k]) => ({ t, v: x => x[k], h: x => x[k] })),
    { t: 'Cerradas a tiempo', v: x => anPct(x.aTiempo, x.conCad), h: x => anPctTxt(anPct(x.aTiempo, x.conCad)) }
  ];
  box.innerHTML = anCab('Informes por cliente y proyecto', `${plural(l.length, m === 'cli' ? 'cliente' : 'proyecto')} · abiertas ahora y cerradas de los últimos 15 días`, `<button class="btn sm" onclick="infExcel()">↓ Excel</button>`)
    + `<div class="an-filtros"><span class="seg mini" role="group" aria-label="Agrupar">${[['cli', 'Por cliente'], ['proy', 'Por proyecto']].map(([v, t]) => `<button class="segb${m === v ? ' on' : ''}" aria-pressed="${m === v}" onclick="infCambia('modo','${v}')">${t}</button>`).join('')}</span>${anSegDsp(infAn.dsp, 'infCambiaDsp')}</div>`
    + anTabla('inf' + m, cols, l, 'Sin datos con este filtro.', 'renderInformes')
    + `<p class="hint">«Cerradas a tiempo» solo cuenta las cerradas desde esta versión que tenían caducidad.</p>`;
}
function infExcel() {
  const nom = infAn.modo === 'cli' ? 'Cliente' : 'Proyecto';
  anExcel(infAn.modo === 'cli' ? 'por-cliente' : 'por-proyecto', infGrupos().map(x => ({ [nom]: x.t, Abiertas: x.ab, Presencial: x.pres, 'Sin asignar': x.sin, Caducadas: x.cad, 'Caducan hoy': x.hoy, 'Cerradas 15 días': x.cerr, 'Cerradas a tiempo %': x.conCad ? anPct(x.aTiempo, x.conCad) : '' })));
}

// ---- Histórico y tendencias: una foto por día, guardada en este equipo ----
function coordFotoHoy() {
  if (!esCoord()) return;
  const L = ctlListas(), ruta = rutaHoy(), cad = new Set(L.cad.map(tkey));
  const cuenta = f => ({ ab: L.todas.filter(f).length, sin: L.pend.filter(f).length, cad: L.todas.filter(r => f(r) && cad.has(tkey(r))).length, ruta: ruta.filter(x => f(x.r)).length, hechas: ruta.filter(x => x.st === 'd' && f(x.r)).length });
  const foto = cuenta(() => true); foto.dsp = {};
  PERFILES.filter(p => p !== 'COORD').forEach(p => { foto.dsp[p] = cuenta(r => dspTicket(r) === p); });
  const g = lsGet(HIST_COORD_KEY, {}); g[isoHoy()] = foto;
  Object.keys(g).sort().slice(0, -HIST_COORD_DIAS).forEach(k => delete g[k]);
  lsSet(HIST_COORD_KEY, g);
}
let tenAn = { dias: 30, dsp: '' }, anSeries = {};
function abrirTendencias() { anAbrir('md-an-g'); renderTendencias(); }
function tenCambia(v) { tenAn.dias = v; renderTendencias(); }
function tenCambiaDsp(v) { tenAn.dsp = v; renderTendencias(); }
function tenFilas() {
  const g = lsGet(HIST_COORD_KEY, {}), lim = isoHoy(new Date(Date.now() - tenAn.dias * 86400000));
  return Object.keys(g).sort().filter(k => !tenAn.dias || k >= lim).map(k => { const f = tenAn.dsp ? (g[k].dsp || {})[tenAn.dsp] : g[k]; return f ? { iso: k, ...f } : null; }).filter(Boolean);
}
const anFecha = iso => iso.slice(8) + '/' + iso.slice(5, 7);
const anTs = iso => parseIso(iso).getTime();
function anGrafico(id, serie, suf, max) {
  const W = 440, H = 136, iz = 34, de = 14, ar = 10, ab = 22, t0 = anTs(serie[0].iso), span = Math.max(1, anTs(serie[serie.length - 1].iso) - t0);
  const top = max || Math.max(1, Math.ceil(Math.max(...serie.map(p => p.v)) * 1.1));
  const x = p => iz + (W - iz - de) * (anTs(p.iso) - t0) / span, y = v => H - ab - (H - ab - ar) * v / top;
  let d = ''; serie.forEach((p, i) => { d += (!i || anTs(p.iso) - anTs(serie[i - 1].iso) > 7 * 86400000 ? 'M' : 'L') + x(p).toFixed(1) + ' ' + y(p.v).toFixed(1); });
  const u = serie[serie.length - 1];
  anSeries[id] = serie.map(p => ({ x: x(p), y: y(p.v), iso: p.iso, v: p.v, suf }));
  return `<div class="an-graf" id="g-${id}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución; los valores están en la tabla de abajo" onmousemove="anMover(event,'${id}')" onmouseleave="anSalir('${id}')">
    <line class="an-rej" x1="${iz}" x2="${W - de}" y1="${y(top)}" y2="${y(top)}"/><line class="an-eje" x1="${iz}" x2="${W - de}" y1="${y(0)}" y2="${y(0)}"/>
    <text class="an-t" x="${iz - 6}" y="${y(top) + 4}" text-anchor="end">${top}</text><text class="an-t" x="${iz - 6}" y="${y(0) + 4}" text-anchor="end">0</text>
    <text class="an-t" x="${iz}" y="${H - 5}">${anFecha(serie[0].iso)}</text><text class="an-t" x="${W - de}" y="${H - 5}" text-anchor="end">${anFecha(u.iso)}</text>
    <path class="an-linea" d="${d}"/><circle class="an-punto" cx="${x(u)}" cy="${y(u.v)}" r="4"/>
    <line class="an-cruz" id="c-${id}" y1="${ar}" y2="${H - ab}" visibility="hidden"/><circle class="an-punto" id="p-${id}" r="5" visibility="hidden"/>
    <rect x="${iz}" y="0" width="${W - iz - de}" height="${H - ab}" fill="transparent"/></svg><div class="an-tip" id="t-${id}" hidden></div></div>`;
}
function anMover(ev, id) {
  const s = anSeries[id], svg = ev.currentTarget; if (!s) return;
  const r = svg.getBoundingClientRect(), mx = (ev.clientX - r.left) / r.width * 440;
  const p = s.reduce((a, b) => Math.abs(b.x - mx) < Math.abs(a.x - mx) ? b : a);
  const c = document.getElementById('c-' + id), o = document.getElementById('p-' + id), t = document.getElementById('t-' + id);
  c.setAttribute('x1', p.x); c.setAttribute('x2', p.x); c.setAttribute('visibility', 'visible');
  o.setAttribute('cx', p.x); o.setAttribute('cy', p.y); o.setAttribute('visibility', 'visible');
  t.innerHTML = `<b>${p.v}${p.suf}</b> ${anFecha(p.iso)}`; t.hidden = false;
  t.style.left = Math.min(r.width - 90, Math.max(0, p.x / 440 * r.width - 40)) + 'px';
}
function anSalir(id) { ['c-', 'p-'].forEach(x => { const e = document.getElementById(x + id); if (e) e.setAttribute('visibility', 'hidden'); }); const t = document.getElementById('t-' + id); if (t) t.hidden = true; }
function renderTendencias() {
  const box = document.getElementById('anBox'); if (!box) return;
  const l = tenFilas();
  const met = [['ab', 'Abiertas', f => f.ab, '', 0], ['cad', 'Caducadas', f => f.cad, '', 0], ['sin', 'Sin asignar', f => f.sin, '', 0], ['ruta', 'Ruta hecha', f => f.ruta ? Math.round(f.hechas / f.ruta * 100) : null, ' %', 100]];
  const tarjeta = ([id, t, fn, suf, max]) => {
    const s = l.map(f => ({ iso: f.iso, v: fn(f) })).filter(p => p.v !== null);
    if (!s.length) return `<section class="an-card"><h3>${t}</h3><div class="dempty">Sin datos</div></section>`;
    const u = s[s.length - 1], lim = isoHoy(new Date(anTs(u.iso) - 7 * 86400000)), ant = s.filter(p => p.iso <= lim).pop(), dif = ant ? u.v - ant.v : null;
    return `<section class="an-card"><h3>${t}</h3><div class="an-hero"><b>${u.v}${suf}</b><span>${dif === null ? 'aún sin datos de hace una semana' : dif === 0 ? 'igual que hace 7 días' : (dif > 0 ? '+' : '−') + Math.abs(dif) + suf + ' frente a hace 7 días'}</span></div>${s.length > 1 ? anGrafico(id, s, suf, max) : '<div class="dempty">La gráfica aparecerá con dos días de datos.</div>'}</section>`;
  };
  box.innerHTML = anCab('Histórico y tendencias', 'Se guarda una foto al día mientras Control está abierto con ATGO sincronizando, solo en este equipo')
    + `<div class="an-filtros"><span class="seg mini" role="group" aria-label="Periodo">${[[30, '30 días'], [90, '90 días'], [0, 'Todo']].map(([v, t]) => `<button class="segb${tenAn.dias === v ? ' on' : ''}" aria-pressed="${tenAn.dias === v}" onclick="tenCambia(${v})">${t}</button>`).join('')}</span>${anSegDsp(tenAn.dsp, 'tenCambiaDsp')}</div>`
    + (l.length ? `<div class="an-grid">${met.map(tarjeta).join('')}</div><details class="an-det"><summary>Ver los datos en tabla</summary><div class="ctl-tabla"><table><thead><tr><th>Día</th><th>Abiertas</th><th>Caducadas</th><th>Sin asignar</th><th>Ruta hecha</th></tr></thead><tbody>${l.slice().reverse().map(f => `<tr><td class="mono">${f.iso.split('-').reverse().join('/')}</td><td>${f.ab}</td><td>${f.cad}</td><td>${f.sin}</td><td>${f.ruta ? f.hechas + ' de ' + f.ruta : '—'}</td></tr>`).join('')}</tbody></table></div></details>`
      : '<div class="dempty">Aún no hay fotos guardadas. La primera se guardará con la próxima carga de ATGO.</div>');
}

// ---- Indicadores por técnico ----
let indAn = { dsp: '' };
function indDatos() {
  const lim = isoHoy(new Date(Date.now() - 30 * 86400000)), porOp = {}, idx = reincidencias();
  const js = Object.entries(jornadas).filter(([k]) => k >= lim);
  js.forEach(([, j]) => Object.entries(j.ops || {}).forEach(([op, o]) => { const t = porOp[op] = porOp[op] || { tot: 0, d: 0, late: 0, dias: 0 }; t.tot += o.tot || 0; t.d += o.d || 0; t.late += o.late || 0; t.dias++; }));
  const cerr = Object.values(cerradas);
  return TECNICOS.filter(op => !/^XXX/i.test(op)).map(op => {
    const j = porOp[op] || { tot: 0, d: 0, late: 0, dias: 0 }, c = cerr.filter(x => x.op === op), f = primeraVisitaResumen(c, idx);
    const ab = rows.filter(r => cleanInitials(r.operario) === op && !esCierre(r.estado));
    return { op, dsp: dspTicket({ operario: op }), zona: zonaDe(op), ab: ab.length, vd: j.dias ? j.tot / j.dias : -1, cum: anPct(j.d, j.tot), late: j.late, cerr: c.length, reinc: ab.filter(r => idx[tkey(r)]).length + c.filter(x => idx[x.key]).length, fv: anPct(f.ok, f.n), fvn: f.n };
  }).filter(x => !indAn.dsp || x.dsp === indAn.dsp);
}
function abrirIndicadores() { anAbrir('md-an-g'); renderIndicadores(); }
function indCambiaDsp(v) { indAn.dsp = v; renderIndicadores(); }
function renderIndicadores() {
  const box = document.getElementById('anBox'); if (!box) return;
  const l = indDatos(), cols = [
    { t: 'Técnico', v: x => x.op, h: x => `<b class="mono">${esc(x.op)}</b>` }, { t: 'DSP', v: x => x.dsp, h: x => esc(x.dsp) }, { t: 'Zona', v: x => x.zona, h: x => esc(x.zona || '—') },
    { t: 'Abiertas', v: x => x.ab, h: x => x.ab }, { t: 'Visitas / día', v: x => x.vd, h: x => x.vd < 0 ? '—' : x.vd.toFixed(1).replace('.', ',') },
    { t: 'Ruta cumplida', v: x => x.cum, h: x => anPctTxt(x.cum) }, { t: 'Retrasos', v: x => x.late, h: x => x.late },
    { t: 'Cerradas 15 días', v: x => x.cerr, h: x => x.cerr }, { t: 'Reincidencias', v: x => x.reinc, h: x => x.reinc },
    { t: '1ª visita resuelta', v: x => x.fv, h: x => anPctTxt(x.fv) + (x.fvn ? ` <small class="dim">de ${x.fvn}</small>` : '') }
  ];
  box.innerHTML = anCab('Indicadores por técnico', 'Rutas de los últimos 30 días y cerradas de los últimos 15, guardadas en este equipo', `<button class="btn sm" onclick="indExcel()">↓ Excel</button>`)
    + `<div class="an-filtros">${anSegDsp(indAn.dsp, 'indCambiaDsp')}</div>` + anTabla('ind', cols, l, 'Sin técnicos con este filtro.', 'renderIndicadores')
    + `<p class="hint">Para apoyar y detectar formación o material que falta. La primera visita resuelta es aproximada: no volvió a abrirse el mismo equipo y el técnico no inició el ticket en dos días distintos.</p>`;
}
function indExcel() { anExcel('tecnicos', indDatos().map(x => ({ Técnico: x.op, DSP: x.dsp, Zona: x.zona, Abiertas: x.ab, 'Visitas/día': x.vd < 0 ? '' : +x.vd.toFixed(1), 'Ruta cumplida %': x.cum < 0 ? '' : x.cum, Retrasos: x.late, 'Cerradas 15 días': x.cerr, Reincidencias: x.reinc, '1ª visita resuelta %': x.fv < 0 ? '' : x.fv }))); }

// ---- Equilibrio de carga: técnicos saturados y quién tiene hueco cerca ----
let eqFecha = null;
function abrirEquilibrio() { eqFecha = nextWorkday(); anAbrir(); renderEquilibrio(); }
function eqCambia(v) { if (v) { eqFecha = new Date(v + 'T12:00'); renderEquilibrio(); } }
function equilibrioPropuestas(fecha) {
  const f = ddmmyyyy(fecha), disp = TECNICOS.filter(op => !/^XXX/i.test(op) && !dispatcherOps().includes(op) && !noDisponible(op, fecha));
  const info = disp.map(op => ({ op, zona: zonaDe(op), dsp: dspTicket({ operario: op }), m: cargaMin(op, f) }));
  const huecos = info.filter(x => x.m < JORNADA_MIN * 0.5);
  return info.filter(x => x.m > JORNADA_MIN).sort((a, b) => b.m - a.m).map(s => {
    const vecinos = zonaOps(s.zona), porZona = huecos.filter(h => h.op !== s.op && (vecinos.includes(h.op) || h.zona === s.zona)), mismoDsp = huecos.filter(h => h.op !== s.op && h.dsp === s.dsp);
    const c = (porZona.length ? porZona : mismoDsp).slice().sort((a, b) => a.m - b.m)[0] || null;
    const visitas = rows.filter(r => r.fVisita === f && r.operario === s.op && esPresencial(r)).map(r => ({ r, min: estimarMin(r) || 0 }));
    const t = visitas.filter(v => !v.r.desdeHora).sort((a, b) => b.min - a.min)[0] || visitas.sort((a, b) => horaMin(b.r.desdeHora) - horaMin(a.r.desdeHora))[0] || null;
    if (c && t) { c.m += t.min || 60; }
    return { s, c, t, cerca: !!porZona.length };
  });
}
function renderEquilibrio() {
  const box = document.getElementById('anBox'); if (!box) return;
  const l = equilibrioPropuestas(eqFecha), iso = isoHoy(eqFecha);
  box.innerHTML = anCab('Equilibrio de carga', `Técnicos con más de ${JORNADA_MIN / 60} h ese día y quién tiene hueco. No cambia nada: es una propuesta para hablar con el DSP`)
    + `<div class="an-filtros"><label>Día <input type="date" value="${iso}" onchange="eqCambia(this.value)"></label></div>`
    + (l.length ? `<div class="eq-lista">${l.map(x => `<div class="eq-fila"><span><b class="mono">${esc(x.s.op)}</b> <small>${esc(x.s.zona || '')} · ${esc(x.s.dsp)}</small></span><span class="eq-carga">${esc(fmtMin(x.s.m))}</span>
        <span>${x.c ? `Pasar a <b class="mono">${esc(x.c.op)}</b> <small>${esc(x.c.zona || '')} · ${esc(fmtMin(x.c.m))}${x.cerca ? '' : ' · otra zona de su DSP'}</small>` : '<span class="dim">Nadie con hueco en su zona ni en su DSP</span>'}</span>
        <span>${x.t ? `<a href="#" class="mono" onclick="cerrarModal();openTicket('${jsq(tkey(x.t.r))}');return false">${esc(String(x.t.r.num).slice(-5))}</a> <small>${esc(x.t.r.descSede || '')}</small>` : ''}</span></div>`).join('')}</div>`
      : '<div class="dempty">Nadie supera la jornada ese día.</div>');
}

// ---- Mapa nacional: visitas de hoy y sin asignar, por DSP ----
let nacAn = { modo: 'todo', dsp: '' };
function nacColor(dsp) { const i = PERFILES.filter(p => p !== 'COORD').indexOf(dsp); return i >= 0 ? DSP_COLORES[i % DSP_COLORES.length] : DSP_SIN_COLOR; }
async function abrirMapaNacional() {
  const m = document.getElementById('modal'); nacAn = { modo: 'todo', dsp: '' };
  m.innerHTML = `<div class="md-box md-mapa"><div class="dw-head"><div><div class="dw-num" style="color:var(--ink)">Mapa nacional · ${esc(diaLargo(new Date()))}</div><div class="dw-sub" id="mapaEst">Cargando…</div></div><button class="iconbtn" onclick="cerrarModal()" aria-label="Cerrar">✕</button></div><div id="mapa"></div><div class="mapa-leg" id="mapaLeg"></div><div class="mapa-nota" id="mapaNota"></div></div>`;
  m.hidden = false;
  const est = t => { const e = document.getElementById('mapaEst'); if (e) e.textContent = t; };
  try { await cargarLeaflet(); } catch (e) { est('No se pudo cargar el mapa (sin conexión).'); return; }
  const hoy = todayStr(), visitas = todasAbiertas().filter(r => esPresencial(r) && r.fVisita === hoy && !/^XXX/i.test(r.operario || '')), sinAsig = ctlListas().pend;
  const items = [...visitas.map(r => ({ r, sin: false })), ...sinAsig.map(r => ({ r, sin: true }))].map(x => ({ ...x, dsp: dspTicket(x.r) || '—' }));
  const mapa = L.map('mapa').setView([39.8, -3.7], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(mapa);
  setTimeout(() => mapa.invalidateSize(), 150);
  const capa = L.layerGroup().addTo(mapa), puntos = [];
  const linea = p => `<a href="#" onclick="cerrarModal();openTicket('${jsq(tkey(p.r))}');return false"><b>Nº ${esc(p.r.num)}</b></a> · ${esc(p.dsp)} · ${p.sin ? 'Sin asignar' : esc(cleanInitials(p.r.operario)) + (p.r.desdeHora ? ' ' + esc(p.r.desdeHora) : '')}<br>${esc(p.r.descSede || '')}${p.aprox ? ' <i>(aproximada)</i>' : ''}`;
  function pinta(ajustar) {
    capa.clearLayers();
    const vis = puntos.filter(p => (nacAn.modo === 'todo' || (nacAn.modo === 'sin') === p.sin) && (!nacAn.dsp || p.dsp === nacAn.dsp)), g = new Map();
    vis.forEach(p => { const k = p.ll[0].toFixed(2) + ',' + p.ll[1].toFixed(2) + '|' + p.dsp + '|' + p.sin; if (!g.has(k)) g.set(k, []); g.get(k).push(p); });
    g.forEach(l => {
      const p = l[0], txt = (p.dsp === '—' ? '?' : p.dsp.replace('DSP', 'D')) + (l.length > 1 ? '·' + l.length : ''), w = 16 + txt.length * 7;
      L.marker(p.ll, { icon: L.divIcon({ className: 'mapa-dsp' + (p.sin ? ' sin' : ''), html: `<div style="--c:${nacColor(p.dsp)};width:${w}px">${esc(txt)}</div>`, iconSize: [w, 22], iconAnchor: [w / 2, 11] }), bubblingMouseEvents: false }).bindPopup(l.map(linea).join('<hr>'), { maxHeight: 260 }).addTo(capa);
    });
    if (ajustar && vis.length) mapa.fitBounds(vis.map(p => p.ll), { padding: [40, 40], maxZoom: 9 });
    leyenda();
  }
  function leyenda() {
    const n = d => items.filter(x => x.dsp === d).length, seg = [['todo', 'Todo'], ['vis', 'Visitas de hoy'], ['sin', 'Sin asignar']];
    document.getElementById('mapaLeg').innerHTML = seg.map(([v, t]) => `<button class="mapa-tec${nacAn.modo === v ? ' on' : ''}" onclick="window.__nacModo('${v}')">${t}</button>`).join('')
      + [...PERFILES.filter(p => p !== 'COORD'), '—'].filter(n).map(d => `<button class="mapa-tec${nacAn.dsp === d ? ' on' : ''}" onclick="window.__nacDsp('${d}')"><i style="background:${nacColor(d)}"></i>${esc(d === '—' ? 'Sin DSP' : d)} · ${n(d)}</button>`).join('');
    document.getElementById('mapaNota').innerHTML = '<span><i class="lg dia" style="background:#6b7280"></i>Visita de hoy</span><span><i class="lg otra" style="border-color:#6b7280"></i>Sin asignar</span>';
  }
  window.__nacModo = v => { nacAn.modo = v; pinta(true); };
  window.__nacDsp = d => { nacAn.dsp = nacAn.dsp === d ? '' : d; pinta(true); };
  if (!items.length) { est('Sin visitas hoy ni incidencias sin asignar.'); leyenda(); return; }
  const faltan = [];
  for (const x of items) { if (situadoYa(x.r)) { const s = await situar(x.r); if (s) puntos.push({ ...x, ...s }); } else faltan.push(x); }
  pinta(true);
  const nuevas = faltan.slice(0, MAPA_NUEVAS_MAX);
  for (const [i, x] of nuevas.entries()) {
    est(`Situando direcciones nuevas ${i + 1}/${nuevas.length}… se guardan para la próxima vez`);
    const s = await situar(x.r);
    if (!document.getElementById('mapa')) return;
    if (s) { puntos.push({ ...x, ...s }); pinta(false); }
  }
  est(`${plural(puntos.filter(p => !p.sin).length, 'visita')} de hoy y ${puntos.filter(p => p.sin).length} sin asignar en el mapa${items.length > puntos.length ? ` · ${items.length - puntos.length} sin situar` : ''}`);
}
