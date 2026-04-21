import { describe, it, expect } from 'vitest';
import { buildExport, migrateExport, isZeroDataExportV1, ExportValidationError } from './zeroDataExport.ts';
import { Trimester, LifecycleStage } from '../types.ts';
import type {
  ZeroDataTrackingSlice,
  ZeroDataAvaSlice,
  ZeroDataSettingsSlice,
  PregnancyProfile,
} from '../types.ts';

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

const emptyAvaChat: ZeroDataAvaSlice = { messages: [] };

const defaultSettings: ZeroDataSettingsSlice = { hasAcceptedPrivacy: true };

const sampleProfile: PregnancyProfile = {
  userName: 'Test User',
  lmpDate: '2024-01-01',
  dueDate: '2024-10-01',
  isManualDueDate: false,
  pregnancyType: 'singleton',
  babies: [],
  themeColor: 'pink',
  albums: {
    bump: [],
    baby: [],
    ultrasound: [],
    nursery: [],
    family: [],
    other: [],
  },
  lifecycleStage: LifecycleStage.PREGNANCY,
};

function makeValidExport() {
  return buildExport({
    profile: sampleProfile,
    trimester: Trimester.FIRST,
    tracking: emptyTracking,
    avaChat: emptyAvaChat,
    settings: defaultSettings,
    identityType: 'local-uuid',
    identityValue: 'test-uuid-1234',
    platform: 'web',
    appVersion: '0.1.0',
  });
}

describe('buildExport', () => {
  it('sets schemaVersion to 1', () => {
    const result = makeValidExport();
    expect(result.meta.schemaVersion).toBe(1);
  });

  it('sets exportedAt as ISO 8601 string', () => {
    const before = new Date();
    const result = makeValidExport();
    const after = new Date();
    const exportedAt = new Date(result.meta.exportedAt);
    expect(result.meta.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(exportedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(exportedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('includes identityValue when provided', () => {
    const result = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'local-uuid',
      identityValue: 'uuid-abc',
      platform: 'web',
      appVersion: '0.1.0',
    });
    expect(result.meta.identityType).toBe('local-uuid');
    expect(result.meta.identityValue).toBe('uuid-abc');
  });

  it('omits identityValue when not provided (firebase-uid path)', () => {
    const result = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'firebase-uid',
      platform: 'mobile',
      appVersion: '0.1.0',
    });
    expect(result.meta.identityType).toBe('firebase-uid');
    expect(result.meta.identityValue).toBeUndefined();
  });

  it('omits extras field when not provided', () => {
    const result = makeValidExport();
    expect(result.extras).toBeUndefined();
  });

  it('includes extras when provided', () => {
    const result = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      extras: { periodLogs: [], lastWeekCelebrated: 10 },
      identityType: 'local-uuid',
      platform: 'web',
      appVersion: '0.1.0',
    });
    expect(result.extras).toBeDefined();
    expect(result.extras!.lastWeekCelebrated).toBe(10);
  });
});

describe('migrateExport - identity round-trip', () => {
  it('returns an object with schemaVersion 1 matching the built export', () => {
    const built = makeValidExport();
    const migrated = migrateExport(built);
    expect(migrated.meta.schemaVersion).toBe(1);
    expect(migrated.meta.appVersion).toBe('0.1.0');
    expect(migrated.meta.identityType).toBe('local-uuid');
    expect(migrated.meta.identityValue).toBe('test-uuid-1234');
    expect(migrated.meta.platform).toBe('web');
  });

  it('round-trip: build -> JSON.stringify -> JSON.parse -> migrateExport deep equals typed surface', () => {
    const built = makeValidExport();
    const serialised = JSON.parse(JSON.stringify(built));
    const migrated = migrateExport(serialised);
    expect(migrated.meta.schemaVersion).toBe(built.meta.schemaVersion);
    expect(migrated.meta.exportedAt).toBe(built.meta.exportedAt);
    expect(migrated.profile).toEqual(built.profile);
    expect(migrated.trimester).toBe(built.trimester);
    expect(migrated.tracking).toEqual(built.tracking);
    expect(migrated.avaChat).toEqual(built.avaChat);
    expect(migrated.settings).toEqual(built.settings);
    expect(migrated.extras).toBeUndefined();
  });
});

