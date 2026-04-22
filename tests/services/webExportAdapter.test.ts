import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockLocalStorage } from '../helpers';
import {
  KEYS,
  USER_SCOPED_KEYS,
  storage,
} from '../../packages/web/src/services/storageService.ts';
import {
  restoreUserScopedKeys,
  wipeUserScopedKeys,
} from '../../packages/web/src/services/webExportAdapter.ts';
import type {
  ZeroDataExportV1,
  ZeroDataTrackingSlice,
} from '../../packages/shared/src/types.ts';

type LocalStorageMock = ReturnType<typeof mockLocalStorage>;

function installMockStorage(): LocalStorageMock {
  const mock = mockLocalStorage();
  vi.stubGlobal('localStorage', mock);
  (storage as any)._uuid = null;
  return mock;
}

const emptyTracking: ZeroDataTrackingSlice = {
  foodEntries: [],
  symptoms: [],
  vitamins: [],
  contractions: [],
  journalEntries: [],
  calendarEvents: [],
  weightLogs: [],
  sleepLogs: [],
  feedingLogs: [],
  milestones: [],
  healthLogs: [],
  reactions: [],
  babyGrowthLogs: [],
  tummyTimeLogs: [],
  bloodPressureLogs: [],
  kickLogs: [],
  kegelLogs: [],
  diaperLogs: [],
  medicationLogs: [],
};

function buildPayload(overrides: Partial<ZeroDataExportV1> = {}): ZeroDataExportV1 {
  return {
    version: 1,
    exportedAt: new Date('2026-01-01').toISOString(),
    tracking: emptyTracking,
    settings: { hasAcceptedPrivacy: true },
    ...overrides,
  };
}

describe('webExportAdapter — wipeUserScopedKeys', () => {
  let ls: LocalStorageMock;

  beforeEach(() => {
    ls = installMockStorage();
  });

  it('removes every USER_SCOPED_KEY under the current UUID', () => {
    const uuid = storage.getLocalUuidPublic();
    for (const key of USER_SCOPED_KEYS) {
      ls._store.set(`${uuid}_${key}`, '"seed"');
    }
    wipeUserScopedKeys(storage);
    for (const key of USER_SCOPED_KEYS) {
      expect(ls._store.has(`${uuid}_${key}`)).toBe(false);
    }
  });

  it('preserves the device UUID and unrelated keys', () => {
    const uuid = storage.getLocalUuidPublic();
    ls._store.set('nestly_local_uuid', uuid);
    ls._store.set('some_global_key', 'preserved');
    wipeUserScopedKeys(storage);
    expect(ls._store.get('nestly_local_uuid')).toBe(uuid);
    expect(ls._store.get('some_global_key')).toBe('preserved');
  });
});

