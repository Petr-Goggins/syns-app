// Конфигурация навигации для Sync App

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: string; // название иконки из lucide-react
}

// Полный список всех разделов приложения
export const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Главная', path: '/', icon: 'Home' },
  { id: 'workouts', label: 'Тренировки', path: '/workouts', icon: 'Dumbbell' },
  { id: 'nutrition', label: 'Питание', path: '/nutrition', icon: 'Utensils' },
  { id: 'reports', label: 'Статистика', path: '/reports', icon: 'BarChart2' },
  { id: 'profile', label: 'Профиль', path: '/profile', icon: 'User' },
  { id: 'long-path', label: 'Длинный путь', path: '/long-path', icon: 'Target' },
  { id: 'cycle', label: 'Биоритмы', path: '/cycle', icon: 'Calendar' },
  { id: 'coach', label: 'Наставник', path: '/coach', icon: 'Sparkles' },
  { id: 'achievements', label: 'Достижения', path: '/achievements', icon: 'Award' },
  { id: 'progress', label: 'Прогресс', path: '/progress', icon: 'TrendingUp' },
  { id: 'sleep', label: 'Сон', path: '/sleep', icon: 'Moon' },
  { id: 'settings', label: 'Настройки', path: '/settings', icon: 'Settings' },
];

// Навигация для мобильных устройств (первые 5 пунктов)
export const MOBILE_NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS.slice(0, 5);

// Навигация для десктопа (боковое меню - все пункты)
export const DESKTOP_NAV_ITEMS: NavItem[] = ALL_NAV_ITEMS;

// breakpoint для переключения между мобильной и десктоп навигацией
export const NAV_BREAKPOINT = 768; // px
