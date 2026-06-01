const CACHE_NAME = 'auto-mentenanta-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  '/manifest.json'
];

// Install: precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('Cache addAll failed (unimportant in dev):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: remove old caches
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

// Push: afișează notificarea trimisă de server (merge și cu aplicația închisă)
self.addEventListener('push', (event) => {
  let date = { titlu: 'Auto-Mentenanță', corp: 'Ai o notificare nouă', url: '/notificari' };
  try {
    if (event.data) date = { ...date, ...event.data.json() };
  } catch (e) { /* payload simplu, ignorăm */ }

  event.waitUntil(
    self.registration.showNotification(date.titlu, {
      body: date.corp,
      icon: '/icons/icon-192-removeb.png',
      badge: '/icons/icon-192-removeb.png',
      data: { url: date.url || '/notificari' },
      vibrate: [100, 50, 100],
    })
  );
});

// Click pe notificare: deschide aplicația la pagina relevantă
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/notificari';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      const existent = lista.find((c) => c.url.includes(url));
      if (existent) return existent.focus();
      return clients.openWindow(url);
    })
  );
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle http/https — chrome-extension:// and others are not cacheable
  if (!url.protocol.startsWith('http')) return;

  // API calls: always network, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigare (pagina HTML): network-first, ca să primești mereu ultima versiune
  // după un deploy nou. Cache-ul rămâne doar pentru offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', cloned));
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Restul (JS/CSS/imagini — au hash în nume, deci sigure la cache): cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok && event.request.method === 'GET') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      });
    })
  );
});