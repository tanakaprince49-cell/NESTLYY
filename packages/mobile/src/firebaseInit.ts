/**
 * Mobile-specific Firebase initialization.
 * MUST be imported before any module that touches `@nestly/shared` (which calls getAuth).
 * initializeAuth registers the auth instance on the app -- subsequent getAuth() calls
 * return the same instance, so shared/firebase.ts picks it up automatically.
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
