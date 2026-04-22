import { describe, it, expect } from 'vitest';
import {
  AVA_PURGE_DONE_KEY,
  AVA_HAD_ORPHANS_KEY,
  isAvaOrphanKey,
  collectAvaOrphanKeys,
  purgeAvaOrphansSync,
  purgeAvaOrphansAsync,
} from './avaOrphanPurge.ts';

function makeSyncBackend(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    store,
    backend: {
      getItem: (key: string): string | null => (store.has(key) ? (store.get(key) as string) : null),
      setItem: (key: string, value: string): void => {
        store.set(key, value);
      },
      removeItem: (key: string): void => {
        store.delete(key);
      },
      getAllKeys: (): readonly string[] => Array.from(store.keys()),
    },
  };
}

function makeAsyncBackend(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    store,
    backend: {
      getItem: async (key: string): Promise<string | null> =>
        store.has(key) ? (store.get(key) as string) : null,
      setItem: async (key: string, value: string): Promise<void> => {
        store.set(key, value);
      },
      removeItem: async (key: string): Promise<void> => {
        store.delete(key);
      },
      getAllKeys: async (): Promise<readonly string[]> => Array.from(store.keys()),
    },
  };
}

describe('isAvaOrphanKey', () => {
  it('matches exact unscoped Ava keys', () => {
    expect(isAvaOrphanKey('ava_history_v2')).toBe(true);
    expect(isAvaOrphanKey('ava_memory_bank')).toBe(true);
    expect(isAvaOrphanKey('ava_custom_image')).toBe(true);
    expect(isAvaOrphanKey('chat_history')).toBe(true);
    expect(isAvaOrphanKey('custom_plan')).toBe(true);
    expect(isAvaOrphanKey('custom_plan_v1')).toBe(true);
    expect(isAvaOrphanKey('ava-chat')).toBe(true);
  });

  it('matches UUID-prefixed Ava keys', () => {
    expect(isAvaOrphanKey('abc-123_ava_history_v2')).toBe(true);
    expect(isAvaOrphanKey('abc-123_custom_plan_v1')).toBe(true);
    expect(isAvaOrphanKey('abc-123_ava-chat')).toBe(true);
  });

  it('matches legacy email-prefixed Ava keys', () => {
    expect(isAvaOrphanKey('user@example.com_ava_history_v2')).toBe(true);
    expect(isAvaOrphanKey('user@example.com_chat_history')).toBe(true);
  });

  it('matches guest-prefixed Ava keys', () => {
    expect(isAvaOrphanKey('guest__ava_history_v2')).toBe(true);
  });

  it('does not match unrelated keys', () => {
    expect(isAvaOrphanKey('nestly_local_uuid')).toBe(false);
    expect(isAvaOrphanKey('abc-123_food_entries')).toBe(false);
    expect(isAvaOrphanKey('abc-123_profile_v5')).toBe(false);
    expect(isAvaOrphanKey('abc-123_journal')).toBe(false);
    expect(isAvaOrphanKey('nestly_privacy_accepted')).toBe(false);
    expect(isAvaOrphanKey('abc-123_ava_reality_check')).toBe(false);
  });

  it('handles full-length UUIDv4 scope prefixes', () => {
    expect(
      isAvaOrphanKey('a1b2c3d4-e5f6-4abc-9def-0123456789ab_ava_history_v2'),
    ).toBe(true);
    expect(
      isAvaOrphanKey('a1b2c3d4-e5f6-4abc-9def-0123456789ab_food_entries'),
    ).toBe(false);
  });
});

describe('collectAvaOrphanKeys', () => {
  it('returns only the orphan keys from a mixed list', () => {
    const keys = [
      'nestly_local_uuid',
      'abc-123_ava_history_v2',
      'abc-123_food_entries',
      'abc-123_chat_history',
      'abc-123_profile_v5',
      'abc-123_ava-chat',
    ];
    expect(collectAvaOrphanKeys(keys)).toEqual([
      'abc-123_ava_history_v2',
      'abc-123_chat_history',
      'abc-123_ava-chat',
    ]);
  });

  it('returns empty array when no orphans present', () => {
    expect(collectAvaOrphanKeys(['nestly_local_uuid', 'abc_food_entries'])).toEqual([]);
  });
});

