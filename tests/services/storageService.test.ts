import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockLocalStorage } from '../helpers';
import {
  KEYS,
  USER_SCOPED_KEYS,
  storage,
} from '../../packages/web/src/services/storageService.ts';
import { LOCAL_UUID_KEY } from '../../packages/shared/src/stores/localIdentityStore.ts';

type LocalStorageMock = ReturnType<typeof mockLocalStorage>;

function installMockStorage(): LocalStorageMock {
  const mock = mockLocalStorage();
  vi.stubGlobal('localStorage', mock);
  // Reset singleton UUID cache so each test gets a clean bootstrap path.
  (storage as any)._uuid = null;
  return mock;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('storageService — UUID scoping and bootstrap', () => {
  let ls: LocalStorageMock;

  beforeEach(() => {
    ls = installMockStorage();
  });

  it('generates a UUID on first access and persists it under LOCAL_UUID_KEY', () => {
    const uuid = storage.getLocalUuidPublic();
    expect(uuid).toMatch(UUID_RE);
    expect(ls._store.get(LOCAL_UUID_KEY)).toBe(uuid);
  });

  it('returns the cached UUID on subsequent calls without regenerating', () => {
    const first = storage.getLocalUuidPublic();
    const second = storage.getLocalUuidPublic();
    expect(second).toBe(first);
  });

  it('reuses an existing UUID already in localStorage', () => {
    ls._store.set(LOCAL_UUID_KEY, 'existing-uuid-value');
    const uuid = storage.getLocalUuidPublic();
    expect(uuid).toBe('existing-uuid-value');
  });

  it('writes user-scoped keys as `${uuid}_${key}`', () => {
    const uuid = storage.getLocalUuidPublic();
    storage.addFoodEntry({
      id: 'f1',
      name: 'sadza',
      calories: 200,
      protein: 5,
      folate: 10,
      iron: 1,
      calcium: 2,
      timestamp: 1,
    });
    expect(ls._store.has(`${uuid}_${KEYS.FOOD}`)).toBe(true);
    expect(ls._store.has(KEYS.FOOD)).toBe(false);
  });

  it('writes global keys unscoped (no UUID prefix)', () => {
    storage.setVisitCount(7);
    expect(ls._store.has(KEYS.VISITS)).toBe(true);
    const uuid = storage.getLocalUuidPublic();
    expect(ls._store.has(`${uuid}_${KEYS.VISITS}`)).toBe(false);
  });
});

describe('storageService — CRUD helpers', () => {
  beforeEach(() => {
    installMockStorage();
  });

  it('round-trips food entries', () => {
    storage.addFoodEntry({
      id: 'a',
      name: 'eggs',
      calories: 140,
      protein: 12,
      folate: 22,
      iron: 2,
      calcium: 50,
      timestamp: 1,
    });
    const entries = storage.getFoodEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe('eggs');
  });

  it('addFoodEntry prepends (newest first)', () => {
    storage.addFoodEntry({ id: '1', name: 'a', calories: 0, protein: 0, folate: 0, iron: 0, calcium: 0, timestamp: 1 });
    storage.addFoodEntry({ id: '2', name: 'b', calories: 0, protein: 0, folate: 0, iron: 0, calcium: 0, timestamp: 2 });
    expect(storage.getFoodEntries().map((e) => e.id)).toEqual(['2', '1']);
  });

  it('removeFoodEntry filters by id', () => {
    storage.addFoodEntry({ id: '1', name: 'a', calories: 0, protein: 0, folate: 0, iron: 0, calcium: 0, timestamp: 1 });
    storage.addFoodEntry({ id: '2', name: 'b', calories: 0, protein: 0, folate: 0, iron: 0, calcium: 0, timestamp: 2 });
    storage.removeFoodEntry('1');
    expect(storage.getFoodEntries()).toHaveLength(1);
    expect(storage.getFoodEntries()[0].id).toBe('2');
  });

  it('getFoodEntries returns [] when no data exists', () => {
    expect(storage.getFoodEntries()).toEqual([]);
  });

  it('getProfile returns null when unset', () => {
    expect(storage.getProfile()).toBeNull();
  });

  it('saveProfile / getProfile round-trips', () => {
    const profile: any = { name: 'Tendai', week: 12, babies: [] };
    storage.saveProfile(profile);
    const read = storage.getProfile();
    expect(read?.name).toBe('Tendai');
    expect(read?.week).toBe(12);
  });

  it('getProfile backfills an empty `babies` array when missing', () => {
    const profile: any = { name: 'Chiedza', week: 20 };
    storage.saveProfile(profile);
    const read = storage.getProfile();
    expect(read?.babies).toEqual([]);
  });

  it('removeSleepLog filters by id', () => {
    const base = { mode: 'pregnancy', quality: 'good', type: 'night', timestamp: 1 } as any;
    storage.addSleepLog({ ...base, id: '1', startTime: 'a', endTime: 'b', userId: 'u' });
    storage.addSleepLog({ ...base, id: '2', startTime: 'a', endTime: 'b', userId: 'u' });
    storage.removeSleepLog('1');
    expect(storage.getSleepLogs().map((s) => s.id)).toEqual(['2']);
  });

  it('unlockAchievement dedupes by id', () => {
    storage.unlockAchievement('first_meal');
    storage.unlockAchievement('first_meal');
    storage.unlockAchievement('tri_1');
    expect(storage.getUnlockedAchievementIds().sort()).toEqual(['first_meal', 'tri_1']);
  });
});

describe('storageService — recent picks / reports / sleep sessions (#337)', () => {
  beforeEach(() => {
    installMockStorage();
  });

  it('getRecentFoodPicks returns [] when unset', () => {
    expect(storage.getRecentFoodPicks()).toEqual([]);
  });

  it('setRecentFoodPicks / getRecentFoodPicks round-trips', () => {
    storage.setRecentFoodPicks(['eggs', 'sadza', 'nyemba']);
    expect(storage.getRecentFoodPicks()).toEqual(['eggs', 'sadza', 'nyemba']);
  });

  it('getRecentReports returns [] when unset', () => {
    expect(storage.getRecentReports()).toEqual([]);
  });

  it('setRecentReports / getRecentReports round-trips', () => {
    const reports = [{ start: '2026-01-01', end: '2026-01-07', id: 'r1' }];
    storage.setRecentReports(reports);
    expect(storage.getRecentReports()).toEqual(reports);
  });

  it('hasSleepSessions returns false on a fresh profile', () => {
    expect(storage.hasSleepSessions()).toBe(false);
  });

  it('hasSleepSessions returns true after an empty-array write (user deleted all)', () => {
    storage.setSleepSessions([]);
    expect(storage.hasSleepSessions()).toBe(true);
  });

  it('hasSleepSessions returns true after a non-empty write', () => {
    storage.setSleepSessions([
      {
        id: '1',
        userId: 'u',
        startTime: 'a',
        endTime: 'b',
        mode: 'pregnancy',
        quality: 'good',
        type: 'night',
        timestamp: 1,
      } as any,
    ]);
    expect(storage.hasSleepSessions()).toBe(true);
  });

  it('hasSleepSessions returns false when localStorage throws', () => {
    // First force the cached UUID bootstrap so the error on getItem can only
    // come from the hasSleepSessions read itself.
    storage.getLocalUuidPublic();
    const spy = vi
      .spyOn(localStorage, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    expect(storage.hasSleepSessions()).toBe(false);
    spy.mockRestore();
  });
});

describe('storageService — error handling', () => {
  beforeEach(() => {
    installMockStorage();
  });

  it('getItem returns the default when stored JSON is corrupted', () => {
    const uuid = storage.getLocalUuidPublic();
    localStorage.setItem(`${uuid}_${KEYS.FOOD}`, '{not valid json');
    expect(storage.getFoodEntries()).toEqual([]);
  });

  it('getItem returns the default when the stored value is not the expected array shape', () => {
    const uuid = storage.getLocalUuidPublic();
    localStorage.setItem(`${uuid}_${KEYS.FOOD}`, JSON.stringify({ oops: true }));
    expect(storage.getFoodEntries()).toEqual([]);
  });

  it('getProfile tolerates a thrown getItem', () => {
    storage.getLocalUuidPublic();
    const spy = vi
      .spyOn(localStorage, 'getItem')
      .mockImplementation(() => {
        throw new Error('blocked');
      });
    expect(storage.getProfile()).toBeNull();
    spy.mockRestore();
  });

  it('setItem swallows QuotaExceededError and logs a warning', () => {
    storage.getLocalUuidPublic();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const quotaErr = Object.assign(new Error('quota'), { name: 'QuotaExceededError' });
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw quotaErr;
    });
    expect(() =>
      storage.addFoodEntry({ id: 'a', name: 'x', calories: 0, protein: 0, folate: 0, iron: 0, calcium: 0, timestamp: 1 }),
    ).not.toThrow();
    expect(warn).toHaveBeenCalled();
    spy.mockRestore();
    warn.mockRestore();
  });

  it('setItem ignores non-quota storage errors without throwing', () => {
    storage.getLocalUuidPublic();
    const spy = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('something else');
    });
    expect(() => storage.acceptPrivacy()).not.toThrow();
    spy.mockRestore();
  });
});

