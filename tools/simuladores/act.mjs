// Pestaña Actividad contra ATGO simulado, lanzada con el favorito definitivo
import fs from 'node:fs'; import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url'; import path from 'node:path';
const AQUI = path.dirname(fileURLToPath(import.meta.url)), repo = path.resolve(AQUI, '../..'), S = path.join(AQUI, 'salida'); fs.mkdirSync(S + '/cap', { recursive: true });
const lanzar = () => chromium.launch(process.platform === 'win32' ? { channel: 'chrome' } : {});   // Windows: Chrome instalado; Ubuntu: Chromium de Playwright
;
const fav = fs.readFileSync(repo + '/tools/movil/favorito.txt', 'utf8').trim(), codigo = fs.readFileSync(repo + '/movil.js', 'utf8'), firma = fs.readFileSync(repo + '/movil.firma.json', 'utf8');
const h = (hh, mm) => { const d = new Date(); d.setHours(hh, mm, 0, 0); return d; }, isoZ = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().replace('Z', '+0000');   // como ATGO: hora de España marcada como UTC
const b = await lanzar();
for (const [tema, ancho] of [['light', 384], ['dark', 360], ['light', 320]]) {
  const ctx = await b.newContext({ viewport: { width: ancho, height: 832 }, isMobile: true, hasTouch: true, colorScheme: tema });
  const met = {}, consultas = [];
  await ctx.route(/.*/, r => {
    const u = new URL(r.request().url()), J = o => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (u.hostname === 'angriogon.github.io') return r.fulfill({ status: 200, contentType: 'text/plain', headers: { 'access-control-allow-origin': '*' }, body: u.pathname.endsWith('.json') ? firma : codigo });
    if (u.hostname !== 'atgo.tier1.es') return r.abort();
    if (!u.pathname.startsWith('/api/')) return r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><body>ATGO</body>' });
    met[r.request().method()] = (met[r.request().method()] || 0) + 1;
    const q = u.searchParams.get('q') || '', op = (q.split('codOpe.equals=')[1] || '').split(',')[0];
    if (u.pathname.includes('/listado') && q.includes('fechaCierre')) { consultas.push(op); return J({ last: true, content: op === 'ACAB' ? [{ incidenciaId: { periodo: 2026, codSerie: '00', codInc: 901 }, codOpe: 'ACAB', desEstado: 'CERRADO', sedeDescripcion: 'SEDE CERRADA CON MENSAJE', fechaCierre: isoZ(h(15, 6)) }, { incidenciaId: { periodo: 2026, codSerie: '00', codInc: 902 }, codOpe: 'ACAB', desEstado: 'CERRADO', sedeDescripcion: 'SEDE SIN MENSAJE', fechaCierre: isoZ(h(14, 30)) }] : [] }); }
    if (u.pathname.includes('/listado')) return J({ last: true, content: op && !op.startsWith('XXX') && ['DSG', 'JVR'].includes(op) ? [{ incidenciaId: { periodo: 2026, codSerie: '00', codInc: op === 'DSG' ? 801 : 802 }, codOpe: op, desEstado: 'PTE. MOVER MATERIAL', sedeDescripcion: 'SEDE ' + op }] : [] });
    if (u.pathname.includes('/hilo/')) {
      const c = +u.pathname.split('/').pop(), m = (hh, mm, u2, t) => ({ hiloIncidenciaId: { fechaRegistro: isoZ(h(hh, mm)) }, usuario: u2, descripcion: t });
      if (c === 901) return J([m(15, 5, 'ACAB', 'El ticket ha cambiado del estado PRESENCIAL al estado CERRADO')]);
      if (c === 902) return J([m(9, 0, 'X', 'Comentario cualquiera')]);
      if (c === 801) return J([m(15, 30, 'DSG', 'El ticket ha cambiado del estado PRESENCIAL al estado PTE. MOVER MATERIAL'), m(18, 30, 'AMRG', 'El ticket ha cambiado del estado PTE. MOVER MATERIAL al estado PRESENCIAL')]);
      if (c === 802) return J([m(14, 10, 'ADMIN', 'El ticket ha cambiado del estado CREADO al estado PTE. MOVER MATERIAL')]);
      return J([]);
    }
    return J([]);
  });
  await ctx.addInitScript(() => { try { localStorage.setItem('token', JSON.stringify('simulado')); localStorage.setItem('expires', String(Math.floor(Date.now() / 1000) + 7200)); localStorage.setItem('codigoOperario', 'AMRG'); } catch (e) {} });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('dialog', d => d.accept());
  await pg.goto('https://atgo.tier1.es/#/x'); await pg.evaluate(u => { location.href = u; }, fav);
  await pg.waitForFunction(() => { const x = document.getElementById('despacho-movil'); return x && /Datos de las/.test(x.shadowRoot.getElementById('est').textContent); }, null, { timeout: 20000 });
  const sr = (fn, a) => pg.evaluate(([f, a]) => new Function('r', 'a', 'return (' + f + ')(r,a)')(document.getElementById('despacho-movil').shadowRoot, a), [fn.toString(), a]);
  const lee = () => sr(r => ({ res: r.querySelector('.res2') && r.querySelector('.res2').textContent.trim(), lineas: [...r.querySelectorAll('.ev')].map(e => e.textContent.replace(/\s+/g, ' ').trim()), tecs: [...r.querySelectorAll('.atn')].map(e => e.textContent.replace(/\s+/g, ' ').trim()) }));
  const res = {};
  await sr(r => [...r.querySelectorAll('nav button')].find(x => x.dataset.v === 'act').click());
  await pg.waitForFunction(() => !/Cargando cierres/.test(document.getElementById('despacho-movil').shadowRoot.getElementById('v').textContent), null, { timeout: 15000 }); await pg.waitForTimeout(200);
  res.consultasCierres = consultas.length; res.f1416 = await lee(); await pg.screenshot({ path: S + '/cap/act-' + tema + ancho + '.png' });
  await sr(r => { const s = r.querySelector('[data-c=franja]'); s.value = '1'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await pg.waitForTimeout(80); res.f1819 = await lee();
  await sr(r => { const s = r.querySelector('[data-c=franja]'); s.value = '2'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await pg.waitForTimeout(80); res.todo = (await lee()).res;
  await sr(r => r.querySelector('[data-a=tipoact][data-v=c]').click()); await pg.waitForTimeout(60); res.soloCierres = (await lee()).res; await sr(r => r.querySelector('[data-a=tipoact][data-v=""]').click());
  await sr(r => r.querySelector('[data-a=campana][data-v=ACAB]').click()); await pg.waitForTimeout(60); res.sinACAB = (await lee()); await sr(r => r.querySelector('[data-a=campana][data-v=ACAB]').click());
  await sr(r => r.querySelector('[data-a=tecact][data-v=DSG]').click()); await pg.waitForTimeout(60); res.soloDSG = (await lee()).res; await sr(r => r.querySelector('[data-a=tecact][data-v=DSG]').click());
  // Ficha de una cerrada (no está en la lista de abiertas)
  await sr(r => [...r.querySelectorAll('.ev')].find(e => /SIN MENSAJE/.test(e.textContent)).click()); await pg.waitForTimeout(300);
  res.fichaCerrada = await sr(r => !r.getElementById('fi').hidden && /SEDE SIN MENSAJE/.test(r.getElementById('fi').textContent)); await pg.goBack(); await pg.waitForTimeout(100);
  // Franjas editables y guardadas
  await sr(r => r.querySelector('[data-a=franjas]').click()); await pg.waitForTimeout(60);
  await sr(r => { const i = r.querySelector('[data-f="0-1"]'); i.value = '17:00'; }); await sr(r => r.querySelector('[data-a=guardafr]').click()); await pg.waitForTimeout(60);
  res.franjaNueva = await sr(r => [...r.querySelector('[data-c=franja]').options].map(o => o.textContent)); res.prefs = await pg.evaluate(() => localStorage.getItem('despachoMovilActividad_v1'));
  res.menuSinPrueba = await sr(r => { r.querySelector('[data-a=menu]').click(); return !r.querySelector('[data-a=pruebaact]'); });
  res.medida = await sr(r => ({ ancho: innerWidth, fuera: [...r.querySelectorAll('*')].filter(e => { const x = e.getBoundingClientRect(); return x.width && (x.right > innerWidth + 1 || (e.scrollWidth > e.clientWidth + 1 && e.matches('button,select,.res2'))); }).length, nav: [...r.querySelectorAll('nav button')].map(b => Math.round(b.getBoundingClientRect().height)) }));
  console.log('===', tema, JSON.stringify(res), JSON.stringify(met), errs.length ? 'ERR ' + errs.join('|') : 'sin errores');
  await ctx.close();
}
await b.close();
