import { describe, it, expect } from 'vitest';
import {
  WEB_PUSH_STALE_NOTICE_PENDING_KEY,
  detectStaleWebPushSync,
  shouldShowWebPushStaleNoticeSync,
  dismissWebPushStaleNoticeSync,
} from './webPushStaleNotice.ts';

const PROFILE_KEY = 'abc-123_profile_v5';

function makeBackend(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    store,
    backend: {
      getItem: (k: string): string | null =>
        store.has(k) ? (store.get(k) as string) : null,
      setItem: (k: string, v: string): void => {
        store.set(k, v);
      },
      removeItem: (k: string): void => {
        store.delete(k);
      },
    },
  };
}

describe('detectStaleWebPushSync', () => {
  it('is a no-op when the profile key does not exist (fresh install)', () => {
    const { store, backend } = makeBackend();
    detectStaleWebPushSync(backend, PROFILE_KEY);
    expect(store.has(WEB_PUSH_STALE_NOTICE_PENDING_KEY)).toBe(false);
    expect(store.has(PROFILE_KEY)).toBe(false);
  });

  it('sets pending flag and strips field when notificationsEnabled=true', () => {
    const { store, backend } = makeBackend({
      [PROFILE_KEY]: JSON.stringify({
        userName: 'Test',
        notificationsEnabled: true,
      }),
    });
    detectStaleWebPushSync(backend, PROFILE_KEY);
    expect(store.get(WEB_PUSH_STALE_NOTICE_PENDING_KEY)).toBe('1');
    const rewritten = JSON.parse(store.get(PROFILE_KEY) as string);
    expect('notificationsEnabled' in rewritten).toBe(false);
    expect(rewritten.userName).toBe('Test');
  });

  it('strips field but does not set pending flag when notificationsEnabled=false', () => {
    const { store, backend } = makeBackend({
      [PROFILE_KEY]: JSON.stringify({
        userName: 'Test',
        notificationsEnabled: false,
      }),
    });
    detectStaleWebPushSync(backend, PROFILE_KEY);
    expect(store.has(WEB_PUSH_STALE_NOTICE_PENDING_KEY)).toBe(false);
    const rewritten = JSON.parse(store.get(PROFILE_KEY) as string);
    expect('notificationsEnabled' in rewritten).toBe(false);
    expect(rewritten.userName).toBe('Test');
  });

  it('leaves profile untouched when notificationsEnabled is absent', () => {
    const original = JSON.stringify({ userName: 'Test' });
    const { store, backend } = makeBackend({ [PROFILE_KEY]: original });
    detectStaleWebPushSync(backend, PROFILE_KEY);
    expect(store.has(WEB_PUSH_STALE_NOTICE_PENDING_KEY)).toBe(false);
    expect(store.get(PROFILE_KEY)).toBe(original);
  });

  it('is idempotent: second run after first is a no-op', () => {
    const { store, backend } = makeBackend({
      [PROFILE_KEY]: JSON.stringify({
        userName: 'Test',
        notificationsEnabled: true,
      }),
    });
    detectStaleWebPushSync(backend, PROFILE_KEY);
    const afterFirst = store.get(PROFILE_KEY);
    detectStaleWebPushSync(backend, PROFILE_KEY);
    expect(store.get(PROFILE_KEY)).toBe(afterFirst);
    expect(store.get(WEB_PUSH_STALE_NOTICE_PENDING_KEY)).toBe('1');
  });

  it('silently ignores malformed JSON', () => {
    const { store, backend } = makeBackend({
      [PROFILE_KEY]: '{not json',
    });
    expect(() => detectStaleWebPushSync(backend, PROFILE_KEY)).not.toThrow();
    expect(store.has(WEB_PUSH_STALE_NOTICE_PENDING_KEY)).toBe(false);
    expect(store.get(PROFILE_KEY)).toBe('{not json');
  });

  it('silently ignores non-object profile value', () => {
    const { store, backend } = makeBackend({
      [PROFILE_KEY]: 'null',
    });
    detectStaleWebPushSync(backend, PROFILE_KEY);
    expect(store.has(WEB_PUSH_STALE_NOTICE_PENDING_KEY)).toBe(false);
  });

  it('silently ignores array profile value', () => {
    const { store, backend } = makeBackend({
      [PROFILE_KEY]: '[]',
    });
    detectStaleWebPushSync(backend, PROFILE_KEY);
    expect(store.has(WEB_PUSH_STALE_NOTICE_PENDING_KEY)).toBe(false);
  });
});

describe('shouldShowWebPushStaleNoticeSync', () => {
  it('returns true when pending flag is set', () => {
    const { backend } = makeBackend({ [WEB_PUSH_STALE_NOTICE_PENDING_KEY]: '1' });
    expect(shouldShowWebPushStaleNoticeSync(backend)).toBe(true);
  });

  it('returns false when pending flag is absent', () => {
    const { backend } = makeBackend();
    expect(shouldShowWebPushStaleNoticeSync(backend)).toBe(false);
  });

  it('returns false when pending flag is any value other than "1"', () => {
    const { backend } = makeBackend({ [WEB_PUSH_STALE_NOTICE_PENDING_KEY]: '0' });
    expect(shouldShowWebPushStaleNoticeSync(backend)).toBe(false);
  });
});

describe('dismissWebPushStaleNoticeSync', () => {
  it('removes the pending flag', () => {
    const { store, backend } = makeBackend({
      [WEB_PUSH_STALE_NOTICE_PENDING_KEY]: '1',
    });
    dismissWebPushStaleNoticeSync(backend);
    expect(store.has(WEB_PUSH_STALE_NOTICE_PENDING_KEY)).toBe(false);
  });

  it('is a no-op when the flag is not set', () => {
    const { store, backend } = makeBackend();
    expect(() => dismissWebPushStaleNoticeSync(backend)).not.toThrow();
    expect(store.size).toBe(0);
  });
});