describe('storageService — email-scope migration (#293 follow-up)', () => {
  let ls: LocalStorageMock;

  beforeEach(() => {
    ls = installMockStorage();
  });

  it('migrates legacy email-scoped keys under the new UUID scope on first boot', () => {
    ls._store.set('nestly_auth_email', 'user@test.com');
    ls._store.set('user@test.com_food_entries', JSON.stringify([{ id: 'legacy' }]));
    ls._store.set('user@test.com_symptoms', JSON.stringify([{ id: 'sym' }]));

    const uuid = storage.getLocalUuidPublic();

    expect(ls._store.get(`${uuid}_${KEYS.FOOD}`)).toContain('legacy');
    expect(ls._store.get(`${uuid}_${KEYS.SYMPTOMS}`)).toContain('sym');
    expect(ls._store.has('user@test.com_food_entries')).toBe(false);
    expect(ls._store.has('user@test.com_symptoms')).toBe(false);
    expect(ls._store.has('nestly_auth_email')).toBe(false);
  });

  it('is a no-op when no legacy email marker exists', () => {
    ls._store.set('user@test.com_food_entries', JSON.stringify([{ id: 'orphan' }]));

    const uuid = storage.getLocalUuidPublic();

    // Without the `nestly_auth_email` pointer, the migrator cannot
    // identify legacy keys and must leave them alone.
    expect(ls._store.has('user@test.com_food_entries')).toBe(true);
    expect(ls._store.has(`${uuid}_${KEYS.FOOD}`)).toBe(false);
  });

  it('does not clobber a pre-existing UUID-scoped value', () => {
    ls._store.set('nestly_auth_email', 'user@test.com');
    ls._store.set('user@test.com_food_entries', JSON.stringify([{ id: 'from-legacy' }]));
    // Pre-seed the UUID (same one getLocalIdentitySync will return) and an
    // existing UUID-scoped food array. Migration must not overwrite it.
    ls._store.set(LOCAL_UUID_KEY, 'fixed-uuid');
    ls._store.set(`fixed-uuid_${KEYS.FOOD}`, JSON.stringify([{ id: 'from-uuid' }]));

    storage.getLocalUuidPublic();

    expect(ls._store.get(`fixed-uuid_${KEYS.FOOD}`)).toContain('from-uuid');
    expect(ls._store.has('user@test.com_food_entries')).toBe(false);
    expect(ls._store.has('nestly_auth_email')).toBe(false);
  });
});

