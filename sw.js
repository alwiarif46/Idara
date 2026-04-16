const CACHE_NAME = 'iri-app-v9';

/** Offline shell: split modules from index.html (bump CACHE_NAME when this list changes). */
const PRECACHE_URLS = [
  './constants.js',
  './helpers.js',
  './components.js',
  './storage.js',
  './modern.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Let Apps Script requests go straight to network — no SW interference
  if (event.request.url.includes('script.google.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('/exec')) {
    return;
  }

  // For everything else: network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
