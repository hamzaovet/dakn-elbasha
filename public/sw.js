/* Basha Salon VIP - Service Worker (Background Web Push + App Shell Caching) */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Cache / Network fetch handler required for Windows & Chromium PWA installation
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Listen for Web Push events even when browser tabs are closed
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "👑 دقن الباشا وحمام الباشا VIP الملكي",
      body: event.data.text(),
      url: "/",
    };
  }

  const title = data.title || "👑 دقن الباشا وحمام الباشا VIP الملكي VIP";
  const options = {
    body: data.body || "لديك إشعار جديد من دقن الباشا وحمام الباشا VIP",
    icon: data.icon || "/dakn-logo.jpg",
    badge: data.badge || "/dakn-logo.jpg",
    tag: data.tag || `basha-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
    vibrate: [250, 100, 250, 100, 350],
    dir: "rtl",
    lang: "ar",
    data: {
      url: data.url || "/",
      ...(data.data || {}),
    },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "BASHA_PUSH_RECEIVED",
            payload: { title, ...data },
          });
        });
      }),
    ])
  );
});

// Handle notification click to focus existing window or open destination route
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes(targetUrl)) {
            return client.focus();
          }
        }
      }
      if (clientList.length > 0 && "focus" in clientList[0]) {
        clientList[0].navigate(targetUrl).catch(() => {});
        return clientList[0].focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
