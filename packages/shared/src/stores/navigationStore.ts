import { create } from 'zustand';

type TabName = 'dashboard' | 'baby' | 'education' | 'tools' | 'ava' | 'admin' | 'settings' | 'village';

interface NavigationState {
  activeTab: TabName;
  activeToolCat: string;
  setActiveTab: (tab: TabName) => void;
  setActiveToolCat: (cat: string) => void;
}

export const useNavigationStore = create<NavigationState>()((set) => ({
  activeTab: 'dashboard',
  activeToolCat: 'all',
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveToolCat: (cat) => set({ activeToolCat: cat }),
}));
