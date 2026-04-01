importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyDm6OvIZb714N5JkHzWCCFeEsWyBHayB90",
  authDomain: "plasma-ripple-467908-e7.firebaseapp.com",
  projectId: "plasma-ripple-467908-e7",
  storageBucket: "plasma-ripple-467908-e7.firebasestorage.app",
  messagingSenderId: "250549049447",
  appId: "1:250549049447:web:2c04341af1867201061cc2",
  measurementId: "G-Y6EQPDNY95"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // If the payload has a notification property, FCM will handle it automatically
  // in most cases. We only need to show a manual one if it's a data-only message
  // or if we want to override the default behavior.
  if (!payload.notification) {
    const notificationTitle = 'Nestly Update';
    const notificationOptions = {
      body: payload.data?.body || 'New update from Nestly',
      icon: '/logo.png',
      data: payload.data
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

// --- WIDGET & GENERIC PUSH LOGIC (from sw.js) ---
const WIDGET_TAG = 'nestly-stats';

// Cache Firebase auth iframe (90 KiB, default 30 min TTL) for 24h
const CACHE_NAME = 'nestly-ext-v1';
const CACHED_URL_PATTERNS = [
  /firebaseapp\.com\/.*\/auth\/iframe/
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (!CACHED_URL_PATTERNS.some(p => p.test(url))) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })
  );
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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});
