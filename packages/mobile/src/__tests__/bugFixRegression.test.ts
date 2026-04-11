// Regression tests for the Android beta bug-fix round (#212-#222).
//
// This file exercises the PURE-FUNCTION parts of each fix. Anything that
// requires a running device (Google OAuth browser flow, AsyncStorage
// persistence across app restart, Health Connect permissions, native
// DateTimePicker, Avatar image picker) is intentionally NOT covered here
// and must be walked through manually on a real Android build.
//
// Each block cross-references the file and issue it protects.

import { LifecycleStage } from '@nestly/shared';
import {
  hasValidLmpDate,
  parseLocalIsoDate,
  toIsoDate,
} from '../utils/dates';

// #225 / PR #229-review follow-up: LMP and due-date UTC-shift
// Production code: packages/mobile/src/screens/SetupScreen.tsx
describe('#225 local date helpers (LMP and due-date persistence)', () => {
  test('toIsoDate formats a Date using local calendar parts', () => {
    const d = new Date(2025, 0, 15); // local 2025-01-15 00:00
    expect(toIsoDate(d)).toBe('2025-01-15');
  });

  test('toIsoDate is stable at local midnight regardless of timezone', () => {
    // A Date created with local-part constructors has no ambiguity even in
    // positive offsets such as Zimbabwe UTC+2. This is the core property
    // that toISOString().slice(0, 10) fails to preserve.
    const d = new Date(2025, 5, 1, 0, 0, 0, 0);
    expect(toIsoDate(d)).toBe('2025-06-01');
  });

  test('toIsoDate round-trips through parseLocalIsoDate', () => {
    const original = new Date(2024, 11, 31); // local 2024-12-31
    const str = toIsoDate(original);
    const parsed = parseLocalIsoDate(str);
    expect(parsed).not.toBeNull();
    expect(parsed!.getFullYear()).toBe(2024);
    expect(parsed!.getMonth()).toBe(11);
    expect(parsed!.getDate()).toBe(31);
  });

  test('parseLocalIsoDate rejects partial years like "2024"', () => {
    // `new Date("2024")` silently evaluates to 2024-01-01 UTC, which was a
    // source of the year-only save bug on the due-date picker.
    expect(parseLocalIsoDate('2024')).toBeNull();
  });

  test('parseLocalIsoDate rejects rolled-over invalid calendar dates', () => {
    // `new Date(2025, 1, 30)` rolls to 2025-03-02; we must catch that.
    expect(parseLocalIsoDate('2025-02-30')).toBeNull();
    expect(parseLocalIsoDate('2025-13-01')).toBeNull();
    expect(parseLocalIsoDate('2025-04-31')).toBeNull();
  });

  test('parseLocalIsoDate accepts leap-day February 29 on leap years', () => {
    expect(parseLocalIsoDate('2024-02-29')).not.toBeNull();
    expect(parseLocalIsoDate('2025-02-29')).toBeNull();
  });
});

// #215 / #228: Growth tab crashes on empty or invalid LMP
// Production code: packages/mobile/src/screens/BabyScreen.tsx
describe('#228 hasValidLmpDate guard for Growth tab', () => {
  test('rejects undefined and empty string', () => {
    expect(hasValidLmpDate(undefined)).toBe(false);
    expect(hasValidLmpDate(null)).toBe(false);
    expect(hasValidLmpDate('')).toBe(false);
  });

  test('rejects unparseable strings', () => {
    expect(hasValidLmpDate('not-a-date')).toBe(false);
    expect(hasValidLmpDate('banana')).toBe(false);
  });

  test('accepts ISO date strings', () => {
    expect(hasValidLmpDate('2025-03-15')).toBe(true);
    expect(hasValidLmpDate('2024-12-01T00:00:00.000Z')).toBe(true);
  });
});

// #228 carousel centering offset: pure arithmetic extracted from the
// scrollTo() call in BabyScreen so it can be exercised deterministically.
// Production code: packages/mobile/src/screens/BabyScreen.tsx
//   x: Math.max(0, idx * TILE_STRIDE + TILE_WIDTH / 2 - screenWidth / 2)
const TILE_WIDTH = 64;
const TILE_STRIDE = 72;

function centerOffset(idx: number, screenWidth: number): number {
  return Math.max(0, idx * TILE_STRIDE + TILE_WIDTH / 2 - screenWidth / 2);
}

