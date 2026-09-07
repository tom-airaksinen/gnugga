// Gnugga – service worker. Samma mönster som Flippa: allt cachas vid install,
// cache-namnet bumpas per version så installerade PWA:er hämtar nytt.
const CACHE = "gnugga-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./data/changelog.js",
  "./data/ro/monster.js",
  "./data/ro/lexikon.json",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      // cache:"reload" kringgår webbläsarens HTTP-cache (GitHub Pages sätter max-age=600),
      // annars kan en gammal app.js hamna under det nya cache-namnet.
      await Promise.all(ASSETS.map((u) => c.add(new Request(u, { cache: "reload" }))));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
