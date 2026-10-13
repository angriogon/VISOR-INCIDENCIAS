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
  "const ZONAS = ZONAS_BASE; const ZONAS_TEC = ZONAS.filter(z => !z.dispatcher); const TECNICOS = ZONAS_TEC.flatMap(z => z.ops); const OPERARIOS = ZONAS.flatMap(z => z.ops); const TODOS_OPS = OPERARIOS; function perfilDeOp() { return 'OTROS'; }",
  extraer(app, 'function zonaOps('), extraer(app, 'function zonaDe('), extraer(app, 'function opIndex('), extraer(app, 'function esPresencial('), extraer(app, 'function horaMin('), extraer(app, 'function sortByHora('), extraer(app, 'function ddmmyyyy('),
  extraer(dia, 'function tkey('), extraer(dia, 'const ESTADOS_CIERRE'), extraer(dia, 'function esCierre('),
  extraer(herr, 'const PROV_ZONA'), extraer(herr, 'const PROV_RE'), extraer(herr, 'function zonaTicket('), extraer(herr, 'function poblacionDe('),
  extraer(panel, 'const POOL_ZONA'), extraer(herr, 'function zonaDeTexto('), extraer(panel, 'function zonaComodin('), extraer(panel, 'function zonaPool('), extraer(panel, 'function sedeKey('), extraer(panel, 'function mismaSede('), extraer(panel, 'function recomendar('), extraer(panel, 'function conflictos('), extraer(panel, 'function fmtMin('),
  "let rows = [], poolOpsDesc = {}, duracionFija = {}; const JORNADA_MIN = 480; const tecCfg = {}; function cargaMin() { return 0; } function estimarMin(r) { return duracionFija[r.key] || null; } let bajasPrueba = []; function enBaja(op) { return bajasPrueba.includes(op); }"
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
// Zonas por provincia (palabra completa) y recomendación en las zonas de DSP2–DSP5
const zt = (provincia, poblacion, domicilio) => cr.zonaTicket({ provincia, poblacion, domicilio, operario: 'XXX-PRUEBA' });
igual('provincia: zonas de DSP2–DSP5', [zt('Murcia'), zt('ALICANTE'), zt('Castellón'), zt('BARCELONA'), zt('Madrid'), zt('Ciudad Real'), zt('Valladolid'), zt('Zaragoza'), zt('A Coruña'), zt('Asturias'), zt('Navarra'), zt('Illes Balears'), zt('Portugal')],
  ['MURCIA', 'ALICANTE', 'VALENCIA/CASTELLÓN', 'CATALUÑA', 'MADRID', 'CIUDAD REAL', 'CASTILLA Y LEÓN', 'ARAGÓN', 'GALICIA', 'ASTURIAS/CANTABRIA', 'NORTE', 'BALEARES', 'PORTUGAL']);
igual('provincia: palabra completa ("asesoría" no es Soria)', zt('', '', 'C/ Asesoría Fiscal 3'), null);
igual('provincia: Andalucía sigue igual', [zt('SEVILLA'), zt('', 'Palma del Condado, HUELVA')], ['SEVILLA/HUELVA', 'SEVILLA/HUELVA']);
igual('recomendado: Murcia propone a sus técnicos', cr.recomendar(T('1/00/7', 'XXX-MU', 'Tienda Murcia', { provincia: 'MURCIA', poblacion: 'MURCIA' }), new Date(2026, 9, 13, 12)).map(x => x.op).sort(), ['GAS', 'RUFB']);
vm.runInContext("poolOpsDesc = { 'XXX-MU': 'PENDIENTE ASIGNAR MURCIA', 'XXX-RARO': 'PENDIENTE ASIGNAR' };", cr);
igual('comodines: zona por el nombre en ATGO', [cr.zonaPool({ operario: 'XXX-MU', provincia: '' }), cr.zonaComodin('XXX-RARO'), cr.zonaPool({ operario: 'XXX-SVQ' })], ['MURCIA', null, 'SEVILLA/HUELVA']);
vm.runInContext("poolOpsDesc = { 'XXX-0GALIC2': 'PENDIENTE ASIGNAR GALICIA-2', 'XXX-0GUIPUZ': 'PENDIENTE ASIGNAR GUIPUZKOA', 'XXX-0MURCIA': 'PENDIENTE ASIGNAR MURCIA_ALICANTE', 'XXX-0SANSEB': 'PENDIENTE ASIGNAR PAIS VASCO_RIOJA', 'XXX-0LEON': 'PENDIENTE ASIGNAR LEÓN', 'XXX-LP': 'PENDIENTE ASIGNAR LAS PALMAS' };", cr);
igual('comodines reales de ATGO', ['XXX-0GALIC2', 'XXX-0GUIPUZ', 'XXX-0MURCIA', 'XXX-0SANSEB', 'XXX-0LEON', 'XXX-LP'].map(op => cr.zonaComodin(op)), ['GALICIA', 'NORTE', 'MURCIA', 'NORTE', 'CASTILLA Y LEÓN', null]);
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

