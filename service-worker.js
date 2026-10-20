const CACHE_NAME = 'dm-forge-v7';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/initiative.js',
  './js/encounter.js',
  './js/vault.js',
  './js/npc.js',
  './js/characters.js',
  './js/loot.js',
  './js/notes.js',
  './js/spells.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local assets immediately, external fonts best-effort
      const localAssets = ASSETS.filter(a => !a.startsWith('http'));
      const extAssets = ASSETS.filter(a => a.startsWith('http'));
      return cache.addAll(localAssets).then(() => {
        return Promise.allSettled(extAssets.map(url => cache.add(url)));
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Network-first for navigation, cache-first for assets
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('./index.html')
      )
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        return response;
      }).catch(() => cached);
    })
  );
});
