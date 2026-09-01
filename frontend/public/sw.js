// Minimal offline shell cache — SPEC.md §6: "Service worker caches the shell, today's
// module, and the log form." Pages get cached as the trainee actually visits them
// (network-first, falling back to cache), which naturally covers exactly those pages.
// API requests are never intercepted here — the offline log queue (src/offline/logQueue.js)
// handles that at the application level instead.

const CACHE = 'neev-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return; // never cache API responses

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((res) => {
        caches.open(CACHE).then((c) => c.put(request, res.clone()));
        return res;
      }).catch(() => caches.match(request).then((r) => r || caches.match('/'))),
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        }).catch(() => cached);
        return cached || network;
      }),
    );
  }
});
