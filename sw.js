// sw.js - Nestly Premium Service Worker

const WIDGET_TAG = 'nestly-stats';

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * WIDGET LIFECYCLE
 * These events are handled by Chromium/Android to render the system widgets.
 */
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
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

async function updateWidget(widget) {
  try {
    const templateResponse = await fetch('./nestly-widget-adaptive-card.json');
    const template = await templateResponse.json();
    
    // Send standard data to the Adaptive Card template
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
    console.error('Widget Update Error:', e);
  }
}

self.addEventListener("fetch", (event) => {
  // Pass-through for installability criteria
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Nestly Reminder', body: 'You have a new update.' };
  
  const options = {
    body: data.body,
    icon: '/logo.png', // Fallback if BRAND_LOGO not available
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});