// 1.4.0: asignar desde el móvil, restauración si ATGO cambia algo más, carga rápida, novedades y urgentes
import fs from 'node:fs'; import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url'; import path from 'node:path';
const AQUI = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(AQUI, '../..'), S = path.join(AQUI, 'salida'); fs.mkdirSync(S + '/cap', { recursive: true });
const lanzar = () => chromium.launch(process.platform === 'win32' ? { channel: 'chrome' } : {});   // Windows: Chrome instalado; Ubuntu: Chromium de Playwright
;
const fav = fs.readFileSync(repo + '/tools/movil/favorito.txt', 'utf8').trim(), codigo = fs.readFileSync(repo + '/movil.js', 'utf8'), firma = fs.readFileSync(repo + '/movil.firma.json', 'utf8');
const h = (hh, mm) => { const d = new Date(); d.setHours(hh, mm, 0, 0); return d; }, isoZ = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().replace('Z', '+0000');   // como ATGO: hora de España marcada como UTC
const pad = n => String(n).padStart(2, '0'), es = d => pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':00';
const ancho = +(process.argv[2] || 384), tema = process.argv[3] || 'light';
const b = await lanzar();
const ctx = await b.newContext({ viewport: { width: ancho, height: 832 }, isMobile: true, hasTouch: true, colorScheme: tema });
const fichas = {}, ficha = (c, op, extra) => (fichas['2026/00/' + c] = { incidenciaId: { periodo: 2026, codSerie: '00', codInc: c }, codOpe: op, desOpe: op.startsWith('XXX') ? 'PENDIENTE ASIGNAR SEVILLA' : 'APELLIDO, ' + op, estado: 10, desEstado: 'PRESENCIAL', domicilio: 'CALLE ' + c, provincia: 'SEVILLA', fechaVisita: null, horaInicioVisita: null, horaFinVisita: null, sedeDescripcion: 'SEDE ' + c, ...extra });
ficha(701, 'XXX-SVQ'); ficha(702, 'XXX-SVQ'); ficha(703, 'XXX-SVQ'); ficha(801, 'DSG', { desEstado: 'PTE. MOVER MATERIAL', estado: 20 }); ficha(802, 'JVR', { desEstado: 'PTE. MOVER MATERIAL', estado: 20 });
let con704 = false, msgAhora = null, put703 = 0; const cuenta = { tec: 0, pool: 0, cierres: 0, put: 0 };
const fila = f => ({ ...f, codOpe: f.codOpe, sedeDescripcion: f.sedeDescripcion });
await ctx.route(/.*/, async r => {
  const u = new URL(r.request().url()), J = o => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) }), M = r.request().method();
  if (u.hostname === 'angriogon.github.io') return r.fulfill({ status: 200, contentType: 'text/plain', headers: { 'access-control-allow-origin': '*' }, body: u.pathname.endsWith('.json') ? firma : codigo });
  if (u.hostname !== 'atgo.tier1.es') return r.abort();
  if (!u.pathname.startsWith('/api/')) return r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><body>ATGO</body>' });
  const q = u.searchParams.get('q') || '', op = (q.split('codOpe.equals=')[1] || '').split(',')[0];
  const mF = /\/incidencias\/(\d+)\/(\w+)\/(\d+)$/.exec(u.pathname);
  if (mF && M === 'PUT') {
    cuenta.put++; const f = fichas[mF[1] + '/' + mF[2] + '/' + mF[3]], g = k => { const v = u.searchParams.get(k); return v === 'null' || v === '' ? null : v; };
    f.codOpe = g('codOpe'); f.desOpe = f.codOpe.startsWith('XXX') ? 'PENDIENTE ASIGNAR SEVILLA' : 'APELLIDO, ' + f.codOpe; f.fechaVisita = g('fechaVisita') ? g('fechaVisita') + 'T00:00:00Z' : null; f.horaInicioVisita = g('inicioVisita'); f.horaFinVisita = g('finVisita'); f.domicilio = g('domicilio');
    if (mF[3] === '703' && ++put703 === 1) f.domicilio = 'CAMBIADA POR ATGO';
    return r.fulfill({ status: 200, body: '' });
  }
  if (M !== 'GET') return r.fulfill({ status: 405, body: '' });
  if (mF) return J(fichas[mF[1] + '/' + mF[2] + '/' + mF[3]]);
  if (u.pathname.endsWith('/operario')) return J([{ codOpe: 'XXX-SVQ', desOpe: 'PENDIENTE ASIGNAR SEVILLA' }]);
  if (u.pathname.includes('/listado') && q.includes('fechaCierre')) { cuenta.cierres++; return J({ last: true, content: [] }); }
  if (u.pathname.includes('/listado')) {
    if (op.startsWith('XXX')) { cuenta.pool++; return J({ last: true, content: Object.values(fichas).filter(f => f.codOpe === op && (con704 || f.incidenciaId.codInc !== 704)).map(fila) }); }
    cuenta.tec++; return J({ last: true, content: Object.values(fichas).filter(f => f.codOpe === op).map(fila) });
  }
  if (u.pathname.includes('/hilo/')) {
    const c = +u.pathname.split('/').pop(), m = (d, u2, t) => ({ hiloIncidenciaId: { fechaRegistro: isoZ(d) }, usuario: u2, descripcion: t });
    if (c === 701) { const a = new Date(Date.now() - 86400000), n = new Date(Date.now() + 2 * 3600000); return J([m(h(8, 0), 'X', 'CAMBIO CADUCIDAD: ANTES: ' + es(a) + ' AHORA: ' + es(n))]); }
    if (c === 801) return J([m(h(9, 30), 'DSG', 'El ticket ha cambiado del estado PRESENCIAL al estado PTE. MOVER MATERIAL'), ...(msgAhora ? [m(msgAhora, 'DSG', 'El ticket ha cambiado del estado PTE. MOVER MATERIAL al estado PRESENCIAL')] : [])]);
    return J([]);
  }
  return J([]);
});
await ctx.addInitScript(() => { try { localStorage.setItem('token', JSON.stringify('simulado')); localStorage.setItem('expires', String(Math.floor(Date.now() / 1000) + 7200)); localStorage.setItem('codigoOperario', 'AMRG'); if (!localStorage.getItem('despachoMovilActividad_v1')) localStorage.setItem('despachoMovilActividad_v1', JSON.stringify({ modo: 'completa' })); } catch (e) {} });
const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('dialog', d => d.accept());
await pg.goto('https://atgo.tier1.es/#/x'); await pg.evaluate(u => { location.href = u; }, fav);
const listo = () => pg.waitForFunction(() => { const x = document.getElementById('despacho-movil'); return x && /Datos de las/.test(x.shadowRoot.getElementById('est').textContent); }, null, { timeout: 20000 });
await listo();
const sr = (fn, a) => pg.evaluate(([f, a]) => new Function('r', 'a', 'return (' + f + ')(r,a)')(document.getElementById('despacho-movil').shadowRoot, a), [fn.toString(), a]);
const clic = sel => sr((r, s) => { const e = r.querySelector(s); if (!e) throw new Error('no está ' + s); e.click(); }, sel);
const txt = sel => sr((r, s) => { const e = r.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);
const esperaMe = re => pg.waitForFunction(s => new RegExp(s).test(document.getElementById('despacho-movil').shadowRoot.getElementById('me').textContent), re, { timeout: 10000 });
const res = {};
await clic('nav [data-v=sin]'); await pg.waitForTimeout(100);
res.sin = await sr(r => ({ urgentes: r.querySelector('h2.hu') && r.querySelector('h2.hu').textContent, primera: r.querySelector('.cw .n').textContent, botones: r.querySelectorAll('.asg').length, nuevas: r.querySelectorAll('.nv').length }));
await pg.screenshot({ path: S + '/cap/sin-' + ancho + tema + '.png' });
// Asignar 701 a DSG con fecha
await clic('.asg[data-k="2026/00/701"]'); await pg.waitForTimeout(80);
res.hojaTec = await sr(r => ({ primeraZona: r.querySelector('#me .sub').textContent, tecs: r.querySelectorAll('#me [data-a=eligetec]').length }));
await pg.screenshot({ path: S + '/cap/tec-' + ancho + tema + '.png' });
await clic('#me [data-a=eligetec][data-v=DSG]'); await pg.waitForTimeout(80);
await sr(r => { r.getElementById('af').value = '2026-11-12'; r.getElementById('ah1').value = '09:00'; r.getElementById('ah2').value = '11:00'; });
await pg.screenshot({ path: S + '/cap/conf-' + ancho + tema + '.png' });
await clic('#me [data-a=confasig]'); await esperaMe('Hecho|No se ha'); res.asig701 = await txt('#me .hoja'); res.ficha701 = JSON.stringify([fichas['2026/00/701'].codOpe, fichas['2026/00/701'].fechaVisita, fichas['2026/00/701'].horaInicioVisita, fichas['2026/00/701'].horaFinVisita]);
await clic('#me [data-a=cmenu]'); await pg.waitForTimeout(80);
res.sinTras = await sr(r => [...r.querySelectorAll('.cw .n')].map(e => e.textContent));
// 703: ATGO cambia también el domicilio → se deja como estaba
await clic('.asg[data-k="2026/00/703"]'); await pg.waitForTimeout(60); await clic('#me [data-a=eligetec][data-v=JVR]'); await pg.waitForTimeout(60); await clic('#me [data-a=confasig]'); await esperaMe('Hecho|No se ha');
res.asig703 = await txt('#me .hoja'); res.ficha703 = JSON.stringify([fichas['2026/00/703'].codOpe, fichas['2026/00/703'].domicilio]); await clic('#me [data-a=cmenu]');
// Ficha de 802: nada que cambiar
await clic('nav [data-v=inc]'); await pg.waitForTimeout(80); await clic('[data-a=plg][data-v=""]'); await pg.waitForTimeout(80);
await clic('.c[data-k="2026/00/802"]'); await pg.waitForTimeout(250); res.botonFicha = await txt('#fi .acc .prim');
await clic('#fi [data-a=asignar]'); await pg.waitForTimeout(60); await clic('#me [data-a=eligetec][data-v=JVR]'); await pg.waitForTimeout(60); await clic('#me [data-a=confasig]'); await pg.waitForTimeout(100);
res.nada = await txt('#ares'); await clic('#me [data-a=cmenu]'); await pg.goBack(); await pg.waitForTimeout(100);
res.inc701 = await sr(r => !!r.querySelector('.c[data-k="2026/00/701"]'));
res.puts = cuenta.put;
// Carga rápida
await clic('[data-a=menu]'); await pg.waitForTimeout(60); await clic('#me [data-a=modo][data-v=rapida]'); await pg.waitForTimeout(60); await clic('#me [data-a=cmenu]');
await clic('nav [data-v=hoy]'); await pg.waitForTimeout(60);
ficha(704, 'XXX-SVQ'); con704 = true; msgAhora = new Date();
const antes = { ...cuenta }; await clic('[data-a=cargar]'); await pg.waitForTimeout(400); await listo(); await pg.waitForTimeout(1500);
res.rapida = { tec: cuenta.tec - antes.tec, pool: cuenta.pool - antes.pool, cierres: cuenta.cierres - antes.cierres, est: await txt('#est'), nota: await txt('.nota span') };
res.badges = await sr(r => [r.getElementById('bSin').hidden ? '-' : r.getElementById('bSin').textContent, r.getElementById('bAct').hidden ? '-' : r.getElementById('bAct').textContent]);
await pg.screenshot({ path: S + '/cap/rapida-' + ancho + tema + '.png' });
await clic('nav [data-v=sin]'); await pg.waitForTimeout(100); res.sinNueva = await sr(r => [...r.querySelectorAll('.cw')].filter(c => c.querySelector('.nv')).map(c => c.querySelector('.n').textContent));
await clic('nav [data-v=act]'); await pg.waitForTimeout(300); res.actNuevo = await sr(r => r.querySelectorAll('.ev .nv').length); res.notaFranja = await txt('.nota'); await pg.screenshot({ path: S + '/cap/act-' + ancho + tema + '.png' });
await clic('[data-a=vertodo]'); await pg.waitForTimeout(80); res.actNuevoTodo = await sr(r => r.querySelectorAll('.ev .nv').length);
await clic('nav [data-v=hoy]'); await pg.waitForTimeout(80);
res.badgesTras = await sr(r => [r.getElementById('bSin').hidden ? '-' : r.getElementById('bSin').textContent, r.getElementById('bAct').hidden ? '-' : r.getElementById('bAct').textContent]);
// Completa a mano
const a2 = { ...cuenta }; await clic('.nota [data-a=completa]'); await pg.waitForTimeout(400); await listo(); res.completa = { tec: cuenta.tec - a2.tec, nota: await txt('.nota') };
res.medida = await sr(r => [...r.querySelectorAll('*')].filter(e => { const x = e.getBoundingClientRect(); return x.width && x.right > innerWidth + 1; }).length);
await clic('[data-a=menu]'); await pg.waitForTimeout(60); await pg.screenshot({ path: S + '/cap/menu-' + ancho + tema + '.png' });
res.menuFuera = await sr(r => [...r.querySelectorAll('#me *')].filter(e => { const x = e.getBoundingClientRect(); return x.width && x.right > innerWidth + 1; }).length);
console.log(ancho, tema, JSON.stringify(res, null, 1), errs.length ? 'ERR ' + errs.join('|') : 'sin errores');
await b.close();
