import { create } from 'zustand';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebase.ts';

interface AuthState {
  authEmail: string | null;
  userUid: string | null;
  loading: boolean;
  setAuth: (email: string, uid: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  signInWithGoogle: (idToken: string, accessToken?: string) => Promise<void>;
  logout: () => void;
}

// Note: no `persist` wrapper. authEmail / userUid are Firebase-owned —
// Firebase Auth keeps its own persistent session via
// getReactNativePersistence(AsyncStorage) on mobile and IndexedDB on web —
// and rehydrating them from a Zustand bucket would race the onAuthStateChanged
// listener and occasionally reinstate a stale identity. `loading` is transient
// UI state that must start `true` on every cold start so App.tsx waits for
// onAuthStateChanged to resolve before rendering. The device-level privacy
// consent flag used to live here but moved to privacyStore in #281 so it is
// no longer wiped on logout and is not keyed per-account. See issue #234 for
// the original context on why authEmail/userUid stay unpersisted.
export const useAuthStore = create<AuthState>()((set) => ({
  authEmail: null,
  userUid: null,
  loading: true,
  setAuth: (email, uid) => set({ authEmail: email, userUid: uid }),
  clearAuth: () => set({ authEmail: null, userUid: null }),
  setLoading: (loading) => set({ loading }),
  // Exchange a Google ID token for a Firebase credential. The existing
  // onAuthStateChanged listener in mobile App.tsx populates authEmail /
  // userUid, so this method intentionally does not mutate store state.
  signInWithGoogle: async (idToken, accessToken) => {
    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    await signInWithCredential(auth, credential);
  },
  logout: () => set({ authEmail: null, userUid: null, loading: false }),
}));
