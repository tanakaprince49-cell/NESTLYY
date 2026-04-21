import {
  buildExport,
  migrateExport,
  Trimester,
  ExportValidationError,
  type ZeroDataExportV1,
  type PregnancyProfile,
  type ZeroDataSettingsSlice,
} from '@nestly/shared';
import {
  useProfileStore,
  useTrackingStore,
  usePrivacyStore,
  useLocalIdentityStore,
} from '@nestly/shared/stores';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { clearUserStores } from '../stores/bootstrap';
import { buildDoctorSummaryHtml } from './reportHtmlTemplates';
import { generateAndSharePdf } from './pdfService';

// Keep in sync with packages/mobile/app.json -> expo.version (canonical).
// Mirrors the web exportService constant — both platforms stamp this onto
// meta.appVersion so a user can see which build produced a given backup file.
export const APP_VERSION = '0.1.0';

function trimesterFromProfile(profile: PregnancyProfile | null): Trimester {
  if (!profile?.dueDate) return Trimester.FIRST;
  const due = new Date(profile.dueDate).getTime();
  if (Number.isNaN(due)) return Trimester.FIRST;
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksLeft = (due - Date.now()) / msPerWeek;
  const weeks = 40 - weeksLeft;
  if (weeks < 13) return Trimester.FIRST;
  if (weeks < 27) return Trimester.SECOND;
  return Trimester.THIRD;
}

function settingsSliceFromProfile(
  profile: PregnancyProfile | null,
  hasAcceptedPrivacy: boolean,
): ZeroDataSettingsSlice {
  const slice: ZeroDataSettingsSlice = { hasAcceptedPrivacy };
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

export function buildMobileExport(): ZeroDataExportV1 {
  const { profile } = useProfileStore.getState();
  const t = useTrackingStore.getState();
  const { hasAcceptedPrivacy } = usePrivacyStore.getState();
  const { localUuid } = useLocalIdentityStore.getState();

  return buildExport({
    profile,
    trimester: trimesterFromProfile(profile),
    tracking: {
      // Zustand tracking store names the food-logs array `entries` for legacy
      // reasons; the shared export schema calls it `foodEntries`. Map here so
      // the web and mobile exports are byte-compatible.
      foodEntries: t.entries,
      symptoms: t.symptoms,
      vitamins: t.vitamins,
      contractions: t.contractions,
      journalEntries: t.journalEntries,
      calendarEvents: t.calendarEvents,
      weightLogs: t.weightLogs,
      sleepLogs: t.sleepLogs,
      feedingLogs: t.feedingLogs,
      milestones: t.milestones,
      healthLogs: t.healthLogs,
      reactions: t.reactions,
      babyGrowthLogs: t.babyGrowthLogs,
      tummyTimeLogs: t.tummyTimeLogs,
      bloodPressureLogs: t.bloodPressureLogs,
      kickLogs: t.kickLogs,
      kegelLogs: t.kegelLogs,
      diaperLogs: t.diaperLogs,
      medicationLogs: t.medicationLogs,
    },
    avaChat: { messages: [] },
    settings: settingsSliceFromProfile(profile, hasAcceptedPrivacy),
    identityType: 'local-uuid',
    // localUuid is '' at cold start before bootstrap runs; treat empty as absent.
    identityValue: localUuid || undefined,
    platform: 'mobile',
    appVersion: APP_VERSION,
  });
}

function defaultBackupFilename(): string {
  return `nestly-export-${new Date().toISOString().split('T')[0]}.json`;
}

export async function saveExportAndShare(
  payload: ZeroDataExportV1,
  filename?: string,
): Promise<void> {
  const name = filename ?? defaultBackupFilename();
  const file = new File(Paths.document, name);
  // Overwrite any prior export under the same filename (same-day re-export)
  // so we never hand the share sheet a stale file.
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(payload, null, 2));
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Nestly data',
    UTI: 'public.json',
  });
}

export async function pickAndLoadExport(): Promise<ZeroDataExportV1 | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    // copyToCacheDirectory gives us a stable file:// URI that expo-file-system
    // can read, regardless of whether the user picked from Drive, Files, or
    // another content provider.
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  let text: string;
  try {
    text = await new File(asset.uri).text();
  } catch {
    throw new ExportValidationError(
      'Could not read the selected file. Try again or pick a different file.',
      'INVALID_SHAPE',
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ExportValidationError(
      'File is not valid JSON. Only Nestly export files are supported.',
      'INVALID_SHAPE',
    );
  }
  return migrateExport(parsed);
}

/**
 * Apply a validated export payload to the in-memory stores. Zustand persist
 * middleware writes each setter through to AsyncStorage asynchronously; this
 * function returns once the in-memory state matches the payload. Callers who
 * need to be sure the AsyncStorage write landed (e.g., before navigating away)
 * should `await` one microtask after this returns, but the in-memory state is
 * authoritative for the rest of the session either way.
 *
 * Privacy consent (`settings.hasAcceptedPrivacy`) is intentionally NOT applied
 * to the device: consent is device-level per #281, and the receiving device's
 * own consent state must win over whatever the backup file carries. The field
 * is still stamped into the export for portability, just ignored here.
 *
 * All store writes are wrapped in a try/catch that rolls back to the
 * pre-restore snapshot if any setter throws, so users never see a partial
 * restore (profile replaced but tracking half-populated).
 */
