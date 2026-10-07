// Extensión "Despacho · sincronización con ATGO".
// Hace lo mismo que el favorito ⟳ Despacho ATGO, pero sola: cuando hay sesión iniciada en ATGO,
// añade a la página el script de sincronización publicado en GitHub Pages. No lee ni guarda nada por su cuenta.
(function () {
  const SYNC = 'https://angriogon.github.io/VISOR-INCIDENCIAS/atgo-sync.js';
  function conSesion() {
    try { return !!localStorage.getItem('token') && !/#\/login/.test(location.hash); } catch (e) { return false; }
  }
  function arrancar() {
    if (document.getElementById('despacho-sync')) return;
    const s = document.createElement('script');
    s.id = 'despacho-sync';
    s.src = SYNC + '?v=' + Date.now();
    (document.body || document.documentElement).appendChild(s);
  }
  // Espera a que inicies sesión (si aún no lo has hecho) y arranca una sola vez
  const t = setInterval(() => { if (conSesion()) { clearInterval(t); arrancar(); } }, 2000);
  if (conSesion()) { clearInterval(t); arrancar(); }
})();
