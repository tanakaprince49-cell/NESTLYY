// sw.js - Nestly Service Worker with Widget Support

self.addEventListener("install", (event) => {
  console.log("🛠 Nestly Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("🚀 Nestly Service Worker activated");
  event.waitUntil(self.clients.claim());
});

/**
 * PWA WIDGET SUPPORT
 * These events handle the native Android/Chromium Home Screen Widgets
 */

self.addEventListener('widgetinstall', event => {
  console.log('📦 Widget installed:', event.widget.tag);
  event.waitUntil(updateWidget(event.widget));
});

self.addEventListener('widgetresume', event => {
  console.log('👁️ Widget shown:', event.widget.tag);
  event.waitUntil(updateWidget(event.widget));
});

self.addEventListener('widgetclick', event => {
  console.log('🖱️ Widget clicked:', event.action);
  const urlToOpen = event.action === 'log_water' ? '/?tab=dashboard' : '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

async function updateWidget(widget) {
  // In a real app, we would fetch data from IndexedDB or storage
  // For this implementation, we provide a high-fidelity Nestly UI snapshot
  const payload = {
    template: {
      type: "AdaptiveCard",
      version: "1.5",
      body: [
        {
          type: "ColumnSet",
          columns: [
            {
              type: "Column",
              width: "auto",
              items: [
                {
                  type: "Image",
                  url: "https://i.ibb.co/qLkMSD9n/Screenshot-20260211-190854-com-android-gallery3d.webp",
                  size: "Small",
                  style: "Person"
                }
              ]
            },
            {
              type: "Column",
              width: "stretch",
              verticalContentAlignment: "Center",
              items: [
                {
                  type: "TextBlock",
                  text: "NESTLY",
                  weight: "Bolder",
                  size: "Small",
                  color: "Attention",
                  wrap: true
                }
              ]
            }
          ]
        },
        {
          type: "Container",
          spacing: "Medium",
          style: "emphasis",
          items: [
            {
              type: "TextBlock",
              text: "Week 24 • Size of a Corn 🌽",
              weight: "Bolder",
              size: "Medium",
              wrap: true
            }
          ]
        },
        {
          type: "FactSet",
          spacing: "Medium",
          facts: [
            { title: "Weight", value: "68.2 kg" },
            { title: "Water", value: "1500 / 2000 ml" },
            { title: "Status", value: "Feeling Radiant ✨" }
          ]
        }
      ],
      actions: [
        {
          type: "Action.Execute",
          title: "Log Water 💧",
          id: "log_water"
        },
        {
          type: "Action.Execute",
          title: "Open Nest",
          id: "open_app"
        }
      ]
    },
    data: {}
  };

  try {
    await self.widgets.updateByTag(widget.tag, payload);
  } catch (e) {
    console.error('Widget update failed', e);
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].focus();
        } else {
          clients.openWindow("/");
        }
      })
  );
});

self.addEventListener("fetch", (event) => {
  // Required for PWA installability
});