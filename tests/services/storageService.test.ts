import { mockLocalStorage } from '../helpers';

vi.mock('../../packages/shared/src/services/syncService.ts', () => ({
  syncToFirestore: vi.fn(),
}));

// Must import after mock setup
import { storage } from '../../packages/web/src/services/storageService.ts';
import { syncToFirestore } from '../../packages/shared/src/services/syncService.ts';

let ls: ReturnType<typeof mockLocalStorage>;

beforeEach(() => {
  ls = mockLocalStorage();
  vi.stubGlobal('localStorage', ls);
});

describe('key scoping', () => {
  it('uses guest_ prefix when no auth email is set', () => {
    storage.saveProfile({ name: 'Test' } as any);
    expect(ls._store.has('guest_profile_v5')).toBe(true);
  });

  it('uses email prefix when auth email is set', () => {
    storage.setAuthEmail('user@test.com');
    storage.saveProfile({ name: 'Test' } as any);
    expect(ls._store.has('user@test.com_profile_v5')).toBe(true);
  });

  it('global keys are not user-prefixed', () => {
    storage.setAuthEmail('user@test.com');
    storage.addArticle({ id: '1', title: 'Test' } as any);
    expect(ls._store.has('nestly_global_articles')).toBe(true);
    expect(ls._store.has('user@test.com_nestly_global_articles')).toBe(false);
  });

  it('user-scoped and global keys do not interfere', () => {
    storage.setAuthEmail('user@test.com');
    storage.addFoodEntry({ id: 'f1', timestamp: Date.now() } as any);
    storage.addArticle({ id: 'a1', title: 'Article' } as any);

    expect(storage.getFoodEntries()).toHaveLength(1);
    expect(storage.getArticles()).toHaveLength(1);
  });
});

describe('auth', () => {
  it('setAuthEmail / getAuthEmail round-trip', () => {
    storage.setAuthEmail('me@test.com');
    expect(storage.getAuthEmail()).toBe('me@test.com');
  });

  it('getAuthEmail returns null when not set', () => {
    expect(storage.getAuthEmail()).toBeNull();
  });

  it('logout clears auth email', () => {
    storage.setAuthEmail('me@test.com');
    storage.logout();
    expect(storage.getAuthEmail()).toBeNull();
  });
});

describe('profile', () => {
  it('returns null when no profile saved', () => {
    expect(storage.getProfile()).toBeNull();
  });

  it('save/get round-trip', () => {
    storage.setAuthEmail('u@t.com');
    const profile = { name: 'Jane', babies: [{ name: 'Baby' }] } as any;
    storage.saveProfile(profile);
    expect(storage.getProfile()).toEqual(profile);
  });

  it('auto-adds missing babies array', () => {
    storage.setAuthEmail('u@t.com');
    ls.setItem('u@t.com_profile_v5', JSON.stringify({ name: 'Jane' }));
    const p = storage.getProfile();
    expect(p!.babies).toEqual([]);
  });
});

describe('CRUD operations', () => {
  beforeEach(() => {
    storage.setAuthEmail('user@t.com');
  });

  it('addFoodEntry prepends to list', () => {
    storage.addFoodEntry({ id: 'a', timestamp: 1 } as any);
    storage.addFoodEntry({ id: 'b', timestamp: 2 } as any);
    const entries = storage.getFoodEntries();
    expect(entries[0].id).toBe('b');
    expect(entries[1].id).toBe('a');
  });

  it('removeFoodEntry filters by id', () => {
    storage.addFoodEntry({ id: 'a', timestamp: 1 } as any);
    storage.addFoodEntry({ id: 'b', timestamp: 2 } as any);
    storage.removeFoodEntry('a');
    const entries = storage.getFoodEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('b');
  });

  it('get returns empty array when nothing stored', () => {
    expect(storage.getFoodEntries()).toEqual([]);
    expect(storage.getWeightLogs()).toEqual([]);
    expect(storage.getJournalEntries()).toEqual([]);
  });

  it('removeSleepLog filters by id', () => {
    storage.addSleepLog({ id: 's1' } as any);
    storage.addSleepLog({ id: 's2' } as any);
    storage.removeSleepLog('s1');
    expect(storage.getSleepLogs()).toHaveLength(1);
    expect(storage.getSleepLogs()[0].id).toBe('s2');
  });
});

