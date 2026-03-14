import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, RecaptchaVerifier, signInWithPhoneNumber, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const syncProfileToFirestore = async (uid: string, profile: any) => {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      uid,
      email: profile.email,
      userName: profile.userName,
      lifecycleStage: profile.lifecycleStage,
      lmpDate: profile.lmpDate || null,
      dueDate: profile.dueDate || null,
      isManualDueDate: profile.isManualDueDate || false,
      pregnancyType: profile.pregnancyType || 'singleton',
      babies: profile.babies || [],
      themeColor: profile.themeColor || 'pink',
      profileImage: profile.profileImage || null,
      startingWeight: profile.startingWeight || 0,
      customTargets: profile.customTargets || null,
      albums: profile.albums || null,
      notificationsEnabled: profile.notificationsEnabled !== false,
      emailNotifications: profile.emailNotifications !== false,
      createdAt: profile.createdAt || new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getProfileFromFirestore = async (uid: string) => {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const syncDataToFirestore = async (uid: string, collectionName: string, data: any) => {
  const path = `users/${uid}/${collectionName}/data`;
  try {
    const userRef = doc(db, 'users', uid);
    const dataRef = doc(userRef, collectionName, 'data');
    await setDoc(dataRef, { items: data }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
