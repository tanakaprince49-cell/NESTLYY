import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, type Messaging } from 'firebase/messaging';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export { app };
export const auth = getAuth(app);
export const db = getFirestore(app);

let messaging: Messaging | null = null;
try {
  messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
} catch (e) {
  console.warn("Messaging initialization failed", e);
}
export { messaging };
export const googleProvider = new GoogleAuthProvider();

