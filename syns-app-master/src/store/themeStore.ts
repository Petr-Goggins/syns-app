import { create } from 'zustand';

export type ThemeName = 'dark-blue' | 'light' | 'gray' | 'black';

export interface ThemeOption {
  id: ThemeName;
  label: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'dark-blue', label: 'Тёмно-синяя', description: 'Классическая тёмная тема' },
  { id: 'light', label: 'Светлая', description: 'Светлый фон, тёмный текст' },
  { id: 'gray', label: 'Серая', description: 'Нейтральные серые тона' },
  { id: 'black', label: 'Чёрная', description: 'Глубокий чёрный с фиолетовым акцентом' },
];

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  initTheme: () => void;
}

const STORAGE_KEY = 'sync-theme';

function applyTheme(theme: ThemeName) {
  // Используем класс вместо data-атрибута для совместимости с CSS
  document.documentElement.className = theme;
  document.documentElement.setAttribute('data-theme', theme);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark-blue',
  setTheme: (theme: ThemeName) => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
  },
  initTheme: () => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    const theme = saved ?? 'dark-blue';
    applyTheme(theme);
    set({ theme });
  },
}));
