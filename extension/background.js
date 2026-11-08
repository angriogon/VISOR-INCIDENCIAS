// Extensión "Despacho · sincronización con ATGO" 2.0: guardián y puente.
// - Guardián: mantiene abierta una pestaña de ATGO fijada y en segundo plano, impide que Chrome la congele y la recarga o
//   la reabre si se cierra, se cuelga o deja de enviar datos. Si caduca la sesión, inicia sesión sola con los datos
//   guardados en las opciones (solo en este navegador; nunca en GitHub ni en el código).
// - Puente: lleva los mensajes entre esa pestaña y Despacho, así Despacho recibe datos aunque no haya abierto él ATGO.
// El token de ATGO nunca pasa por aquí: se queda en su pestaña (solo viajan los mensajes de atgo-sync.js).

const ATGO_ORIGIN = 'https://atgo.tier1.es';
const ATGO_URL = ATGO_ORIGIN + '/#/mistickets/';
const PWA_URL = 'https://angriogon.github.io/VISOR-INCIDENCIAS/';
const PWA_MATCH = PWA_URL + '*';
const VERSION = chrome.runtime.getManifest().version;

const SIN_DATOS_MIN = 6;          // sin una carga completa en este tiempo, la pestaña se recarga
const ENTRE_RECARGAS_MIN = 10;    // como mucho una recarga cada 10 minutos
const ENTRE_LOGINS_MIN = 15;      // como mucho un intento de inicio de sesión cada 15 minutos
const PAUSA_TRAS_FALLO_H = 6;     // si un inicio de sesión falla, no se vuelve a intentar en 6 horas (evita bloquear la cuenta)
const AVISO_SIN_DATOS_MIN = 20;   // si tras recargar sigue sin datos, se avisa con una notificación

// ===== Estado (chrome.storage: el service worker se apaga y se vuelve a encender) =====
const DEF_CFG = { guardian: true, autoLogin: true, usuario: '', clave: '' };
async function cfg() { return { ...DEF_CFG, ...(await chrome.storage.local.get(Object.keys(DEF_CFG))) }; }
async function est() { return (await chrome.storage.local.get('estado')).estado || {}; }
async function setEst(cambios) {
  const e = { ...(await est()), ...cambios };
  await chrome.storage.local.set({ estado: e });
  return e;
}
const ahora = () => Date.now();
const min = n => n * 60000;

// ===== Sincronización firmada =====
// atgo-sync.js se descarga de Despacho, pero solo se ejecuta si lo firmó la clave privada del responsable, que no está en GitHub.
// Si la firma falla, es de una versión anterior o no hay red, se usa la última válida o la copia que lleva la extensión.
const SYNC_URL = PWA_URL + 'atgo-sync.js', FIRMA_URL = PWA_URL + 'atgo-sync.firma.json';
const CLAVE_SYNC = { kty: 'EC', crv: 'P-256', x: 'EVPbiPlcDt2sbw-SKqFMP9ZjHzfu82Z5MH381emTKmY', y: 'HbXZwssPKq-5ucE0A6dojqkEs_EgwYGkjgQCZgFbEHU' };
const ENTRE_COMPROBACIONES_MIN = 5;
const versionDe = codigo => (/const SYNC_VERSION = '(\d+\.\d+\.\d+)'/.exec(codigo) || [])[1] || '';
function cmpVersion(a, b) {
  const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); }
  return 0;
}
async function firmaValida(codigo, f) {
  if (!f || typeof f.firma !== 'string' || !f.v || versionDe(codigo) !== f.v) return false;
  try {
    const clave = await crypto.subtle.importKey('jwk', CLAVE_SYNC, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const firma = Uint8Array.from(atob(f.firma), c => c.charCodeAt(0));
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, clave, firma, new TextEncoder().encode('despacho-sync|' + f.v + '|' + codigo));
  } catch (err) { return false; }
}
async function bajar(url) {
  const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 10000);
  try {
    const r = await fetch(url + '?t=' + ahora(), { cache: 'no-store', signal: ctrl.signal });
    if (!r.ok) throw new Error(String(r.status));
    return await r.text();
  } finally { clearTimeout(to); }
}
async function versionEmpaquetada() {
  const r = await fetch(chrome.runtime.getURL('atgo-sync.js'));
  return versionDe(await r.text());
}
// La versión válida más reciente, o null si lo mejor es la copia de la extensión
async function syncFirmada() {
  const empaquetada = await versionEmpaquetada();
  const g = (await chrome.storage.local.get('syncFirmada')).syncFirmada;
  let mejor = g && cmpVersion(g.firma.v, empaquetada) >= 0 && await firmaValida(g.codigo, g.firma) ? g : null;
  try {
    const [texto, json] = await Promise.all([bajar(SYNC_URL), bajar(FIRMA_URL)]);
    const codigo = texto.replace(/\r\n/g, '\n'), firma = JSON.parse(json);
    if (await firmaValida(codigo, firma) && cmpVersion(firma.v, mejor ? mejor.firma.v : empaquetada) >= 0) {
      if (!mejor || cmpVersion(firma.v, mejor.firma.v) > 0) await chrome.storage.local.set({ syncFirmada: { codigo, firma } });
      mejor = { codigo, firma };
    }
  } catch (err) { /* sin red o publicación a medias: sirve la última válida */ }
  return mejor;
}
async function ejecutarSync(tabId) {
  const s = await syncFirmada();
  if (s) {
    try {
      const [r] = await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', args: [s.codigo], func: codigo => {
        const el = document.createElement('script'); el.textContent = codigo; document.documentElement.appendChild(el); el.remove();
        return !!window.__despachoSync;
      } });
      if (r && r.result) return s.firma.v;
    } catch (err) { /* se usa la copia de la extensión */ }
  }
  await chrome.scripting.executeScript({ target: { tabId }, world: 'MAIN', files: ['atgo-sync.js'] });
  return versionEmpaquetada();
}
// Si hay una versión firmada más nueva que la que corre, se recarga solo la pestaña del guardián y solo si está libre
async function pestanaOcupada(tab) {
  try {
    const [r] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: () => !!(window.__despachoSync && window.__despachoSync.ocupado && window.__despachoSync.ocupado()) });
    return !r || r.result !== false;
  } catch (err) { return true; }
}
async function comprobarVersionSync(tab, e) {
  if (ahora() - (e.ultimaComprobacionSync || 0) < min(ENTRE_COMPROBACIONES_MIN)) return;
  await setEst({ ultimaComprobacionSync: ahora() });
  if (!e.syncEnPestana || tab.active || e.enLogin) return;
  const s = await syncFirmada();
  if (!s || cmpVersion(s.firma.v, e.syncEnPestana) <= 0 || await pestanaOcupada(tab)) return;
  await recargar(tab, 'sincronización ' + s.firma.v);
}