describe('webExportAdapter — restoreUserScopedKeys happy path', () => {
  beforeEach(() => {
    installMockStorage();
  });

  it('writes every imported value under the current UUID', () => {
    const uuid = storage.getLocalUuidPublic();
    const payload = buildPayload({
      tracking: {
        ...emptyTracking,
        foodEntries: [
          {
            id: 'f1',
            name: 'eggs',
            calories: 140,
            protein: 12,
            folate: 40,
            iron: 2,
            calcium: 50,
            timestamp: 1,
          },
        ],
      },
    });
    restoreUserScopedKeys(storage, payload);
    const stored = localStorage.getItem(`${uuid}_${KEYS.FOOD}`);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toEqual(payload.tracking.foodEntries);
    const privacy = localStorage.getItem(`${uuid}_${KEYS.PRIVACY_ACCEPTED}`);
    expect(JSON.parse(privacy!)).toBe(true);
  });

  it('overwrites pre-existing values with the imported payload', () => {
    const uuid = storage.getLocalUuidPublic();
    localStorage.setItem(
      `${uuid}_${KEYS.FOOD}`,
      JSON.stringify([{ id: 'old', name: 'stale' }]),
    );
    const payload = buildPayload({
      tracking: {
        ...emptyTracking,
        foodEntries: [
          {
            id: 'new',
            name: 'fresh',
            calories: 100,
            protein: 10,
            folate: 20,
            iron: 1,
            calcium: 30,
            timestamp: 1,
          },
        ],
      },
    });
    restoreUserScopedKeys(storage, payload);
    const stored = JSON.parse(
      localStorage.getItem(`${uuid}_${KEYS.FOOD}`)!,
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('new');
  });
});

describe('webExportAdapter — restoreUserScopedKeys rollback on QuotaExceededError', () => {
  let ls: LocalStorageMock;

  beforeEach(() => {
    ls = installMockStorage();
  });

  it('rolls back every user-scoped key when a mid-restore write throws', () => {
    const uuid = storage.getLocalUuidPublic();
    const originalFood = [
      {
        id: 'pre-existing',
        name: 'banana',
        calories: 90,
        protein: 1,
        folate: 20,
        iron: 0.3,
        calcium: 5,
        timestamp: 1,
      },
    ];
    const originalPrivacy = true;
    localStorage.setItem(`${uuid}_${KEYS.FOOD}`, JSON.stringify(originalFood));
    localStorage.setItem(`${uuid}_${KEYS.PRIVACY_ACCEPTED}`, JSON.stringify(originalPrivacy));

    // Stub setItem to throw QuotaExceededError on the 3rd write, which
    // is mid-restore. The snapshot has already been captured and the
    // wipe completed, so we're exercising the actual rollback path.
    const realSetItem = ls.setItem.bind(ls);
    let writeCount = 0;
    ls.setItem = (key: string, value: string) => {
      writeCount += 1;
      if (writeCount === 3) {
        const err = new Error('quota') as Error & { name: string };
        err.name = 'QuotaExceededError';
        throw err;
      }
      realSetItem(key, value);
    };

    const payload = buildPayload({
      tracking: {
        ...emptyTracking,
        foodEntries: [
          {
            id: 'imported',
            name: 'mango',
            calories: 60,
            protein: 1,
            folate: 30,
            iron: 0.2,
            calcium: 10,
            timestamp: 2,
          },
        ],
      },
    });

    expect(() => restoreUserScopedKeys(storage, payload)).toThrow(/quota/);

    // After rollback, pre-existing values are back exactly as before.
    expect(
      JSON.parse(localStorage.getItem(`${uuid}_${KEYS.FOOD}`)!),
    ).toEqual(originalFood);
    expect(
      JSON.parse(localStorage.getItem(`${uuid}_${KEYS.PRIVACY_ACCEPTED}`)!),
    ).toBe(originalPrivacy);
  });

  it('rolls back to an empty state when no snapshot existed pre-call', () => {
    const uuid = storage.getLocalUuidPublic();

    const realSetItem = ls.setItem.bind(ls);
    let writeCount = 0;
    ls.setItem = (key: string, value: string) => {
      writeCount += 1;
      if (writeCount === 2) {
        const err = new Error('quota') as Error & { name: string };
        err.name = 'QuotaExceededError';
        throw err;
      }
      realSetItem(key, value);
    };

    const payload = buildPayload({
      tracking: {
        ...emptyTracking,
        foodEntries: [
          {
            id: 'imported',
            name: 'mango',
            calories: 60,
            protein: 1,
            folate: 30,
            iron: 0.2,
            calcium: 10,
            timestamp: 2,
          },
        ],
      },
    });

    expect(() => restoreUserScopedKeys(storage, payload)).toThrow();

    // Nothing was seeded, so after rollback every user-scoped key is absent.
    for (const key of USER_SCOPED_KEYS) {
      expect(ls._store.has(`${uuid}_${key}`)).toBe(false);
    }
  });

  it('rethrows the original error so callers can surface it', () => {
    const realSetItem = ls.setItem.bind(ls);
    ls.setItem = (key: string, value: string) => {
      if (key.includes(KEYS.FOOD)) {
        const err = new Error('explicit-canary') as Error & { name: string };
        err.name = 'QuotaExceededError';
        throw err;
      }
      realSetItem(key, value);
    };

    const payload = buildPayload();
    expect(() => restoreUserScopedKeys(storage, payload)).toThrow(/explicit-canary/);
  });
});