describe('storageService — orphan global keys migration (#337)', () => {
  let ls: LocalStorageMock;

  beforeEach(() => {
    ls = installMockStorage();
  });

  it('migrates unscoped recent_food_picks, nestly_recent_reports, and sleep_sessions to the UUID scope', () => {
    ls._store.set(LOCAL_UUID_KEY, 'uuid-1');
    ls._store.set(KEYS.RECENT_FOOD_PICKS, JSON.stringify(['eggs']));
    ls._store.set(KEYS.RECENT_REPORTS, JSON.stringify([{ id: 'r1', start: 'a', end: 'b' }]));
    ls._store.set(KEYS.SLEEP_SESSIONS, JSON.stringify([{ id: 's1' }]));

    storage.getLocalUuidPublic();

    expect(ls._store.get(`uuid-1_${KEYS.RECENT_FOOD_PICKS}`)).toContain('eggs');
    expect(ls._store.get(`uuid-1_${KEYS.RECENT_REPORTS}`)).toContain('r1');
    expect(ls._store.get(`uuid-1_${KEYS.SLEEP_SESSIONS}`)).toContain('s1');
    expect(ls._store.has(KEYS.RECENT_FOOD_PICKS)).toBe(false);
    expect(ls._store.has(KEYS.RECENT_REPORTS)).toBe(false);
    expect(ls._store.has(KEYS.SLEEP_SESSIONS)).toBe(false);
    expect(ls._store.get('uuid-1_orphan_keys_migrated_v1')).toBe('done');
  });

  it('is idempotent on subsequent boots (flag guard)', () => {
    ls._store.set(LOCAL_UUID_KEY, 'uuid-1');
    ls._store.set('uuid-1_orphan_keys_migrated_v1', 'done');
    // Plant a "global" orphan — the flag says we already migrated, so the
    // migrator must NOT touch it.
    ls._store.set(KEYS.RECENT_FOOD_PICKS, JSON.stringify(['should-stay']));

    storage.getLocalUuidPublic();

    expect(ls._store.has(KEYS.RECENT_FOOD_PICKS)).toBe(true);
    expect(ls._store.has(`uuid-1_${KEYS.RECENT_FOOD_PICKS}`)).toBe(false);
  });

  it('does not clobber an existing UUID-scoped value', () => {
    ls._store.set(LOCAL_UUID_KEY, 'uuid-1');
    ls._store.set(KEYS.RECENT_FOOD_PICKS, JSON.stringify(['global-wins']));
    ls._store.set(`uuid-1_${KEYS.RECENT_FOOD_PICKS}`, JSON.stringify(['scoped-wins']));

    storage.getLocalUuidPublic();

    expect(ls._store.get(`uuid-1_${KEYS.RECENT_FOOD_PICKS}`)).toContain('scoped-wins');
    // Global value is still removed — the post-migration world has no global key.
    expect(ls._store.has(KEYS.RECENT_FOOD_PICKS)).toBe(false);
  });

  it('translates legacy pre-pivot recent_food_research names to ids via searchNutrition', () => {
    ls._store.set(LOCAL_UUID_KEY, 'uuid-1');
    // Use a name the offline nutrition database can resolve.
    ls._store.set('recent_food_research', JSON.stringify(['sadza']));

    storage.getLocalUuidPublic();

    const scoped = ls._store.get(`uuid-1_${KEYS.RECENT_FOOD_PICKS}`);
    expect(scoped).toBeTruthy();
    const ids = JSON.parse(scoped as string);
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThan(0);
    // The legacy key is cleared regardless of what resolved.
    expect(ls._store.has('recent_food_research')).toBe(false);
  });

  it('ignores legacy names that do not resolve and leaves the scoped key untouched', () => {
    ls._store.set(LOCAL_UUID_KEY, 'uuid-1');
    ls._store.set('recent_food_research', JSON.stringify(['zzzznotafood', 'alsofake']));

    storage.getLocalUuidPublic();

    expect(ls._store.has('recent_food_research')).toBe(false);
    // Nothing to write: no scoped key was created.
    expect(ls._store.has(`uuid-1_${KEYS.RECENT_FOOD_PICKS}`)).toBe(false);
  });
});

