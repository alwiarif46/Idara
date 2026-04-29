/* Idara dashboard — Web Push */
self.addEventListener("push", (event) => {
  let data = { title: "Idara", body: "", url: "/dashboard.html" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {
    try {
      const t = event.data.text();
      if (t) data.body = t;
    } catch (_) { /* ignore */ }
  }
  const openUrl = data.url || "/dashboard.html";
  event.waitUntil(
    self.registration.showNotification(data.title || "Idara", {
      body: data.body || "",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: data.tag || undefined,
      data: { url: openUrl, notif_id: data.notif_id },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const raw = (event.notification.data && event.notification.data.url) || "/dashboard.html";
  const url = new URL(raw, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if ("focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
