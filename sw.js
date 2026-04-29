const CACHE_NAME = 'iri-app-v17';

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
  const req = event.request;

  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (_) {
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (url.href.includes('script.google.com') ||
      url.href.includes('googleapis.com') ||
      url.pathname.endsWith('/exec')) {
    return;
  }

  if (url.pathname.endsWith('/dashboard.html') ||
      url.pathname.endsWith('/dashboard-i18n.js') ||
      url.pathname.endsWith('/idara-notify-ov.js') ||
      url.pathname.endsWith('/service-worker.js')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const isDoc = req.mode === 'navigate' || /\.html($|\?)/.test(url.href);
        if (!isDoc) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            try { cache.put(req, copy); } catch (_) { /* ignore */ }
          });
        }
        return response;
      })
      .catch(() => caches.match(req))
  );
});
