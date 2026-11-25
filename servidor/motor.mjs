// Despacho · motor del servidor. Fase 0: SOLO LECTURA.
// Mantiene ATGO abierto en un Chromium sin pantalla con tu sesión, ejecuta dentro el atgo-sync.js firmado
// (el token no sale de esa pestaña, igual que en el PC), guarda el historial de cambios en SQLite y
// publica su estado en una API pequeña para la PWA (⚙ › General › Servidor).
// En esta fase no envía ninguna orden de escritura a ATGO: solo lecturas (config, refresh, hilos y estados).
// También hace de «pestaña de ATGO» para la PWA en la tablet, el móvil o un PC sin extensión: /mensajes y /pedir.
// Uso: node --no-warnings servidor/motor.mjs   (lo arranca el servicio que crea servidor/instalar.sh)
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { chromium } from 'playwright-core';

const MOTOR_VERSION = '0.2.0';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLAVES = process.env.DESPACHO_CLAVES || path.join(os.homedir(), '.despacho');          // nunca va al repositorio
const DATOS = process.env.DESPACHO_DATOS || path.join(os.homedir(), '.local', 'share', 'despacho-motor');
const PUERTO = Number(process.env.PUERTO || 8791);
const PWA_URL = 'https://angriogon.github.io/VISOR-INCIDENCIAS/';
const ORIGENES = new Set(['https://angriogon.github.io', 'http://localhost:8765', 'http://127.0.0.1:8765']);
const ATGO = 'https://atgo.tier1.es';
const ATGO_URL = ATGO + '/#/mistickets/';
const SOLO_LECTURA = new Set(['despacho-config', 'despacho-refresh', 'despacho-ready', 'despacho-hilo', 'despacho-estado']);   // lo único que el motor puede mandar a ATGO

fs.mkdirSync(CLAVES, { recursive: true, mode: 0o700 });
fs.mkdirSync(DATOS, { recursive: true });
const F = {
  cred: path.join(CLAVES, 'atgo.json'),            // { usuario, clave } de ATGO
  acceso: path.join(CLAVES, 'servidor.json'),      // { clave } de acceso a esta API
  navegador: path.join(CLAVES, 'navegador-atgo'),  // perfil de Chromium (guarda la sesión de ATGO)
  config: path.join(DATOS, 'config.json'),         // técnicos que manda la PWA
  sync: path.join(DATOS, 'atgo-sync.js'), firma: path.join(DATOS, 'atgo-sync.firma.json'),   // última versión válida
  db: path.join(DATOS, 'historial.db'),
  ultimo: path.join(DATOS, 'ultimo.json')          // última carga completa (para la PWA tras reiniciar el motor)
};

const log = (...a) => console.log(new Date().toISOString().slice(0, 19), ...a);
const leerJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const escribirPrivado = (f, o) => { fs.writeFileSync(f + '.tmp', JSON.stringify(o), { mode: 0o600 }); fs.renameSync(f + '.tmp', f); };

// ===== Clave de acceso a la API (se crea la primera vez) =====
let acceso = leerJson(F.acceso, null);
if (!acceso || !acceso.clave) { acceso = { clave: crypto.randomBytes(24).toString('base64url') }; escribirPrivado(F.acceso, acceso); log('Clave de acceso creada en', F.acceso); }

// ===== Estado =====
const estado = {
  motor: MOTOR_VERSION, fase: 0, desde: Date.now(), sesion: 'arrancando', texto: '', error: false,
  syncV: null, ultimaCarga: null, errores: [], loginFallos: 0, loginPausaHasta: 0
};
const fallo = t => { log('ERROR', t); estado.errores.unshift({ at: Date.now(), t: String(t).slice(0, 300) }); estado.errores.length = Math.min(estado.errores.length, 15); };

// Calendario: el piloto solo actuará de lunes a viernes (hora de Madrid). En la fase 0 solo se informa.
function laborable(d = new Date()) {
  const dia = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short' }).format(d);
  return !['Sat', 'Sun'].includes(dia);
}

