// Service worker del Panel de Despacho.
// Sube VERSION cada vez que publiques cambios para que la app instalada se actualice.
const VERSION = 'despacho-v1.5.0';
const SHELL = [
  './',
  './index.html',
  './dia.js',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);
    // La librería de Excel se guarda para poder importar sin conexión.
    try { await cache.add(new Request(XLSX_URL, { mode: 'cors' })); } catch (e) { /* se reintenta al usarla */ }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Páginas: primero red (para recibir actualizaciones), si no hay conexión, caché.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(VERSION);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  // Resto (iconos, librería, fuentes): primero caché, si no, red y se guarda.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        const cache = await caches.open(VERSION);
        cache.put(req, res.clone());
      }
      return res;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});

// Clic en un aviso de Windows: trae Despacho al frente (o lo abre) en "Mi día".
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const win = all.find(c => c.url.startsWith(self.registration.scope));
    if (win) { await win.focus(); win.postMessage({ type: 'show-dia' }); }
    else await self.clients.openWindow('./#dia');
  })());
});
