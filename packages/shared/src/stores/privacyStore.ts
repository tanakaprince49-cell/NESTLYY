import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
  createLazyStorage,
  type StateStorage,
} from './middleware/persistMiddleware.ts';

interface PrivacyState {
  hasAcceptedPrivacy: boolean;
  setHasAcceptedPrivacy: (accepted: boolean) => void;
}

const { storage: privacyLazyStorage, setBackend: privacySetBackend } = createLazyStorage();
export const setPrivacyStorage = (storage: StateStorage): void => {
  privacySetBackend(storage);
};

// Privacy consent is a device-level acceptance — if the user taps Continue
// once, subsequent launches and sign-ins as any account on this device should
// skip PrivacyScreen. That rules out keeping the flag in authStore (which
// rides the per-account `{email}_` prefix applied by createUserScopedStorage)
// and rules out the logout-wipe behavior that preceded this split. Mobile
// bootstrap wires this store directly to the raw AsyncStorage backend and
// rehydrates it once at app startup, before onAuthStateChanged resolves.
// See #281.
export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      hasAcceptedPrivacy: false,
      setHasAcceptedPrivacy: (accepted) => set({ hasAcceptedPrivacy: accepted }),
    }),
    {
      name: 'privacy',
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => privacyLazyStorage),
      partialize: (state) => ({ hasAcceptedPrivacy: state.hasAcceptedPrivacy }),
    },
  ),
);
