import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export const googleProvider = new GoogleAuthProvider();

export const syncProfileToFirestore = async (uid: string, profile: any) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid,
      email: profile.email,
      name: profile.name,
      lifecycleStage: profile.lifecycleStage,
      lmpDate: profile.lmpDate || null,
      dueDate: profile.dueDate || null,
      emailNotifications: profile.emailNotifications !== false,
      createdAt: profile.createdAt || new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error syncing profile to Firestore:", error);
  }
};

export const syncDataToFirestore = async (uid: string, collectionName: string, data: any[]) => {
  try {
    const userRef = doc(db, 'users', uid);
    const dataRef = doc(userRef, collectionName, 'data');
    await setDoc(dataRef, { items: data }, { merge: true });
  } catch (error) {
    console.error(`Error syncing ${collectionName} to Firestore:`, error);
  }
};
