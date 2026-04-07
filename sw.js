const CACHE_NAME = 'iri-app-v6';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
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
  if (event.request.url.includes('script.google.com') || event.request.url.includes('/exec')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response(JSON.stringify({ success: false, error: 'OFFLINE' }), {
          headers: { 'Content-Type': 'application/json' }
        }))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request))
    );
  }
});
