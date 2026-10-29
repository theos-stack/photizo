const CACHE = "photizo-static-v1";
const OFFLINE = "/offline.html";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE, "/icons/icon-192.png"])).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE)));
    return;
  }
  if (url.pathname.startsWith("/streak") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/auth/")) return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.ok) { const copy=response.clone(); void caches.open(CACHE).then((cache)=>cache.put(request,copy)); } return response; })));
  }
});
self.addEventListener("push", (event) => {
  let data = { title: "A moment for prayer", body: "Your PHOTIZO prayer guide is ready.", url: "/streak" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { url: data.url || "/streak" } }));
});
self.addEventListener("notificationclick", (event) => { event.notification.close(); const target=event.notification.data?.url || "/streak"; event.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then((list)=>{const existing=list.find((client)=>new URL(client.url).origin===self.location.origin);return existing?existing.navigate(target):clients.openWindow(target);})); });
