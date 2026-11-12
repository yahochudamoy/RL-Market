const CACHE_NAME = 'rl-market-master-v3.3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/modules.css',
  './js/app.js',
  './js/config.js',
  './js/state.js',
  './js/ui-catalog.js',
  './js/ui-favorites.js',
  './js/ui-cart.js',
  './js/ui-nesting.js',
  './js/dxf-worker.js',
  './js/admin.js',
  './js/editor.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('supabase.co')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
