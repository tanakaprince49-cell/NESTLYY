import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
      emailNotifications: profile.emailNotifications !== false, // Default to true
      createdAt: profile.createdAt || new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error("Error syncing profile to Firestore:", error);
  }
};
