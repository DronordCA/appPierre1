// Nacho Service Worker — v1
const CACHE = "nacho-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon2.png",
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js",
];

// Install — cache app shell
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first for Firebase, cache first for app shell
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Firebase — always network, no cache
  if (url.hostname.includes("firebase") || url.hostname.includes("google")) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({error:"offline"}), {
        headers: {"Content-Type": "application/json"}
      }))
    );
    return;
  }

  // App shell — cache first, fall back to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
