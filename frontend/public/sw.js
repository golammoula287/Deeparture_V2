const CACHE = 'deeparture-customer-offline-v1';
const OFFLINE = '/offline.html';
const OFFLINE_ASSETS = [OFFLINE, '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
const CUSTOMER_PAGE = /^(?:\/$|\/(?:about-us|contact|featured-trips|special-offers|why-deeparture|destinations|explore\/(?:liveaboards|resorts))\/?$|\/(?:destinations|liveaboards|resorts)\/[a-z0-9-]+\/?$)/;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(OFFLINE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('deeparture-customer-offline-') && key !== CACHE).map(key => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const { origin, pathname } = new URL(request.url);
  if (origin !== self.location.origin) return;
  if (OFFLINE_ASSETS.includes(pathname)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(pathname)).then(response => response || fetch(request)));
  } else if (request.mode === 'navigate' && CUSTOMER_PAGE.test(pathname)) {
    event.respondWith(fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return await cache.match(OFFLINE) || Response.error();
    }));
  }
});
