import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from './middleware/persistMiddleware.ts';

interface AuthState {
  authEmail: string | null;
  userUid: string | null;
  loading: boolean;
  hasAcceptedPrivacy: boolean;
  setAuth: (email: string, uid: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHasAcceptedPrivacy: (accepted: boolean) => void;
  logout: () => void;
}

let authStorage: StateStorage | null = null;
export const setAuthStorage = (storage: StateStorage): void => {
  authStorage = storage;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authEmail: null,
      userUid: null,
      loading: true,
      hasAcceptedPrivacy: false,
      setAuth: (email, uid) => set({ authEmail: email, userUid: uid }),
      clearAuth: () => set({ authEmail: null, userUid: null }),
      setLoading: (loading) => set({ loading }),
      setHasAcceptedPrivacy: (accepted) => set({ hasAcceptedPrivacy: accepted }),
      logout: () =>
        set({ authEmail: null, userUid: null, hasAcceptedPrivacy: false, loading: false }),
    }),
    {
      name: 'auth',
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => {
        if (!authStorage) {
          throw new Error(
            'authStorage not initialized. Call setAuthStorage() at bootstrap.',
          );
        }
        return authStorage;
      }),
      // Only persist the privacy flag. authEmail and userUid come from
      // Firebase Auth (which has its own AsyncStorage persistence via
      // getReactNativePersistence), and loading is transient.
      partialize: (state) => ({ hasAcceptedPrivacy: state.hasAcceptedPrivacy }),
    },
  ),
);