// ---- Perfiles: lista matriz, migración, cambios del usuario y selector de técnicos ----
const bloquePerfiles = app.slice(app.indexOf('const PERFILES'), app.indexOf('const PERFIL = perfilCfg.activo;'));
function perfilesCon(guardado) {
  const almacen = guardado ? { dispatcher_perfiles_v1: JSON.stringify(guardado) } : {};
  const c = { localStorage: { getItem: k => almacen[k] ?? null, setItem: (k, v) => { almacen[k] = String(v); } } }; vm.createContext(c);
  vm.runInContext(extraer(app, 'const ZONAS_BASE') + '\n' + bloquePerfiles + '\nthis.cfg = perfilCfg; this.def = perfilesPorDefecto(); this.zb = ZONAS_BASE;', c);
  return { cfg: c.cfg, def: c.def, zb: c.zb, guardado: almacen.dispatcher_perfiles_v1 && JSON.parse(almacen.dispatcher_perfiles_v1) };
}
const cuenta = t => Object.fromEntries(Object.entries(t).map(([p, l]) => [p, l.length]));
const nuevo = perfilesCon(null);
igual('perfiles: lista matriz en un equipo nuevo', cuenta(nuevo.cfg.tecs), { DSP1: 21, DSP2: 16, DSP3: 10, DSP4: 18, DSP5: 5, COORD: 70 });
igual('perfiles: DSP2 con Murcia y Cataluña', ['RUFB', 'GAS', 'JHT', 'OALC'].every(op => nuevo.cfg.tecs.DSP2.includes(op)) && !nuevo.cfg.tecs.DSP2.includes('DSG'), true);
const viejo = perfilesCon({ activo: 'DSP2', inicial1: true, tecs: { DSP1: ['AMRG', 'DSG', 'ZZZ1'], DSP2: ['RUFB'], DSP3: [], DSP4: [], DSP5: [], COORD: [] } });
igual('perfiles: los antiguos pasan una vez a la matriz', [cuenta(viejo.cfg.tecs).DSP2, viejo.cfg.tecs.DSP1.includes('ZZZ1'), viejo.cfg.activo, viejo.guardado.matriz1], [16, false, 'DSP2', true]);
const propio = { activo: 'DSP3', matriz1: true, tecs: { ...nuevo.def, DSP3: ['ADGG', 'NUEVO1'] } };
igual('perfiles: tras la migración se respetan tus cambios (quitar y añadir)', perfilesCon(propio).cfg.tecs.DSP3.slice().sort(), ['ADGG', 'NUEVO1']);
const conNuevo = perfilesCon({ ...propio, conocidos: nuevo.def.DSP1.filter(op => op !== 'DSG') });
igual('perfiles: un técnico nuevo en el código entra en su perfil y en COORD', [conNuevo.cfg.tecs.DSP1.filter(x => x === 'DSG').length, conNuevo.cfg.tecs.COORD.filter(x => x === 'DSG').length], [1, 1]);
igual('perfiles: restablecer = lista matriz', cuenta(perfilesCon(propio).def), { DSP1: 21, DSP2: 16, DSP3: 10, DSP4: 18, DSP5: 5, COORD: 70 });
const so = { esc: s => String(s), plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's') }; vm.createContext(so);
vm.runInContext(extraer(panel, 'function opcionesTecnico(') + `
  const PERFILES = ['DSP1','DSP2','COORD'], PERFIL = 'DSP1', TECNICOS = ['DSG','ACAB'], TODOS_OPS = ['AMRG','DSG','ACAB','RUFB','GAS'];
  const perfilCfg = { tecs: { DSP1: ['AMRG','DSG','ACAB'], DSP2: ['RUFB','GAS'], COORD: TODOS_OPS } };
  function dispatcherOps() { return ['AMRG']; } let bajasPrueba = []; function enBaja(op) { return bajasPrueba.includes(op); }`, so);
const selHtml = so.opcionesTecnico([{ op: 'ACAB', carga: 0 }], 'RUFB', false);
const valores = [...selHtml.matchAll(/value="([^"]*)"/g)].map(m => m[1]);
igual('selector: todos los técnicos de todos los perfiles, una vez cada uno', valores.slice().sort(), ['ACAB', 'AMRG', 'DSG', 'GAS', 'RUFB']);
igual('selector: el recomendado primero y el elegido marcado', [valores[0], /value="RUFB" selected/.test(selHtml), /optgroup label="Técnicos de DSP2"/.test(selHtml)], ['ACAB', true, true]);

