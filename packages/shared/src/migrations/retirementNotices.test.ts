import { describe, it, expect } from 'vitest';
import {
  AVA_RETIREMENT_NOTICE_SEEN_KEY,
  shouldShowAvaRetirementNoticeSync,
  shouldShowAvaRetirementNoticeAsync,
  markAvaRetirementNoticeSeenSync,
  markAvaRetirementNoticeSeenAsync,
} from './retirementNotices.ts';
import { AVA_HAD_ORPHANS_KEY } from './avaOrphanPurge.ts';

function makeSyncBackend(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    store,
    backend: {
      getItem: (key: string): string | null => (store.has(key) ? (store.get(key) as string) : null),
      setItem: (key: string, value: string): void => {
        store.set(key, value);
      },
    },
  };
}

function makeAsyncBackend(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    store,
    backend: {
      getItem: async (key: string): Promise<string | null> =>
        store.has(key) ? (store.get(key) as string) : null,
      setItem: async (key: string, value: string): Promise<void> => {
        store.set(key, value);
      },
    },
  };
}

describe('shouldShowAvaRetirementNoticeSync', () => {
  it('returns true when purge found orphans and notice not yet seen', () => {
    const { backend } = makeSyncBackend({ [AVA_HAD_ORPHANS_KEY]: '1' });
    expect(shouldShowAvaRetirementNoticeSync(backend)).toBe(true);
  });

  it('returns false and silently marks seen when purge found no orphans (fresh install)', () => {
    const { store, backend } = makeSyncBackend({ [AVA_HAD_ORPHANS_KEY]: '0' });
    expect(shouldShowAvaRetirementNoticeSync(backend)).toBe(false);
    expect(store.get(AVA_RETIREMENT_NOTICE_SEEN_KEY)).toBe('1');
  });

  it('returns false and silently marks seen when purge has not run yet (no had-orphans flag)', () => {
    const { store, backend } = makeSyncBackend({});
    expect(shouldShowAvaRetirementNoticeSync(backend)).toBe(false);
    expect(store.get(AVA_RETIREMENT_NOTICE_SEEN_KEY)).toBe('1');
  });

  it('returns false when notice has already been seen', () => {
    const { backend } = makeSyncBackend({
      [AVA_HAD_ORPHANS_KEY]: '1',
      [AVA_RETIREMENT_NOTICE_SEEN_KEY]: '1',
    });
    expect(shouldShowAvaRetirementNoticeSync(backend)).toBe(false);
  });

  it('does not mark seen when returning true (banner still needs to render)', () => {
    const { store, backend } = makeSyncBackend({ [AVA_HAD_ORPHANS_KEY]: '1' });
    shouldShowAvaRetirementNoticeSync(backend);
    expect(store.has(AVA_RETIREMENT_NOTICE_SEEN_KEY)).toBe(false);
  });
});

describe('markAvaRetirementNoticeSeenSync', () => {
  it('sets the seen flag', () => {
    const { store, backend } = makeSyncBackend({});
    markAvaRetirementNoticeSeenSync(backend);
    expect(store.get(AVA_RETIREMENT_NOTICE_SEEN_KEY)).toBe('1');
  });
});

describe('shouldShowAvaRetirementNoticeAsync', () => {
  it('returns true when purge found orphans and notice not yet seen', async () => {
    const { backend } = makeAsyncBackend({ [AVA_HAD_ORPHANS_KEY]: '1' });
    await expect(shouldShowAvaRetirementNoticeAsync(backend)).resolves.toBe(true);
  });

  it('returns false and silently marks seen when purge found no orphans', async () => {
    const { store, backend } = makeAsyncBackend({ [AVA_HAD_ORPHANS_KEY]: '0' });
    await expect(shouldShowAvaRetirementNoticeAsync(backend)).resolves.toBe(false);
    expect(store.get(AVA_RETIREMENT_NOTICE_SEEN_KEY)).toBe('1');
  });

  it('returns false and silently marks seen when purge has not run yet (no had-orphans flag)', async () => {
    const { store, backend } = makeAsyncBackend({});
    await expect(shouldShowAvaRetirementNoticeAsync(backend)).resolves.toBe(false);
    expect(store.get(AVA_RETIREMENT_NOTICE_SEEN_KEY)).toBe('1');
  });

  it('returns false when notice has already been seen', async () => {
    const { backend } = makeAsyncBackend({
      [AVA_HAD_ORPHANS_KEY]: '1',
      [AVA_RETIREMENT_NOTICE_SEEN_KEY]: '1',
    });
    await expect(shouldShowAvaRetirementNoticeAsync(backend)).resolves.toBe(false);
  });

  it('does not mark seen when returning true', async () => {
    const { store, backend } = makeAsyncBackend({ [AVA_HAD_ORPHANS_KEY]: '1' });
    await shouldShowAvaRetirementNoticeAsync(backend);
    expect(store.has(AVA_RETIREMENT_NOTICE_SEEN_KEY)).toBe(false);
  });
});

describe('markAvaRetirementNoticeSeenAsync', () => {
  it('sets the seen flag', async () => {
    const { store, backend } = makeAsyncBackend({});
    await markAvaRetirementNoticeSeenAsync(backend);
    expect(store.get(AVA_RETIREMENT_NOTICE_SEEN_KEY)).toBe('1');
  });
});
