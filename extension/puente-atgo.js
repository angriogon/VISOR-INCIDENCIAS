// Puente en la pestaña de ATGO (mundo aislado de la extensión, no el de la página).
// - Pregunta al guardián si esta es la pestaña que gestiona y lo deja marcado en la página (data-despacho-*),
//   para que atgo.js arranque la sincronización solo en ella y atgo-sync.js mande los mensajes por el puente.
// - Lleva los mensajes entre atgo-sync.js (la página) y la extensión.
// - Si la sesión caduca, inicia sesión sola con los datos de las opciones de la extensión (si están guardados).
// El token de ATGO no se lee ni se envía: solo se mira su fecha de caducidad.
(function () {
  const raiz = document.documentElement;
  const ATGO_URL = location.origin + '/#/mistickets/';
  const enviar = (m) => chrome.runtime.sendMessage(m).catch(() => null);

  chrome.runtime.sendMessage({ tipo: 'hola-atgo' }).then((r) => {
    if (!r || r.gestionada === null) return;              // guardián apagado: la extensión funciona como la 1.x
    raiz.dataset.despachoGestionada = r.gestionada ? 'si' : 'no';
    if (!r.gestionada) return;
    raiz.dataset.despachoPuente = r.v || '2';

    // Página → extensión (mensajes de atgo-sync.js para Despacho, y botón ↗ del recuadro)
    window.addEventListener('message', (e) => {
      if (e.source !== window || !e.data || typeof e.data !== 'object') return;
      if (e.data.__despacho === 'de-atgo' && e.data.msg) enviar({ tipo: 'de-atgo', msg: e.data.msg });
      else if (e.data.__despacho === 'abrir-despacho') enviar({ tipo: 'accion', accion: 'abrir-despacho' });
    });
    // Extensión → página (mensajes de Despacho para atgo-sync.js)
    chrome.runtime.onMessage.addListener((m) => {
      if (m && m.tipo === 'a-atgo' && m.msg) window.postMessage({ __despacho: 'a-atgo', msg: m.msg }, location.origin);
    });

    vigilarSesion();
  }).catch(() => {});

  // ===== Sesión =====
  function sesionValida(margenMs) {
    try {
      if (!localStorage.getItem('token')) return false;
      const exp = Number(localStorage.getItem('expires'));
      return !exp || exp * 1000 > Date.now() + (margenMs || 0);
    } catch (e) { return false; }
  }
  const enLogin = () => /#\/login/.test(location.hash) || !!campoClave();
  function campoClave() {
    const c = [...document.querySelectorAll('input[type="password"]')].find(visible);
    return c || null;
  }
  function visible(el) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }

  let intentando = false;
  function vigilarSesion() {
    const revisar = () => {
      if (intentando) return;
      // Caducada o a punto de caducar (10 min): se cierra la sesión vieja y se inicia una nueva
      if (!sesionValida(10 * 60000) && !enLogin()) {
        try { localStorage.removeItem('token'); localStorage.removeItem('expires'); } catch (e) {}
        location.replace(location.origin + '/#/login');
        return;
      }
      if (!sesionValida(0) && enLogin()) iniciarSesion();
    };
    setTimeout(revisar, 3000);
    setInterval(revisar, 30000);
  }

  async function esperar(cond, ms) {
    const fin = Date.now() + ms;
    while (Date.now() < fin) { const v = cond(); if (v) return v; await new Promise(r => setTimeout(r, 500)); }
    return null;
  }

  // Rellena un campo como si se escribiera (vale para Angular, React y formularios normales)
  function escribir(el, valor) {
    el.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, valor);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  async function iniciarSesion() {
    intentando = true;
    try {
      const clave = await esperar(campoClave, 20000);
      if (!clave) return;
      const r = await enviar({ tipo: 'pedir-login' });
      if (!r || !r.ok) return;

      const form = clave.closest('form') || document;
      const campos = [...form.querySelectorAll('input')].filter(i => visible(i) && /^(text|email|)$/i.test(i.type || ''));
      const usuario = campos.find(i => /user|usu|login|mail|nombre/i.test((i.name || '') + (i.id || '') + (i.placeholder || '') + (i.getAttribute('formcontrolname') || '')))
        || campos.filter(i => i.compareDocumentPosition(clave) & Node.DOCUMENT_POSITION_FOLLOWING).pop() || campos[0];
      if (!usuario) { enviar({ tipo: 'login-resultado', ok: false }); return; }

      escribir(usuario, r.usuario);
      escribir(clave, r.clave);
      // Casilla «Recordarme», si existe
      [...form.querySelectorAll('input[type="checkbox"]')].forEach(ch => {
        const txt = ((ch.closest('label') || {}).textContent || '') + (ch.name || '') + (ch.id || '');
        if (/record|remember|mantener/i.test(txt) && !ch.checked) ch.click();
      });
      await new Promise(res => setTimeout(res, 400));
      const boton = form.querySelector('button[type="submit"], input[type="submit"]')
        || [...form.querySelectorAll('button')].find(b => visible(b) && /entrar|acceder|iniciar|login|aceptar/i.test(b.textContent || ''));
      if (boton) boton.click();
      else if (form.requestSubmit) form.requestSubmit();
      else clave.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));

      const ok = await esperar(() => sesionValida(0) && !campoClave(), 25000);
      enviar({ tipo: 'login-resultado', ok: !!ok });
      if (ok && !/#\/mistickets/.test(location.hash)) location.replace(ATGO_URL);
    } finally {
      intentando = false;
    }
  }
})();
