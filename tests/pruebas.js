// Pruebas automáticas de Despacho (sin dependencias): node tests/pruebas.js
// Extraen funciones puras de los scripts de la app y las prueban con textos reales de ATGO.
const fs = require('fs'), path = require('path'), vm = require('vm');
const raiz = path.join(__dirname, '..');
const leer = f => fs.readFileSync(path.join(raiz, f), 'utf8');

// Saca del código fuente una función o constante de nivel superior (hasta cerrar sus llaves/corchetes)
function extraer(src, cab) {
  const i = src.indexOf(cab); if (i < 0) throw new Error('No encuentro: ' + cab);
  let j = src.indexOf(cab.startsWith('function') ? '{' : '=', i), prof = 0, k = j, cad = null;
  if (!cab.startsWith('function')) { const fin = src.indexOf(';\n', i); return src.slice(i, fin + 1); }
  for (; k < src.length; k++) {
    const c = src[k];
    if (cad) { if (c === '\\') { k++; continue; } if (c === cad) cad = null; continue; }
    if (c === '"' || c === "'" || c === '`') { cad = c; continue; }
    if (c === '/' && src[k + 1] === '/') { k = src.indexOf('\n', k); continue; }
    if (c === '{') prof++;
    if (c === '}' && --prof === 0) break;
  }
  return src.slice(i, k + 1);
}
const app = leer('app.js'), panel = leer('panel.js'), herr = leer('herramientas.js');
const codigo = [
  extraer(app, 'function norm('),
  extraer(panel, 'const DUR_CTX'), extraer(panel, 'const NUM_PAL'), extraer(panel, 'function minutosTexto('),
  extraer(herr, 'const MESES'), extraer(herr, 'const CAD_RE'), extraer(herr, 'function fechasEnTexto(')
].join('\n');
const ctx = {}; vm.createContext(ctx); vm.runInContext(codigo, ctx);

let ok = 0, ko = 0;
function igual(nombre, obtenido, esperado) {
  if (JSON.stringify(obtenido) === JSON.stringify(esperado)) ok++;
  else { ko++; console.error('✕ ' + nombre + '\n   esperado: ' + JSON.stringify(esperado) + '\n   obtenido: ' + JSON.stringify(obtenido)); }
}

// ---- Duración de la visita leída del hilo (minutos o null) ----
const dur = t => ctx.minutosTexto(t);
igual('franja de despliegue', dur('- Enviar a técnico presencial 8 equipos HP MAQUETADOS. - Horario de despliegue de 7 a 15 horas. - También actualizar inventario'), 480);
igual('franja con minutos', dur('Intervención de 9:00 a 11:30 en tienda'), 150);
igual('duración estimada', dur('Duración estimada de la intervención: 2 h'), 120);
igual('palabras', dur('El trabajo requiere unas tres horas'), 180);
igual('media hora', dur('Se prevé media hora de trabajo'), 30);
igual('jornada completa', dur('Montaje de jornada completa'), 480);
igual('hora del día no es duración', dur('Llegó a la instalación a las 10:00 horas y a las 10:40 cae masivamente la fibra'), null);
igual('a las 9 horas no es duración', dur('La instalación empieza a las 9 horas'), null);
igual('llamar en 15 minutos', dur('Llamamos al 675575194 y nos indica que llamemos en 15 minutos'), null);
igual('metros no son horas', dur('Solicitamos cable DVI a VGA de 3 a 5 metros'), null);
igual('caducidad no es duración', dur('CAMBIO CADUCIDAD: ANTES: 07/10/2026 23:59:59 AHORA: 13/10/2026 23:59:59 CAMBIO DE SEVERIDAD DE 7 A 3'), null);
igual('sin datos', dur('Revisamos.'), null);

// ---- Caducidad: formato real de ATGO ("de X a Y": manda la última fecha) ----
const ref = new Date(2026, 9, 6, 12, 35).getTime();
const f = ctx.fechasEnTexto('CAMBIO CADUCIDAD: ANTES: 07/10/2026 23:59:59 AHORA: 13/10/2026 23:59:59 CAMBIO DE SEVERIDAD DE 7 A 3', ref);
const ult = f[f.length - 1], d = new Date(ult.ts);
igual('caducidad real: última fecha', [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()], [2026, 10, 13, 23, 59]);
igual('caducidad real: detecta palabra clave', vm.runInContext('CAD_RE', ctx).test('CAMBIO CADUCIDAD: ANTES'), true);
const g = ctx.fechasEnTexto('Caduca el 15 de octubre a las 14:00', ref), dg = new Date(g[g.length - 1].ts);
igual('caducidad con mes en letra', [dg.getMonth() + 1, dg.getDate(), dg.getHours()], [10, 15, 14]);

// ---- Coherencia de configuración ----
const opsSync = (leer('atgo-sync.js').match(/const OPERARIOS = \[([^\]]*)\]/) || [])[1].match(/'([A-Z]+)'/g).map(s => s.slice(1, -1)).sort();
const zb = app.slice(app.indexOf('const ZONAS_BASE'), app.indexOf('];', app.indexOf('const ZONAS_BASE')));
const opsApp = [...new Set([...zb.matchAll(/ops:\[([^\]]*)\]/g)].flatMap(m => m[1].match(/'([A-Z]+)'/g).map(s => s.slice(1, -1))))].sort();
igual('ZONAS_BASE (app.js) = OPERARIOS (atgo-sync.js)', opsApp, opsSync);
const shell = leer('sw.js'), html = leer('index.html');
[...html.matchAll(/<script src="([a-z-]+\.js)"/g)].map(m => m[1]).forEach(js => igual('SHELL incluye ' + js, shell.includes("'./" + js + "'"), true));
const vSw = (shell.match(/despacho-v([\d.]+)/) || [])[1], vApp = (leer('ajustes.js').match(/APP_VERSION = '([\d.]+)'/) || [])[1];
igual('APP_VERSION (ajustes.js) = VERSION (sw.js)', vApp, vSw);

console.log(`${ok} correctas, ${ko} fallidas`);
process.exit(ko ? 1 : 0);
