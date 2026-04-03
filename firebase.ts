import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, type Messaging } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let messaging: Messaging | null = null;
try {
  messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
} catch (e) {
  console.warn("Messaging initialization failed", e);
}
export { messaging };
export const googleProvider = new GoogleAuthProvider();