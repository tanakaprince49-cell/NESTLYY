import {
  PregnancyProfile,
  ZeroDataExportV1,
  ZeroDataExtrasSlice,
  ZeroDataSettingsSlice,
  ZeroDataTrackingSlice,
} from '@nestly/shared';
import { KEYS, StorageService, USER_SCOPED_KEYS } from './storageService.ts';

// Zero-Data export/import/wipe adapter. Bridges the tracker-by-tracker
// storageService getters into the flat `ZeroDataExportV1` shape used by
// exportService (build) and DataManagementCard (restore/wipe). Lives
// outside storageService so the snapshot+rollback logic can be tested
// without pulling in ~30 unrelated domain getters.

export function buildTrackingSlice(storage: StorageService): ZeroDataTrackingSlice {
  return {
    foodEntries: storage.getFoodEntries(),
    symptoms: storage.getSymptoms(),
    vitamins: storage.getVitamins(),
    contractions: storage.getContractions(),
    journalEntries: storage.getJournalEntries(),
    calendarEvents: storage.getCalendarEvents(),
    weightLogs: storage.getWeightLogs(),
    sleepLogs: storage.getSleepLogs(),
    feedingLogs: storage.getFeedingLogs(),
    milestones: storage.getMilestones(),
    healthLogs: storage.getHealthLogs(),
    reactions: storage.getReactions(),
    babyGrowthLogs: storage.getBabyGrowthLogs(),
    tummyTimeLogs: storage.getTummyTimeLogs(),
    bloodPressureLogs: storage.getBloodPressureLogs(),
    kickLogs: storage.getKickLogs(),
    kegelLogs: storage.getKegelLogs(),
    diaperLogs: storage.getDiaperLogs(),
    medicationLogs: storage.getMedications(),
  };
}

export function buildExtrasSlice(storage: StorageService): ZeroDataExtrasSlice {
  return {
    periodLogs: storage.getPeriodLogs(),
    archivedPregnancies: storage.getArchive(),
    checklistItems: storage.getAllChecklists(),
    babyNames: storage.getBabyNames(),
    bumpPhotos: storage.getBumpPhotos(),
    unlockedAchievementIds: storage.getUnlockedAchievementIds(),
    lastWeekCelebrated: storage.getLastWeekCelebrated(),
  };
}

export function buildSettingsSlice(
  storage: StorageService,
  profile: PregnancyProfile | null,
): ZeroDataSettingsSlice {
  const slice: ZeroDataSettingsSlice = {
    hasAcceptedPrivacy: storage.hasAcceptedPrivacy(),
  };
  if (profile?.notificationsEnabled !== undefined) {
    slice.notificationsEnabled = profile.notificationsEnabled;
  }
  if (profile?.emailNotifications !== undefined) {
    slice.emailNotifications = profile.emailNotifications;
  }
  if (profile?.dietPreference !== undefined) {
    slice.dietPreference = profile.dietPreference;
  }
  if (profile?.themeColor !== undefined) {
    slice.themeColor = profile.themeColor;
  }
  return slice;
}

// Wipes every user-scoped key but keeps the device UUID so a post-wipe
// reload routes to Setup under the same identity. Global keys
// (ACTIVITY_LOGS, VISITS, ARTICLES, VIDEOS) intentionally survive — they
// are device telemetry or seeded content, not user data.
//
// storage-audit: allowed — bulk iteration over USER_SCOPED_KEYS. The
// typed storageService API has no generic remove(key) because every
// domain has its own typed setter; this is the one place that needs
// dynamic-key access, and it is the implementation of the "wipe" primitive.
export function wipeUserScopedKeys(storage: StorageService): void {
  const uuid = storage.getLocalUuidPublic();
  try {
    USER_SCOPED_KEYS.forEach((key) => {
      localStorage.removeItem(`${uuid}_${key}`); // storage-audit: allowed — bulk wipe over dynamic key list
    });
  } catch {}
}

