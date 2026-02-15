// sw.js - Nestly Service Worker

self.addEventListener("install", (event) => {
  console.log("🛠 Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].focus();
        } else {
          clients.openWindow("/");
        }
      })
  );
});

// Added fetch listener to satisfy PWA requirements
self.addEventListener("fetch", (event) => {
  // Pass-through for now
});
