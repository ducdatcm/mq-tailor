/* Offline worker for the in-store tablet. The build fills in the build id and the list of files below (see vite.config.ts).
 *
 * The first visit keeps a full copy of the app on the tablet, so it opens and works without the
 * internet afterwards. The page itself and config.json are always asked from the network first, so a
 * new version or a new spreadsheet address is picked up as soon as there is a connection. */
const CACHE = 'mq-tablet-2026-11-13 03:27';
const PRECACHE = ["./","./assets/be-vietnam-pro-latin-400-normal-PpnXBOrz.woff2","./assets/be-vietnam-pro-latin-500-normal-B6LVzGNe.woff2","./assets/be-vietnam-pro-latin-600-normal-BZDkUTrt.woff2","./assets/be-vietnam-pro-latin-ext-400-normal-CiZNW1ec.woff2","./assets/be-vietnam-pro-vietnamese-400-normal-CRcqvyg1.woff2","./assets/be-vietnam-pro-vietnamese-500-normal-DREgrEoJ.woff2","./assets/be-vietnam-pro-vietnamese-600-normal-nyU-ZL2p.woff2","./assets/cormorant-garamond-latin-500-normal-BsRWmXhO.woff2","./assets/cormorant-garamond-latin-600-normal-Co1r35X9.woff2","./assets/cormorant-garamond-latin-ext-600-normal-DaBc-lu7.woff2","./assets/cormorant-garamond-vietnamese-500-normal-BZGLGj12.woff2","./assets/cormorant-garamond-vietnamese-600-normal-BoXdMtcr.woff2","./assets/index-DTqmcCK9.js","./assets/index-zzdL_dWp.css","./config.example.json","./config.json","./favicon.svg","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./index.html","./manifest.webmanifest"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('mq-tablet-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const remember = (request, response) => {
  if (response && response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // the spreadsheet and anything else: straight to the network

  const networkFirst = request.mode === 'navigate' || url.pathname.endsWith('/config.json') || url.pathname.endsWith('/manifest.webmanifest');
  if (networkFirst) {
    event.respondWith(
      fetch(request)
        .then((response) => remember(request, response))
        .catch(() => caches.match(request).then((hit) => hit || caches.match(new URL('./', self.registration.scope).href))),
    );
    return;
  }

  // files of the app (their names change with every build): the saved copy first
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((response) => remember(request, response))));
});
