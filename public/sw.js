/* Calamify service worker – offline shell + cached audio streams */
const VERSION = "calamify-v1";
const SHELL = `${VERSION}-shell`;
const AUDIO = "calamify-offline-audio";
const DATA = `${VERSION}-data`;

const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.png", "/explore", "/library", "/trending"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION) && k !== AUDIO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function audioKey(url) {
  // ignore query params so warmed/downloaded streams are reused
  const u = new URL(url);
  return `${u.origin}${u.pathname}`;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // audio streams: cache-first (offline downloads), network fallback
  if (url.pathname.startsWith("/api/audio/")) {
    event.respondWith(
      caches.open(AUDIO).then(async (cache) => {
        const key = audioKey(req.url);
        const cached = await cache.match(key);
        if (cached && !req.headers.get("range")) return cached;
        try {
          const res = await fetch(req);
          if (res.ok && !req.headers.get("range")) {
            cache.put(key, res.clone()).catch(() => undefined);
          }
          return res;
        } catch (err) {
          if (cached) return cached;
          throw err;
        }
      })
    );
    return;
  }

  // search / discovery data: network first, cached fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(DATA).then((c) => c.put(req.url, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(DATA);
          const cached = await cache.match(req.url);
          return cached || new Response(JSON.stringify({ results: [], offline: true }), { headers: { "Content-Type": "application/json" } });
        })
    );
    return;
  }

  // navigation: network first, offline shell fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(SHELL);
        return (await cache.match("/")) || new Response("Offline", { status: 503 });
      })
    );
    return;
  }

  // static assets: stale-while-revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res.ok && (req.destination === "script" || req.destination === "style" || req.destination === "image")) {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put(req, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Calamify", body: "New music in your orbit 🌌" };
  try {
    if (event.data) data = event.data.json();
  } catch {
    /* use defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Calamify", {
      body: data.body || "",
      icon: "/icon.png",
      badge: "/icon.png",
      data: { url: data.link || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/"));
});
