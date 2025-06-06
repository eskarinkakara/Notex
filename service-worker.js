const cacheName = "notex-cache-v1";
const filesToCache = [
  "/Notex/",
  "/Notex/index.html",
  "/Notex/allTags.html",
  "/Notex/freeWrite.html",
  "/Notex/style.css",
  "/Notex/allTags.js",
  "/Notex/freeWrite.js",
  "/Notex/inputElements.js",
  "/Notex/modal.js",
  "/Notex/notes.js",
  "/Notex/manifest.json",
  "/Notex/Notex_icon.png",
  "/Notex/Notex_icon-192.png",
  "/Notex/Notex_icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() =>
        caches.match("/Notex/index.html")
      );
    })
  );
});