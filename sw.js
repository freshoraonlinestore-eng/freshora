/* =========================
FRESHORA SERVICE WORKER
PWA - OFFLINE SUPPORT
========================= */

const CACHE_NAME = "freshora-cache-v6";

/* Files to cache */
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./logo.png",
  "./manifest.json",
  "./admin.html",
  "./admin.css",
  "./admin.js",
  "./login.html",
  "./firebase.js"
];

/* =========================
INSTALL EVENT
========================= */
self.addEventListener("install", (event) => {
  console.log("SW: Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("SW: Caching files...");
      return cache.addAll(urlsToCache);
    })
  );

  self.skipWaiting();
});

/* =========================
ACTIVATE EVENT
========================= */
self.addEventListener("activate", (event) => {
  console.log("SW: Activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("SW: Clearing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );

  self.clients.claim();
});

/* =========================
FETCH EVENT
========================= */
self.addEventListener("fetch", (event) => {

  // Network first - fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
