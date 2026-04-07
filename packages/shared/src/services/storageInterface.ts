/**
 * Platform-agnostic storage backend interface.
 * Web implements this with localStorage, mobile with AsyncStorage.
 */
export interface IStorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
