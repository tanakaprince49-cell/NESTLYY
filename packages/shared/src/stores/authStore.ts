import { create } from 'zustand';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase.ts';
import {
  persist,
  createJSONStorage,
  createLazyStorage,
  type StateStorage,
} from './middleware/persistMiddleware.ts';

interface AuthState {
  authEmail: string | null;
  userUid: string | null;
  loading: boolean;
  hasAcceptedPrivacy: boolean;
  setAuth: (email: string, uid: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHasAcceptedPrivacy: (accepted: boolean) => void;
  signInWithGoogle: (idToken: string, accessToken?: string) => Promise<void>;
  logout: () => void;
}

const { storage: authLazyStorage, setBackend: authSetBackend } = createLazyStorage();
export const setAuthStorage = (storage: StateStorage): void => {
  authSetBackend(storage);
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
      // Exchange a Google ID token for a Firebase credential. The existing
      // onAuthStateChanged listener in mobile App.tsx populates authEmail /
      // userUid, so this method intentionally does not mutate store state.
      signInWithGoogle: async (idToken, accessToken) => {
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        await signInWithCredential(auth, credential);
      },
      logout: () =>
        set({ authEmail: null, userUid: null, hasAcceptedPrivacy: false, loading: false }),
    }),
    {
      name: 'auth',
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => authLazyStorage),
      // Only persist the privacy flag. authEmail and userUid are owned by
      // Firebase Auth — it keeps its own persistent session via
      // getReactNativePersistence(AsyncStorage) on mobile and IndexedDB on
      // web — and rehydrating them from the Zustand bucket would race the
      // Firebase listener and occasionally reinstate a stale identity.
      // `loading` is transient UI state and should start true on every cold
      // start so App.tsx waits for onAuthStateChanged to resolve before
      // rendering. See issue #234 for the review context that pinned this
      // decision in writing.
      partialize: (state) => ({ hasAcceptedPrivacy: state.hasAcceptedPrivacy }),
    },
  ),
);
