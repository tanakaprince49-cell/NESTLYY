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

type PersistedStore = { persist: { rehydrate: () => Promise<void>; clearStorage: () => void | Promise<void> } };

const USER_SCOPED_STORES: ReadonlyArray<readonly [string, PersistedStore]> = [
  ['auth', useAuthStore as unknown as PersistedStore],
  ['profile', useProfileStore as unknown as PersistedStore],
  ['tracking', useTrackingStore as unknown as PersistedStore],
  ['avaChat', useAvaChatStore as unknown as PersistedStore],
];

/**
 * Rehydrate all user-scoped stores from AsyncStorage. Must be called after
 * Firebase auth has resolved and `setAuth` has populated the authStore with
 * the correct scope identifier, otherwise the persist middleware would read
 * the guest bucket.
 *
 * Each store is rehydrated inside its own try/catch: if one bucket contains
 * unparseable JSON or the backend read throws, we log the failure and move on
 * so the remaining stores still load. Without this, a single corrupted bucket
 * (e.g. from a killed write during a previous session) would knock out the
 * entire app state. See issue #235.
 */
export async function rehydrateUserStores(): Promise<void> {
  await Promise.all(
    USER_SCOPED_STORES.map(async ([name, store]) => {
      try {
        await store.persist.rehydrate();
      } catch (err) {
        console.warn(`[rehydrateUserStores] "${name}" failed to rehydrate:`, err);
      }
    }),
  );
}

/**
 * Clear every persisted user-scoped store. Used on logout to prevent a
 * previous account's data from bleeding into the next account signed in on
 * the same device.
 *
 * Uses the same per-store try/catch pattern as rehydrateUserStores so that a
 * single storage failure can never leave logout half-done.
 */
export async function clearUserStores(): Promise<void> {
  await Promise.all(
    USER_SCOPED_STORES.map(async ([name, store]) => {
      try {
        await store.persist.clearStorage();
      } catch (err) {
        console.warn(`[clearUserStores] "${name}" failed to clear:`, err);
      }
    }),
  );
}
