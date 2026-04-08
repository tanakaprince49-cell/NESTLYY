import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IAsyncStorageBackend } from '@nestly/shared';

export const asyncStorageBackend: IAsyncStorageBackend = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};
