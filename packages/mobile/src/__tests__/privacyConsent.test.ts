// #281 regression tests updated for #293 (Zero-Data MVP / no Firebase Auth).
//
// Two guarantees we need to lock in:
//   1. useLocalIdentityStore never touches hasAcceptedPrivacy (different store).
//   2. Privacy consent persists under a device-level key (`privacy`) with
//      no uuid prefix — i.e. it does not ride the createUserScopedStorage
//      `{uuid}_` prefix that profile/tracking/avaChat use.

import {
  useLocalIdentityStore,
  setLocalUuid,
  usePrivacyStore,
  setPrivacyStorage,
  type StateStorage,
} from '@nestly/shared/stores';

describe('#281 privacy consent is device-level, not session-scoped', () => {
  test('setting localUuid does not clear or mention privacy consent', () => {
    setLocalUuid('test-uuid-123');
    const state = useLocalIdentityStore.getState() as unknown as Record<string, unknown>;
    expect(state.localUuid).toBe('test-uuid-123');
    expect('hasAcceptedPrivacy' in state).toBe(false);
  });

  test('privacyStore.setHasAcceptedPrivacy(true) writes under the device-level key', async () => {
    const writes: Array<{ key: string; value: string }> = [];
    const inMemory: StateStorage = {
      getItem: async () => null,
      setItem: async (key, value) => {
        writes.push({ key, value });
      },
      removeItem: async () => {},
    };
    // No afterEach teardown: this is the last test that exercises privacy
    // persistence in this file, and Jest runs each test file in its own
    // worker with a fresh module registry, so the in-memory backend cannot
    // leak into other suites.
    setPrivacyStorage(inMemory);

    usePrivacyStore.getState().setHasAcceptedPrivacy(true);
    // Zustand's persist middleware writes asynchronously on the next tick.
    // Yield a macrotask and the microtask queue so the setItem flushes.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(writes.length).toBeGreaterThan(0);
    const keys = writes.map((w) => w.key);
    expect(keys).toContain('privacy');
    // Not uuid-prefixed (would be `{uuid}_privacy` if privacyStore accidentally
    // ended up on createUserScopedStorage).
    for (const key of keys) {
      expect(key).not.toMatch(/^[^_]+_privacy$/);
    }

    // Parse the persisted payload and confirm the flag made it through.
    const payload = JSON.parse(writes[writes.length - 1].value);
    expect(payload.state.hasAcceptedPrivacy).toBe(true);
  });

  test('privacyStore starts with hasAcceptedPrivacy=false by default', () => {
    // Reset the zustand store's state (not its persist config) between tests
    // so this assertion is not tainted by the previous test writing `true`.
    usePrivacyStore.setState({ hasAcceptedPrivacy: false });
    expect(usePrivacyStore.getState().hasAcceptedPrivacy).toBe(false);
  });
});
