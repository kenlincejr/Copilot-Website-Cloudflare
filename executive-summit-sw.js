/* Service worker for the Executive Summit guide only (registered with scope /executive-summit.html).
   It keeps the guide, its icons and the resort maps available on weak resort Wi-Fi.
   The page itself is network-first, so new agenda changes always win when there is a signal. */
const CACHE = 'summit-guide-v1';
const PAGE = '/executive-summit.html';
const ASSETS = [
  '/executive-summit.webmanifest',
  '/assets/summit/icon-180.png',
  '/assets/summit/icon-192.png',
  '/assets/summit/icon-512.png',
  '/assets/summit/resort-map-1.webp',
  '/assets/summit/resort-map-2.webp'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled([PAGE, ...ASSETS].map(u => cache.add(new Request(u, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('summit-guide-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (url.pathname === PAGE) {                       // the page: network first, cache as the fallback
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const net = await Promise.race([
          fetch(req),
          new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4500))
        ]);
        if (net && net.ok) cache.put(PAGE, net.clone());
        return net;
      } catch (e) {
        const hit = await cache.match(PAGE);
        if (hit) return hit;
        return fetch(req);
      }
    })());
    return;
  }

  if (ASSETS.includes(url.pathname)) {               // maps and icons: cache first, refresh in the background
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(url.pathname);
      const refresh = fetch(req).then(r => { if (r && r.ok) cache.put(url.pathname, r.clone()); return r; }).catch(() => null);
      return hit || (await refresh) || Response.error();
    })());
  }
});