describe('storageService — deleteAccount', () => {
  let ls: LocalStorageMock;

  beforeEach(() => {
    ls = installMockStorage();
  });

  it('removes every USER_SCOPED_KEYS entry under the current UUID', () => {
    const uuid = storage.getLocalUuidPublic();
    storage.addFoodEntry({ id: '1', name: 'x', calories: 0, protein: 0, folate: 0, iron: 0, calcium: 0, timestamp: 1 });
    storage.saveProfile({ name: 'p' } as any);
    storage.acceptPrivacy();

    expect(ls._store.has(`${uuid}_${KEYS.FOOD}`)).toBe(true);
    expect(ls._store.has(`${uuid}_${KEYS.PROFILE}`)).toBe(true);
    expect(ls._store.has(`${uuid}_${KEYS.PRIVACY_ACCEPTED}`)).toBe(true);

    storage.deleteAccount();

    for (const key of USER_SCOPED_KEYS) {
      expect(ls._store.has(`${uuid}_${key}`)).toBe(false);
    }
  });

  it('removes LOCAL_UUID_KEY so next boot mints a fresh identity', () => {
    storage.getLocalUuidPublic();
    expect(ls._store.has(LOCAL_UUID_KEY)).toBe(true);
    storage.deleteAccount();
    expect(ls._store.has(LOCAL_UUID_KEY)).toBe(false);
  });

  it('resets the singleton cache so the next getScope returns a fresh UUID', () => {
    const first = storage.getLocalUuidPublic();
    storage.deleteAccount();
    const second = storage.getLocalUuidPublic();
    expect(second).not.toBe(first);
    expect(second).toMatch(UUID_RE);
  });

  it('preserves global (unscoped) keys', () => {
    const uuid = storage.getLocalUuidPublic();
    storage.setVisitCount(3);
    storage.logActivity('user', 'login');
    storage.addArticle({ id: 'art-1', title: 't', content: 'c', category: 'pregnancy' } as any);
    storage.addVideo({ id: 'v-1', title: 't', url: 'u', category: 'pregnancy' } as any);

    storage.deleteAccount();

    // Global data lives unscoped and survives deleteAccount.
    expect(ls._store.has(KEYS.VISITS)).toBe(true);
    expect(ls._store.has(KEYS.ACTIVITY_LOGS)).toBe(true);
    expect(ls._store.has(KEYS.ARTICLES)).toBe(true);
    expect(ls._store.has(KEYS.VIDEOS)).toBe(true);
    // And it is NOT stored under the old UUID prefix either.
    expect(ls._store.has(`${uuid}_${KEYS.VISITS}`)).toBe(false);
  });
});

