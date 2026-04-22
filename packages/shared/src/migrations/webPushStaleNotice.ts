/**
 * One-shot notice for web users who had Push Notifications enabled before
 * #298 removed the feature from the web surface. Their
 * `profile.notificationsEnabled = true` flag stayed in localStorage as a
 * no-op; this migration detects that, strips the dead field from the
 * stored profile, and queues a banner to inform the user on next launch.
 *
 * Web-only: mobile push is still live (until #299). See issue #320.
 *
 * Failure mode: JSON parse/write errors are swallowed so a corrupted
 * profile blob cannot wedge boot. The pending flag is only written on a
 * successful clean parse + rewrite, so the banner never shows without a
 * real cleanup having happened.
 */

export const WEB_PUSH_STALE_NOTICE_PENDING_KEY =
  'nestly_web_push_stale_notice_pending_v1';

export interface WebPushStaleSyncBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Reads the user-scoped profile blob and, if `notificationsEnabled` is
 * present, strips it from the stored JSON. When the stripped value was
 * `true`, also sets the pending-notice flag so the banner renders.
 *
 * `profileKey` is the full scoped key (e.g. `{uuid}_profile_v5`); the
 * caller owns scope resolution. The value stored at `profileKey` is
 * expected to be a JSON-serialized plain profile object (not a Zustand
 * persist wrapper). Safe to call on every boot: after the first run the
 * field is gone and subsequent reads become a no-op.
 */
export function detectStaleWebPushSync(
  backend: WebPushStaleSyncBackend,
  profileKey: string,
): void {
  let raw: string | null;
  try {
    raw = backend.getItem(profileKey);
  } catch {
    return;
  }
  if (raw === null) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;

  const profile = parsed as Record<string, unknown>;
  if (!('notificationsEnabled' in profile)) return;

  const hadStaleOptIn = profile.notificationsEnabled === true;
  delete profile.notificationsEnabled;

  try {
    backend.setItem(profileKey, JSON.stringify(profile));
  } catch {
    return;
  }

  if (hadStaleOptIn) {
    try {
      backend.setItem(WEB_PUSH_STALE_NOTICE_PENDING_KEY, '1');
    } catch {}
  }
}

export function shouldShowWebPushStaleNoticeSync(
  backend: Pick<WebPushStaleSyncBackend, 'getItem'>,
): boolean {
  try {
    return backend.getItem(WEB_PUSH_STALE_NOTICE_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissWebPushStaleNoticeSync(
  backend: Pick<WebPushStaleSyncBackend, 'removeItem'>,
): void {
  try {
    backend.removeItem(WEB_PUSH_STALE_NOTICE_PENDING_KEY);
  } catch {}
}