// ===== Historial (SQLite) =====
const db = new DatabaseSync(F.db);
db.exec(`
  CREATE TABLE IF NOT EXISTS carga (at INTEGER PRIMARY KEY, filas INTEGER, pool INTEGER, segundos INTEGER, v TEXT, sospechosa INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS ticket (key TEXT PRIMARY KEY, datos TEXT, desde INTEGER, hasta INTEGER, activo INTEGER);
  CREATE TABLE IF NOT EXISTS evento (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER, key TEXT, tipo TEXT, campo TEXT, antes TEXT, despues TEXT);
  CREATE INDEX IF NOT EXISTS evento_at ON evento(at);
  CREATE INDEX IF NOT EXISTS evento_key ON evento(key);
`);
const CAMPOS = ['operario', 'fVisita', 'desdeHora', 'hastaHora', 'estado'];
const q = {
  carga: db.prepare('INSERT OR REPLACE INTO carga (at, filas, pool, segundos, v, sospechosa) VALUES (?, ?, ?, ?, ?, ?)'),
  activos: db.prepare('SELECT key, datos FROM ticket WHERE activo = 1'),
  ticket: db.prepare('INSERT INTO ticket (key, datos, desde, hasta, activo) VALUES (?, ?, ?, ?, 1) ON CONFLICT(key) DO UPDATE SET datos = excluded.datos, hasta = excluded.hasta, activo = 1'),
  baja: db.prepare('UPDATE ticket SET activo = 0 WHERE key = ?'),
  evento: db.prepare('INSERT INTO evento (at, key, tipo, campo, antes, despues) VALUES (?, ?, ?, ?, ?, ?)')
};
let ultimasFilas = 0;
function guardarCarga(m) {
  const at = Number(m.at) || Date.now();
  const filas = Array.isArray(m.rows) ? m.rows : [];
  const pool = Array.isArray(m.pool) ? m.pool.map(r => ({ ...r, sinAsignar: true })) : null;
  const todas = [...filas, ...(pool || [])].filter(r => r && r.key);
  // Carga sospechosa (ATGO devolvió muchas menos de golpe): se guarda lo visto, pero no se dan por desaparecidas
  const sospechosa = ultimasFilas >= 20 && filas.length < ultimasFilas * 0.5;
  const previos = new Map(q.activos.all().map(t => [t.key, JSON.parse(t.datos)]));
  db.exec('BEGIN');
  try {
    q.carga.run(at, filas.length, pool ? pool.length : -1, Number(m.seconds) || 0, String(m.v || ''), sospechosa ? 1 : 0);
    const vistas = new Set();
    for (const r of todas) {
      vistas.add(r.key);
      const a = previos.get(r.key);
      if (!a) q.evento.run(at, r.key, 'alta', null, null, JSON.stringify({ operario: r.operario, estado: r.estado, fVisita: r.fVisita || '' }));
      else for (const c of CAMPOS) if (String(a[c] ?? '') !== String(r[c] ?? '')) q.evento.run(at, r.key, 'cambio', c, String(a[c] ?? ''), String(r[c] ?? ''));
      q.ticket.run(r.key, JSON.stringify(r), at, at);
    }
    if (!sospechosa) for (const [k, a] of previos) {
      if (vistas.has(k)) continue;
      if (a.sinAsignar && !pool) continue;   // la bolsa no se pudo leer esta vez
      q.baja.run(k); q.evento.run(at, k, 'baja', null, JSON.stringify({ operario: a.operario, estado: a.estado }), null);
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); fallo('Historial: ' + e.message); return; }
  if (!sospechosa) ultimasFilas = filas.length;
  estado.ultimaCarga = { at, filas: filas.length, pool: pool ? pool.length : null, segundos: Number(m.seconds) || 0, sospechosa };
  estado.syncV = m.v || estado.syncV;
}
function resumenHistorial() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const uno = (sql, ...p) => db.prepare(sql).get(...p);
  return {
    desde: (uno('SELECT MIN(at) AS v FROM carga') || {}).v || null,
    cargas: (uno('SELECT COUNT(*) AS v FROM carga') || {}).v || 0,
    cargasHoy: (uno('SELECT COUNT(*) AS v FROM carga WHERE at >= ?', hoy.getTime()) || {}).v || 0,
    eventosHoy: (uno('SELECT COUNT(*) AS v FROM evento WHERE at >= ?', hoy.getTime()) || {}).v || 0,
    asignacionesHoy: (uno("SELECT COUNT(*) AS v FROM evento WHERE at >= ? AND tipo = 'cambio' AND campo = 'operario'", hoy.getTime()) || {}).v || 0,
    activos: (uno('SELECT COUNT(*) AS v FROM ticket WHERE activo = 1') || {}).v || 0
  };
}

