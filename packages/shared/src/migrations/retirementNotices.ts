/**
 * One-shot user-facing retirement notices. Kept next to avaOrphanPurge
 * because the detection relies on flags the purge writes — specifically
 * AVA_HAD_ORPHANS_KEY, set by `purgeAvaOrphansSync/Async` to '1' when the
 * purge found data and '0' when the install was already clean. See #312.
 *
 * This module is intentionally stateless: the caller reads the decision,
 * renders the banner, then calls `mark...NoticeSeen` on dismissal.
 */

import { AVA_HAD_ORPHANS_KEY } from './avaOrphanPurge.ts';

export const AVA_RETIREMENT_NOTICE_SEEN_KEY = 'nestly_ava_retirement_notice_seen';

export interface RetirementNoticeSyncBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface RetirementNoticeAsyncBackend {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/**
 * Returns true when the caller should render the Ava / Symptom Decoder /
 * Custom Plan retirement banner.
 *
 * Logic:
 * 1. If the user already dismissed the banner, no.
 * 2. If the orphan purge recorded that the install had Ava data, yes.
 * 3. Otherwise silently mark the notice as seen (fresh install — apologize
 *    for nothing the user ever saw) and return false.
 */
export function shouldShowAvaRetirementNoticeSync(
  backend: RetirementNoticeSyncBackend,
): boolean {
  if (backend.getItem(AVA_RETIREMENT_NOTICE_SEEN_KEY) === '1') return false;
  if (backend.getItem(AVA_HAD_ORPHANS_KEY) === '1') return true;
  backend.setItem(AVA_RETIREMENT_NOTICE_SEEN_KEY, '1');
  return false;
}

export async function shouldShowAvaRetirementNoticeAsync(
  backend: RetirementNoticeAsyncBackend,
): Promise<boolean> {
  if ((await backend.getItem(AVA_RETIREMENT_NOTICE_SEEN_KEY)) === '1') return false;
  if ((await backend.getItem(AVA_HAD_ORPHANS_KEY)) === '1') return true;
  await backend.setItem(AVA_RETIREMENT_NOTICE_SEEN_KEY, '1');
  return false;
}

export function markAvaRetirementNoticeSeenSync(backend: RetirementNoticeSyncBackend): void {
  backend.setItem(AVA_RETIREMENT_NOTICE_SEEN_KEY, '1');
}

export async function markAvaRetirementNoticeSeenAsync(
  backend: RetirementNoticeAsyncBackend,
): Promise<void> {
  await backend.setItem(AVA_RETIREMENT_NOTICE_SEEN_KEY, '1');
}
