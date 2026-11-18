/* Service worker PharmaRévision (généré au build, ne pas modifier dist/sw.js à la main). */
const VERSION = __VERSION__;
const CORE = __CORE__;
const ALL = __ALL__;
const CACHE = "pharmarevision-" + VERSION;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("pharmarevision-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TOUT_TELECHARGER") {
    const port = event.ports && event.ports[0];
    caches.open(CACHE).then(async (cache) => {
      let fait = 0;
      for (const url of ALL) {
        try {
          if (!(await cache.match(url))) await cache.add(url);
        } catch (e) {
          /* fichier ignoré */
        }
        fait++;
        if (port && fait % 10 === 0) port.postMessage({ fait, total: ALL.length });
      }
      if (port) port.postMessage({ fait: ALL.length, total: ALL.length, termine: true });
    });
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_vercel/")) return;

  // Fichiers versionnés : cache d'abord.
  if (url.pathname.startsWith("/_astro/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Pages et données : réseau d'abord, cache en secours (hors-ligne).
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then(
          (hit) =>
            hit ||
            (req.mode === "navigate"
              ? caches.match("/hors-ligne/")
              : new Response("Hors ligne", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })),
        ),
      ),
  );
});
