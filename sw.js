// sw.js - Nestly Premium Service Worker

const WIDGET_TAG = 'nestly-stats';

self.addEventListener("install", (event) => {
  console.log("🛠 sw: Install");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("🚀 sw: Activate");
  event.waitUntil(self.clients.claim());
});

/**
 * WIDGET LIFECYCLE
 */
self.addEventListener('widgetinstall', event => {
  console.log('📦 sw: Widget Install', event.widget.tag);
  event.waitUntil(updateWidget(event.widget));
});

self.addEventListener('widgetresume', event => {
  console.log('👁️ sw: Widget Resume', event.widget.tag);
  event.waitUntil(updateWidget(event.widget));
});

self.addEventListener('widgetclick', event => {
  console.log('🖱️ sw: Widget Click', event.action);
  let url = '/';
  if (event.action === 'log_water') url = '/?tab=dashboard';
  if (event.action === 'open_ava') url = '/?tab=ava';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

async function updateWidget(widget) {
  try {
    const templateResponse = await fetch('/nestly-widget-adaptive-card.json');
    const template = await templateResponse.json();
    
    // In a production app, we would fetch real stats from IndexedDB here
    await self.widgets.updateByTag(WIDGET_TAG, {
      template: template,
      data: {
        week: "24",
        size: "Corn 🌽",
        water: "1.5L / 2L",
        weight: "68 kg"
      }
    });
  } catch (e) {
    console.error('sw: Widget update failed', e);
  }
}

self.addEventListener("fetch", (event) => {
  // Required for PWA Installability criteria
});