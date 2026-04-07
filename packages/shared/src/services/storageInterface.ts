/**
 * Platform-agnostic storage backend interface.
 * Web implements this with localStorage, mobile with AsyncStorage.
 */
export interface IStorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface IAsyncStorageBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
