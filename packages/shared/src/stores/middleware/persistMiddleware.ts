import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { IStorageBackend, IAsyncStorageBackend } from '../../services/storageInterface.ts';

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
 * Wraps a storage backend (sync localStorage-style or async AsyncStorage-style)
 * as a zustand-compatible StateStorage, prefixing every key with the current
 * user's scope so multiple accounts on one device never see each other's data.
 *
 * Works with both sync and async backends: any return value that is a Promise
 * is awaited before returning, so zustand always receives a consistent shape.
 */
export function createUserScopedStorage(
  backend: IStorageBackend | IAsyncStorageBackend,
  getEmail: () => string | null,
): StateStorage {
  const prefix = (): string => {
    const email = getEmail();
    return email ? `${email}_` : 'guest_';
  };

  return {
    getItem: async (key: string): Promise<string | null> => {
      const res = (backend as IAsyncStorageBackend).getItem(prefix() + key);
      return res instanceof Promise ? await res : (res as string | null);
    },
    setItem: async (key: string, value: string): Promise<void> => {
      const res = (backend as IAsyncStorageBackend).setItem(prefix() + key, value);
      if (res instanceof Promise) await res;
    },
    removeItem: async (key: string): Promise<void> => {
      const res = (backend as IAsyncStorageBackend).removeItem(prefix() + key);
      if (res instanceof Promise) await res;
    },
  };
}
