/**
 * Mobile-specific Firebase initialization.
 * Imported first from mobile/index.ts so initializeAuth runs before any consumer
 * reads from the lazy `auth` proxy exported by @nestly/shared/firebase. That proxy
 * defers getAuth(app) until the first property access, so subsequent getAuth()
 * calls return the RN-persisted Auth instance registered here.
 */
import { initializeApp, getApps } from 'firebase/app';
// @ts-expect-error -- Metro resolves the RN bundle which exports this; TS sees the browser types
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from '@nestly/shared/firebase-applet-config.json';

if (getApps().length === 0) {
  const app = initializeApp(firebaseConfig);
  initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
