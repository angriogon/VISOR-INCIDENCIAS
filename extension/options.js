const $ = id => document.getElementById(id);
const hace = t => {
  if (!t) return 'nunca';
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? 'ahora mismo' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.round(m / 60) + ' h' : new Date(t).toLocaleString('es-ES');
};
const fila = (a, b, cls) => `<div><span>${a}</span><span class="${cls || ''}">${b}</span></div>`;
function mensaje(t, err) { $('msg').textContent = t; $('msg').className = err ? 'err' : 'ok'; }

async function pintar() {
  const r = await chrome.runtime.sendMessage({ tipo: 'estado-guardian' });
  if (!r) return;
  const c = r.cfg, e = r.estado || {};
  $('ver').textContent = 'Extensión ' + r.v;
  $('guardian').checked = !!c.guardian;
  $('autoLogin').checked = !!c.autoLogin;
  if (document.activeElement !== $('usuario')) $('usuario').value = c.usuario || '';
  $('clave').placeholder = c.hayClave ? '•••••••• (guardada; escribe otra para cambiarla)' : 'Sin guardar';
  const datosOk = e.ultimosDatos && Date.now() - e.ultimosDatos < 10 * 60000;
  const pausa = e.loginPausadoHasta && Date.now() < e.loginPausadoHasta;
  $('estado').innerHTML =
    fila('Vigilancia', c.guardian ? 'activada' : 'apagada', c.guardian ? 'ok' : 'err') +
    fila('Pestaña de ATGO', r.gestionada ? 'abierta' : 'no abierta', r.gestionada ? 'ok' : 'err') +
    fila('Últimos datos enviados', hace(e.ultimosDatos), datosOk ? 'ok' : 'err') +
    fila('Última recarga', hace(e.ultimaRecarga) + (e.motivoRecarga ? ' (' + e.motivoRecarga + ')' : '')) +
    fila('Último inicio de sesión automático', hace(e.ultimoLoginOk)) +
    (pausa ? fila('Inicio de sesión', 'en pausa hasta ' + new Date(e.loginPausadoHasta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }), 'err') : '') +
    (c.autoLogin && !(c.usuario && c.hayClave) ? fila('Inicio de sesión', 'faltan usuario o contraseña', 'err') : '');
}

$('guardar').onclick = async () => {
  const cambios = { guardian: $('guardian').checked, autoLogin: $('autoLogin').checked, usuario: $('usuario').value.trim() };
  if ($('clave').value) cambios.clave = $('clave').value;
  await chrome.storage.local.set(cambios);
  $('clave').value = '';
  mensaje('Guardado ✓');
  pintar();
};
$('borrar').onclick = async () => { await chrome.storage.local.set({ clave: '' }); mensaje('Contraseña borrada'); pintar(); };
$('probar').onclick = async () => {
  await chrome.runtime.sendMessage({ tipo: 'probar-login' });
  mensaje('Recargando ATGO… si la sesión ha caducado, iniciará sesión en unos segundos.');
  setTimeout(pintar, 4000);
};
$('ver-atgo').onclick = () => chrome.runtime.sendMessage({ tipo: 'accion', accion: 'mostrar-atgo' });
$('reabrir').onclick = async () => { await chrome.runtime.sendMessage({ tipo: 'accion', accion: 'reabrir-atgo' }); mensaje('Recargando ATGO…'); setTimeout(pintar, 4000); };
// Los interruptores se guardan al momento
$('guardian').onchange = () => chrome.storage.local.set({ guardian: $('guardian').checked }).then(pintar);
$('autoLogin').onchange = () => chrome.storage.local.set({ autoLogin: $('autoLogin').checked }).then(pintar);

pintar();
setInterval(pintar, 15000);
