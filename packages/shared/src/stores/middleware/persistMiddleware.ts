import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { IAsyncStorageBackend } from '../../services/storageInterface.ts';

export type { StateStorage };
export { persist, createJSONStorage };

/**
 * Creates a lazy StateStorage proxy whose backend can be injected after the
 * store has already been wrapped with the persist middleware.
 *
 * This matters because zustand's `createJSONStorage(factory)` calls the
 * factory synchronously at store-creation time. If we waited to assign the
 * real backend, the factory would have nothing to return — zustand would
 * then silently fall back to a no-op storage AND skip attaching
 * `api.persist`, so calls like `store.persist.rehydrate()` would crash at
 * runtime.
 *
 * Instead, we return a stable non-null StateStorage at creation time that
 * delegates every call through a mutable backend reference. Before the
 * backend is set (e.g. on web, which imports the shared stores for their
 * types but never calls the setter), reads return null and writes no-op.
 */
export function createLazyStorage(): {
  storage: StateStorage;
  setBackend: (backend: StateStorage | null) => void;
} {
  let backend: StateStorage | null = null;
  const storage: StateStorage = {
    getItem: async (key: string): Promise<string | null> => {
      if (!backend) return null;
      const res = backend.getItem(key);
      return res instanceof Promise ? await res : res;
    },
    setItem: async (key: string, value: string): Promise<void> => {
      if (!backend) return;
      const res = backend.setItem(key, value);
      if (res instanceof Promise) await res;
    },
    removeItem: async (key: string): Promise<void> => {
      if (!backend) return;
      const res = backend.removeItem(key);
      if (res instanceof Promise) await res;
    },
  };
  return {
    storage,
    setBackend: (b) => {
      backend = b;
    },
  };
}

/**
 * Wraps an async storage backend (AsyncStorage-style) as a zustand-compatible
 * StateStorage, prefixing every key with the current user's scope so multiple
 * accounts on one device never see each other's data.
 *
 * Mobile-only in practice: web persists via storageService (localStorage) and
 * does not use this helper. Narrowing to IAsyncStorageBackend removes the
 * unsafe runtime cast the old sync-or-async union required. See #233.
 */
export function createUserScopedStorage(
  backend: IAsyncStorageBackend,
  getEmail: () => string | null,
): StateStorage {
  const prefix = (): string => {
    const email = getEmail();
    return email ? `${email}_` : 'guest_';
  };

  return {
    getItem: (key: string): Promise<string | null> => backend.getItem(prefix() + key),
    setItem: (key: string, value: string): Promise<void> => backend.setItem(prefix() + key, value),
    removeItem: (key: string): Promise<void> => backend.removeItem(prefix() + key),
  };
}
