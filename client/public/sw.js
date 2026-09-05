const CACHE_NAME = 'zenith-finance-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const urlString = req.url;

  // 1. STRICT SCHEME GUARD: Only handle http/https requests
  if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
    return; // Bypass chrome-extension://, moz-extension://, ws://, etc.
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch {
    return;
  }

  // 2. DEV GUARD: Do not intercept Vite dev server / HMR / internal files
  if (
    parsedUrl.port === '5173' ||
    parsedUrl.pathname.includes('/@vite/') ||
    parsedUrl.pathname.includes('/@fs/') ||
    parsedUrl.pathname.includes('/@id/') ||
    parsedUrl.pathname.startsWith('/src/') ||
    parsedUrl.search.includes('?token=') ||
    parsedUrl.search.includes('&token=')
  ) {
    return;
  }

  // 3. API GUARD: Let backend API requests pass directly to network
  if (parsedUrl.pathname.includes('/api/')) {
    return;
  }

  // 4. EXTERNAL / EXTENSION SCRIPT GUARD: Ignore foreign origin scripts
  if (parsedUrl.origin !== self.location.origin) {
    return;
  }

  // 5. NAVIGATION REQUESTS (HTML): Network-First with safe offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // 6. STATIC ASSETS: Cache-First with safe network fetch and error catching
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && req.method === 'GET') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
          }
          return networkResponse;
        })
        .catch((err) => {
          // Never let promise reject into the browser console for missing assets
          return new Response('', { status: 404, statusText: 'Not Found' });
        });
    })
  );
});