describe('storageService — checklist', () => {
  beforeEach(() => {
    installMockStorage();
  });

  it('saveChecklistItem inserts a new item', () => {
    const item: any = { id: 'c1', category: 'prenatal', text: 't', completed: false };
    storage.saveChecklistItem(item);
    expect(storage.getAllChecklists()).toEqual([item]);
  });

  it('saveChecklistItem updates an existing item with the same id', () => {
    storage.saveChecklistItem({ id: 'c1', category: 'prenatal', text: 't', completed: false } as any);
    storage.saveChecklistItem({ id: 'c1', category: 'prenatal', text: 't', completed: true } as any);
    const all = storage.getAllChecklists();
    expect(all).toHaveLength(1);
    expect(all[0].completed).toBe(true);
  });

  it('getChecklist filters by category', () => {
    storage.saveChecklistItem({ id: 'a', category: 'prenatal', text: 'p', completed: false } as any);
    storage.saveChecklistItem({ id: 'b', category: 'hospital-bag', text: 'h', completed: false } as any);
    const prenatal = storage.getChecklist('prenatal' as any);
    expect(prenatal).toHaveLength(1);
    expect(prenatal[0].id).toBe('a');
  });

  it('removeChecklistItem deletes by id', () => {
    storage.saveChecklistItem({ id: 'a', category: 'prenatal', text: 'p', completed: false } as any);
    storage.saveChecklistItem({ id: 'b', category: 'prenatal', text: 'q', completed: false } as any);
    storage.removeChecklistItem('a');
    expect(storage.getAllChecklists().map((i) => i.id)).toEqual(['b']);
  });
});