export function restoreMobileExport(data: ZeroDataExportV1): void {
  const profileStore = useProfileStore.getState();
  const t = useTrackingStore.getState();
  const snapshot = {
    profile: profileStore.profile,
    entries: t.entries,
    symptoms: t.symptoms,
    vitamins: t.vitamins,
    contractions: t.contractions,
    journalEntries: t.journalEntries,
    calendarEvents: t.calendarEvents,
    weightLogs: t.weightLogs,
    sleepLogs: t.sleepLogs,
    feedingLogs: t.feedingLogs,
    milestones: t.milestones,
    healthLogs: t.healthLogs,
    reactions: t.reactions,
    babyGrowthLogs: t.babyGrowthLogs,
    tummyTimeLogs: t.tummyTimeLogs,
    bloodPressureLogs: t.bloodPressureLogs,
    kickLogs: t.kickLogs,
    kegelLogs: t.kegelLogs,
    diaperLogs: t.diaperLogs,
    medicationLogs: t.medicationLogs,
  };

  try {
    profileStore.setProfile(data.profile);
    // Mirror the export->slice mapping: slice.foodEntries -> store.entries.
    t.setEntries(data.tracking.foodEntries);
    t.setSymptoms(data.tracking.symptoms);
    t.setVitamins(data.tracking.vitamins);
    t.setContractions(data.tracking.contractions);
    t.setJournalEntries(data.tracking.journalEntries);
    t.setCalendarEvents(data.tracking.calendarEvents);
    t.setWeightLogs(data.tracking.weightLogs);
    t.setSleepLogs(data.tracking.sleepLogs);
    t.setFeedingLogs(data.tracking.feedingLogs);
    t.setMilestones(data.tracking.milestones);
    t.setHealthLogs(data.tracking.healthLogs);
    t.setReactions(data.tracking.reactions);
    t.setBabyGrowthLogs(data.tracking.babyGrowthLogs);
    t.setTummyTimeLogs(data.tracking.tummyTimeLogs);
    t.setBloodPressureLogs(data.tracking.bloodPressureLogs);
    t.setKickLogs(data.tracking.kickLogs);
    t.setKegelLogs(data.tracking.kegelLogs);
    t.setDiaperLogs(data.tracking.diaperLogs);
    t.setMedicationLogs(data.tracking.medicationLogs);
  } catch (err) {
    profileStore.setProfile(snapshot.profile);
    t.setEntries(snapshot.entries);
    t.setSymptoms(snapshot.symptoms);
    t.setVitamins(snapshot.vitamins);
    t.setContractions(snapshot.contractions);
    t.setJournalEntries(snapshot.journalEntries);
    t.setCalendarEvents(snapshot.calendarEvents);
    t.setWeightLogs(snapshot.weightLogs);
    t.setSleepLogs(snapshot.sleepLogs);
    t.setFeedingLogs(snapshot.feedingLogs);
    t.setMilestones(snapshot.milestones);
    t.setHealthLogs(snapshot.healthLogs);
    t.setReactions(snapshot.reactions);
    t.setBabyGrowthLogs(snapshot.babyGrowthLogs);
    t.setTummyTimeLogs(snapshot.tummyTimeLogs);
    t.setBloodPressureLogs(snapshot.bloodPressureLogs);
    t.setKickLogs(snapshot.kickLogs);
    t.setKegelLogs(snapshot.kegelLogs);
    t.setDiaperLogs(snapshot.diaperLogs);
    t.setMedicationLogs(snapshot.medicationLogs);
    throw err;
  }
}

/**
 * Delete every user-scoped persisted slice from AsyncStorage and reset the
 * in-memory store state. Privacy consent is device-level per #281 and is
 * intentionally NOT wiped — a user who asks to delete their tracking data
 * should not be forced back through the privacy consent screen on next launch.
 *
 * The in-memory setters run BEFORE `clearUserStores()` so that if Zustand's
 * persist middleware flushes during the AsyncStorage wipe window, it writes
 * empty state (the no-op we want) rather than the old state (which would
 * survive the wipe).
 */
export async function wipeAllMobileData(): Promise<void> {
  useProfileStore.getState().setProfile(null);
  useTrackingStore.getState().resetAllLogs();
  await clearUserStores();
}

/**
 * Generate the cross-platform "For your midwife or doctor" PDF from the
 * current tracker state and hand it to the Android share sheet. Returns
 * without effect if no profile is configured — the caller should guard with
 * a UI hint rather than relying on this silent no-op, but it avoids printing
 * a blank header for users who somehow land on this button before setup.
 */
export async function shareDoctorSummaryPdf(): Promise<void> {
  const { profile } = useProfileStore.getState();
  if (!profile) return;
  const t = useTrackingStore.getState();
  const html = buildDoctorSummaryHtml({
    profile,
    weightLogs: t.weightLogs,
    bloodPressureLogs: t.bloodPressureLogs,
    sleepLogs: t.sleepLogs,
    symptoms: t.symptoms,
    kickLogs: t.kickLogs,
    kegelLogs: t.kegelLogs,
    foodEntries: t.entries,
    feedingLogs: t.feedingLogs,
    diaperLogs: t.diaperLogs,
    medicationLogs: t.medicationLogs,
  });
  const filename = `Nestly_Doctor_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
  await generateAndSharePdf(html, filename);
}
