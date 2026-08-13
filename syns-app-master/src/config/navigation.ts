// Конфигурация навигации для Sync
import { 
  Home, 
  Dumbbell, 
  Utensils, 
  BarChart2, 
  User, 
  Target, 
  Moon, 
  Trophy, 
  Settings,
  Heart,
  TrendingUp,
  Zap
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

// Полный список разделов для десктопного сайдбара
export const FULL_NAVIGATION: NavItem[] = [
  { path: '/', label: 'Главная', icon: Home },
  { path: '/workouts', label: 'Тренировки', icon: Dumbbell },
  { path: '/nutrition', label: 'Питание', icon: Utensils },
  { path: '/reports', label: 'Статистика', icon: BarChart2 },
  { path: '/profile', label: 'Профиль', icon: User },
  { path: '/long-path', label: 'Длинный путь', icon: Target },
  { path: '/cycle', label: 'Биоритмы', icon: Moon },
  { path: '/chat', label: 'Наставник', icon: Heart },
  { path: '/achievements', label: 'Достижения', icon: Trophy },
  { path: '/settings', label: 'Настройки', icon: Settings },
  { path: '/sleep', label: 'Сон', icon: Moon },
  { path: '/progress', label: 'Прогресс', icon: TrendingUp },
];

// Короткий список для мобильной навигации (первые 5 пунктов)
export const MOBILE_NAVIGATION: NavItem[] = FULL_NAVIGATION.slice(0, 5);

// Быстрые действия для виджетов
export const QUICK_ACTIONS = [
  { id: 'water', label: 'Вода', icon: Zap },
  { id: 'workout', label: 'Тренировка', icon: Dumbbell },
  { id: 'meal', label: 'Приём пищи', icon: Utensils },
];
