// Pure-function tests for Village Hub Phase 1 (#262).
//
// Exercises the three predicates extracted from VillageHomeScreen and
// CreateNestModal without requiring a running device, Firestore connection,
// or React Native renderer. Each block cross-references the file it protects.

import type { Nest, NestMembership, NestCategory } from '@nestly/shared';

// ---------------------------------------------------------------------------
// Helpers extracted from VillageHomeScreen (lines with useMemo filter logic)
// ---------------------------------------------------------------------------

function filterNests(
  nests: Nest[],
  categoryFilter: NestCategory | 'all',
  debouncedSearch: string,
  sortBy: 'popular' | 'newest',
): Nest[] {
  let filtered = nests;
  if (categoryFilter !== 'all') {
    filtered = filtered.filter((n) => n.category === categoryFilter);
  }
  if (debouncedSearch.trim()) {
    const q = debouncedSearch.toLowerCase().trim();
    filtered = filtered.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q),
    );
  }
  const sorted = [...filtered];
  if (sortBy === 'newest') {
    sorted.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    sorted.sort((a, b) => b.memberCount - a.memberCount);
  }
  return sorted;
}

function computeJoinedIds(memberships: NestMembership[]): Set<string> {
  return new Set(memberships.map((m) => m.nestId));
}

// Extracted from CreateNestModal submit guard
function canCreateNest(input: { name: string; description: string }): boolean {
  return input.name.trim().length >= 2 && input.description.trim().length >= 2;
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

function makeNest(overrides: Partial<Nest> & { id: string }): Nest {
  return {
    name: 'Test Nest',
    description: 'A test nest description',
    category: 'general',
    emoji: '🌸',
    memberCount: 0,
    isTemplate: false,
    createdAt: 1000,
    creatorUid: null,
    ...overrides,
  };
}

function makeMembership(nestId: string, userId = 'user-1'): NestMembership {
  return { id: `${userId}_${nestId}`, nestId, userId, joinedAt: Date.now() };
}

const NESTS: Nest[] = [
  makeNest({ id: 'a', name: 'First Trimester Moms', description: 'Early weeks support', category: 'trimester', memberCount: 50, createdAt: 3000 }),
  makeNest({ id: 'b', name: 'Vegan Pregnancy', description: 'Plant-based meals', category: 'diet', memberCount: 20, createdAt: 2000 }),
  makeNest({ id: 'c', name: 'Working Moms', description: 'Balancing career', category: 'lifestyle', memberCount: 80, createdAt: 1000 }),
  makeNest({ id: 'd', name: 'Newborn Moms Circle', description: 'First weeks with baby', category: 'postpartum', memberCount: 10, createdAt: 4000 }),
];

// ---------------------------------------------------------------------------
// filterNests: category filter
// ---------------------------------------------------------------------------

describe('#262 filterNests -- category filter', () => {
  test('all returns every nest', () => {
    const result = filterNests(NESTS, 'all', '', 'popular');
    expect(result).toHaveLength(4);
  });

  test('trimester filter returns only trimester nests', () => {
    const result = filterNests(NESTS, 'trimester', '', 'popular');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  test('diet filter returns only diet nests', () => {
    const result = filterNests(NESTS, 'diet', '', 'popular');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  test('category with no matches returns empty array', () => {
    const result = filterNests(NESTS, 'support', '', 'popular');
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// filterNests: case-insensitive search
// ---------------------------------------------------------------------------

describe('#262 filterNests -- search', () => {
  test('search by name is case-insensitive', () => {
    const result = filterNests(NESTS, 'all', 'VEGAN', 'popular');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  test('search by description substring', () => {
    const result = filterNests(NESTS, 'all', 'career', 'popular');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c');
  });

  test('search with no matches returns empty array', () => {
    const result = filterNests(NESTS, 'all', 'zzznomatch', 'popular');
    expect(result).toHaveLength(0);
  });

  test('whitespace-only search is treated as no search', () => {
    const result = filterNests(NESTS, 'all', '   ', 'popular');
    expect(result).toHaveLength(4);
  });

  test('search combined with category filter', () => {
    const result = filterNests(NESTS, 'trimester', 'first', 'popular');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  test('search + category filter with no overlap returns empty array', () => {
    // 'vegan' only matches nest b (diet), but filter is 'trimester'
    const result = filterNests(NESTS, 'trimester', 'vegan', 'popular');
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// filterNests: sort
// ---------------------------------------------------------------------------

describe('#262 filterNests -- sort', () => {
  test('popular sort orders by memberCount descending', () => {
    const result = filterNests(NESTS, 'all', '', 'popular');
    const counts = result.map((n) => n.memberCount);
    for (let i = 0; i < counts.length - 1; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i + 1]);
    }
  });

  test('newest sort orders by createdAt descending', () => {
    const result = filterNests(NESTS, 'all', '', 'newest');
    const times = result.map((n) => n.createdAt);
    for (let i = 0; i < times.length - 1; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i + 1]);
    }
  });

  test('popular sort puts Working Moms (80) first', () => {
    const result = filterNests(NESTS, 'all', '', 'popular');
    expect(result[0].id).toBe('c');
  });

  test('newest sort puts Newborn Moms Circle (createdAt 4000) first', () => {
    const result = filterNests(NESTS, 'all', '', 'newest');
    expect(result[0].id).toBe('d');
  });
});

// ---------------------------------------------------------------------------
// computeJoinedIds
// ---------------------------------------------------------------------------

describe('#262 computeJoinedIds', () => {
  test('empty memberships returns empty Set', () => {
    const ids = computeJoinedIds([]);
    expect(ids.size).toBe(0);
  });

  test('returns a Set of nestIds', () => {
    const memberships = [makeMembership('nest-1'), makeMembership('nest-2')];
    const ids = computeJoinedIds(memberships);
    expect(ids.has('nest-1')).toBe(true);
    expect(ids.has('nest-2')).toBe(true);
    expect(ids.size).toBe(2);
  });

  test('deduplicates if the same nest appears twice', () => {
    // Should not happen in practice, but the Set handles it gracefully
    const memberships = [makeMembership('nest-1'), makeMembership('nest-1', 'user-2')];
    const ids = computeJoinedIds(memberships);
    expect(ids.size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// canCreateNest predicate (extracted from CreateNestModal submit guard)
// ---------------------------------------------------------------------------

describe('#262 canCreateNest', () => {
  test('accepts name and description each at least 2 chars', () => {
    expect(canCreateNest({ name: 'ab', description: 'cd' })).toBe(true);
  });

  test('rejects name shorter than 2 chars after trim', () => {
    expect(canCreateNest({ name: 'a', description: 'valid description' })).toBe(false);
    expect(canCreateNest({ name: '', description: 'valid description' })).toBe(false);
    expect(canCreateNest({ name: '  a  ', description: 'valid description' })).toBe(false);
  });

  test('rejects description shorter than 2 chars after trim', () => {
    expect(canCreateNest({ name: 'valid name', description: 'x' })).toBe(false);
    expect(canCreateNest({ name: 'valid name', description: '' })).toBe(false);
    expect(canCreateNest({ name: 'valid name', description: '  z  ' })).toBe(false);
  });

  test('rejects both too short', () => {
    expect(canCreateNest({ name: '', description: '' })).toBe(false);
    expect(canCreateNest({ name: 'a', description: 'b' })).toBe(false);
  });

  test('whitespace padding does not count toward the 2-char minimum', () => {
    expect(canCreateNest({ name: '  x  ', description: '  y  ' })).toBe(false);
    expect(canCreateNest({ name: '  xy  ', description: '  ab  ' })).toBe(true);
  });
});
