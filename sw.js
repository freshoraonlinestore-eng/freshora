/* =========================
FRESHORA SERVICE WORKER
CACHE-FREE AUTO UPDATE SYSTEM
========================= */

const CACHE_NAME = "freshora-cache-v1";

/* Files to cache (ONLY essential shell) */
const urlsToCache = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./logo.png"
];

/* =========================
INSTALL EVENT
========================= */
self.addEventListener("install", (event) => {
  console.log("SW: Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );

  self.skipWaiting();
});

/* =========================
ACTIVATE EVENT (IMPORTANT FIX)
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
FETCH EVENT (CACHE-FREE STRATEGY)
========================= */
self.addEventListener("fetch", (event) => {

  // Always bypass cache for Firebase + API calls
  if (
    event.request.url.includes("firebase") ||
    event.request.url.includes("firestore") ||
    event.request.url.includes("googleapis")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network first (NO STALE CACHE PROBLEM)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