// ===== atgo-sync.js firmado (la misma comprobación que la extensión) =====
const CLAVE_SYNC = (() => {
  const m = /const CLAVE_SYNC = (\{[^}]*\});/.exec(fs.readFileSync(path.join(REPO, 'extension', 'background.js'), 'utf8'));
  return Function('return ' + m[1])();
})();
const versionDe = c => (/const SYNC_VERSION = '(\d+\.\d+\.\d+)'/.exec(c) || [])[1] || '';
async function firmaValida(codigo, f) {
  if (!f || typeof f.firma !== 'string' || !f.v || versionDe(codigo) !== f.v) return false;
  try {
    const clave = await crypto.webcrypto.subtle.importKey('jwk', CLAVE_SYNC, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return await crypto.webcrypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, clave, Buffer.from(f.firma, 'base64'), new TextEncoder().encode('despacho-sync|' + f.v + '|' + codigo));
  } catch (e) { return false; }
}
let codigoSync = null;
async function cargarSync() {
  try {
    const bajar = async u => { const r = await fetch(u + '?t=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(15000) }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.text(); };
    const [c, f] = await Promise.all([bajar(PWA_URL + 'atgo-sync.js'), bajar(PWA_URL + 'atgo-sync.firma.json').then(JSON.parse)]);
    if (await firmaValida(c, f)) {
      if (c !== codigoSync) { fs.writeFileSync(F.sync, c); fs.writeFileSync(F.firma, JSON.stringify(f)); }
      return c;
    }
    fallo('La sincronización publicada no tiene una firma válida: se usa la última válida');
  } catch (e) { fallo('No se pudo descargar la sincronización: ' + e.message); }
  for (const [c, f] of [[F.sync, F.firma], [path.join(REPO, 'atgo-sync.js'), path.join(REPO, 'atgo-sync.firma.json')]]) {
    try { const cod = fs.readFileSync(c, 'utf8'); if (await firmaValida(cod, leerJson(f, null))) return cod; } catch (e) {}
  }
  return null;
}

// ===== Navegador con ATGO =====
let ctx = null, page = null, ultimoDato = 0, revisando = false;
function ejecutable() {
  if (process.env.CHROME) return process.env.CHROME;
  const base = path.join(os.homedir(), '.cache', 'ms-playwright');
  const d = fs.readdirSync(base).filter(x => /^chromium-\d+$/.test(x)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))[0];
  return path.join(base, d, 'chrome-linux64', 'chrome');
}
async function abrirNavegador() {
  ctx = await chromium.launchPersistentContext(F.navegador, {
    executablePath: ejecutable(), headless: true, locale: 'es-ES', timezoneId: 'Europe/Madrid', viewport: { width: 1280, height: 800 },
    args: ['--disable-dev-shm-usage', '--no-first-run']
  });
  ctx.on('close', () => { fallo('El navegador se ha cerrado'); process.exit(1); });   // el servicio lo vuelve a arrancar
  // Sin imágenes, fuentes ni vídeo: menos memoria
  await ctx.route('**/*', r => ['image', 'font', 'media'].includes(r.request().resourceType()) ? r.abort() : r.continue());
  await ctx.exposeBinding('__despachoMotor', (_src, msg) => recibir(msg));
  // Hace de puente de la extensión: lo que atgo-sync manda a Despacho llega aquí
  await ctx.addInitScript(() => {
    window.addEventListener('message', e => {
      if (e.source === window && e.data && e.data.__despacho === 'de-atgo' && e.data.msg && typeof e.data.msg === 'object') {
        try { window.__despachoMotor(e.data.msg); } catch (err) {}
      }
    });
  });
  page = ctx.pages()[0] || await ctx.newPage();
  page.on('crash', () => { fallo('La pestaña de ATGO se ha colgado'); process.exit(1); });
  await page.goto(ATGO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
}
// Cola de mensajes para la PWA que lee desde aquí (/mensajes): la última carga completa, el último estado y las
// respuestas de hilos y estados. Cada PWA pide lo que haya desde el último número que vio.
let colaN = 0, cola = [];
function encolar(m) {
  if (m.type === 'atgo-data' || m.type === 'atgo-status') cola = cola.filter(x => x.m.type !== m.type);   // de estos basta el último
  cola.push({ n: ++colaN, m }); if (cola.length > 60) cola = cola.slice(-60);
}
{ const u = leerJson(F.ultimo, null); if (u && u.type === 'atgo-data') encolar(u); }
function recibir(m) {
  if (!m || typeof m !== 'object') return;
  if (m.type === 'atgo-status') { estado.texto = String(m.text || '').slice(0, 200); estado.error = !!m.error; encolar({ type: 'atgo-status', text: estado.texto, error: estado.error }); }
  else if (m.type === 'atgo-data' && !m.partial) {
    ultimoDato = Date.now();
    const previa = cola.find(x => x.m.type === 'atgo-data');
    if (previa && previa.m.at === m.at) return;   // la misma carga reenviada (despacho-ready)
    guardarCarga(m); encolar(m);
    try { escribirPrivado(F.ultimo, m); } catch (e) { fallo('No se pudo guardar la última carga: ' + e.message); }
  }
  else if (m.type === 'atgo-hilo' || m.type === 'atgo-estado') encolar(m);
}
async function aAtgo(msg) {
  if (!SOLO_LECTURA.has(msg.type)) throw new Error('Fase 0: el motor no escribe en ATGO');
  await page.evaluate(m => window.postMessage({ __despacho: 'a-atgo', msg: m }, location.origin), msg);
}
async function mandarConfig() {
  const c = leerJson(F.config, null);
  if (c && c.operarios && c.operarios.length) await aAtgo({ type: 'despacho-config', operarios: c.operarios, permitidos: c.permitidos || c.operarios });
}
async function inyectar() {
  const codigo = await cargarSync();
  if (!codigo) { fallo('No hay ninguna sincronización con firma válida'); return; }
  codigoSync = codigo;
  await page.evaluate(u => { document.documentElement.dataset.despachoPuente = 'motor'; window.__despachoPwaUrl = u; }, PWA_URL + 'atgo-sync.js');
  await page.evaluate(codigo);
  estado.syncV = versionDe(codigo);
  log('Sincronización', estado.syncV, 'en marcha');
  await mandarConfig();
}

// ===== Sesión: inicio automático con el usuario guardado, sin insistir si falla =====
async function verSesion() {
  return page.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const token = !!localStorage.getItem('token'), exp = Number(localStorage.getItem('expires')) || 0;
    const login = /#\/login/.test(location.hash) || [...document.querySelectorAll('input[type="password"]')].some(vis);
    return { valida: token && (!exp || exp * 1000 > Date.now()) && !login, login, sync: !!window.__despachoSync };
  });
}
async function iniciarSesion() {
  const cred = leerJson(F.cred, null);
  if (!cred || !cred.instancia || !cred.usuario || !cred.clave) { estado.sesion = 'sin-credenciales'; return; }
  if (Date.now() < estado.loginPausaHasta) return;
  estado.sesion = 'iniciando';
  log('Iniciando sesión en ATGO');
  await page.evaluate(() => { localStorage.removeItem('token'); localStorage.removeItem('expires'); });
  await page.goto(ATGO + '/#/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const clave = await page.waitForSelector('input[type="password"]:visible', { timeout: 30000 }).catch(() => null);
  let ok = false;
  if (clave) {
    // Mismo criterio que la extensión para encontrar el campo de usuario
    const rellenado = await page.evaluate(({ ins, u, c }) => {
      const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const pass = [...document.querySelectorAll('input[type="password"]')].find(vis);
      const form = pass.closest('form') || document;
      const campos = [...form.querySelectorAll('input')].filter(i => vis(i) && /^(text|email|)$/i.test(i.type || ''));
      // ATGO pide Instancia, Usuario y Contraseña; sus ids cambian en cada carga, así que se buscan por la etiqueta
      const etiqueta = i => ((i.closest('label, mat-form-field, div') || {}).innerText || '') + ' ' + (i.placeholder || '') + ' ' + (i.getAttribute('aria-label') || '');
      const inst = campos.find(i => /instancia/i.test(etiqueta(i)));
      const user = campos.find(i => i !== inst && /usuario|user/i.test(etiqueta(i)));
      if (!inst || !user) return false;
      const escribir = (el, v) => { el.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); ['input', 'change', 'blur'].forEach(t => el.dispatchEvent(new Event(t, { bubbles: true }))); };
      escribir(inst, ins); escribir(user, u); escribir(pass, c);
      [...form.querySelectorAll('input[type="checkbox"]')].forEach(ch => { const t = ((ch.closest('label') || {}).textContent || '') + (ch.name || '') + (ch.id || ''); if (/record|remember|mantener/i.test(t) && !ch.checked) ch.click(); });
      setTimeout(() => {
        const b = form.querySelector('button[type="submit"], input[type="submit"]') || [...form.querySelectorAll('button')].find(x => vis(x) && /entrar|acceder|iniciar|login|aceptar/i.test(x.textContent || ''));
        if (b) b.click(); else if (form.requestSubmit) form.requestSubmit();
      }, 400);
      return true;
    }, { ins: cred.instancia, u: cred.usuario, c: cred.clave });
    if (!rellenado) fallo('La página de acceso de ATGO ha cambiado: no encuentro Instancia y Usuario');
    const fin = Date.now() + 30000;
    while (!ok && Date.now() < fin) { await page.waitForTimeout(1000); ok = (await verSesion().catch(() => ({}))).valida; }
  }
  if (ok) {
    estado.loginFallos = 0; estado.sesion = 'ok'; log('Sesión iniciada');
    await page.goto(ATGO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    return;
  }
  // Sin reintentos seguidos (no bloquear la cuenta): 5 min, 30 min y, a la tercera, se para hasta tener credenciales nuevas
  estado.loginFallos++;
  if (estado.loginFallos >= 3) { estado.sesion = 'login-fallido'; estado.loginPausaHasta = Infinity; fallo('ATGO rechaza el inicio de sesión tres veces: parado hasta que guardes el usuario de nuevo'); }
  else { estado.sesion = 'login-pausa'; estado.loginPausaHasta = Date.now() + (estado.loginFallos === 1 ? 5 : 30) * 60000; fallo('No se pudo iniciar sesión en ATGO (intento ' + estado.loginFallos + ')'); }
}
async function revisar() {
  if (revisando) return; revisando = true;
  try {
    const s = await verSesion();
    if (s.valida) {
      estado.sesion = 'ok';
      if (!s.sync) { await page.waitForTimeout(2000); await inyectar(); ultimoDato = ultimoDato || Date.now(); }
      else if (ultimoDato && Date.now() - ultimoDato > 10 * 60000) {
        // Sin datos en 10 minutos: se recarga ATGO desde cero
        fallo('Sin datos de ATGO en 10 minutos: se recarga la página'); ultimoDato = Date.now();
        await page.goto(ATGO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      }
    } else await iniciarSesion();
  } catch (e) { fallo('Revisión: ' + e.message); }
  finally { revisando = false; }
}
// Cada 30 min se mira si hay una sincronización nueva publicada: si la hay, se recarga ATGO para usarla
setInterval(async () => {
  const c = await cargarSync();
  if (c && codigoSync && c !== codigoSync && !(await page.evaluate(() => window.__despachoSync && window.__despachoSync.ocupado()).catch(() => true))) {
    log('Sincronización nueva:', versionDe(c)); await page.goto(ATGO_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => fallo(e.message));
  }
}, 30 * 60000);

// ===== API para la PWA =====
let fallosAuth = [];
function autorizado(req) {
  const h = String(req.headers.authorization || ''), dada = Buffer.from(h.replace(/^Bearer /, '')), buena = Buffer.from(acceso.clave);
  return dada.length === buena.length && crypto.timingSafeEqual(dada, buena);
}
function leerCuerpo(req) {
  return new Promise((ok, mal) => {
    let t = ''; req.on('data', d => { t += d; if (t.length > 20000) { mal(new Error('demasiado grande')); req.destroy(); } });
    req.on('end', () => { try { ok(t ? JSON.parse(t) : {}); } catch (e) { mal(e); } });
  });
}
async function guardarConfig(b) {
  const ops = limpiaOps(b.operarios), perm = limpiaOps(b.permitidos);
  if (!ops.length || ops.length > 200) return 0;
  const vieja = leerJson(F.config, {});
  fs.writeFileSync(F.config, JSON.stringify({ operarios: ops, permitidos: perm.length ? perm : ops, at: Date.now() }));
  if ((vieja.operarios || []).slice().sort().join() !== ops.slice().sort().join() && estado.sesion === 'ok') await mandarConfig().catch(e => fallo(e.message));
  return ops.length;
}
const limpiaOps = a => [...new Set((Array.isArray(a) ? a : []).map(x => String(x).trim().toUpperCase()).filter(x => /^[A-Z0-9]{2,12}$/.test(x)))];
http.createServer(async (req, res) => {
  const origen = req.headers.origin;
  const cab = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (origen && ORIGENES.has(origen)) Object.assign(cab, { 'Access-Control-Allow-Origin': origen, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST', Vary: 'Origin' });
  const responder = (code, o) => { res.writeHead(code, cab); res.end(JSON.stringify(o)); };
  try {
    const ruta = new URL(req.url, 'http://x').pathname;
    if (req.method === 'OPTIONS') return responder(204, {});
    if (ruta === '/salud') return responder(200, { ok: true, app: 'despacho-motor' });
    fallosAuth = fallosAuth.filter(t => Date.now() - t < 10 * 60000);
    if (fallosAuth.length >= 20) return responder(429, { error: 'Demasiados intentos. Espera unos minutos.' });
    if (!autorizado(req)) { fallosAuth.push(Date.now()); return responder(401, { error: 'Clave de acceso incorrecta' }); }
    if (req.method === 'GET' && ruta === '/estado') {
      const c = leerJson(F.config, {}), cred = leerJson(F.cred, null);
      return responder(200, {
        ...estado, loginPausaHasta: undefined, ahora: Date.now(), laborable: laborable(), memoriaMB: Math.round(process.memoryUsage().rss / 1048576),
        credenciales: !!(cred && cred.usuario), usuario: cred && cred.usuario ? cred.usuario : null, tecnicos: (c.operarios || []).length,
        historial: resumenHistorial()
      });
    }
    if (req.method === 'POST' && ruta === '/config') {
      const b = await leerCuerpo(req), n = await guardarConfig(b);
      return n ? responder(200, { ok: true, tecnicos: n }) : responder(400, { error: 'Lista de técnicos no válida' });
    }
    if (req.method === 'GET' && ruta === '/mensajes') {
      let desde = Number(new URL(req.url, 'http://x').searchParams.get('desde')) || 0;
      if (desde > colaN) desde = 0;   // el motor se ha reiniciado: se manda todo
      const cuerpo = JSON.stringify({ n: colaN, msgs: cola.filter(x => x.n > desde).map(x => x.m), sesion: estado.sesion, fase: estado.fase });
      if (/\bgzip\b/.test(String(req.headers['accept-encoding'] || ''))) { res.writeHead(200, { ...cab, 'Content-Encoding': 'gzip' }); return res.end(zlib.gzipSync(cuerpo)); }
      res.writeHead(200, cab); return res.end(cuerpo);
    }
    if (req.method === 'POST' && ruta === '/pedir') {
      const m = (await leerCuerpo(req)).msg;
      if (!m || typeof m !== 'object') return responder(400, { error: 'Falta el mensaje' });
      if (m.type === 'despacho-config') return responder(200, { ok: !!(await guardarConfig(m)) });
      if (!SOLO_LECTURA.has(m.type)) return responder(403, { error: 'Desde el servidor, de momento solo se puede leer' });
      const keys = Array.isArray(m.keys) ? m.keys.map(String).filter(k => /^\d+\/[^/]+\/\d+$/.test(k)).slice(0, 200) : undefined;
      if (estado.sesion !== 'ok') return responder(503, { error: 'El servidor no tiene sesión en ATGO' });
      await aAtgo(keys ? { type: m.type, keys } : { type: m.type });
      return responder(200, { ok: true });
    }
    if (req.method === 'POST' && ruta === '/credenciales') {
      const b = await leerCuerpo(req), ins = String(b.instancia || '').trim(), u = String(b.usuario || '').trim(), c = String(b.clave || '');
      if (!ins || !u || !c || ins.length > 100 || u.length > 100 || c.length > 200) return responder(400, { error: 'Faltan la instancia, el usuario o la contraseña' });
      escribirPrivado(F.cred, { instancia: ins, usuario: u, clave: c });
      estado.loginFallos = 0; estado.loginPausaHasta = 0; log('Usuario de ATGO guardado');
      setTimeout(revisar, 500);
      return responder(200, { ok: true });
    }
    if (req.method === 'POST' && ruta === '/actualizar') { await aAtgo({ type: 'despacho-refresh' }).catch(() => {}); return responder(200, { ok: true }); }
    responder(404, { error: 'No existe' });
  } catch (e) { fallo('API: ' + e.message); responder(500, { error: 'Error interno' }); }
}).listen(PUERTO, '127.0.0.1', () => log('API en http://127.0.0.1:' + PUERTO));

// ===== Arranque =====
try {
  await abrirNavegador();
  log('ATGO abierto. Motor', MOTOR_VERSION, '(fase 0: solo lectura)');
  await revisar();
  setInterval(revisar, 30000);
} catch (e) { fallo('Arranque: ' + e.message); process.exit(1); }
for (const s of ['SIGTERM', 'SIGINT']) process.on(s, async () => { log('Parando'); try { await ctx.close(); } catch (e) {} db.close(); process.exit(0); });
