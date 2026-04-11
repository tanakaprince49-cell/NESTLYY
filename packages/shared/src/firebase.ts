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
// The Proxy needs three traps to behave like the real instance:
//   - `get` forwards property reads and methods. Reflect.get receives the
//     resolved instance as the receiver so getters/methods see
//     `this === real instance` -- important for SDKs that hold internal
//     state on the instance.
//   - `set` forwards writes so SDK internals that mutate the instance
//     post-construction land on the real object, not the {} target.
//   - `getPrototypeOf` is load-bearing for Firestore: the modular SDK's
//     __PRIVATE_cast helper does `instanceof Firestore` on every top-level
//     function (collection, doc, writeBatch, runTransaction, ...), which
//     would throw INVALID_ARGUMENT against a Proxy wrapping `{}` unless the
//     prototype chain resolves to the real Firestore prototype.
function lazyProxy<T extends object>(resolve: () => T): T {
  let cached: T | undefined;
  const get = (): T => {
    if (!cached) cached = resolve();
    return cached;
  };
  return new Proxy({} as T, {
    get(_target, prop) {
      const instance = get();
      return Reflect.get(instance, prop, instance);
    },
    set(_target, prop, value) {
      const instance = get();
      return Reflect.set(instance, prop, value, instance);
    },
    getPrototypeOf(_target) {
      return Object.getPrototypeOf(get());
    },
  });
}

export const auth: Auth = lazyProxy<Auth>(() => getAuth(app));
export const db: Firestore = lazyProxy<Firestore>(() => getFirestore(app));

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
export const googleProvider = new GoogleAuthProvider();
