// Simple service worker for offline caching of static assets
// Bump the cache name to invalidate old cached files whenever the game is updated.
// If you make further changes to the game files, increment this version string.
const CACHE_NAME = 'atc-sim-cache-v2';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/assets/bg_runway.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});