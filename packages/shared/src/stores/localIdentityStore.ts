import { create } from 'zustand';

export const LOCAL_UUID_KEY = 'nestly_local_uuid';

interface LocalIdentityState {
  localUuid: string;
}

/**
 * Returns the persisted local UUID, creating and persisting one if absent.
 * Sync, localStorage-based. Used on web. Mobile uses getLocalUuidAsync.
 */
export function getLocalIdentitySync(
  getItem: (key: string) => string | null,
  setItem: (key: string, value: string) => void,
): string {
  const stored = getItem(LOCAL_UUID_KEY);
  if (stored) return stored;
  const uuid = _generateUuid();
  setItem(LOCAL_UUID_KEY, uuid);
  return uuid;
}

/**
 * Returns the persisted local UUID, creating and persisting one if absent.
 * Async, AsyncStorage-based. Used on mobile.
 */
export async function getLocalIdentityAsync(
  getItem: (key: string) => Promise<string | null>,
  setItem: (key: string, value: string) => Promise<void>,
): Promise<string> {
  const stored = await getItem(LOCAL_UUID_KEY);
  if (stored) return stored;
  const uuid = _generateUuid();
  await setItem(LOCAL_UUID_KEY, uuid);
  return uuid;
}

function _generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const useLocalIdentityStore = create<LocalIdentityState>()(() => ({
  localUuid: '',
}));

export function setLocalUuid(uuid: string): void {
  useLocalIdentityStore.setState({ localUuid: uuid });
}
