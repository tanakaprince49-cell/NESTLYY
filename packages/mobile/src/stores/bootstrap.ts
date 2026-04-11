import {
  useAuthStore,
  useProfileStore,
  useTrackingStore,
  useAvaChatStore,
  createUserScopedStorage,
  setAuthStorage,
  setProfileStorage,
  setTrackingStorage,
  setAvaChatStorage,
} from '@nestly/shared/stores';
import { asyncStorageBackend } from './storageBackend';

// Read the current user scope lazily so that each storage call reflects the
// current auth state rather than a stale snapshot at bootstrap time.
const getEmail = (): string | null => useAuthStore.getState().authEmail;

/**
 * Install the AsyncStorage-backed, user-scoped StateStorage on every
 * persisted store. Does NOT trigger hydration; each store is configured with
 * `skipHydration: true` and is rehydrated explicitly by rehydrateUserStores()
 * after Firebase auth resolves. Call this once at app startup, before
 * registerRootComponent.
 */
export function bootstrapStores(): void {
  const storage = createUserScopedStorage(asyncStorageBackend, getEmail);
  setAuthStorage(storage);
  setProfileStorage(storage);
  setTrackingStorage(storage);
  setAvaChatStorage(storage);
}

/**
 * Rehydrate all user-scoped stores from AsyncStorage. Must be called after
 * Firebase auth has resolved and `setAuth` has populated the authStore with
 * the correct scope identifier, otherwise the persist middleware would read
 * the guest bucket.
 */
export async function rehydrateUserStores(): Promise<void> {
  await Promise.all([
    useAuthStore.persist.rehydrate(),
    useProfileStore.persist.rehydrate(),
    useTrackingStore.persist.rehydrate(),
    useAvaChatStore.persist.rehydrate(),
  ]);
}

/**
 * Clear every persisted user-scoped store. Used on logout to prevent a
 * previous account's data from bleeding into the next account signed in on
 * the same device.
 */
export async function clearUserStores(): Promise<void> {
  await Promise.all([
    useProfileStore.persist.clearStorage(),
    useAuthStore.persist.clearStorage(),
    useTrackingStore.persist.clearStorage(),
    useAvaChatStore.persist.clearStorage(),
  ]);
}
