import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from './middleware/persistMiddleware.ts';
import { Trimester } from '../types.ts';
import type { PregnancyProfile } from '../types.ts';

interface ProfileState {
  profile: PregnancyProfile | null;
  trimester: Trimester;
  isEditingProfile: boolean;
  setProfile: (profile: PregnancyProfile | null) => void;
  updateProfile: (updates: Partial<PregnancyProfile>) => void;
  setTrimester: (trimester: Trimester) => void;
  setIsEditingProfile: (editing: boolean) => void;
}

// Injected by the platform at bootstrap time. Shared cannot depend on
// AsyncStorage or localStorage directly, so the host (mobile or web) calls
// setProfileStorage once at startup with a user-scoped StateStorage.
let profileStorage: StateStorage | null = null;
export const setProfileStorage = (storage: StateStorage): void => {
  profileStorage = storage;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      trimester: Trimester.FIRST,
      isEditingProfile: false,
      setProfile: (profile) => set({ profile }),
      updateProfile: (updates) =>
        set((state) =>
          state.profile ? { profile: { ...state.profile, ...updates } } : state,
        ),
      setTrimester: (trimester) => set({ trimester }),
      setIsEditingProfile: (editing) => set({ isEditingProfile: editing }),
    }),
    {
      name: 'profile',
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => {
        if (!profileStorage) {
          throw new Error(
            'profileStorage not initialized. Call setProfileStorage() at bootstrap.',
          );
        }
        return profileStorage;
      }),
      partialize: (state) => ({
        profile: state.profile,
        trimester: state.trimester,
      }),
    },
  ),
);