// ---- Nómina: altas, cambios de zona y bajas ----
const conAlta = perfilesCon({ ...propio, tecs: nuevo.def, conocidos: nuevo.def.COORD, nomina: { NUEVO9: { z: 'MURCIA', alta: true } } });
igual('nómina: un alta con zona entra en su zona, su DSP y COORD', [conAlta.zb.find(z => z.nombre === 'MURCIA').ops.includes('NUEVO9'), conAlta.cfg.tecs.DSP2.includes('NUEVO9'), conAlta.cfg.tecs.COORD.includes('NUEVO9'), conAlta.def.DSP2.includes('NUEVO9')], [true, true, true, true]);
const conMovido = perfilesCon({ ...propio, tecs: nuevo.def, conocidos: nuevo.def.COORD, nomina: { DSG: { z: '', dsp: 'DSP3' }, LGV: { z: 'MÁLAGA' } } });
igual('nómina: cambiar de zona o dejarlo sin zona cambia la lista matriz', [conMovido.def.DSP1.includes('DSG'), conMovido.def.DSP3.includes('DSG'), conMovido.zb.find(z => z.nombre === 'MÁLAGA').ops.includes('LGV'), conMovido.zb.find(z => z.nombre === 'GRANADA').ops.includes('LGV'), conMovido.def.COORD.length], [false, true, true, false, 70]);
vm.runInContext("bajasPrueba = ['EACL']", cr);
igual('nómina: un técnico de baja no se recomienda', cr.recomendar(pool, new Date(2026, 9, 13, 12)).some(x => x.op === 'EACL'), false);
vm.runInContext("bajasPrueba = []", cr);
vm.runInContext("bajasPrueba = ['GAS', 'RUFB']", so);
const selBaja = [...so.opcionesTecnico([], 'RUFB', false).matchAll(/value="([^"]*)"/g)].map(m => m[1]);
igual('nómina: el de baja no sale en el selector (salvo si ya es el elegido)', [selBaja.includes('GAS'), selBaja.includes('RUFB')], [false, true]);

// ---- Incidencias: orden por estado dentro de cada técnico ----
const coe = {}; vm.createContext(coe);
vm.runInContext([extraer(app, 'function norm('), extraer(app, 'const ESTADOS'), extraer(app, 'function ordenEstado(')].join('\n'), coe);
igual('orden por estado: PRESENCIAL antes que FUERA DE MANTENIMIENTO y ESCALADO; desconocidos al final', ['ESCALADO TIER1', 'OTRO', 'presencial', 'FUERA DE MANTENIMIENTO'].sort((a, b) => coe.ordenEstado(a) - coe.ordenEstado(b)), ['presencial', 'FUERA DE MANTENIMIENTO', 'ESCALADO TIER1', 'OTRO']);

// ---- Coherencia de configuración ----
const vSyncA = (leer('atgo-sync.js').match(/SYNC_VERSION = '([\d.]+)'/) || [])[1], vSyncP = (app.match(/SYNC_VERSION = '([\d.]+)'/) || [])[1];
igual('SYNC_VERSION igual en atgo-sync.js y app.js', vSyncA, vSyncP);
const opsSync = (leer('atgo-sync.js').match(/(?:const|let) OPERARIOS = \[([^\]]*)\]/) || [])[1].match(/'([A-Z]+)'/g).map(s => s.slice(1, -1)).sort();
const zb = app.slice(app.indexOf('const ZONAS_BASE'), app.indexOf('];', app.indexOf('const ZONAS_BASE')));
// atgo-sync.js lleva de respaldo solo los de DSP1 (zonas sin "dsp"); los demás perfiles los manda Despacho
const opsApp = [...new Set(zb.split(/\r?\n/).filter(l => /ops:\[/.test(l) && !/dsp:/.test(l)).flatMap(l => l.match(/ops:\[([^\]]*)\]/)[1].match(/'([A-Z]+)'/g).map(s => s.slice(1, -1))))].sort();
igual('DSP2–DSP5: zonas con su perfil', [...new Set((zb.match(/dsp:'(DSP\d)'/g) || []).map(x => x.slice(5, 9)))].sort(), ['DSP2', 'DSP3', 'DSP4', 'DSP5']);
igual('DSP1 en ZONAS_BASE (app.js) = OPERARIOS de respaldo (atgo-sync.js)', opsApp, opsSync);
const shell = leer('sw.js'), html = leer('index.html');
[...html.matchAll(/<script src="([a-z-]+\.js)"/g)].map(m => m[1]).forEach(js => igual('SHELL incluye ' + js, shell.includes("'./" + js + "'"), true));
const vSw = (shell.match(/despacho-v([\d.]+)/) || [])[1], vApp = (leer('ajustes.js').match(/APP_VERSION = '([\d.]+)'/) || [])[1];
igual('APP_VERSION (ajustes.js) = VERSION (sw.js)', vApp, vSw);
igual('sw.js guarda los archivos pidiéndolos al servidor (no a la caché del navegador)', /cache:\s*'reload'/.test(shell), true);

console.log(`${ok} correctas, ${ko} fallidas`);
process.exit(ko ? 1 : 0);
