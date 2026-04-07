import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>()((set) => ({
  authEmail: null,
  userUid: null,
  loading: true,
  hasAcceptedPrivacy: false,
  setAuth: (email, uid) => set({ authEmail: email, userUid: uid }),
  clearAuth: () => set({ authEmail: null, userUid: null }),
  setLoading: (loading) => set({ loading }),
  setHasAcceptedPrivacy: (accepted) => set({ hasAcceptedPrivacy: accepted }),
  logout: () => set({ authEmail: null, userUid: null, hasAcceptedPrivacy: false, loading: false }),
}));
