import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getMessaging, type Messaging } from 'firebase/messaging';
import firebaseConfig from './firebase-applet-config.json';

const app: FirebaseApp = initializeApp(firebaseConfig);

export { app };

// Lazy Proxy exports for `auth` and `db`.
//
// Why: on React Native, packages/mobile/src/firebaseInit.ts must call
// initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
// BEFORE any code reaches getAuth(app). Import ordering in mobile/index.ts
// currently guarantees this, but eager `const auth = getAuth(app)` at shared
// module load would silently regress if a future refactor reordered imports.
//
// With the Proxy, getAuth / getFirestore run only on first property access
// from a consumer. The mobile bootstrap has always finished by then, so the
// RN-persisted Auth instance is already registered and getAuth(app) returns
// it unchanged. As a side benefit, on mobile (where `db` is never used) the
// Firestore instance is never constructed at all, eliminating the zombie
// getFirestore(app) call on RN.
//
// Reflect.get receives the real resolved instance as the receiver so getters
// and methods see `this === real instance`, which matters for the Firestore
// SDK where internal state lives on the instance.
let _auth: Auth | undefined;
let _db: Firestore | undefined;

export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    if (!_auth) _auth = getAuth(app);
    return Reflect.get(_auth, prop, _auth);
  },
});

export const db: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    if (!_db) _db = getFirestore(app);
    return Reflect.get(_db, prop, _db);
  },
});

// Messaging stays eager. It is browser-only (requires ServiceWorker) and
// consumers like pushService.ts rely on `if (messaging)` truthiness to skip
// on RN — a Proxy is always truthy and would break that guard.
let messaging: Messaging | null = null;
try {
  // getMessaging requires ServiceWorker (browser only, not React Native)
  const isBrowser = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  messaging = isBrowser ? getMessaging(app) : null;
} catch (e) {
  console.warn("Messaging initialization failed", e);
}
export { messaging };
export const googleProvider = new GoogleAuthProvider();
