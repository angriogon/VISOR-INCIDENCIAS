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
    toggleCfg(); for (const t of ['gen', 'avi', 'wa', 'dat']) { cfgTab = t; renderCfg(); await paso(50); } document.getElementById('cfgMenu').hidden = true;
    abrirPerfiles('DSP2'); await paso(50); out.perfilDSP2 = document.querySelectorAll('#perfBox .pf-tec').length; perfSel = 'DSP5'; renderPerfiles(); out.perfilDSP5 = document.querySelectorAll('#perfBox .pf-tec').length; cerrarModal();
    showTab('sin'); sinFiltro = 'todas'; renderSin(); out.selectorTodos = document.querySelectorAll('#viewSin select option').length;
    showTab('sin'); sinMarcarTodas(true); out.marcadas = sinMarcadas().length;
    abrirNovedades(); cerrarModal(); abrirAtajos(); cerrarModal();
    openPalette(); document.getElementById('palInput').value = 'ceuta'; palRender(); out.buscador = palItems.length > 0; closePalette();
    out.coord = (resumenCoordHtml().match(/class="coord-card/g) || []).length;
    verDsp('DSP1'); await paso(150); out.filtroDsp = filtroInc.dsp; filtroInc.dsp = '';
    out.errores = diagLista().map(d => d.msg);
    return out;
  }, payload);
  const esperado = { coord: 5, filtroDsp: 'DSP1', perfilDSP2: 16, perfilDSP5: 5, selectorTodos: 70, filas: 6, sinAsignar: 1, avisoVersion: 'atgo', enCurso: 'c', marcadas: 1, buscador: true, duracion: true };
  for (const [k, v] of Object.entries(esperado)) if (r[k] !== v) errores.push(`${k}: esperado ${JSON.stringify(v)}, obtenido ${JSON.stringify(r[k])}`);
  for (const t of ['dia', 'sin', 'inc', 'sem', 'man']) if (!r['vista_' + t]) errores.push('La vista ' + t + ' está vacía');
  r.errores.forEach(e => errores.push('Diagnóstico: ' + e));
} catch (e) {
  errores.push('No se pudo ejecutar la prueba: ' + e.message);
} finally {
  if (navegador) await navegador.close();
  server.close();
}
if (errores.length) { console.error('✕ Prueba de arranque:\n  ' + errores.join('\n  ')); process.exit(1); }
console.log('Prueba de arranque correcta');
