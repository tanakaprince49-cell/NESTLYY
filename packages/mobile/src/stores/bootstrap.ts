import {
  useLocalIdentityStore,
  usePrivacyStore,
  createUserScopedStorage,
  setAllUserScopedStorage,
  setPrivacyStorage,
  USER_SCOPED_PERSISTED_STORES,
} from '@nestly/shared/stores';
import { asyncStorageBackend } from './storageBackend';

// Read the current local UUID scope lazily so each storage call reflects the
// current identity rather than a stale snapshot at bootstrap time.
const getLocalUuid = (): string | null => {
  const uuid = useLocalIdentityStore.getState().localUuid;
  return uuid || null;
};

/**
 * Install the AsyncStorage-backed, user-scoped StateStorage on every
 * persisted store. Does NOT trigger hydration; each store is configured with
 * `skipHydration: true` and is rehydrated explicitly by rehydrateUserStores()
 * (user-scoped stores, after auth resolves) or rehydratePrivacyStore()
 * (device-level privacy store, at cold start before auth). Call this once
 * at app startup, before registerRootComponent.
 */
export function bootstrapStores(): void {
  const storage = createUserScopedStorage(asyncStorageBackend, getLocalUuid);
  setAllUserScopedStorage(storage);
  // Privacy consent is device-level, not per-account. Wire the raw
  // asyncStorageBackend (no email prefix) so the flag sits under a single
  // stable AsyncStorage key across all accounts on the device. See #281.
  setPrivacyStorage(asyncStorageBackend);
}

type PrivacyPersistedStore = { persist: { rehydrate: () => Promise<void> } };

/**
 * Rehydrate the device-level privacy store. Safe to call at cold start
 * before Firebase auth resolves, because this store is not user-scoped.
 * Swallows failures so a corrupted privacy bucket can never block app boot —
 * the consent prompt reappearing is a far better failure mode than a hang.
 */
export async function rehydratePrivacyStore(): Promise<void> {
  try {
    await (usePrivacyStore as unknown as PrivacyPersistedStore).persist.rehydrate();
  } catch (err) {
    console.warn('[rehydratePrivacyStore] failed to rehydrate:', err);
  }
}

type PersistedStore = { persist: { rehydrate: () => Promise<void>; clearStorage: () => void | Promise<void> } };

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
 *
 * Iterates the shared USER_SCOPED_PERSISTED_STORES registry so adding a new
 * persisted store in shared automatically flows through rehydrate and clear
 * without touching mobile bootstrap. See issue #244.
 */
export async function rehydrateUserStores(): Promise<void> {
  await Promise.all(
    Object.entries(USER_SCOPED_PERSISTED_STORES).map(async ([name, { store }]) => {
      try {
        await (store as unknown as PersistedStore).persist.rehydrate();
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
    Object.entries(USER_SCOPED_PERSISTED_STORES).map(async ([name, { store }]) => {
      try {
        await (store as unknown as PersistedStore).persist.clearStorage();
      } catch (err) {
        console.warn(`[clearUserStores] "${name}" failed to clear:`, err);
      }
    }),
  );
}