// ===== Pestaña gestionada =====
async function pestanaGestionada() {
  const e = await est();
  if (e.tabId == null) return null;
  try {
    const t = await chrome.tabs.get(e.tabId);
    if (t && t.url && t.url.startsWith(ATGO_ORIGIN)) return t;
  } catch (err) { /* ya no existe */ }
  return null;
}

async function abrirPestana() {
  // En una ventana normal (las de aplicaciones, como Despacho instalado, no admiten pestañas)
  const ventanas = await chrome.windows.getAll({ windowTypes: ['normal'] });
  let tab;
  if (ventanas.length) {
    const v = ventanas.find(w => w.focused) || ventanas[0];
    tab = await chrome.tabs.create({ url: ATGO_URL, pinned: true, active: false, windowId: v.id });
  } else {
    const w = await chrome.windows.create({ url: ATGO_URL, focused: false, state: 'minimized' });
    tab = w.tabs[0];
    try { await chrome.tabs.update(tab.id, { pinned: true }); } catch (err) {}
  }
  try { await chrome.tabs.update(tab.id, { autoDiscardable: false }); } catch (err) {}
  await setEst({ tabId: tab.id, abiertaEn: ahora(), ultimaRecarga: ahora(), ultimosDatos: 0, ultimoAviso: 0 });
  return tab;
}

async function recargar(tab, motivo) {
  await setEst({ ultimaRecarga: ahora(), motivoRecarga: motivo });
  // Con un parámetro distinto cada vez para que sea una carga completa (si solo cambiara el #, no se recargaría)
  try { await chrome.tabs.update(tab.id, { url: ATGO_ORIGIN + '/?despacho=' + ahora() + '#/mistickets/', autoDiscardable: false }); } catch (err) {}
}