// Restore snapshots every user-scoped key under the current UUID, wipes,
// writes the imported payload, and rolls back if any write throws mid-way
// (e.g. QuotaExceededError) so the user is never left with a half-restored
// state. Device UUID is preserved — imported data lives under this
// device's scope going forward, no identity churn.
//
// storage-audit: allowed — snapshot/restore needs dynamic-key read and
// raw-string passthrough. Typed getters would deserialize-then-reserialize
// on every key and drop unknown fields, breaking round-trip fidelity.
export function restoreUserScopedKeys(
  storage: StorageService,
  data: ZeroDataExportV1,
): void {
  const uuid = storage.getLocalUuidPublic();
  const snapshot = new Map<string, string | null>();
  for (const key of USER_SCOPED_KEYS) {
    const fullKey = `${uuid}_${key}`;
    try {
      snapshot.set(fullKey, localStorage.getItem(fullKey)); // storage-audit: allowed — raw snapshot for rollback
    } catch {
      snapshot.set(fullKey, null);
    }
  }

  wipeUserScopedKeys(storage);

  const writeOrThrow = (key: string, value: unknown): void => {
    localStorage.setItem(`${uuid}_${key}`, JSON.stringify(value)); // storage-audit: allowed — dynamic-key typed write
  };

  try {
    if (data.profile) {
      writeOrThrow(KEYS.PROFILE, data.profile);
    }

    writeOrThrow(KEYS.FOOD, data.tracking.foodEntries);
    writeOrThrow(KEYS.SYMPTOMS, data.tracking.symptoms);
    writeOrThrow(KEYS.VITAMINS, data.tracking.vitamins);
    writeOrThrow(KEYS.CONTRACTIONS, data.tracking.contractions);
    writeOrThrow(KEYS.JOURNAL, data.tracking.journalEntries);
    writeOrThrow(KEYS.CALENDAR, data.tracking.calendarEvents);
    writeOrThrow(KEYS.WEIGHT, data.tracking.weightLogs);
    writeOrThrow(KEYS.SLEEP, data.tracking.sleepLogs);
    writeOrThrow(KEYS.FEEDING, data.tracking.feedingLogs);
    writeOrThrow(KEYS.MILESTONES, data.tracking.milestones);
    writeOrThrow(KEYS.HEALTH, data.tracking.healthLogs);
    writeOrThrow(KEYS.REACTIONS, data.tracking.reactions);
    writeOrThrow(KEYS.BABY_GROWTH, data.tracking.babyGrowthLogs);
    writeOrThrow(KEYS.TUMMY_TIME, data.tracking.tummyTimeLogs);
    writeOrThrow(KEYS.BLOOD_PRESSURE, data.tracking.bloodPressureLogs);
    writeOrThrow(KEYS.KICKS, data.tracking.kickLogs);
    writeOrThrow(KEYS.KEGELS, data.tracking.kegelLogs);
    writeOrThrow(KEYS.DIAPER, data.tracking.diaperLogs);
    writeOrThrow(KEYS.MEDICATIONS, data.tracking.medicationLogs);

    writeOrThrow(KEYS.PRIVACY_ACCEPTED, data.settings.hasAcceptedPrivacy);

    if (data.extras) {
      if (data.extras.periodLogs) writeOrThrow(KEYS.PERIOD_LOGS, data.extras.periodLogs);
      if (data.extras.archivedPregnancies) writeOrThrow(KEYS.ARCHIVE, data.extras.archivedPregnancies);
      if (data.extras.checklistItems) writeOrThrow(KEYS.CHECKLISTS, data.extras.checklistItems);
      if (data.extras.babyNames) writeOrThrow(KEYS.BABY_NAMES, data.extras.babyNames);
      if (data.extras.bumpPhotos) writeOrThrow(KEYS.BUMP_PHOTOS, data.extras.bumpPhotos);
      if (data.extras.unlockedAchievementIds) writeOrThrow(KEYS.UNLOCKED_IDS, data.extras.unlockedAchievementIds);
      if (typeof data.extras.lastWeekCelebrated === 'number') {
        writeOrThrow(KEYS.LAST_WEEK_CELEBRATED, data.extras.lastWeekCelebrated);
      }
    }
  } catch (e) {
    try {
      for (const fullKey of snapshot.keys()) {
        localStorage.removeItem(fullKey); // storage-audit: allowed — rollback wipe
      }
      for (const [fullKey, value] of snapshot) {
        if (value !== null) {
          localStorage.setItem(fullKey, value); // storage-audit: allowed — rollback restore
        }
      }
    } catch {
      // Nothing more we can do — surface the original error to the caller.
    }
    throw e;
  }
}
