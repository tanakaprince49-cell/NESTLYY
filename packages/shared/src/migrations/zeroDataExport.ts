import type {
  IdentityType,
  PregnancyProfile,
  Trimester,
  ZeroDataAvaSlice,
  ZeroDataExportV1,
  ZeroDataExtrasSlice,
  ZeroDataSettingsSlice,
  ZeroDataTrackingSlice,
} from '../types.ts';
import { CURRENT_SCHEMA_VERSION } from '../types.ts';

export class ExportValidationError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ExportValidationError';
    this.code = code;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function assertTrackingShape(tracking: unknown): asserts tracking is ZeroDataTrackingSlice {
  if (!isObject(tracking)) {
    throw new ExportValidationError('tracking must be an object', 'INVALID_SHAPE');
  }
  const required: (keyof ZeroDataTrackingSlice)[] = [
    'foodEntries',
    'symptoms',
    'vitamins',
    'contractions',
    'journalEntries',
    'calendarEvents',
    'weightLogs',
    'sleepLogs',
    'feedingLogs',
    'milestones',
    'healthLogs',
    'reactions',
    'babyGrowthLogs',
    'tummyTimeLogs',
    'bloodPressureLogs',
    'kickLogs',
    'kegelLogs',
    'diaperLogs',
    'medicationLogs',
  ];
  for (const key of required) {
    if (!isArray(tracking[key])) {
      throw new ExportValidationError(
        `tracking.${key} must be an array`,
        'INVALID_SHAPE',
      );
    }
  }
}

function assertAvaChatShape(avaChat: unknown): asserts avaChat is ZeroDataAvaSlice {
  if (!isObject(avaChat)) {
    throw new ExportValidationError('avaChat must be an object', 'INVALID_SHAPE');
  }
  if (!isArray(avaChat['messages'])) {
    throw new ExportValidationError('avaChat.messages must be an array', 'INVALID_SHAPE');
  }
}

function assertSettingsShape(settings: unknown): asserts settings is ZeroDataSettingsSlice {
  if (!isObject(settings)) {
    throw new ExportValidationError('settings must be an object', 'INVALID_SHAPE');
  }
  if (typeof settings['hasAcceptedPrivacy'] !== 'boolean') {
    throw new ExportValidationError(
      'settings.hasAcceptedPrivacy must be a boolean',
      'INVALID_SHAPE',
    );
  }
}

export function isZeroDataExportV1(raw: unknown): raw is ZeroDataExportV1 {
  try {
    checkShapeV1(raw);
    return true;
  } catch {
    return false;
  }
}

function checkShapeV1(raw: unknown): asserts raw is ZeroDataExportV1 {
  if (!isObject(raw)) {
    throw new ExportValidationError('Export must be a non-null object', 'MISSING_VERSION');
  }
  if (!isObject(raw['meta'])) {
    throw new ExportValidationError('Missing meta', 'MISSING_VERSION');
  }
  if (!('tracking' in raw)) {
    throw new ExportValidationError('Missing tracking slice', 'INVALID_SHAPE');
  }
  assertTrackingShape(raw['tracking']);
  if (!('avaChat' in raw)) {
    throw new ExportValidationError('Missing avaChat slice', 'INVALID_SHAPE');
  }
  assertAvaChatShape(raw['avaChat']);
  if (!('settings' in raw)) {
    throw new ExportValidationError('Missing settings slice', 'INVALID_SHAPE');
  }
  assertSettingsShape(raw['settings']);
}

export function migrateExport(raw: unknown): ZeroDataExportV1 {
  if (!isObject(raw)) {
    throw new ExportValidationError('Export must be a non-null object', 'MISSING_VERSION');
  }

  const meta = raw['meta'];
  if (!isObject(meta)) {
    throw new ExportValidationError('Missing schemaVersion', 'MISSING_VERSION');
  }

  const schemaVersion = meta['schemaVersion'];
  if (typeof schemaVersion !== 'number') {
    throw new ExportValidationError('Missing schemaVersion', 'MISSING_VERSION');
  }

  if (schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new ExportValidationError('Newer schema, please update app', 'FUTURE_VERSION');
  }

  if (schemaVersion < 1) {
    throw new ExportValidationError('Unknown legacy schema', 'LEGACY_VERSION');
  }

  if (schemaVersion === 1) {
    checkShapeV1(raw);
    const { meta: rawMeta, profile, trimester, tracking, avaChat, settings, extras } = raw;
    const result: ZeroDataExportV1 = {
      meta: rawMeta as ZeroDataExportV1['meta'],
      profile: profile as PregnancyProfile | null,
      trimester: trimester as Trimester,
      tracking: tracking as ZeroDataTrackingSlice,
      avaChat: avaChat as ZeroDataAvaSlice,
      settings: settings as ZeroDataSettingsSlice,
    };
    if (extras !== undefined) {
      result.extras = extras as ZeroDataExtrasSlice;
    }
    return result;
  }

  throw new ExportValidationError('Unknown legacy schema', 'LEGACY_VERSION');
}

export function buildExport(input: {
  profile: PregnancyProfile | null;
  trimester: Trimester;
  tracking: ZeroDataTrackingSlice;
  avaChat: ZeroDataAvaSlice;
  settings: ZeroDataSettingsSlice;
  extras?: ZeroDataExtrasSlice;
  identityType: IdentityType;
  identityValue?: string;
  platform: 'web' | 'mobile';
  appVersion: string;
}): ZeroDataExportV1 {
  const result: ZeroDataExportV1 = {
    meta: {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      appVersion: input.appVersion,
      exportedAt: new Date().toISOString(),
      identityType: input.identityType,
      platform: input.platform,
    },
    profile: input.profile,
    trimester: input.trimester,
    tracking: { ...input.tracking },
    avaChat: { ...input.avaChat },
    settings: { ...input.settings },
  };
  if (input.identityValue !== undefined) {
    result.meta.identityValue = input.identityValue;
  }
  if (input.extras !== undefined) {
    result.extras = { ...input.extras };
  }
  return result;
}
