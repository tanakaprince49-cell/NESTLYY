import { create } from 'zustand';
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

export const useProfileStore = create<ProfileState>()((set) => ({
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
}));
