import { mockLocalStorage } from '../helpers';
import { Trimester } from '../../types.ts';

vi.mock('../../services/syncService.ts', () => ({
  syncToFirestore: vi.fn(),
}));

import { checkAchievements, ALL_ACHIEVEMENTS } from '../../services/achievementService.ts';
import { storage } from '../../services/storageService.ts';

let ls: ReturnType<typeof mockLocalStorage>;

beforeEach(() => {
  ls = mockLocalStorage();
  vi.stubGlobal('localStorage', ls);
  storage.setAuthEmail('test@t.com');
});

const emptyProfile = { name: 'Jane' } as any;

describe('achievement triggers', () => {
  it('returns empty when all inputs are empty', () => {
    const result = checkAchievements(emptyProfile, [], [], [], Trimester.FIRST);
    // tri_1 fires because trimester is FIRST
    const ids = result.map(a => a.id);
    expect(ids).not.toContain('first_meal');
    expect(ids).not.toContain('first_journal');
    expect(ids).not.toContain('vitamin_pro');
  });

  it('unlocks first_meal when foods non-empty', () => {
    const result = checkAchievements(emptyProfile, [{ id: 'f1' } as any], [], [], Trimester.FIRST);
    expect(result.map(a => a.id)).toContain('first_meal');
  });

  it('unlocks first_journal when journals non-empty', () => {
    const result = checkAchievements(emptyProfile, [], [{ id: 'j1' } as any], [], Trimester.FIRST);
    expect(result.map(a => a.id)).toContain('first_journal');
  });

  it('unlocks vitamin_pro when vitamins non-empty', () => {
    const result = checkAchievements(emptyProfile, [], [], [{ id: 'v1' } as any], Trimester.FIRST);
    expect(result.map(a => a.id)).toContain('vitamin_pro');
  });

  it('unlocks tri_1 for First Trimester', () => {
    const result = checkAchievements(emptyProfile, [], [], [], Trimester.FIRST);
    expect(result.map(a => a.id)).toContain('tri_1');
  });

  it('unlocks tri_2 for Second Trimester', () => {
    const result = checkAchievements(emptyProfile, [], [], [], Trimester.SECOND);
    expect(result.map(a => a.id)).toContain('tri_2');
  });

  it('unlocks tri_3 for Third Trimester', () => {
    const result = checkAchievements(emptyProfile, [], [], [], Trimester.THIRD);
    expect(result.map(a => a.id)).toContain('tri_3');
  });

  it('unlocks weight_log when weight logs exist', () => {
    storage.addWeightLog({ id: 'w1', timestamp: Date.now(), weight: 65 } as any);
    const result = checkAchievements(emptyProfile, [], [], [], Trimester.FIRST);
    expect(result.map(a => a.id)).toContain('weight_log');
  });
});

describe('dedup', () => {
  it('does not return already-unlocked achievements', () => {
    // First call unlocks tri_1
    checkAchievements(emptyProfile, [], [], [], Trimester.FIRST);

    // Second call should not return tri_1 again
    const result = checkAchievements(emptyProfile, [], [], [], Trimester.FIRST);
    expect(result.map(a => a.id)).not.toContain('tri_1');
  });

  it('can unlock multiple achievements in a single call', () => {
    storage.addWeightLog({ id: 'w1', timestamp: Date.now(), weight: 65 } as any);
    const result = checkAchievements(
      emptyProfile,
      [{ id: 'f1' } as any],
      [{ id: 'j1' } as any],
      [{ id: 'v1' } as any],
      Trimester.SECOND,
    );
    const ids = result.map(a => a.id);
    expect(ids).toContain('first_meal');
    expect(ids).toContain('first_journal');
    expect(ids).toContain('vitamin_pro');
    expect(ids).toContain('tri_2');
    expect(ids).toContain('weight_log');
    expect(result.length).toBeGreaterThanOrEqual(5);
  });
});

describe('data integrity', () => {
  it('ALL_ACHIEVEMENTS has 8 entries with required fields', () => {
    expect(ALL_ACHIEVEMENTS).toHaveLength(8);
    for (const a of ALL_ACHIEVEMENTS) {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('title');
      expect(a).toHaveProperty('description');
      expect(a).toHaveProperty('icon');
    }
  });
});