describe('purgeAvaOrphansSync', () => {
  it('fresh install: no orphans to purge, flag set, had-orphans=0', () => {
    const { store, backend } = makeSyncBackend({
      nestly_local_uuid: 'abc-123',
      'abc-123_profile_v5': '{}',
    });
    const result = purgeAvaOrphansSync(backend);
    expect(result).toEqual({ purged: 0, skipped: false });
    expect(store.get(AVA_PURGE_DONE_KEY)).toBe('1');
    expect(store.get(AVA_HAD_ORPHANS_KEY)).toBe('0');
    expect(store.get('nestly_local_uuid')).toBe('abc-123');
    expect(store.get('abc-123_profile_v5')).toBe('{}');
  });

  it('upgrade with Ava data: removes orphan keys, flag set, had-orphans=1', () => {
    const { store, backend } = makeSyncBackend({
      nestly_local_uuid: 'abc-123',
      'abc-123_ava_history_v2': '[]',
      'abc-123_ava_memory_bank': '[]',
      'abc-123_ava_custom_image': '"data:..."',
      'abc-123_chat_history': '[]',
      'abc-123_custom_plan_v1': '{}',
      'abc-123_ava-chat': '{}',
      'abc-123_profile_v5': '{"userName":"Test"}',
      'abc-123_food_entries': '[]',
    });
    const result = purgeAvaOrphansSync(backend);
    expect(result).toEqual({ purged: 6, skipped: false });
    expect(store.has('abc-123_ava_history_v2')).toBe(false);
    expect(store.has('abc-123_ava_memory_bank')).toBe(false);
    expect(store.has('abc-123_ava_custom_image')).toBe(false);
    expect(store.has('abc-123_chat_history')).toBe(false);
    expect(store.has('abc-123_custom_plan_v1')).toBe(false);
    expect(store.has('abc-123_ava-chat')).toBe(false);
    expect(store.get('abc-123_profile_v5')).toBe('{"userName":"Test"}');
    expect(store.get('abc-123_food_entries')).toBe('[]');
    expect(store.get(AVA_PURGE_DONE_KEY)).toBe('1');
    expect(store.get(AVA_HAD_ORPHANS_KEY)).toBe('1');
  });

  it('skips rerun when flag is already set', () => {
    const { store, backend } = makeSyncBackend({
      [AVA_PURGE_DONE_KEY]: '1',
      'abc-123_ava_history_v2': 'should-not-be-touched',
    });
    const result = purgeAvaOrphansSync(backend);
    expect(result).toEqual({ purged: 0, skipped: true });
    expect(store.get('abc-123_ava_history_v2')).toBe('should-not-be-touched');
  });

  it('removes legacy email-scoped and guest-scoped Ava keys', () => {
    const { store, backend } = makeSyncBackend({
      'user@example.com_ava_history_v2': '[]',
      'guest__chat_history': '[]',
      'user@example.com_food_entries': '[]',
    });
    const result = purgeAvaOrphansSync(backend);
    expect(result.purged).toBe(2);
    expect(store.has('user@example.com_ava_history_v2')).toBe(false);
    expect(store.has('guest__chat_history')).toBe(false);
    expect(store.get('user@example.com_food_entries')).toBe('[]');
  });
});

describe('purgeAvaOrphansAsync', () => {
  it('fresh install: no orphans to purge, flag set', async () => {
    const { store, backend } = makeAsyncBackend({
      nestly_local_uuid: 'abc-123',
      'abc-123_profile_v5': '{}',
    });
    const result = await purgeAvaOrphansAsync(backend);
    expect(result).toEqual({ purged: 0, skipped: false });
    expect(store.get(AVA_PURGE_DONE_KEY)).toBe('1');
    expect(store.get('abc-123_profile_v5')).toBe('{}');
  });

  it('upgrade with Ava data: removes orphan keys and sets the flag', async () => {
    const { store, backend } = makeAsyncBackend({
      nestly_local_uuid: 'abc-123',
      'abc-123_ava_history_v2': '[]',
      'abc-123_ava-chat': '{}',
      'abc-123_profile_v5': '{}',
    });
    const result = await purgeAvaOrphansAsync(backend);
    expect(result).toEqual({ purged: 2, skipped: false });
    expect(store.has('abc-123_ava_history_v2')).toBe(false);
    expect(store.has('abc-123_ava-chat')).toBe(false);
    expect(store.get('abc-123_profile_v5')).toBe('{}');
    expect(store.get(AVA_PURGE_DONE_KEY)).toBe('1');
  });

  it('skips rerun when flag is already set', async () => {
    const { store, backend } = makeAsyncBackend({
      [AVA_PURGE_DONE_KEY]: '1',
      'abc-123_custom_plan_v1': 'should-not-be-touched',
    });
    const result = await purgeAvaOrphansAsync(backend);
    expect(result).toEqual({ purged: 0, skipped: true });
    expect(store.get('abc-123_custom_plan_v1')).toBe('should-not-be-touched');
  });
});
