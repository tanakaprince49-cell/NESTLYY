import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockLocalStorage } from '../helpers';
import {
  ALL_ACHIEVEMENTS,
  checkAchievements,
} from '../../packages/web/src/services/achievementService.ts';
import { storage } from '../../packages/web/src/services/storageService.ts';
import {
  Trimester,
  type FoodEntry,
  type JournalEntry,
  type VitaminLog,
  type WeightLog,
  type PregnancyProfile,
} from '../../packages/shared/src/types.ts';

type LocalStorageMock = ReturnType<typeof mockLocalStorage>;

function installMockStorage(): LocalStorageMock {
  const mock = mockLocalStorage();
  vi.stubGlobal('localStorage', mock);
  (storage as any)._uuid = null;
  return mock;
}

const food = (id: string): FoodEntry => ({
  id,
  name: 'eggs',
  calories: 140,
  protein: 12,
  folate: 40,
  iron: 2,
  calcium: 50,
  timestamp: 1,
});

const journal = (id: string): JournalEntry => ({
  id,
  title: 't',
  content: 'c',
  mood: 'Happy',
  timestamp: 1,
});

const vitamin = (id: string): VitaminLog => ({
  id,
  timestamp: 1,
});

const weight = (id: string): WeightLog => ({
  id,
  weightKg: 65,
  timestamp: 1,
});

const profile: PregnancyProfile = {
  dueDate: new Date(2026, 10, 1).toISOString(),
  lmpDate: null,
  name: 'Tester',
  age: 30,
  healthStatus: 'Healthy',
  gestationalAgeAtEstimate: null,
  prePregnancyWeightKg: 60,
  prePregnancyHeightCm: 165,
};

describe('achievementService — ALL_ACHIEVEMENTS schema', () => {
  it('exports exactly 8 achievements', () => {
    expect(ALL_ACHIEVEMENTS).toHaveLength(8);
  });

  it('has unique ids', () => {
    const ids = ALL_ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every achievement has id, title, description and icon', () => {
    for (const a of ALL_ACHIEVEMENTS) {
      expect(a.id).toBeTruthy();
      expect(a.title).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(a.icon).toBeTruthy();
    }
  });

  it('covers the expected achievement ids', () => {
    const ids = ALL_ACHIEVEMENTS.map(a => a.id).sort();
    expect(ids).toEqual(
      [
        'ar_explorer',
        'first_journal',
        'first_meal',
        'tri_1',
        'tri_2',
        'tri_3',
        'vitamin_pro',
        'weight_log',
      ].sort(),
    );
  });
});

describe('achievementService — checkAchievements triggers', () => {
  beforeEach(() => {
    installMockStorage();
  });

  it('unlocks first_meal when foods has at least one entry', () => {
    const unlocked = checkAchievements(profile, [food('f1')], [], [], Trimester.FIRST);
    const ids = unlocked.map(a => a.id);
    expect(ids).toContain('first_meal');
  });

  it('does not unlock first_meal when foods is empty', () => {
    const unlocked = checkAchievements(profile, [], [], [], Trimester.FIRST);
    expect(unlocked.map(a => a.id)).not.toContain('first_meal');
  });

  it('unlocks first_journal when journals has at least one entry', () => {
    const unlocked = checkAchievements(profile, [], [journal('j1')], [], Trimester.FIRST);
    expect(unlocked.map(a => a.id)).toContain('first_journal');
  });

  it('unlocks vitamin_pro when vitamins has at least one entry', () => {
    const unlocked = checkAchievements(profile, [], [], [vitamin('v1')], Trimester.FIRST);
    expect(unlocked.map(a => a.id)).toContain('vitamin_pro');
  });

  it('unlocks tri_1 when trimester is FIRST', () => {
    const unlocked = checkAchievements(profile, [], [], [], Trimester.FIRST);
    expect(unlocked.map(a => a.id)).toContain('tri_1');
  });

  it('unlocks tri_2 when trimester is SECOND (and not tri_1)', () => {
    const unlocked = checkAchievements(profile, [], [], [], Trimester.SECOND);
    const ids = unlocked.map(a => a.id);
    expect(ids).toContain('tri_2');
    expect(ids).not.toContain('tri_1');
    expect(ids).not.toContain('tri_3');
  });

  it('unlocks tri_3 when trimester is THIRD (and not tri_1 or tri_2)', () => {
    const unlocked = checkAchievements(profile, [], [], [], Trimester.THIRD);
    const ids = unlocked.map(a => a.id);
    expect(ids).toContain('tri_3');
    expect(ids).not.toContain('tri_1');
    expect(ids).not.toContain('tri_2');
  });

  it('unlocks weight_log when weight logs exist in storage', () => {
    storage.addWeightLog(weight('w1'));
    const unlocked = checkAchievements(profile, [], [], [], Trimester.FIRST);
    expect(unlocked.map(a => a.id)).toContain('weight_log');
  });

  it('does not unlock weight_log when no weight logs exist', () => {
    const unlocked = checkAchievements(profile, [], [], [], Trimester.FIRST);
    expect(unlocked.map(a => a.id)).not.toContain('weight_log');
  });

  it('unlocks multiple achievements at once when multiple conditions are met', () => {
    storage.addWeightLog(weight('w1'));
    const unlocked = checkAchievements(
      profile,
      [food('f1')],
      [journal('j1')],
      [vitamin('v1')],
      Trimester.SECOND,
    );
    const ids = unlocked.map(a => a.id).sort();
    expect(ids).toEqual(
      ['first_journal', 'first_meal', 'tri_2', 'vitamin_pro', 'weight_log'].sort(),
    );
  });
});

