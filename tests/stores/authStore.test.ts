import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../packages/shared/src/stores/authStore.ts';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      authEmail: null,
      userUid: null,
      loading: true,
    });
  });

  it('starts with null auth', () => {
    const state = useAuthStore.getState();
    expect(state.authEmail).toBeNull();
    expect(state.userUid).toBeNull();
    expect(state.loading).toBe(true);
  });

  it('setAuth sets email and uid', () => {
    useAuthStore.getState().setAuth('test@example.com', 'uid-123');
    const state = useAuthStore.getState();
    expect(state.authEmail).toBe('test@example.com');
    expect(state.userUid).toBe('uid-123');
  });

  it('clearAuth resets email and uid', () => {
    useAuthStore.getState().setAuth('test@example.com', 'uid-123');
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.authEmail).toBeNull();
    expect(state.userUid).toBeNull();
  });

  it('logout resets email, uid, and loading (privacy consent lives in privacyStore since #281)', () => {
    useAuthStore.getState().setAuth('test@example.com', 'uid-123');
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.authEmail).toBeNull();
    expect(state.userUid).toBeNull();
    expect(state.loading).toBe(false);
  });
});
