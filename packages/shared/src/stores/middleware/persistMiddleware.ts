import { persist, type StateStorage } from 'zustand/middleware';
import type { IStorageBackend } from '../../services/storageInterface.ts';
import type { IAsyncStorageBackend } from '../../services/storageInterface.ts';

export type { StateStorage };

export function createUserScopedStorage(
  backend: IStorageBackend | IAsyncStorageBackend,
  getEmail: () => string | null,
): StateStorage {
  const prefix = (): string => {
    const email = getEmail();
    return email ? `${email}_` : 'guest_';
  };

  return {
    getItem: (key: string): string | null | Promise<string | null> => {
      return (backend as IStorageBackend).getItem(prefix() + key) ??
        (backend as IAsyncStorageBackend).getItem?.(prefix() + key) ??
        null;
    },
    setItem: (key: string, value: string): void | Promise<void> => {
      const sync = backend as IStorageBackend;
      if (typeof sync.setItem === 'function' && sync.setItem.length === 2) {
        const result = sync.setItem(prefix() + key, value);
        if (result !== undefined) {
          return result as Promise<void>;
        }
        return;
      }
      return (backend as IAsyncStorageBackend).setItem(prefix() + key, value);
    },
    removeItem: (key: string): void | Promise<void> => {
      const sync = backend as IStorageBackend;
      if (typeof sync.removeItem === 'function') {
        const result = sync.removeItem(prefix() + key);
        if (result !== undefined) {
          return result as Promise<void>;
        }
        return;
      }
      return (backend as IAsyncStorageBackend).removeItem(prefix() + key);
    },
  };
}

export { persist };
