/* Waypoint — Service Worker
   Cacht die App-Shell (HTML, Icon, Manifest, Leaflet, Fonts) → Start auch offline.
   Kartenkacheln und Routing-/POI-APIs bleiben bewusst Netzwerk (zu groß bzw. dynamisch);
   ohne Netz zeigt die App das an, statt eine leere Karte vorzutäuschen. */
const VERSION = 'waypoint-v2';
const CORE = [
  'kartentisch.html',
  'manifest.webmanifest',
  'icon.svg'
];
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
];
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    // Same-Origin-Kern muss klappen; CDN einzeln (Fehler dort dürfen Install nicht killen).
    await c.addAll(CORE);
    await Promise.allSettled(CDN.map((u) => c.add(new Request(u, { mode: 'no-cors' }))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    const isDoc = req.mode === 'navigate' || url.pathname.endsWith('.html');
    if (isDoc) {
      // HTML-Dokument: network-first → online immer die aktuelle App,
      // offline aus dem Cache. Verhindert veraltete Stände nach einem Update.
      e.respondWith((async () => {
        try {
          const res = await fetch(req);
          if (res && res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
          return res;
        } catch (_) {
          return (await caches.match(req)) || (await caches.match('kartentisch.html')) ||
            new Response('', { status: 504, statusText: 'offline' });
        }
      })());
      return;
    }
    // Statische Assets (Icon, Manifest …): cache-first, im Hintergrund auffrischen.
    e.respondWith((async () => {
      const cached = await caches.match(req);
      const net = fetch(req).then((res) => {
        if (res && res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      }).catch(() => null);
      return cached || (await net) || new Response('', { status: 504, statusText: 'offline' });
    })());
    return;
  }

  // CDN (Leaflet, Fonts): stale-while-revalidate.
  if (CDN_HOSTS.includes(url.host)) {
    e.respondWith((async () => {
      const cached = await caches.match(req);
      const net = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          caches.open(VERSION).then((c) => c.put(req, res.clone()));
        }
        return res;
      }).catch(() => null);
      return cached || (await net) || new Response('', { status: 504 });
    })());
    return;
  }

  // Kacheln & APIs: nicht abfangen → normales Netzwerkverhalten.
});
