importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_VERSION = "our-space-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/apple-touch-icon.png",
  "/splash/manifest-icon-192.maskable.png",
  "/splash/manifest-icon-512.maskable.png",
];

const IMAGE_EXTENSIONS = /\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i;
const MAX_IMAGE_ENTRIES = 80;
const ONESIGNAL_HOSTS = new Set([
  "cdn.onesignal.com",
  "onesignal.com",
  "api.onesignal.com",
]);

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isOneSignalRequest(url) {
  return (
    ONESIGNAL_HOSTS.has(url.hostname) ||
    url.hostname.endsWith(".onesignal.com") ||
    url.pathname.includes("OneSignalSDK")
  );
}

function isStaticAsset(url) {
  return (
    isSameOrigin(url) &&
    (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/splash/") ||
      IMAGE_EXTENSIONS.test(url.pathname))
  );
}

function isImageRequest(request, url) {
  return (
    request.destination === "image" ||
    (isSameOrigin(url) && url.pathname.startsWith("/_next/image")) ||
    IMAGE_EXTENSIONS.test(url.pathname)
  );
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;

  await Promise.all(
    keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)),
  );
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  if (request.headers.has("range")) {
    return fetch(request);
  }

  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fresh = fetch(request)
    .then((response) => {
      if (response.ok || response.status === 0) {
        cache.put(request, response.clone()).catch(() => {});
        void trimCache(cacheName, MAX_IMAGE_ENTRIES);
      }
      return response;
    })
    .catch(() => cached);

  return cached || fresh;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((error) => {
              console.warn("Precache failed:", url, error);
            }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("our-space-") && !key.startsWith(CACHE_VERSION),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (isOneSignalRequest(url)) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isImageRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
  }
});
