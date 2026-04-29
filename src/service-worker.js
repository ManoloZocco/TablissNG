// Hand-written service worker. Replaces workbox-build's generateSW with the
// same runtime caching strategies that were previously configured in
// rspack.config.js. Keep this file plain JS so it can be copied to the
// build output without going through the bundler.

const APIS_CACHE = "tabliss-cache-apis";
const SWR_CACHE = "tabliss-cache-swr";
const IMAGES_CACHE = "tabliss-cache-images";
const VALID_CACHES = new Set([APIS_CACHE, SWR_CACHE, IMAGES_CACHE]);

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_YEAR_MS = 365 * ONE_DAY_MS;
const TS_HEADER = "x-sw-cached-at";

self.addEventListener("install", () => {
  // Match workbox: skipWaiting + clientsClaim
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !VALID_CACHES.has(k)).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isApiRequest(url) {
  return (
    url.hostname === "github-contributions-api.jogruber.de" ||
    url.hostname === "leetcode-api-pied.vercel.app" ||
    url.href.startsWith("https://api.github.com/repos/BookCatKid/tablissNG")
  );
}

function isFaviconRequest(url) {
  return (
    url.href.startsWith("https://www.google.com/s2/favicons") ||
    url.hostname === "icons.duckduckgo.com" ||
    url.hostname === "favicone.com"
  );
}

async function putWithTimestamp(cache, request, response) {
  // Opaque responses (status 0, e.g. cross-origin no-cors) can't be rewrapped
  // — `new Response(body, { status: 0, ... })` throws RangeError. Their
  // headers are also unreadable, so there's no expiration to apply anyway.
  // Cache them as-is.
  if (response.type === "opaque" || response.status === 0) {
    await cache.put(request, response);
    return;
  }
  // Stamp the response so we can apply maxAgeSeconds-style expiration on read.
  const headers = new Headers(response.headers);
  headers.set(TS_HEADER, String(Date.now()));
  const body = await response.blob();
  const stamped = new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  await cache.put(request, stamped);
}

function isExpired(response, maxAgeMs) {
  if (!maxAgeMs) return false;
  const ts = Number(response.headers.get(TS_HEADER));
  if (!ts) return false;
  return Date.now() - ts > maxAgeMs;
}

async function trimCache(cache, maxEntries) {
  if (!maxEntries) return;
  const keys = await cache.keys();
  const excess = keys.length - maxEntries;
  if (excess > 0) {
    // FIFO eviction — matches workbox ExpirationPlugin's default behavior.
    await Promise.all(keys.slice(0, excess).map((k) => cache.delete(k)));
  }
}

function isCacheable(response, allowOpaque) {
  if (!response) return false;
  if (allowOpaque && response.type === "opaque") return true;
  return response.status === 200;
}

async function cacheFirst(request, { cacheName, maxAgeMs }) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached && !isExpired(cached, maxAgeMs)) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (isCacheable(response, false)) {
      await putWithTimestamp(cache, request, response.clone());
    }
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(
  request,
  { cacheName, maxEntries, maxAgeMs },
) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then(async (response) => {
      // Favicons are typically loaded via <img> without `crossorigin`, so the
      // response is opaque (status 0). Allow caching those.
      if (isCacheable(response, true)) {
        await putWithTimestamp(cache, request, response.clone());
        await trimCache(cache, maxEntries);
      }
      return response;
    })
    .catch(() => undefined);

  if (cached && !isExpired(cached, maxAgeMs)) {
    return cached;
  }
  const fresh = await networkPromise;
  return fresh || cached;
}

async function networkFirst(request, { cacheName, maxEntries, maxAgeMs }) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (isCacheable(response, true)) {
      await putWithTimestamp(cache, request, response.clone());
      await trimCache(cache, maxEntries);
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached && !isExpired(cached, maxAgeMs)) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Cache API only supports http(s). Extension contexts can issue requests
  // with chrome-extension://, moz-extension://, etc. — let those bypass the SW.
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (isApiRequest(url)) {
    event.respondWith(
      cacheFirst(request, { cacheName: APIS_CACHE, maxAgeMs: ONE_DAY_MS }),
    );
    return;
  }

  if (isFaviconRequest(url)) {
    event.respondWith(
      staleWhileRevalidate(request, {
        cacheName: SWR_CACHE,
        maxEntries: 50,
        maxAgeMs: ONE_YEAR_MS,
      }),
    );
    return;
  }

  if (request.destination === "image") {
    event.respondWith(
      networkFirst(request, {
        cacheName: IMAGES_CACHE,
        maxEntries: 10,
        maxAgeMs: ONE_YEAR_MS,
      }),
    );
    return;
  }
});