describe('migrateExport - malformed rejection', () => {
  it('throws MISSING_VERSION for null', () => {
    expect(() => migrateExport(null)).toThrow(ExportValidationError);
    try {
      migrateExport(null);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('MISSING_VERSION');
    }
  });

  it('throws MISSING_VERSION for empty object {}', () => {
    expect(() => migrateExport({})).toThrow(ExportValidationError);
    try {
      migrateExport({});
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('MISSING_VERSION');
    }
  });

  it('throws MISSING_VERSION when schemaVersion is a string', () => {
    const raw = { meta: { schemaVersion: 'one' } };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('MISSING_VERSION');
    }
  });

  it('throws FUTURE_VERSION for schemaVersion 2', () => {
    const raw = { meta: { schemaVersion: 2 } };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('FUTURE_VERSION');
    }
  });

  it('throws LEGACY_VERSION for schemaVersion 0', () => {
    const raw = { meta: { schemaVersion: 0 } };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('LEGACY_VERSION');
    }
  });

  it('throws LEGACY_VERSION for negative schemaVersion', () => {
    const raw = { meta: { schemaVersion: -1 } };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('LEGACY_VERSION');
    }
  });
});

describe('migrateExport - shape rejection', () => {
  it('throws INVALID_SHAPE when tracking is missing', () => {
    const raw = {
      meta: { schemaVersion: 1 },
      avaChat: { messages: [] },
      settings: { hasAcceptedPrivacy: true },
    };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('INVALID_SHAPE');
    }
  });

  it('throws INVALID_SHAPE when tracking.weightLogs is not an array', () => {
    const raw = {
      meta: { schemaVersion: 1 },
      tracking: { ...emptyTracking, weightLogs: 'not-an-array' },
      avaChat: { messages: [] },
      settings: { hasAcceptedPrivacy: true },
    };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('INVALID_SHAPE');
    }
  });

  it('throws INVALID_SHAPE when avaChat is missing', () => {
    const raw = {
      meta: { schemaVersion: 1 },
      tracking: emptyTracking,
      settings: { hasAcceptedPrivacy: true },
    };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('INVALID_SHAPE');
    }
  });

  it('throws INVALID_SHAPE when avaChat.messages is not an array', () => {
    const raw = {
      meta: { schemaVersion: 1 },
      tracking: emptyTracking,
      avaChat: { messages: 'bad' },
      settings: { hasAcceptedPrivacy: true },
    };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('INVALID_SHAPE');
    }
  });

  it('throws INVALID_SHAPE when settings.hasAcceptedPrivacy is not boolean', () => {
    const raw = {
      meta: { schemaVersion: 1 },
      tracking: emptyTracking,
      avaChat: { messages: [] },
      settings: { hasAcceptedPrivacy: 'yes' },
    };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('INVALID_SHAPE');
    }
  });
});

describe('migrateExport - extra fields dropped at top level', () => {
  it('unknown top-level field is dropped, result is valid ZeroDataExportV1', () => {
    const built = makeValidExport();
    const withExtra = { ...built, foo: 'bar', anotherUnknown: 42 };
    const migrated = migrateExport(withExtra);
    expect((migrated as any).foo).toBeUndefined();
    expect((migrated as any).anotherUnknown).toBeUndefined();
    expect(migrated.meta.schemaVersion).toBe(1);
  });
});

