// sw.js - Nestly Premium Service Worker

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('widgetinstall', event => {
  event.waitUntil(updateWidget(event.widget));
});

self.addEventListener('widgetresume', event => {
  event.waitUntil(updateWidget(event.widget));
});

self.addEventListener('widgetclick', event => {
  let url = '/';
  if (event.action === 'log_water') url = '/?tab=dashboard';
  if (event.action === 'open_ava') url = '/?tab=ava';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (new URL(client.url).pathname === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

async function updateWidget(widget) {
  // Try to fetch the template we just created
  try {
    const templateResponse = await fetch('/nestly-widget-adaptive-card.json');
    const template = await templateResponse.json();
    
    await self.widgets.updateByTag(widget.tag, {
      template: template,
      data: {
        week: "24",
        size: "Corn 🌽",
        water: "1.5L / 2L",
        weight: "68 kg"
      }
    });
  } catch (e) {
    console.error('Widget update failed', e);
  }
}

self.addEventListener("fetch", (event) => {
  // Required for PWA Installability
});