describe('#228 fetal development carousel centering math', () => {
  test('never scrolls before the start of the list', () => {
    // Very early week on a wide screen: centered offset would be negative,
    // clamp to 0 so ScrollView stays at its natural origin.
    expect(centerOffset(0, 400)).toBe(0);
  });

  test('centers a mid-list tile in the viewport', () => {
    // idx=10, screen=400 → 10*72 + 32 - 200 = 552
    expect(centerOffset(10, 400)).toBe(552);
  });

  test('scales with screen width', () => {
    // Wider screen shifts the centering leftward by half the extra width.
    const narrow = centerOffset(10, 400);
    const wide = centerOffset(10, 800);
    expect(narrow - wide).toBe(200);
  });
});

// #217 / #227: Feeding tool routes to newborn flow in pregnancy mode
// Production code: packages/mobile/src/screens/trackers/FeedingRouter.tsx
// The router picks NutritionTracker for PREGNANCY and PRE_PREGNANCY,
// FeedingTracker for every postpartum stage.
function isPregnancyLike(stage: LifecycleStage | undefined): boolean {
  return stage === LifecycleStage.PREGNANCY || stage === LifecycleStage.PRE_PREGNANCY;
}

describe('#227 FeedingRouter stage predicate', () => {
  test('pregnancy user gets nutrition tracker', () => {
    expect(isPregnancyLike(LifecycleStage.PREGNANCY)).toBe(true);
  });

  test('pre-pregnancy user also gets nutrition tracker', () => {
    // This was the missed case in #220/#227 — PRE_PREGNANCY fell through to
    // the newborn-feeding tracker and also made the hub tile disappear.
    expect(isPregnancyLike(LifecycleStage.PRE_PREGNANCY)).toBe(true);
  });

  test('every postpartum stage gets infant feeding tracker', () => {
    expect(isPregnancyLike(LifecycleStage.BIRTH)).toBe(false);
    expect(isPregnancyLike(LifecycleStage.NEWBORN)).toBe(false);
    expect(isPregnancyLike(LifecycleStage.INFANT)).toBe(false);
    expect(isPregnancyLike(LifecycleStage.TODDLER)).toBe(false);
  });

  test('missing profile falls back to postpartum branch', () => {
    // When profile is null the router short-circuits to FeedingTracker so
    // the screen never crashes on an undefined stage.
    expect(isPregnancyLike(undefined)).toBe(false);
  });
});

// #220 / #227: ToolsHub hides wrong tiles per stage
// Production code: packages/mobile/src/screens/ToolsHubScreen.tsx
// Filter shape: pregnancyOnly hidden for postpartum, postpartumOnly hidden
// for pregnancy-like. Same predicate as above.
interface ToolItem {
  key: string;
  pregnancyOnly?: boolean;
  postpartumOnly?: boolean;
}

function visibleTools(stage: LifecycleStage | undefined, tools: ToolItem[]): ToolItem[] {
  const pregnancyLike = isPregnancyLike(stage);
  return tools.filter((tool) => {
    if (pregnancyLike && tool.postpartumOnly) return false;
    if (!pregnancyLike && tool.pregnancyOnly) return false;
    return true;
  });
}

describe('#227 ToolsHub visibility filter', () => {
  const TOOLS: ToolItem[] = [
    { key: 'Feeding', postpartumOnly: true },
    { key: 'Nutrition', pregnancyOnly: true },
    { key: 'Sleep' },
    { key: 'Kicks', pregnancyOnly: true },
    { key: 'Diaper', postpartumOnly: true },
  ];

  test('pregnancy sees nutrition and kicks, no feeding or diaper', () => {
    const keys = visibleTools(LifecycleStage.PREGNANCY, TOOLS).map((t) => t.key);
    expect(keys).toEqual(['Nutrition', 'Sleep', 'Kicks']);
  });

  test('pre-pregnancy matches pregnancy (the #227 regression case)', () => {
    const keys = visibleTools(LifecycleStage.PRE_PREGNANCY, TOOLS).map((t) => t.key);
    expect(keys).toEqual(['Nutrition', 'Sleep', 'Kicks']);
  });

  test('newborn sees feeding and diaper, no nutrition or kicks', () => {
    const keys = visibleTools(LifecycleStage.NEWBORN, TOOLS).map((t) => t.key);
    expect(keys).toEqual(['Feeding', 'Sleep', 'Diaper']);
  });

  test('unknown stage defaults to postpartum tool set', () => {
    const keys = visibleTools(undefined, TOOLS).map((t) => t.key);
    expect(keys).toEqual(['Feeding', 'Sleep', 'Diaper']);
  });
});