// Una sola revisión a la vez (la alarma, el cierre de la pestaña y los ajustes pueden coincidir y abrir dos pestañas)
let vigilando = null;
function vigilar() {
  if (!vigilando) vigilando = revisar().catch(() => {}).finally(() => { vigilando = null; });
  return vigilando;
}
async function revisar() {
  const c = await cfg();
  if (!c.guardian) return;
  let tab = await pestanaGestionada();
  if (!tab) {
    // Una pestaña de ATGO que está cargando se presenta sola (hola-atgo): se espera a la próxima revisión.
    // Las que ya están abiertas no se tocan: pueden tener un formulario a medias. El guardián abre la suya.
    const abiertas = await chrome.tabs.query({ url: ATGO_ORIGIN + '/*' });
    if (!abiertas.some(t => t.status === 'loading')) await abrirPestana();
    return;
  }
  try { if (tab.autoDiscardable !== false) await chrome.tabs.update(tab.id, { autoDiscardable: false }); } catch (err) {}
  const e = await est();
  if (tab.discarded || tab.status === 'unloaded') { await recargar(tab, 'congelada'); return; }
  // ¿Está enviando datos? (una carga completa cada 2 minutos)
  const ref = Math.max(e.ultimosDatos || 0, e.abiertaEn || 0, e.ultimaRecarga || 0);
  if (e.enLogin) return;   // esperando a iniciar sesión: lo gestiona el puente
  if (ahora() - ref > min(SIN_DATOS_MIN) && ahora() - (e.ultimaRecarga || 0) > min(ENTRE_RECARGAS_MIN)) {
    await recargar(tab, 'sin datos');
    return;
  }
  if (ahora() - Math.max(e.ultimosDatos || 0, e.abiertaEn || 0) > min(AVISO_SIN_DATOS_MIN) && ahora() - (e.ultimoAviso || 0) > min(60)) {
    await setEst({ ultimoAviso: ahora() });
    avisar('sin-datos', 'ATGO no envía datos', 'Despacho lleva más de ' + AVISO_SIN_DATOS_MIN + ' minutos sin datos de ATGO, aunque se ha recargado la pestaña. Ábrela para ver qué pasa.');
  }
  await comprobarVersionSync(tab, e);
}

function avisar(id, titulo, texto) {
  try {
    chrome.notifications.create('despacho-' + id + '-' + ahora(), {
      type: 'basic', iconUrl: 'icon-128.png', title: titulo, message: texto, priority: 2
    });
  } catch (err) {}
}

// ===== Arranque y vigilancia periódica =====
chrome.runtime.onInstalled.addListener(() => { chrome.alarms.create('vigilar', { periodInMinutes: 1 }); vigilar(); });
chrome.runtime.onStartup.addListener(() => { chrome.alarms.create('vigilar', { periodInMinutes: 1 }); vigilar(); });
// Por si el navegador se actualizó o la alarma se perdió: se comprueba cada vez que se enciende el service worker
chrome.alarms.get('vigilar').then(a => { if (!a) chrome.alarms.create('vigilar', { periodInMinutes: 1 }); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'vigilar') vigilar(); });
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const e = await est();
  if (e.tabId === tabId) { await setEst({ tabId: null }); setTimeout(vigilar, 3000); }   // se cerró: se reabre
});
chrome.storage.onChanged.addListener((ch) => { if (ch.guardian) vigilar(); });

// ===== Mensajes de los puentes =====
async function aDespacho(msg) {
  const tabs = await chrome.tabs.query({ url: PWA_MATCH });
  for (const t of tabs) { try { await chrome.tabs.sendMessage(t.id, { tipo: 'de-atgo', msg }); } catch (err) {} }
}
async function aAtgo(msg) {
  const tab = await pestanaGestionada();
  if (!tab) return false;
  try { await chrome.tabs.sendMessage(tab.id, { tipo: 'a-atgo', msg }); return true; } catch (err) { return false; }
}
async function mostrarAtgo() {
  let tab = await pestanaGestionada();
  if (!tab) tab = await abrirPestana();
  try { await chrome.tabs.update(tab.id, { active: true }); await chrome.windows.update(tab.windowId, { focused: true, state: 'normal' }); } catch (err) {}
}
async function abrirDespacho() {
  const tabs = await chrome.tabs.query({ url: PWA_MATCH });
  if (tabs.length) {
    try { await chrome.tabs.update(tabs[0].id, { active: true }); await chrome.windows.update(tabs[0].windowId, { focused: true }); } catch (err) {}
  } else {
    await chrome.tabs.create({ url: PWA_URL + '#inc' });
  }
}

async function avisarSinLogin(c, e) {
  if (ahora() - (e.avisoSinClave || 0) > min(60)) {
    await setEst({ avisoSinClave: ahora() });
    avisar('login', 'ATGO: sesión caducada', c.autoLogin ? 'Guarda tu usuario y contraseña en las opciones de la extensión para que inicie sesión sola.' : 'Inicia sesión en la pestaña de ATGO.');
  }
  await setEst({ enLogin: true });
}

