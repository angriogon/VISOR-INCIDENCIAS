// Extensión "Despacho · sincronización con ATGO".
// Hace lo mismo que el favorito ⟳ Despacho ATGO, pero sola: cuando hay sesión iniciada en ATGO,
// añade a la página el script de sincronización publicado en GitHub Pages. No lee ni guarda nada por su cuenta.
// Se ejecuta en el mundo de la página ("world": "MAIN" en manifest.json), igual que el favorito: desde el mundo
// aislado de la extensión, Chrome bloquea cargar scripts de otra web (CSP de Manifest V3).
// 2.0: con el guardián activo solo sincroniza la pestaña que él vigila (puente-atgo.js la marca con data-despacho-gestionada);
// en las demás pestañas de ATGO no arranca, para no cargar dos veces ni pisar a la buena.
(function () {
  const SYNC = 'https://angriogon.github.io/VISOR-INCIDENCIAS/atgo-sync.js';
  const raiz = document.documentElement;
  const inicio = Date.now();
  function conSesion() {
    try { return !!localStorage.getItem('token') && !/#\/login/.test(location.hash); } catch (e) { return false; }
  }
  // 'si' / 'no' lo pone el puente; si no llega en 6 s (guardián apagado o extensión antigua) se arranca como antes
  function toca() {
    const g = raiz.dataset.despachoGestionada;
    if (g === 'no') return false;
    return g === 'si' || Date.now() - inicio > 6000;
  }
  function arrancar() {
    if (document.getElementById('despacho-sync')) return;
    const s = document.createElement('script');
    s.id = 'despacho-sync';
    s.src = SYNC + '?v=' + Date.now();
    (document.body || document.documentElement).appendChild(s);
  }
  const listo = () => conSesion() && toca();
  // Espera a que haya sesión (si aún no la hay) y arranca una sola vez
  const t = setInterval(() => {
    if (raiz.dataset.despachoGestionada === 'no') { clearInterval(t); return; }
    if (listo()) { clearInterval(t); arrancar(); }
  }, 1000);
})();
