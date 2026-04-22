import {
  buildExport,
  migrateExport,
  Trimester,
  ExportValidationError,
  type ZeroDataExportV1,
  type PregnancyProfile,
} from '@nestly/shared';
import { storage } from './storageService.ts';
import {
  buildExtrasSlice,
  buildSettingsSlice,
  buildTrackingSlice,
} from './webExportAdapter.ts';

// Mirrors the mobile exportService constant — both platforms stamp this onto
// meta.appVersion so a user can see which build produced a given backup file.
// Kept in sync with packages/mobile/app.json -> expo.version by scripts/
// version-bump.mjs, which rewrites this literal every time you run
// `npm run version:patch|minor|major`. Do not edit by hand (#331).
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

export function buildWebExport(): ZeroDataExportV1 {
  const profile = storage.getProfile();
  return buildExport({
    profile,
    trimester: trimesterFromProfile(profile),
    tracking: buildTrackingSlice(storage),
    avaChat: { messages: [] },
    settings: buildSettingsSlice(storage, profile),
    extras: buildExtrasSlice(storage),
    identityType: 'local-uuid',
    identityValue: storage.getLocalUuidPublic(),
    platform: 'web',
    appVersion: APP_VERSION,
  });
}

export function downloadJson(payload: ZeroDataExportV1, filename?: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `nestly-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importFromFile(file: File): Promise<ZeroDataExportV1> {
  const text = await file.text();
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