chrome.runtime.onMessage.addListener((m, sender, responder) => {
  (async () => {
    const e = await est();
    const desdeGestionada = sender.tab && sender.tab.id === e.tabId;
    switch (m && m.tipo) {
      // Se ejecuta en la página de ATGO la última sincronización con firma válida o, si no la hay, la copia de la extensión
      case 'arrancar-sync': {
        const c = await cfg();
        if (!sender.tab || !(sender.tab.url || '').startsWith(ATGO_ORIGIN) || (c.guardian && !desdeGestionada)) return responder(false);
        try { const v = await ejecutarSync(sender.tab.id); if (desdeGestionada) await setEst({ syncEnPestana: v }); return responder(true); }
        catch (err) { return responder(false); }
      }
      // Puente de ATGO al cargar: ¿es la pestaña que gestiono?
      case 'hola-atgo': {
        const c = await cfg();
        if (!c.guardian) return responder({ gestionada: null, v: VERSION });   // guardián apagado: como la extensión 1.x
        if (!desdeGestionada && !(await pestanaGestionada())) {
          // No hay ninguna gestionada (p. ej. tras reiniciar el navegador): esta pasa a serlo
          await setEst({ tabId: sender.tab.id, abiertaEn: ahora(), ultimosDatos: 0 });
          try { await chrome.tabs.update(sender.tab.id, { autoDiscardable: false, pinned: true }); } catch (err) {}
          return responder({ gestionada: true, v: VERSION });
        }
        return responder({ gestionada: desdeGestionada, v: VERSION });
      }
      case 'de-atgo': {
        if (!desdeGestionada) return responder(false);
        const msg = m.msg || {};
        if (msg.type === 'atgo-data' && !msg.partial) await setEst({ ultimosDatos: ahora(), enLogin: false, ultimoAviso: 0 });
        await aDespacho(msg);
        return responder(true);
      }
      case 'a-atgo': return responder(await aAtgo(m.msg));
      case 'accion': {
        if (m.accion === 'mostrar-atgo') await mostrarAtgo();
        else if (m.accion === 'reabrir-atgo') { const t = await pestanaGestionada(); if (t) await recargar(t, 'reconexión pedida'); else await abrirPestana(); }
        else if (m.accion === 'abrir-despacho') await abrirDespacho();
        return responder(true);
      }
      case 'estado-guardian': return responder({ v: VERSION, cfg: { ...(await cfg()), clave: undefined, hayClave: !!(await cfg()).clave }, estado: e, gestionada: !!(await pestanaGestionada()) });

      // ===== Inicio de sesión automático (solo la pestaña gestionada) =====
      // La sesión ha caducado: ¿hay datos para entrar solo? Si no, se avisa y no se toca nada de la sesión ni de la pestaña.
      case 'puede-login': {
        if (!desdeGestionada) return responder({ ok: false });
        const c = await cfg();
        if (c.autoLogin && c.usuario && c.clave && !(e.loginPausadoHasta && ahora() < e.loginPausadoHasta)) return responder({ ok: true });
        await avisarSinLogin(c, e);
        return responder({ ok: false });
      }
      case 'pedir-login': {
        if (!desdeGestionada) return responder({ ok: false });
        const c = await cfg();
        if (!c.autoLogin || !c.usuario || !c.clave) {
          await avisarSinLogin(c, e);
          return responder({ ok: false });
        }
        if (e.loginPausadoHasta && ahora() < e.loginPausadoHasta) return responder({ ok: false, motivo: 'pausado' });
        if (ahora() - (e.ultimoLogin || 0) < min(ENTRE_LOGINS_MIN)) return responder({ ok: false, motivo: 'reciente' });
        await setEst({ ultimoLogin: ahora(), enLogin: true });
        return responder({ ok: true, usuario: c.usuario, clave: c.clave });
      }
      case 'login-resultado': {
        if (!desdeGestionada) return responder(false);
        if (m.ok) {
          await setEst({ enLogin: false, loginPausadoHasta: 0, ultimoLoginOk: ahora() });
        } else {
          await setEst({ enLogin: true, loginPausadoHasta: ahora() + PAUSA_TRAS_FALLO_H * 3600000 });
          avisar('login-fallo', 'ATGO: no he podido iniciar sesión', 'Revisa el usuario y la contraseña en las opciones de la extensión, o inicia sesión a mano en la pestaña de ATGO. No lo reintentaré en ' + PAUSA_TRAS_FALLO_H + ' horas para no bloquear tu cuenta.');
        }
        return responder(true);
      }
      case 'probar-login': {   // desde las opciones: borra la pausa para volver a intentarlo ya
        await setEst({ loginPausadoHasta: 0, ultimoLogin: 0 });
        const t = await pestanaGestionada();
        if (t) await recargar(t, 'prueba de inicio de sesión'); else await abrirPestana();
        return responder(true);
      }
      default: return responder(false);
    }
  })();
  return true;   // respuesta asíncrona
});
