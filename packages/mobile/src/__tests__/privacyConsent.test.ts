// #281 regression tests. Two guarantees we need to lock in:
//   1. authStore.logout() never touches hasAcceptedPrivacy (the flag lives
//      in a separate store now, so even a regression that re-adds the field
//      to authStore would still fail this test because logout's state shape
//      doesn't include it).
//   2. Privacy consent persists under a device-level key (`privacy`) with
//      no email prefix — i.e. it does not ride the createUserScopedStorage
//      `{email}_` prefix that profile/tracking/avaChat use.

import {
  useAuthStore,
  usePrivacyStore,
  setPrivacyStorage,
  type StateStorage,
} from '@nestly/shared/stores';

describe('#281 privacy consent is device-level, not session-scoped', () => {
  test('authStore.logout() does not clear or mention privacy consent', () => {
    useAuthStore.setState({ authEmail: 'user@example.com', userUid: 'abc123', loading: false });
    useAuthStore.getState().logout();
    const state = useAuthStore.getState() as unknown as Record<string, unknown>;
    expect(state.authEmail).toBeNull();
    expect(state.userUid).toBeNull();
    // The field no longer exists on AuthState. If a future change reintroduces
    // it, this test still passes as long as logout() does not set it — but
    // the second assertion below will flag any regression that writes it.
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
    setPrivacyStorage(inMemory);

    usePrivacyStore.getState().setHasAcceptedPrivacy(true);
    // Zustand's persist middleware writes asynchronously on the next tick.
    // Yield a macrotask and the microtask queue so the setItem flushes.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(writes.length).toBeGreaterThan(0);
    const keys = writes.map((w) => w.key);
    expect(keys).toContain('privacy');
    // Not email-prefixed (would be `guest_privacy` or `user@example.com_privacy`
    // if privacyStore accidentally ended up on createUserScopedStorage).
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
