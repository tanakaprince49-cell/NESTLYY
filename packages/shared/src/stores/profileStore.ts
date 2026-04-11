import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
  createLazyStorage,
  type StateStorage,
} from './middleware/persistMiddleware.ts';
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

// A stable lazy proxy so zustand's createJSONStorage call succeeds
// synchronously at store-creation time. The platform host (mobile bootstrap)
// calls setProfileStorage() later with the real user-scoped backend.
const { storage: profileLazyStorage, setBackend: profileSetBackend } = createLazyStorage();
export const setProfileStorage = (storage: StateStorage): void => {
  profileSetBackend(storage);
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
      storage: createJSONStorage(() => profileLazyStorage),
      partialize: (state) => ({
        profile: state.profile,
        trimester: state.trimester,
      }),
    },
  ),
);
