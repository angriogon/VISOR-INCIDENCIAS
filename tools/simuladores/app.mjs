// Simula la app: página de ATGO con el agente «DespachoApp» y cargador.js inyectado como hace la WebView
import fs from 'node:fs'; import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url'; import path from 'node:path';
const AQUI = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(AQUI, '../..'), S = path.join(AQUI, 'salida'); fs.mkdirSync(S + '/cap', { recursive: true });
const lanzar = () => chromium.launch(process.platform === 'win32' ? { channel: 'chrome' } : {});   // Windows: Chrome instalado; Ubuntu: Chromium de Playwright
;
const cargador = fs.readFileSync(repo + '/android/assets/cargador.js', 'utf8'), codigo = fs.readFileSync(repo + '/movil.js', 'utf8'), firma = fs.readFileSync(repo + '/movil.firma.json', 'utf8');
const b = await lanzar();
const ctx = await b.newContext({ viewport: { width: 384, height: 832 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (Linux; Android 17; SM-A556B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/156.0.0.0 Mobile Safari/537.36 DespachoApp/1' });
const met = {};
await ctx.route(/.*/, r => {
  const u = new URL(r.request().url()), J = o => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
  if (u.hostname === 'angriogon.github.io') return r.fulfill({ status: 200, contentType: 'text/plain', headers: { 'access-control-allow-origin': '*' }, body: u.pathname.endsWith('.json') ? firma : codigo });
  if (u.hostname !== 'atgo.tier1.es') return r.abort();
  if (!u.pathname.startsWith('/api/')) return r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><body><p>ATGO</p></body>' });
  met[r.request().method()] = (met[r.request().method()] || 0) + 1;
  if (u.pathname.includes('/listado')) { const op = (u.searchParams.get('q') || '').split('codOpe.equals=')[1] || 'X'; return J({ last: true, content: op.startsWith('XXX') ? [] : [{ incidenciaId: { periodo: 2026, codSerie: '00', codInc: 300 + op.charCodeAt(0) }, codOpe: op, desEstado: 'PRESENCIAL', sedeDescripcion: 'SEDE ' + op }] }); }
  return J([]);
});
const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(e.message)); let alerta = null; pg.on('dialog', d => { alerta = d.message(); d.accept(); });
const inyecta = () => pg.evaluate(c => { (0, eval)(c); }, cargador);
await pg.goto('https://atgo.tier1.es/#/login'); await inyecta(); await pg.waitForTimeout(1500);
const r = {}; r.sinSesion = await pg.evaluate(() => [!!document.getElementById('despacho-movil'), !!document.getElementById('despacho-boton')]);
// Inicia sesión (como hace ATGO, sin recargar la página)
await pg.evaluate(() => { localStorage.setItem('token', JSON.stringify('simulado')); localStorage.setItem('expires', String(Math.floor(Date.now() / 1000) + 7200)); localStorage.setItem('codigoOperario', 'AMRG'); location.hash = '#/dashboard'; });
await pg.waitForFunction(() => !!document.getElementById('despacho-movil'), null, { timeout: 8000 }); r.abreSolo = true;
await inyecta(); await pg.waitForTimeout(1200); r.unaSola = await pg.evaluate(() => document.querySelectorAll('#despacho-movil').length);
const sr = fn => pg.evaluate(f => new Function('r', 'return (' + f + ')(r)')(document.getElementById('despacho-movil').shadowRoot), fn.toString());
await pg.waitForFunction(() => /Datos de las/.test(document.getElementById('despacho-movil').shadowRoot.getElementById('est').textContent), null, { timeout: 15000 });
// Abrir en ATGO desde una ficha: se oculta Despacho, cambia la página y aparece el botón para volver
await sr(r => r.querySelectorAll('nav button')[2].click()); await pg.waitForTimeout(100); await sr(r => r.querySelector('[data-a=plg]').click()); await pg.waitForTimeout(100);
await sr(r => r.querySelectorAll('[data-a=tecinc]')[0].click()); await pg.waitForTimeout(100); await sr(r => r.querySelector('.c').click()); await pg.waitForTimeout(300);
r.botonAtgo = await sr(r => !!r.querySelector('.acc button[data-a=atgo]'));
await sr(r => r.querySelector('.acc button[data-a=atgo]').click()); await pg.waitForTimeout(1300);
r.trasAtgo = await pg.evaluate(() => [location.hash, document.getElementById('despacho-movil').style.display, !!document.getElementById('despacho-boton')]);
await pg.click('#despacho-boton'); await pg.waitForTimeout(1300); r.volver = await pg.evaluate(() => [document.getElementById('despacho-movil').style.display, !!document.getElementById('despacho-boton')]);
// Volver a ATGO desde el menú: se cierra y queda el botón; al pulsarlo se abre de nuevo
await sr(r => r.querySelector('[data-a=menu]').click()); await pg.waitForTimeout(80); await sr(r => r.querySelector('[data-a=salir]').click()); await pg.waitForTimeout(1300);
r.salir = await pg.evaluate(() => [!!document.getElementById('despacho-movil'), !!document.getElementById('despacho-boton')]);
await pg.click('#despacho-boton'); await pg.waitForFunction(() => !!document.getElementById('despacho-movil'), null, { timeout: 8000 }); r.reabrir = true;
await pg.screenshot({ path: S + '/cap/app.png' });
console.log(JSON.stringify(r), JSON.stringify(met), 'alerta', alerta, errs.length ? 'ERR ' + errs.join('|') : 'sin errores');
await b.close();
