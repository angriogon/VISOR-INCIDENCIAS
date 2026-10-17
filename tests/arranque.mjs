// Prueba de arranque en un navegador sin pantalla: abre Despacho con datos de ejemplo (ficticios),
// recorre las pestañas, la ficha, los ajustes y una actualización de ATGO simulada, y falla si aparece
// cualquier error. Uso: npm i --no-save playwright-core && node tests/arranque.mjs
// NAVEGADOR=msedge (Windows) o chrome (por defecto, el de GitHub Actions).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const raiz = process.env.RAIZ || path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(raiz, p);
  if (!f.startsWith(raiz) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const url = `http://localhost:${server.address().port}/`;

// Datos ficticios con la misma forma que los de ATGO
const hoy = new Date(), dd = d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
const man = new Date(hoy); man.setDate(man.getDate() + 1);
const T = (n, op, f, h, estado, sede, prov) => ({ key: `2026/00/${n}`, num: `202600${n}`, url: `https://atgo.tier1.es/#/mistickets/2026/00/${n}`, operario: op, desOperario: 'APELLIDO, NOMBRE', fVisita: f, desdeHora: h, hastaHora: '', estado, descSede: sede, descCliente: 'CLIENTE DE PRUEBA', tipo: 'TPV', domicilio: 'Calle Falsa 1, ' + prov, poblacion: prov, provincia: prov, fRegistroISO: '2026-10-01T10:00:00Z' });
const rows = [
  T(1, 'DSG', dd(hoy), '09:00', 'PRESENCIAL', 'Tienda Centro', 'SEVILLA'), T(2, 'DSG', dd(man), '', 'PRESENCIAL', 'Tienda Norte', 'SEVILLA'),
  T(3, 'EACL', dd(man), '10:00', 'PRESENCIAL', 'Hiper Ceuta', 'CEUTA'), T(4, 'EACL', '', '', 'MATERIAL PTE. FABRICANTE', 'Hiper Ceuta', 'CEUTA'),
  T(5, 'JVR', '', '', 'ESCALADO TIER1', 'Oficina Málaga', 'MALAGA'), T(6, 'AMRG', '', '', 'PRESENCIAL', 'Centro Jaén', 'JAEN')
];
const pool = [{ ...T(9, 'XXX-0CEUTA', '', '', 'PRESENCIAL', 'Hiper Ceuta', 'CEUTA'), desOperario: 'PENDIENTE ASIGNAR CEUTA' }];
const payload = { type: 'atgo-data', partial: false, v: null, rows, pool, poolOps: { 'XXX-0CEUTA': 'PENDIENTE ASIGNAR CEUTA' }, at: Date.now(), caps: ['hilo', 'estado', 'editar', 'asignar', 'pool'], estados: [] };
const hilos = { '2026/00/1': { at: Date.now(), items: [{ ts: Date.now() - 7200000, u: 'ADMIN', n: '', e: '', t: 'Duración estimada de la intervención: 2 h' }, { ts: Date.now() - 3600000, u: 'DSG', n: '', e: '', t: 'El usuario DSG ha iniciado el ticket' }] } };

const errores = [];
let navegador;
try {
  navegador = await chromium.launch({ channel: process.env.NAVEGADOR || 'chrome', headless: true });
  const ctx = await navegador.newContext({ serviceWorkers: 'block', viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(([p, h]) => {
    if (sessionStorage.getItem('prep')) return; sessionStorage.setItem('prep', '1');
    localStorage.clear();
    localStorage.setItem('dispatcher_atgo_v1', JSON.stringify(p));
    localStorage.setItem('dispatcher_hilos_v1', JSON.stringify(h));
    localStorage.setItem('dispatcher_bienvenida_v1', '1');
    localStorage.setItem('dispatcher_preferencias_v1', JSON.stringify({ fase2: 'todos' }));
  }, [payload, hilos]);
  const page = await ctx.newPage();
  page.on('pageerror', e => errores.push('Error de página: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|fonts\.g/.test(m.text())) errores.push('Consola: ' + m.text()); });
  await page.goto(url + '#dia');
  await page.waitForTimeout(1500);
  const r = await page.evaluate(async (p) => {
    const paso = ms => new Promise(x => setTimeout(x, ms)), out = {};
    // Actualización de ATGO simulada por el mismo camino que la real (mensaje desde la pestaña de ATGO)
    const fr = document.createElement('iframe'); fr.style.display = 'none'; document.body.appendChild(fr);
    window.dispatchEvent(new MessageEvent('message', { data: { ...p, at: Date.now() }, origin: 'https://atgo.tier1.es', source: fr.contentWindow }));
    await paso(300);
    out.filas = rows.length; out.sinAsignar = poolRows.length; out.avisoVersion = syncVieja;
    for (const t of ['dia', 'sin', 'inc', 'sem', 'man']) { showTab(t); await paso(150); out['vista_' + t] = document.getElementById({ dia: 'viewDia', sin: 'viewSin', inc: 'viewInc', sem: 'viewSem', man: 'viewMan' }[t]).innerText.length > 20; }
    for (const tab of ['res', 'act', 'his']) { openTicket('2026/00/1', tab); await paso(100); }
    out.duracion = document.getElementById('dwPanel').innerText.includes('Historial');
    closeTicket();
    out.enCurso = rutaHoy().find(x => x.r.key === '2026/00/1').st;
    toggleCfg(); for (const t of ['gen', 'apa', 'avi', 'fes', 'wa', 'dat']) { cfgTab = t; renderCfg(); await paso(50); } document.getElementById('cfgMenu').hidden = true;
    abrirPerfiles('DSP2'); await paso(50); out.perfilDSP2 = document.querySelectorAll('#perfBox .pf-tec').length; perfSel = 'DSP5'; renderPerfiles(); out.perfilDSP5 = document.querySelectorAll('#perfBox .pf-tec').length; cerrarModal();
    showTab('sin'); sinFiltro = 'todas'; renderSin(); const s0 = document.querySelector('#viewSin select'); out.selectorCorto = s0.options.length < 10; completarSelect(s0); out.selectorTodos = s0.options.length;
    showTab('sin'); sinMarcarTodas(true); out.marcadas = sinMarcadas().length;

    abrirNovedades(); cerrarModal(); abrirAtajos(); cerrarModal();
    openPalette(); document.getElementById('palInput').value = 'ceuta'; palRender(); out.buscador = palItems.length > 0; closePalette();
    filtroInc.dsp = 'DSP1'; showTab('inc'); await paso(150); out.filtroDsp = filtroInc.dsp; filtroInc.dsp = '';
    // Filtro por DSP y orden de Sin asignar por urgencia (caduca antes > más antigua)
    filtroInc.dsp = 'DSP1'; out.zonasDsp1 = zonasVisibles().length > 0; filtroInc.dsp = 'DSP2'; out.zonasDsp2 = zonasVisibles().length; filtroInc.dsp = '';
    const base = poolRows[0];
    poolRows = [{ ...base, key: '2026/00/91', fRegistroISO: '2026-01-01T10:00:00Z' }, { ...base, key: '2026/00/92', fRegistroISO: '2026-09-01T10:00:00Z' }, { ...base, key: '2026/00/93', fRegistroISO: '2026-10-01T10:00:00Z' }];
    guardarNota('2026/00/93', { cad: '2026-12-20T10:00' });
    out.ordenSin = sinListas(true).pend.map(r => r.key.slice(-2)).join(',');
    // Mis cambios, sin cerrar y olvidadas (la de enero lleva meses sin técnico)
    registrarEdicion({ key: '2026/00/1', num: '202600001', accion: 'comentario', detalle: 'Prueba', ok: true });
    abrirMisCambios('hoy'); out.misCambios = document.querySelectorAll('#modal table.camb tbody tr').length; cerrarModal();
    abrirSinCerrar(); out.sinCerrar = document.querySelectorAll('#modal .sc-it').length; cerrarModal();
    out.olvidada = olvidada(poolRows.find(r => r.key === '2026/00/91'));
    showTab('dia'); out.botonMisCambios = /Mis cambios · 1/.test(document.getElementById('viewDia').innerText);
    // Festivos: 12/10 es fiesta nacional; el viernes 9/10 de 2026 el próximo laborable es el martes 13
    out.festivo = festivo(new Date(2026, 9, 12, 12)); out.proxLab = isoHoy(nextWorkday(new Date(2026, 9, 9, 12)));
    out.viernesSanto = festivo(new Date(2027, 2, 26, 12));
    // Rellenar el día, contacto y sede en la ficha
    rellenarDia('DSG', isoHoy(nextWorkday())); out.rellenar = !!document.querySelector('#modal .rd-l, #modal .dempty'); cerrarModal();
    out.contacto = /tel:600111222/.test(contactoHtml({ telefono: '600 111 222', email: 'a@b.es' }));
    out.sede = sedeOtras('2026/00/3', rows.find(r => r.key === '2026/00/3')).length;
    // Nómina: baja (sale del selector), apariencia y modo accesible
    abrirNomina(); out.nomina = document.querySelectorAll('#nomBox tbody tr').length;
    // Vacaciones desde hoy: fuera de Incidencias y Planificación, con aviso, y no se propone
    { const hoy = isoHoy(); document.getElementById('vd-DSG').value = hoy; document.getElementById('vh-DSG').value = hoy; nomVacAnadir('DSG');
      showTab('inc'); const sinDsg = !document.querySelector('#groupsPanel .tg[data-op="DSG"]'), aviso = /DSG de vacaciones/.test((document.querySelector('.aus-aviso') || {}).textContent || '');
      showTab('sem'); const semSin = !zonasVisibles().some(z => z.ops.includes('DSG'));
      out.vacaciones = sinDsg && aviso && semSin && !/value="DSG"/.test(opcionesTecnico([], '', true));
      perfilCfg.nomina.DSG.vac = []; guardarPerfiles(); abrirNomina(); }
    nomBaja('ACAB', true); out.bajaSelector = !/value="ACAB"/.test(opcionesTecnico([], '', true)); nomBaja('ACAB', false); cerrarModal();
    setPref('acento', 'atgo'); out.acento = getComputedStyle(document.documentElement).getPropertyValue('--acento').trim();
    modoAccesible(true); out.accesible = document.documentElement.classList.contains('acc-contraste') && document.body.style.zoom === '1.15';
    modoAccesible(false); setPref('acento', ''); setPref('densidad', 'amplia'); out.amplia = document.body.classList.contains('amplia'); setPref('densidad', 'normal');
    abrirNovedades(); out.novedades = document.querySelectorAll('#modal details.nov').length; cerrarModal();
    out.sinNombre = [...document.querySelectorAll('button')].filter(b => b.offsetParent && !(b.getAttribute('aria-label') || b.textContent.trim())).length;
    // Lote: una pestaña de ATGO simulada contesta las 3 de una vez; las filas se actualizan sin recargar
    { const prevCaps = atgoCaps.slice(), prevSrc = atgoSource, prevConf = confirmar; const recibidos = [];
      atgoCaps = [...atgoCaps, 'editar', 'asignar', 'lote']; confirmar = async () => true;
      atgoSource = { closed: false, postMessage: (msg) => { recibidos.push(msg.type + ':' + (msg.items || []).length); setTimeout(() => (msg.items || []).forEach(it => recibirEdicion({ type: 'atgo-editado', id: it.id, key: it.key, accion: 'asignar', ok: true, fila: { operario: 'ACAB', fVisita: '20/10/2026' } })), 30); } };
      const ks = rows.filter(r => r.operario !== 'ACAB').slice(0, 3).map(r => r.key);
      const lr = await asignarLote(ks.map(k => ({ key: k, codOpe: 'ACAB', fechaVisita: '2026-10-20' })), 'Prueba');
      out.lote = recibidos.join() + ' · ' + (lr && lr.bien) + ' · ' + ks.every(k => ticketDe(k).operario === 'ACAB' && ticketDe(k).fVisita === '20/10/2026');
      atgoCaps = prevCaps; atgoSource = prevSrc; confirmar = prevConf; }
    out.errores = diagLista().map(d => d.msg);
    return out;
  }, payload);
  const esperado = { vacaciones: true, lote: 'despacho-editar-lote:3 · 3 · true', nomina: 69, bajaSelector: true, acento: '#0b8ad6', accesible: true, amplia: true, novedades: 6, sinNombre: 0, festivo: 'Fiesta Nacional', proxLab: '2026-10-13', viernesSanto: 'Viernes Santo', rellenar: true, contacto: true, sede: 4, misCambios: 1, sinCerrar: 1, olvidada: true, botonMisCambios: true, zonasDsp1: true, zonasDsp2: 0, ordenSin: '93,91,92', filtroDsp: 'DSP1', perfilDSP2: 16, perfilDSP5: 5, selectorCorto: true, selectorTodos: 70, filas: 6, sinAsignar: 1, avisoVersion: 'atgo', enCurso: 'c', marcadas: 1, buscador: true, duracion: true };
  for (const [k, v] of Object.entries(esperado)) if (r[k] !== v) errores.push(`${k}: esperado ${JSON.stringify(v)}, obtenido ${JSON.stringify(r[k])}`);
  for (const t of ['dia', 'sin', 'inc', 'sem', 'man']) if (!r['vista_' + t]) errores.push('La vista ' + t + ' está vacía');
  r.errores.forEach(e => errores.push('Diagnóstico: ' + e));

  // Casos límite: COORD (todos los técnicos, filtro por DSP) y un perfil vacío. Deben abrir todas las vistas sin errores.
  const escenario = async (nombre, perfiles) => {
    const c2 = await navegador.newContext({ serviceWorkers: 'block', viewport: { width: 1366, height: 768 } });
    await c2.addInitScript(([p, h, pf]) => {
      if (sessionStorage.getItem('prep')) return; sessionStorage.setItem('prep', '1');
      localStorage.clear();
      localStorage.setItem('dispatcher_atgo_v1', JSON.stringify(p)); localStorage.setItem('dispatcher_hilos_v1', JSON.stringify(h));
      localStorage.setItem('dispatcher_bienvenida_v1', '1'); localStorage.setItem('dispatcher_perfiles_v1', JSON.stringify(pf));
    }, [payload, hilos, perfiles]);
    const pg = await c2.newPage();
    pg.on('pageerror', e => errores.push(`${nombre} · error de página: ${e.message}`));
    await pg.goto(url + '#dia'); await pg.waitForTimeout(1200);
    const x = await pg.evaluate(async () => {
      const paso = ms => new Promise(r => setTimeout(r, ms)), o = { perfil: PERFIL, dsps: dspsDelPerfil().length, inicio: location.hash };
      for (const t of ['dia', 'sin', 'inc', 'sem', 'man']) { showTab(t); await paso(100); }
      for (const d of dspsDelPerfil()) { filtroInc.dsp = d; showTab('sem'); showTab('sin'); showTab('inc'); await paso(30); }
      filtroInc.dsp = ''; abrirPerfiles(); cerrarModal(); abrirMisCambios(); cerrarModal(); abrirSinCerrar(); cerrarModal();
      // COORD abre CONTROL (Mi día y Sin asignar no aplican); cada filtro de DSP y cada lista se pintan sin errores
      if (esCoord()) { showTab('ctl'); for (const v of ['pres', 'cad', 'hoy', 'ruta', 'todas']) for (const d of ['', 'DSP1', 'DSP2']) { ctl.dsp = d; ctlSet('vista', v); } ctl.dsp = ''; o.ctlKpis = document.querySelectorAll('#viewCtl .ctl-kpi').length; o.ctlPend = !!document.getElementById('ctlPend'); const c1 = (rows.find(r => r.descCliente && !/^XXX/.test(r.operario)) || {}).descCliente; if (c1) { ctlSet('cli', c1); o.ctlCliente = ctl.vista === 'todas' && document.querySelectorAll('#viewCtl .ctl-cols section:last-child tbody tr').length === ctlFiltradas().todas.length && ctlFiltradas().todas.length > 0; ctlSet('cli', ''); } }
      o.semVacia = /no tiene técnicos/.test((showTab('sem'), document.getElementById('viewSem').innerText));
      o.errores = diagLista().map(d => d.msg); return o;
    });
    await c2.close();
    x.errores.forEach(e => errores.push(`${nombre} · diagnóstico: ${e}`));
    return x;
  };
  const coord = await escenario('COORD', { activo: 'COORD', matriz1: true, tecs: {} });
  if (coord.perfil !== 'COORD' || coord.dsps !== 5 || coord.ctlKpis !== 5 || !coord.ctlPend || coord.ctlCliente === false || coord.inicio !== '#ctl') errores.push('COORD: ' + JSON.stringify(coord));
  const vacio = await escenario('Perfil vacío', { activo: 'DSP5', matriz1: true, tecs: { DSP1: [], DSP2: [], DSP3: [], DSP4: [], DSP5: [], COORD: [] } });
  if (vacio.perfil !== 'DSP5' || !vacio.semVacia) errores.push('Perfil vacío: ' + JSON.stringify(vacio));
  // Abrir la app directamente en cada pestaña (al arrancar, algunas funciones de ajustes.js aún no existen)
  for (const h of ['#sin', '#inc', '#sem', '#man']) {
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errores.push(`Arranque en ${h} · error de página: ${e.message}`));
    await pg.goto(url + h); await pg.waitForTimeout(900); await pg.close();
  }
} catch (e) {
  errores.push('No se pudo ejecutar la prueba: ' + e.message);
} finally {
  if (navegador) await navegador.close();
  server.close();
}
if (errores.length) { console.error('✕ Prueba de arranque:\n  ' + errores.join('\n  ')); process.exit(1); }
console.log('Prueba de arranque correcta');
