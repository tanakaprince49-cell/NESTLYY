export * from './authStore.ts';
export * from './profileStore.ts';
export * from './trackingStore.ts';
export * from './navigationStore.ts';
export * from './avaChatStore.ts';
export * from './healthConnectStore.ts';
export * from './privacyStore.ts';
export * from './middleware/index.ts';

import { useAuthStore, setAuthStorage } from './authStore.ts';
import { useProfileStore, setProfileStorage } from './profileStore.ts';
import { useTrackingStore, setTrackingStorage } from './trackingStore.ts';
import { useAvaChatStore, setAvaChatStorage } from './avaChatStore.ts';
import type { StateStorage } from './middleware/persistMiddleware.ts';

/**
 * Single source of truth for every user-scoped persisted store in the app.
 *
 * Why this exists: the mobile bootstrap needs to install a user-scoped
 * AsyncStorage backend on every persisted store AND rehydrate/clear them in
 * sync on login/logout. Before this registry existed, bootstrap.ts kept its
 * own local list of four stores and their setters — if a fifth persisted
 * store was added in shared, nothing caught the drift at compile time and
 * that store would silently fail to rehydrate on login or leak data across
 * accounts on logout.
 *
 * Adding a new user-scoped persisted store now means adding one entry to
 * this map. Bootstrap iterates it, so there is no second list to update.
 *
 * See issue #244 for context.
 */
export const USER_SCOPED_PERSISTED_STORES = {
  auth: { store: useAuthStore, setStorage: setAuthStorage },
  profile: { store: useProfileStore, setStorage: setProfileStorage },
  tracking: { store: useTrackingStore, setStorage: setTrackingStorage },
  avaChat: { store: useAvaChatStore, setStorage: setAvaChatStorage },
} as const;

export type UserScopedStoreName = keyof typeof USER_SCOPED_PERSISTED_STORES;

/**
 * Install a user-scoped storage backend on every persisted store in one call.
 * Callers (mobile bootstrap) no longer need to remember which setters exist.
 */
export function setAllUserScopedStorage(storage: StateStorage): void {
  for (const { setStorage } of Object.values(USER_SCOPED_PERSISTED_STORES)) {
    setStorage(storage);
  }
}
