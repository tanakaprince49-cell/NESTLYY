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
      // Only persist the privacy flag. authEmail and userUid come from
      // Firebase Auth (which has its own AsyncStorage persistence via
      // getReactNativePersistence), and loading is transient.
      partialize: (state) => ({ hasAcceptedPrivacy: state.hasAcceptedPrivacy }),
    },
  ),
);
