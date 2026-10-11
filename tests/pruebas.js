// Pruebas automáticas de Despacho (sin dependencias): node tests/pruebas.js
// Extraen funciones puras de los scripts de la app y las prueban con textos reales de ATGO.
const fs = require('fs'), path = require('path'), vm = require('vm');
const raiz = path.join(__dirname, '..');
const leer = f => fs.readFileSync(path.join(raiz, f), 'utf8');

// Saca del código fuente una función o constante de nivel superior (hasta cerrar sus llaves/corchetes)
function extraer(src, cab) {
  const i = src.indexOf(cab); if (i < 0) throw new Error('No encuentro: ' + cab);
  let j = src.indexOf(cab.startsWith('function') ? '{' : '=', i), prof = 0, k = j, cad = null;
  if (!cab.startsWith('function')) { const m = /;\r?\n/.exec(src.slice(i)); return src.slice(i, i + m.index + 1); }
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

// ---- Guardado en ATGO: la ficha se reenvía igual cambiando solo lo pedido ----
const sync = leer('atgo-sync.js');
const cs = {}; vm.createContext(cs);
vm.runInContext([extraer(sync, 'function urlGuardado('), extraer(sync, 'const CAMPOS_SISTEMA'), extraer(sync, 'function compararFichas(')].join('\n'), cs);
const ficha = { incidenciaId: { periodo: 2026, codSerie: '00', codInc: 97784 }, estado: 10, codArt: null, tieneGarantia: 'N', fechaGarantia: null, codElemento: '2003060', codOpe: 'AMRG',
  fechaVisita: '2026-10-08T00:00:00Z', horaInicioVisita: '20:50', horaFinVisita: null, codSeveridad: '3', codTipoEle: 'BT', codDivision: '01', suReferencia: 'Ref #12 & más', codCli: '430', desCli: 'CONSORCIO "PUNTOS" VUELA',
  domicilio: 'C/ Gijón 1', poblacion: 'ALMERIA', provincia: 'Almeria', cp: '04001', telefono: '600', email: 'a@b.es', cif: 'A1', idSede: 77, datosRecepcion: null, numProy: null, codAct: null };
const qs = u => Object.fromEntries(u.split('?')[1].split('&').map(p => { const i = p.indexOf('='); return [p.slice(0, i), decodeURIComponent(p.slice(i + 1))]; }));
const sinCambios = qs(cs.urlGuardado(ficha, {})), conCambios = qs(cs.urlGuardado(ficha, { codOpe: 'DSG', fechaVisita: '2026-10-13' }));
igual('guardado: ruta del ticket', cs.urlGuardado(ficha, {}).split('?')[0], '/api/v1/atgo/incidencias/2026/00/97784');
igual('guardado: caracteres especiales intactos', [sinCambios.suReferencia, sinCambios.desCli], ['Ref #12 & más', 'CONSORCIO "PUNTOS" VUELA']);
igual('guardado: cambia solo técnico y fecha', Object.keys(conCambios).filter(k => conCambios[k] !== sinCambios[k]).sort(), ['codOpe', 'fechaVisita']);
igual('guardado: valores nuevos', [conCambios.codOpe, conCambios.fechaVisita], ['DSG', '2026-10-13']);
igual('guardado: nulos como "null"', [sinCambios.finVisita, sinCambios.datosRecepcion, sinCambios.docCompra], ['null', 'null', 'null']);
igual('comprobación: ignora campos de sistema', Object.keys(cs.compararFichas({ ...ficha, usuario: 'X', virtualOrderAsc: 1 }, { ...ficha, usuario: 'Y', virtualOrderAsc: 2 })), []);
igual('comprobación: detecta un cambio inesperado', Object.keys(cs.compararFichas(ficha, { ...ficha, cp: '04002' })), ['cp']);

// ---- Técnico recomendado, misma sede, zonas de apoyo y conflictos ----
const dia = leer('dia.js');
const cr = { console }; vm.createContext(cr);
vm.runInContext([
  extraer(app, 'function norm('), extraer(app, 'function cleanInitials('), extraer(app, 'const ZONAS_BASE'),
  "const ZONAS = ZONAS_BASE; const ZONAS_TEC = ZONAS.filter(z => !z.dispatcher); const TECNICOS = ZONAS_TEC.flatMap(z => z.ops); const OPERARIOS = ZONAS.flatMap(z => z.ops);",
  extraer(app, 'function zonaOps('), extraer(app, 'function zonaDe('), extraer(app, 'function opIndex('), extraer(app, 'function esPresencial('), extraer(app, 'function horaMin('), extraer(app, 'function sortByHora('), extraer(app, 'function ddmmyyyy('),
  extraer(dia, 'function tkey('), extraer(dia, 'const ESTADOS_CIERRE'), extraer(dia, 'function esCierre('),
  extraer(herr, 'const PROV_ZONA'), extraer(herr, 'function zonaTicket('), extraer(herr, 'function poblacionDe('),
  extraer(panel, 'const POOL_ZONA'), extraer(panel, 'function zonaPool('), extraer(panel, 'function sedeKey('), extraer(panel, 'function mismaSede('), extraer(panel, 'function recomendar('), extraer(panel, 'function conflictos('), extraer(panel, 'function fmtMin('),
  "let rows = [], poolOpsDesc = {}, duracionFija = {}; const JORNADA_MIN = 480; const tecCfg = {}; function cargaMin() { return 0; } function estimarMin(r) { return duracionFija[r.key] || null; }"
].join('\n'), cr);
const T = (key, op, sede, extra) => ({ key, num: key.replace(/\//g, ''), operario: op, estado: 'PRESENCIAL', descSede: sede, descCliente: 'CARREFOUR', provincia: 'CEUTA', poblacion: 'CEUTA', fVisita: '', ...(extra || {}) });
vm.runInContext('rows = ' + JSON.stringify([T('1/00/1', 'EACL', '4416-Ceuta-Hiper'), T('1/00/2', 'JIFC', 'Otra sede')]), cr);
const pool = T('1/00/9', 'XXX-0CEUTA', '4416-Ceuta-Hiper');
igual('misma sede: detecta al técnico que ya va', JSON.stringify(cr.mismaSede(pool)), JSON.stringify({ EACL: 1 }));
const rec = cr.recomendar(pool, new Date(2026, 9, 13, 12));
igual('recomendado: el de la misma sede va primero', rec[0].op, 'EACL');
igual('Ceuta: admite apoyo de Cádiz', ['DSJ', 'AAR', 'EACL', 'JRHG'].every(op => rec.some(x => x.op === op && x.apoyo)), true);
igual('Ceuta: su técnico no es apoyo', rec.find(x => x.op === 'JIFC').apoyo, false);
const recMel = cr.recomendar(T('1/00/8', 'XXX-0MELILL', 'Melilla Centro', { provincia: 'MELILLA', poblacion: 'MELILLA' }), new Date(2026, 9, 13, 12));
igual('Melilla: PHEP primero y apoyo de Málaga', [recMel[0].op, ['JVR', 'ILG', 'FMNT', 'MMHG'].every(op => recMel.some(x => x.op === op))], ['PHEP', true]);
vm.runInContext('rows = ' + JSON.stringify([T('2/00/1', 'DSG', 'A', { fVisita: '13/10/2026', desdeHora: '09:00' }), T('2/00/2', 'DSG', 'B', { fVisita: '13/10/2026', desdeHora: '10:00' })]) + "; duracionFija = { '2/00/1': 120 };", cr);
igual('conflictos: solape por duración del hilo', cr.conflictos('13/10/2026').filter(c => c.tipo === 'solape').length, 1);
vm.runInContext("duracionFija = {};", cr);
igual('conflictos: sin duración no inventa solapes', cr.conflictos('13/10/2026').filter(c => c.tipo === 'solape').length, 0);
igual('cierre: estados que cuentan como terminada', ['CERRADO', 'Puesto operativo', 'PTO. OPERATIVO PTE. ACEPTACIÓN PRESUPUESTO', 'EN FABRICANTE', 'PRESENCIAL'].map(e => cr.esCierre(e)), [true, true, true, false, false]);

// ---- Progreso del día: solo cuenta el técnico asignado (el soporte remoto también "inicia" tickets) ----
const cp = {}; vm.createContext(cp);
vm.runInContext([extraer(app, 'function cleanInitials('), extraer(dia, 'function isoHoy('), extraer(dia, 'function progresoHilo('), 'let hilos = {};'].join('\n'), cp);
const ahora = Date.now(), hilo = items => vm.runInContext('hilos = ' + JSON.stringify({ k: { at: ahora, items } }), cp);
hilo([{ ts: ahora - 3600000, t: 'El usuario MAAP ha iniciado el ticket' }]);
igual('progreso: inicio del soporte remoto no cuenta', cp.progresoHilo('k', 'EACL'), null);
hilo([{ ts: ahora - 3600000, t: 'El usuario MAAP ha iniciado el ticket' }, { ts: ahora - 1800000, t: 'El usuario EACL ha iniciado el ticket' }]);
igual('progreso: inicio del técnico = en curso', cp.progresoHilo('k', 'EACL').k, 'c');
hilo([{ ts: ahora - 1800000, t: 'El usuario EACL ha iniciado el ticket' }, { ts: ahora - 600000, t: 'El usuario EACL ha finalizado el ticket' }]);
igual('progreso: finalizado por el técnico', cp.progresoHilo('k', 'EACL').k, 'd');
hilo([{ ts: ahora - 86400000 * 2, t: 'El usuario EACL ha finalizado el ticket' }]);
igual('progreso: lo de otros días no cuenta', cp.progresoHilo('k', 'EACL'), null);

// ---- Coherencia de configuración ----
const vSyncA = (leer('atgo-sync.js').match(/SYNC_VERSION = '([\d.]+)'/) || [])[1], vSyncP = (app.match(/SYNC_VERSION = '([\d.]+)'/) || [])[1];
igual('SYNC_VERSION igual en atgo-sync.js y app.js', vSyncA, vSyncP);
const opsSync = (leer('atgo-sync.js').match(/(?:const|let) OPERARIOS = \[([^\]]*)\]/) || [])[1].match(/'([A-Z]+)'/g).map(s => s.slice(1, -1)).sort();
const zb = app.slice(app.indexOf('const ZONAS_BASE'), app.indexOf('];', app.indexOf('const ZONAS_BASE')));
const opsApp = [...new Set([...zb.matchAll(/ops:\[([^\]]*)\]/g)].flatMap(m => m[1].match(/'([A-Z]+)'/g).map(s => s.slice(1, -1))))].sort();
igual('ZONAS_BASE (app.js) = OPERARIOS (atgo-sync.js)', opsApp, opsSync);
const shell = leer('sw.js'), html = leer('index.html');
[...html.matchAll(/<script src="([a-z-]+\.js)"/g)].map(m => m[1]).forEach(js => igual('SHELL incluye ' + js, shell.includes("'./" + js + "'"), true));
const vSw = (shell.match(/despacho-v([\d.]+)/) || [])[1], vApp = (leer('ajustes.js').match(/APP_VERSION = '([\d.]+)'/) || [])[1];
igual('APP_VERSION (ajustes.js) = VERSION (sw.js)', vApp, vSw);

console.log(`${ok} correctas, ${ko} fallidas`);
process.exit(ko ? 1 : 0);