describe('migrateExport - partial / optional exports', () => {
  it('parses cleanly when extras is absent', () => {
    const built = buildExport({
      profile: sampleProfile,
      trimester: Trimester.SECOND,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'local-uuid',
      platform: 'mobile',
      appVersion: '0.2.0',
    });
    const migrated = migrateExport(JSON.parse(JSON.stringify(built)));
    expect(migrated.extras).toBeUndefined();
  });

  it('parses cleanly when avaChat.messages is empty', () => {
    const built = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: emptyTracking,
      avaChat: { messages: [] },
      settings: defaultSettings,
      identityType: 'local-uuid',
      platform: 'web',
      appVersion: '0.1.0',
    });
    const migrated = migrateExport(JSON.parse(JSON.stringify(built)));
    expect(migrated.avaChat.messages).toEqual([]);
  });

  it('parses cleanly when profile is null', () => {
    const built = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'local-uuid',
      platform: 'web',
      appVersion: '0.1.0',
    });
    const migrated = migrateExport(JSON.parse(JSON.stringify(built)));
    expect(migrated.profile).toBeNull();
  });

  it('parses cleanly when all nineteen tracking arrays are empty', () => {
    const built = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'local-uuid',
      platform: 'web',
      appVersion: '0.1.0',
    });
    const migrated = migrateExport(JSON.parse(JSON.stringify(built)));
    const keys: (keyof ZeroDataTrackingSlice)[] = [
      'foodEntries', 'symptoms', 'vitamins', 'contractions', 'journalEntries',
      'calendarEvents', 'weightLogs', 'sleepLogs', 'feedingLogs', 'milestones',
      'healthLogs', 'reactions', 'babyGrowthLogs', 'tummyTimeLogs',
      'bloodPressureLogs', 'kickLogs', 'kegelLogs', 'diaperLogs', 'medicationLogs',
    ];
    for (const key of keys) {
      expect(migrated.tracking[key]).toEqual([]);
    }
  });
});

describe('migrateExport - unicode round-trip', () => {
  it('preserves Czech diacritics and emoji in journalEntries after JSON round-trip', () => {
    const czechEmoji = 'Toto je záznam s diakritikou: čšžřýáíéúů a emoji 🤰🍼💙';
    const built = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: {
        ...emptyTracking,
        journalEntries: [
          { id: 'j1', content: czechEmoji, timestamp: 1700000000000 },
        ],
      },
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'local-uuid',
      platform: 'web',
      appVersion: '0.1.0',
    });
    const migrated = migrateExport(JSON.parse(JSON.stringify(built)));
    expect(migrated.tracking.journalEntries[0].content).toBe(czechEmoji);
  });
});

describe('migrateExport - oversize smoke test', () => {
  it('parses 10,000 journalEntries in under 100ms', () => {
    const entries = Array.from({ length: 10000 }, (_, i) => ({
      id: `entry-${i}`,
      content: `Journal entry number ${i}`,
      timestamp: 1700000000000 + i * 1000,
    }));
    const built = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: {
        ...emptyTracking,
        journalEntries: entries,
      },
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'local-uuid',
      platform: 'web',
      appVersion: '0.1.0',
    });
    const serialised = JSON.parse(JSON.stringify(built));
    const start = Date.now();
    migrateExport(serialised);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});

