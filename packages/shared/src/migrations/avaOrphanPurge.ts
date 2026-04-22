/**
 * One-shot purge of orphaned Ava / Symptom Decoder / Custom Plan blobs.
 *
 * After #295 the app no longer reads or writes these keys, but pre-update
 * installs still hold the data in localStorage / AsyncStorage under one of
 * several scope prefixes (unscoped, `{uuid}_`, legacy email, legacy guest).
 *
 * The migration iterates every existing key and removes anything whose
 * suffix matches a known Ava/CustomPlan key, then sets a done flag so the
 * scan runs exactly once per installation. See issue #311.
 *
 * Failure mode: if `getAllKeys()` throws (storage quota, permission, etc.),
 * neither the had-orphans nor the done flag is written, so the purge retries
 * on next launch rather than silently skipping cleanup.
 */

export const AVA_PURGE_DONE_KEY = 'nestly_ava_purge_v1_done';

/**
 * Set to '1' by the purge when it finds and removes at least one orphan,
 * '0' when the scan completes with zero orphans. Used downstream (issue
 * #312) to decide whether to show the Ava / Symptom Decoder / Custom Plan
 * retirement notice: if orphans were found the user actively used those
 * features and deserves an acknowledgment; if the device was clean the
 * notice is suppressed silently.
 */
export const AVA_HAD_ORPHANS_KEY = 'nestly_ava_had_orphans_v1';

const AVA_ORPHAN_KEY_SUFFIXES = [
  'ava_history_v2',
  'ava_memory_bank',
  'ava_custom_image',
  'chat_history',
  'custom_plan_v1',
  'custom_plan',
  'ava-chat',
] as const;

export function isAvaOrphanKey(key: string): boolean {
  for (const suffix of AVA_ORPHAN_KEY_SUFFIXES) {
    if (key === suffix) return true;
    if (key.endsWith(`_${suffix}`)) return true;
  }
  return false;
}

export function collectAvaOrphanKeys(allKeys: readonly string[]): string[] {
  return allKeys.filter(isAvaOrphanKey);
}

export interface AvaPurgeResult {
  purged: number;
  skipped: boolean;
}

export interface AvaPurgeSyncBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  getAllKeys(): readonly string[];
}

export interface AvaPurgeAsyncBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
}

export function purgeAvaOrphansSync(backend: AvaPurgeSyncBackend): AvaPurgeResult {
  if (backend.getItem(AVA_PURGE_DONE_KEY) === '1') {
    return { purged: 0, skipped: true };
  }
  const orphans = collectAvaOrphanKeys(backend.getAllKeys());
  for (const key of orphans) {
    backend.removeItem(key);
  }
  backend.setItem(AVA_HAD_ORPHANS_KEY, orphans.length > 0 ? '1' : '0');
  backend.setItem(AVA_PURGE_DONE_KEY, '1');
  return { purged: orphans.length, skipped: false };
}

export async function purgeAvaOrphansAsync(
  backend: AvaPurgeAsyncBackend,
): Promise<AvaPurgeResult> {
  const done = await backend.getItem(AVA_PURGE_DONE_KEY);
  if (done === '1') {
    return { purged: 0, skipped: true };
  }
  const orphans = collectAvaOrphanKeys(await backend.getAllKeys());
  for (const key of orphans) {
    await backend.removeItem(key);
  }
  await backend.setItem(AVA_HAD_ORPHANS_KEY, orphans.length > 0 ? '1' : '0');
  await backend.setItem(AVA_PURGE_DONE_KEY, '1');
  return { purged: orphans.length, skipped: false };
}