describe('achievementService — dedup behavior', () => {
  beforeEach(() => {
    installMockStorage();
  });

  it('returns each achievement only the first time a condition is met', () => {
    const first = checkAchievements(profile, [food('f1')], [], [], Trimester.FIRST);
    expect(first.map(a => a.id)).toContain('first_meal');

    const second = checkAchievements(profile, [food('f1'), food('f2')], [], [], Trimester.FIRST);
    expect(second.map(a => a.id)).not.toContain('first_meal');
  });

  it('persists unlocked ids through storage between calls', () => {
    checkAchievements(profile, [food('f1')], [], [], Trimester.FIRST);
    expect(storage.getUnlockedAchievementIds()).toContain('first_meal');
    expect(storage.getUnlockedAchievementIds()).toContain('tri_1');
  });

  it('returns an empty array when all achievable conditions were already unlocked', () => {
    checkAchievements(profile, [food('f1')], [], [], Trimester.FIRST);
    const second = checkAchievements(profile, [food('f1')], [], [], Trimester.FIRST);
    expect(second).toEqual([]);
  });

  it('returns only newly-unlocked achievements when new conditions appear later', () => {
    checkAchievements(profile, [food('f1')], [], [], Trimester.FIRST);
    const second = checkAchievements(
      profile,
      [food('f1')],
      [journal('j1')],
      [],
      Trimester.FIRST,
    );
    expect(second.map(a => a.id)).toEqual(['first_journal']);
  });

  it('advancing trimester only reports the new trimester achievement', () => {
    checkAchievements(profile, [], [], [], Trimester.FIRST);
    const advance = checkAchievements(profile, [], [], [], Trimester.SECOND);
    expect(advance.map(a => a.id)).toEqual(['tri_2']);
  });
});

describe('achievementService — UUID scoping of unlocks', () => {
  it('stores unlocked ids under the current UUID key, not globally', () => {
    const ls = installMockStorage();
    const uuid = storage.getLocalUuidPublic();
    checkAchievements(profile, [food('f1')], [], [], Trimester.FIRST);
    expect(ls._store.has(`${uuid}_unlocked_achievement_ids`)).toBe(true);
    expect(ls._store.has('unlocked_achievement_ids')).toBe(false);
  });

  it('isolates unlocks between two different UUIDs', () => {
    const ls = installMockStorage();
    ls._store.set('nestly_local_uuid', 'uuid-a');
    checkAchievements(profile, [food('f1')], [], [], Trimester.FIRST);

    installMockStorage();
    const ls2 = mockLocalStorage();
    vi.stubGlobal('localStorage', ls2);
    (storage as any)._uuid = null;
    ls2._store.set('nestly_local_uuid', 'uuid-b');
    const unlocked = checkAchievements(profile, [food('f1')], [], [], Trimester.FIRST);
    expect(unlocked.map(a => a.id)).toContain('first_meal');
  });
});