describe('checklist', () => {
  beforeEach(() => {
    storage.setAuthEmail('user@t.com');
  });

  it('saveChecklistItem appends new item', () => {
    storage.saveChecklistItem({ id: 'c1', category: 'hospital_bag', text: 'Pack bag', completed: false });
    expect(storage.getAllChecklists()).toHaveLength(1);
  });

  it('saveChecklistItem updates existing item by id', () => {
    storage.saveChecklistItem({ id: 'c1', category: 'hospital_bag', text: 'Pack bag', completed: false });
    storage.saveChecklistItem({ id: 'c1', category: 'hospital_bag', text: 'Pack bag', completed: true });
    const all = storage.getAllChecklists();
    expect(all).toHaveLength(1);
    expect(all[0].completed).toBe(true);
  });

  it('getChecklist filters by category', () => {
    storage.saveChecklistItem({ id: 'c1', category: 'hospital_bag', text: 'A', completed: false });
    storage.saveChecklistItem({ id: 'c2', category: 'nursery', text: 'B', completed: false });
    expect(storage.getChecklist('hospital_bag')).toHaveLength(1);
    expect(storage.getChecklist('nursery')).toHaveLength(1);
  });

  it('removeChecklistItem removes by id', () => {
    storage.saveChecklistItem({ id: 'c1', category: 'hospital_bag', text: 'A', completed: false });
    storage.removeChecklistItem('c1');
    expect(storage.getAllChecklists()).toHaveLength(0);
  });
});

describe('achievements', () => {
  beforeEach(() => {
    storage.setAuthEmail('user@t.com');
  });

  it('unlockAchievement adds id to list', () => {
    storage.unlockAchievement('first_meal');
    expect(storage.getUnlockedAchievementIds()).toContain('first_meal');
  });

  it('unlockAchievement skips duplicate ids', () => {
    storage.unlockAchievement('first_meal');
    storage.unlockAchievement('first_meal');
    expect(storage.getUnlockedAchievementIds()).toHaveLength(1);
  });
});

describe('error handling', () => {
  it('getItem returns default for malformed JSON', () => {
    storage.setAuthEmail('user@t.com');
    ls.setItem('user@t.com_food_entries', '{not valid json');
    expect(storage.getFoodEntries()).toEqual([]);
  });

  it('getItem returns default array when stored value is not an array', () => {
    storage.setAuthEmail('user@t.com');
    ls.setItem('user@t.com_food_entries', '"a string"');
    expect(storage.getFoodEntries()).toEqual([]);
  });

  it('setItem catches QuotaExceededError without throwing', () => {
    const error = new DOMException('quota exceeded', 'QuotaExceededError');
    ls.setItem = () => { throw error; };
    storage.setAuthEmail('user@t.com');

    expect(() => {
      storage.saveProfile({ name: 'Test' } as any);
    }).not.toThrow();
  });
});

describe('deleteAccount', () => {
  it('removes all user-prefixed keys and auth', () => {
    storage.setAuthEmail('user@t.com');
    storage.addFoodEntry({ id: 'f1', timestamp: 1 } as any);
    storage.addWeightLog({ id: 'w1', timestamp: 1 } as any);

    storage.deleteAccount();

    expect(storage.getAuthEmail()).toBeNull();
    expect(ls._store.has('user@t.com_food_entries')).toBe(false);
  });

  it('preserves global keys after deleteAccount', () => {
    storage.setAuthEmail('user@t.com');
    storage.addArticle({ id: 'a1', title: 'Article' } as any);
    storage.addFoodEntry({ id: 'f1', timestamp: 1 } as any);

    storage.deleteAccount();

    // Global articles should survive
    expect(ls._store.has('nestly_global_articles')).toBe(true);
  });
});

describe('sync', () => {
  it('calls syncToFirestore on user-scoped write', () => {
    storage.setAuthEmail('user@t.com');
    storage.addFoodEntry({ id: 'f1', timestamp: 1 } as any);
    expect(syncToFirestore).toHaveBeenCalledWith('user@t.com');
  });

  it('does not call syncToFirestore on global write', () => {
    storage.setAuthEmail('user@t.com');
    vi.mocked(syncToFirestore).mockClear();
    storage.addArticle({ id: 'a1', title: 'Test' } as any);
    expect(syncToFirestore).not.toHaveBeenCalled();
  });
});
