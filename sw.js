// Versioned service worker for GitHub Pages/static hosting.
// Uses relative paths and aggressively clears older caches so new builds appear.
const CACHE_NAME = 'atc-sim-cache-v7-2026-03-21-16-35';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css?v=2026-03-21-16-35-v7',
  './script.js?v=2026-03-21-16-35-v7',
  './manifest.json',
  './assets/bg_runway.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((response) => response || caches.match('./index.html')))
  );
});