describe('migrateExport - date strings preserved as strings', () => {
  it('SleepLog startTime and endTime remain strings, not coerced to Date or number', () => {
    const startTime = '2024-06-15T22:00:00.000Z';
    const endTime = '2024-06-16T06:00:00.000Z';
    const built = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: {
        ...emptyTracking,
        sleepLogs: [
          {
            id: 's1',
            userId: 'u1',
            startTime,
            endTime,
            mode: 'pregnancy',
            type: 'night',
            timestamp: 1700000000000,
          },
        ],
      },
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'local-uuid',
      platform: 'web',
      appVersion: '0.1.0',
    });
    const migrated = migrateExport(JSON.parse(JSON.stringify(built)));
    expect(typeof migrated.tracking.sleepLogs[0].startTime).toBe('string');
    expect(typeof migrated.tracking.sleepLogs[0].endTime).toBe('string');
    expect(migrated.tracking.sleepLogs[0].startTime).toBe(startTime);
    expect(migrated.tracking.sleepLogs[0].endTime).toBe(endTime);
  });

  it('MilestoneLog date remains a string', () => {
    const dateStr = '2024-09-01';
    const built = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: {
        ...emptyTracking,
        milestones: [
          {
            id: 'm1',
            babyId: 'b1',
            title: 'First smile',
            date: dateStr,
            timestamp: 1700000000000,
          },
        ],
      },
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'local-uuid',
      platform: 'web',
      appVersion: '0.1.0',
    });
    const migrated = migrateExport(JSON.parse(JSON.stringify(built)));
    expect(typeof migrated.tracking.milestones[0].date).toBe('string');
    expect(migrated.tracking.milestones[0].date).toBe(dateStr);
  });

  it('CalendarEvent date remains a string', () => {
    const dateStr = '2024-07-20';
    const built = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: {
        ...emptyTracking,
        calendarEvents: [
          { id: 'c1', title: 'Checkup', date: dateStr, type: 'appointment' },
        ],
      },
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'local-uuid',
      platform: 'web',
      appVersion: '0.1.0',
    });
    const migrated = migrateExport(JSON.parse(JSON.stringify(built)));
    expect(typeof migrated.tracking.calendarEvents[0].date).toBe('string');
    expect(migrated.tracking.calendarEvents[0].date).toBe(dateStr);
  });
});

describe('migrateExport - identity type coverage', () => {
  it('local-uuid with identityValue emits both fields', () => {
    const result = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'local-uuid',
      identityValue: 'my-uuid-here',
      platform: 'web',
      appVersion: '0.1.0',
    });
    expect(result.meta.identityType).toBe('local-uuid');
    expect(result.meta.identityValue).toBe('my-uuid-here');
  });

  it('firebase-uid without identityValue emits only identityType', () => {
    const result = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'firebase-uid',
      platform: 'mobile',
      appVersion: '0.1.0',
    });
    expect(result.meta.identityType).toBe('firebase-uid');
    expect('identityValue' in result.meta).toBe(false);
  });
});

describe('isZeroDataExportV1', () => {
  it('returns true for a valid export', () => {
    const built = makeValidExport();
    expect(isZeroDataExportV1(built)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isZeroDataExportV1(null)).toBe(false);
  });

  it('returns false for an empty object', () => {
    expect(isZeroDataExportV1({})).toBe(false);
  });

  it('returns false when tracking is missing', () => {
    const raw = {
      meta: { schemaVersion: 1 },
      avaChat: { messages: [] },
      settings: { hasAcceptedPrivacy: true },
    };
    expect(isZeroDataExportV1(raw)).toBe(false);
  });

  it('returns false when meta.schemaVersion is 2', () => {
    const built = makeValidExport();
    const withWrongVersion = { ...built, meta: { ...built.meta, schemaVersion: 2 } };
    expect(isZeroDataExportV1(withWrongVersion)).toBe(false);
  });
});

describe('checkShapeV1 - schemaVersion must equal 1', () => {
  it('migrateExport throws FUTURE_VERSION for schemaVersion 2 (caught before shape check)', () => {
    const raw = {
      meta: { schemaVersion: 2 },
      trimester: Trimester.FIRST,
      profile: null,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
    };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('FUTURE_VERSION');
    }
  });
});

