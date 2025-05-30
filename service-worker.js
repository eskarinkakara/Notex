const cacheName = "notex-cache-v1";
const filesToCache = [
  "/",
  "/index.html",
  "/allTags.html",
  "/freeWrite.html",
  "/style.css",
  "/allTags.js",
  "/freeWrite.js",
  "/inputElements.js",
  "/modal.js",
  "/notes.js",
  "/manifest.json",
  "/Nortex_icon.png",
  "/Nortex_icon-192.png",
  "/Nortex_icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});