/* Offline worker for the in-store tablet. The build fills in the build id and the list of files below (see vite.config.ts).
 *
 * The first visit keeps a full copy of the app on the tablet, so it opens and works without the
 * internet afterwards. The page itself and config.json are always asked from the network first, so a
 * new version or a new spreadsheet address is picked up as soon as there is a connection. */
const CACHE = 'mq-tablet-2026-10-31 02:53';
const PRECACHE = ["./","./assets/index-DznJ7qZ-.js","./assets/index-vAadUM6G.css","./assets/inter-latin-400-normal-C38fXH4l.woff2","./assets/inter-latin-500-normal-Cerq10X2.woff2","./assets/inter-latin-600-normal-LgqL8muc.woff2","./assets/inter-latin-ext-400-normal-C1nco2VV.woff2","./assets/inter-vietnamese-400-normal-DMkecbls.woff2","./assets/inter-vietnamese-500-normal-DOriooB6.woff2","./assets/inter-vietnamese-600-normal-Cc8MFFhd.woff2","./assets/lora-latin-400-normal-DnxXpLNu.woff2","./assets/lora-latin-500-normal-Dh16O2IA.woff2","./assets/lora-latin-600-normal-B-3RcLOQ.woff2","./assets/lora-latin-ext-400-normal-CyviI4c-.woff2","./assets/lora-vietnamese-400-normal-BxA6xcFr.woff2","./assets/lora-vietnamese-500-normal-LA4e_tum.woff2","./assets/lora-vietnamese-600-normal-B_IFhWKN.woff2","./config.example.json","./config.json","./favicon.svg","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./index.html","./manifest.webmanifest"];

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