describe('migrateExport - trimester validation', () => {
  it('throws INVALID_SHAPE for trimester: "banana"', () => {
    const built = makeValidExport();
    const raw = { ...built, trimester: 'banana' };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('INVALID_SHAPE');
    }
  });

  it('throws INVALID_SHAPE for trimester: undefined', () => {
    const built = makeValidExport();
    const { trimester: _t, ...withoutTrimester } = built;
    expect(() => migrateExport(withoutTrimester)).toThrow(ExportValidationError);
    try {
      migrateExport(withoutTrimester);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('INVALID_SHAPE');
    }
  });

  it('accepts all valid Trimester enum values', () => {
    const validValues = Object.values(Trimester);
    for (const trimester of validValues) {
      const built = buildExport({
        profile: null,
        trimester,
        tracking: emptyTracking,
        avaChat: emptyAvaChat,
        settings: defaultSettings,
        identityType: 'local-uuid',
        platform: 'web',
        appVersion: '0.1.0',
      });
      expect(() => migrateExport(JSON.parse(JSON.stringify(built)))).not.toThrow();
    }
  });
});

describe('migrateExport - profile validation', () => {
  it('throws INVALID_SHAPE for profile: [] (array)', () => {
    const built = makeValidExport();
    const raw = { ...built, profile: [] };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('INVALID_SHAPE');
    }
  });

  it('throws INVALID_SHAPE for profile: "string"', () => {
    const built = makeValidExport();
    const raw = { ...built, profile: 'not-an-object' };
    expect(() => migrateExport(raw)).toThrow(ExportValidationError);
    try {
      migrateExport(raw);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('INVALID_SHAPE');
    }
  });

  it('succeeds when profile is null', () => {
    const built = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      identityType: 'local-uuid',
      platform: 'web',
      appVersion: '0.1.0',
    });
    const migrated = migrateExport(JSON.parse(JSON.stringify(built)));
    expect(migrated.profile).toBeNull();
  });
});

describe('migrateExport - prototype pollution guard', () => {
  it('throws INVALID_SHAPE for Object.create(null)', () => {
    const nullProto = Object.assign(Object.create(null) as Record<string, unknown>, {
      meta: { schemaVersion: 1 },
      trimester: Trimester.FIRST,
      profile: null,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
    });
    expect(() => migrateExport(nullProto)).toThrow(ExportValidationError);
    try {
      migrateExport(nullProto);
    } catch (e) {
      expect((e as ExportValidationError).code).toBe('INVALID_SHAPE');
    }
  });

  it('throws for an array input', () => {
    expect(() => migrateExport([])).toThrow(ExportValidationError);
    try {
      migrateExport([]);
    } catch (e) {
      expect(e).toBeInstanceOf(ExportValidationError);
    }
  });

  it('does not throw for plain JSON.parse output (Object.prototype chain)', () => {
    const built = makeValidExport();
    const parsed = JSON.parse(JSON.stringify(built));
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
    expect(() => migrateExport(parsed)).not.toThrow();
  });
});

describe('migrateExport - output key set pinned', () => {
  it('unknown top-level fields are dropped and output key set is exact (no extras)', () => {
    const built = makeValidExport();
    const withExtra = { ...built, foo: 'bar', anotherUnknown: 42 };
    const migrated = migrateExport(withExtra);
    expect((migrated as unknown as Record<string, unknown>).foo).toBeUndefined();
    expect((migrated as unknown as Record<string, unknown>).anotherUnknown).toBeUndefined();
    expect(migrated.meta.schemaVersion).toBe(1);
    expect(Object.keys(migrated).sort()).toEqual(
      ['avaChat', 'meta', 'profile', 'settings', 'tracking', 'trimester'].sort(),
    );
  });

  it('output key set includes extras when extras is provided', () => {
    const built = buildExport({
      profile: null,
      trimester: Trimester.FIRST,
      tracking: emptyTracking,
      avaChat: emptyAvaChat,
      settings: defaultSettings,
      extras: { periodLogs: [], lastWeekCelebrated: 5 },
      identityType: 'local-uuid',
      platform: 'web',
      appVersion: '0.1.0',
    });
    const migrated = migrateExport(JSON.parse(JSON.stringify(built)));
    expect(Object.keys(migrated).sort()).toEqual(
      ['avaChat', 'extras', 'meta', 'profile', 'settings', 'tracking', 'trimester'].sort(),
    );
  });
});
