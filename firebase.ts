import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, RecaptchaVerifier, signInWithPhoneNumber, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const db: any = null; // Provide a null export to avoid breaking imports

let messaging: Messaging | null = null;
try {
  messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
} catch (e) {
  console.warn("Messaging initialization failed", e);
}
export { messaging };
export const googleProvider = new GoogleAuthProvider();

