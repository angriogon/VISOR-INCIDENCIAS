// Puente en Despacho (mundo aislado de la extensión): lleva los mensajes entre Despacho y la pestaña de ATGO que vigila
// el guardián. Solo pasan los mensajes de atgo-sync.js (datos de tickets, hilos, ediciones); el token de ATGO no.
(function () {
  const anunciar = () => window.postMessage({ __despacho: 'puente', v: chrome.runtime.getManifest().version }, location.origin);
  chrome.runtime.sendMessage({ tipo: 'estado-guardian' }).then((r) => {
    if (!r || !r.cfg || !r.cfg.guardian) return;   // guardián apagado: Despacho funciona como con la extensión 1.x
    // Extensión → página
    chrome.runtime.onMessage.addListener((m) => {
      if (m && m.tipo === 'de-atgo' && m.msg) window.postMessage({ __despacho: 'de-atgo', msg: m.msg }, location.origin);
    });
    // Página → extensión
    window.addEventListener('message', (e) => {
      if (e.source !== window || !e.data || typeof e.data !== 'object') return;
      if (e.data.__despacho === 'a-atgo' && e.data.msg) chrome.runtime.sendMessage({ tipo: 'a-atgo', msg: e.data.msg }).catch(() => {});
      else if (e.data.__despacho === 'a-extension' && /^(mostrar-atgo|reabrir-atgo)$/.test(e.data.accion || '')) chrome.runtime.sendMessage({ tipo: 'accion', accion: e.data.accion }).catch(() => {});
    });
    // Se anuncia al cargar y otra vez cuando la página ya ha montado su escucha (app.js va al final)
    anunciar();
    if (document.readyState !== 'complete') window.addEventListener('load', anunciar, { once: true });
    setTimeout(anunciar, 3000);
  }).catch(() => {});
})();
