const CACHE_NAME = "disruptor-v2";
const STATIC_CACHE = ["/favicon.ico", "/manifest.json", "/pwa-192.png", "/pwa-512.png"];

function shouldCache(request, response) {
  if (request.method !== "GET") return false;
  if (!response || !response.ok) return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (request.mode === "navigate") return false;

  const cacheableDestinations = new Set(["script", "style", "image", "font"]);
  return cacheableDestinations.has(request.destination);
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  // Never cache HTML route navigations to avoid stale 404/redirect shells.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (shouldCache(request, response)) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
