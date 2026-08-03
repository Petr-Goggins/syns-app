import { create } from 'zustand';
import { useThemeStore, type ThemeName } from '@/store/themeStore';

interface SettingsState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  initTheme: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'dark-blue',
  setTheme: (theme: ThemeName) => {
    useThemeStore.getState().setTheme(theme);
    set({ theme });
  },
  initTheme: () => {
    useThemeStore.getState().initTheme();
    set({ theme: useThemeStore.getState().theme });
  },
}));
