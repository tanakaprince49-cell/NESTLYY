import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { IStorageBackend, IAsyncStorageBackend } from '../../services/storageInterface.ts';

export type { StateStorage };
export { persist, createJSONStorage };

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
