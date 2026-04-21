import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';
import firebaseConfig from './firebase-applet-config.json';

const app: FirebaseApp = initializeApp(firebaseConfig);

export { app };

// Messaging stays eager. It is browser-only (requires ServiceWorker) and
// consumers like pushService.ts rely on `if (messaging)` truthiness to skip
// on RN -- a Proxy is always truthy and would break that guard.
let messaging: Messaging | null = null;
try {
  // getMessaging requires ServiceWorker (browser only, not React Native)
  const isBrowser = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  messaging = isBrowser ? getMessaging(app) : null;
} catch (e) {
  console.warn("Messaging initialization failed", e);
}
export { messaging };
