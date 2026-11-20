/* ==========================================================================
   AURA STUDIO — PRODUCTION SERVICE WORKER
   - Application Shell Precaching & Offline Fallback
   - Strictly Bypasses all user audio, IndexedDB, Audius, YouTube, and Supabase
   ========================================================================== */

const CACHE_NAME = 'aura-shell-v3';

// Static Shell Assets for Instant App Shell Boot
const PRECACHE_ASSETS = [
  '/site.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // 1. Only handle GET requests. Never intercept POST, PUT, DELETE, etc.
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // 2. Never intercept WebSocket or non-http protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // 3. Audio & Video safety: NEVER intercept range requests or media streaming
  if (
    req.headers.has('range') ||
    req.destination === 'audio' ||
    req.destination === 'video'
  ) {
    return;
  }

  // 4. Bypass external streaming & real-time APIs
  const bypassHosts = [
    'supabase.co',
    'audius.co',
    'youtube.com',
    'youtube-nocookie.com',
    'googlevideo.com',
    'ytimg.com',
    'googleapis.com',
    'gstatic.com'
  ];

  if (bypassHosts.some((host) => url.hostname.includes(host))) {
    return;
  }

  // 5. Bypass internal API endpoints, Vite dev modules, AI Studio iframe bridge, and Listen Together WS
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/ws') ||
    url.pathname.startsWith('/listen-sync') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/_aistudio') ||
    url.pathname.startsWith('/_vercel')
  ) {
    return;
  }

  // 6. Navigation requests (HTML document loading)
  // Network first; fall back to cached index.html only if offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return new Response('AURA Studio is currently offline. Please check your connection.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // 7. Same-origin Immutable Built Assets (/assets/..., icons, fonts)
  if (url.origin === self.location.origin) {
    const isStaticAsset =
      url.pathname.startsWith('/assets/') ||
      /\.(svg|png|jpg|jpeg|webp|ico|woff2?|ttf|eot)$/i.test(url.pathname);

    if (isStaticAsset) {
      event.respondWith(
        caches.match(req).then((cachedResponse) => {
          if (cachedResponse) {
            fetch(req)
              .then((networkResponse) => {
                const ct = networkResponse?.headers?.get('content-type') || '';
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic' && !ct.includes('text/html')) {
                  const toCache = networkResponse.clone();
                  caches.open(CACHE_NAME).then((cache) => cache.put(req, toCache));
                }
              })
              .catch(() => {});
            return cachedResponse;
          }

          return fetch(req).then((networkResponse) => {
            const ct = networkResponse?.headers?.get('content-type') || '';
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' || ct.includes('text/html')) {
              return networkResponse;
            }
            const toCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, toCache));
            return networkResponse;
          });
        })
      );
      return;
    }
  }
});
