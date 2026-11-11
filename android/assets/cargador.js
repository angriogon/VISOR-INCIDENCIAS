// Se inyecta en cada página de ATGO dentro de la app. Con la sesión iniciada abre Despacho móvil (una vez por carga)
// y, si lo cierras u ocultas, deja un botón «Despacho» para volver. Igual que el favorito: descarga movil.js y solo
// lo ejecuta si su firma es válida y su versión no es anterior a la última usada.
(function () {
  if (window.__despachoCargador) return;
  window.__despachoCargador = true;
  var BASE = 'https://angriogon.github.io/VISOR-INCIDENCIAS/';
  var CLAVE = { kty: 'EC', crv: 'P-256', x: 'EVPbiPlcDt2sbw-SKqFMP9ZjHzfu82Z5MH381emTKmY', y: 'HbXZwssPKq-5ucE0A6dojqkEs_EgwYGkjgQCZgFbEHU' };
  var abiertoUnaVez = false, cargando = false;
  function conSesion() { try { return !!localStorage.getItem('token') && !/#\/login/.test(location.hash); } catch (e) { return false; } }
  function vista() { return document.getElementById('despacho-movil'); }
  function num(v) { return String(v).split('.').reduce(function (a, b) { return a * 1000 + Number(b); }, 0); }
  async function abrir() {
    var v = vista();
    if (v && window.__despachoMovil) { v.style.display = ''; return; }
    if (cargando) return;
    cargando = true;
    try {
      var t = '?t=' + Date.now(), o = { cache: 'no-store' };
      var r = await Promise.all([fetch(BASE + 'movil.js' + t, o).then(function (x) { return x.text(); }), fetch(BASE + 'movil.firma.json' + t, o).then(function (x) { return x.json(); })]);
      var codigo = r[0].split('\r\n').join('\n'), f = r[1], usada = localStorage.getItem('despachoMovilV') || '0.0.0';
      var clave = await crypto.subtle.importKey('jwk', CLAVE, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
      var firma = Uint8Array.from(atob(f.firma), function (c) { return c.charCodeAt(0); });
      var ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, clave, firma, new TextEncoder().encode('despacho-movil|' + f.v + '|' + codigo));
      if (!ok || codigo.indexOf("MOVIL_VERSION = '" + f.v + "'") < 0 || num(f.v) < num(usada)) throw new Error('copia no válida');
      localStorage.setItem('despachoMovilV', f.v);
      var s = document.createElement('script'); s.textContent = codigo; document.documentElement.appendChild(s); s.remove();
    } catch (e) {
      alert('No se ha podido abrir Despacho: ' + (e && e.message || e) + '. Comprueba la conexión y pulsa el botón Despacho.');
    } finally { cargando = false; }
  }
  function boton() {
    var b = document.getElementById('despacho-boton'), v = vista(), visible = v && v.style.display !== 'none';
    if (!conSesion() || visible || cargando) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('button');
      b.id = 'despacho-boton'; b.type = 'button'; b.textContent = 'Despacho';
      b.style.cssText = 'position:fixed;right:16px;bottom:24px;z-index:2147483646;min-height:48px;padding:0 20px;border:0;border-radius:24px;background:rgb(133,86,18);color:white;font:600 16px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.35)';
      b.onclick = abrir;
      (document.body || document.documentElement).appendChild(b);
    }
  }
  setInterval(function () {
    if (!abiertoUnaVez && conSesion()) { abiertoUnaVez = true; abrir(); }
    boton();
  }, 1000);
})();
