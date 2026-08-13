// Сопоставление упражнений и мышц для тепловой карты
export interface MuscleMapping {
  exercise: string[];
  muscles: string[];
}

export const EXERCISE_MUSCLE_MAP: Record<string, string[]> = {
  // Грудь
  'жим лёжа': ['chest', 'triceps', 'shoulders_front'],
  'bench press': ['chest', 'triceps', 'shoulders_front'],
  'жим гантелей': ['chest', 'triceps', 'shoulders_front'],
  'dumbbell press': ['chest', 'triceps', 'shoulders_front'],
  'отжимания': ['chest', 'triceps', 'shoulders_front', 'abs'],
  'push ups': ['chest', 'triceps', 'shoulders_front', 'abs'],
  'разводка': ['chest'],
  'flyes': ['chest'],
  
  // Ноги (квадрицепсы, бицепс бедра, ягодицы)
  'присед': ['quads', 'glutes', 'hamstrings'],
  'squat': ['quads', 'glutes', 'hamstrings'],
  'приседания': ['quads', 'glutes', 'hamstrings'],
  'выпады': ['quads', 'glutes', 'hamstrings'],
  'lunges': ['quads', 'glutes', 'hamstrings'],
  'жим ногами': ['quads', 'glutes'],
  'leg press': ['quads', 'glutes'],
  'румынская тяга': ['hamstrings', 'glutes', 'back'],
  'romanian deadlift': ['hamstrings', 'glutes', 'back'],
  
  // Спина
  'становая тяга': ['back', 'lats', 'hamstrings', 'glutes'],
  'deadlift': ['back', 'lats', 'hamstrings', 'glutes'],
  'подтягивания': ['back', 'lats', 'biceps'],
  'pull ups': ['back', 'lats', 'biceps'],
  'тяга гантели': ['back', 'lats', 'biceps'],
  'row': ['back', 'lats', 'biceps'],
  'тяга штанги': ['back', 'lats', 'traps'],
  'barbell row': ['back', 'lats', 'traps'],
  
  // Плечи
  'жим гантелей сидя': ['shoulders_front', 'triceps', 'traps'],
  'shoulder press': ['shoulders_front', 'triceps', 'traps'],
  'жим штанги': ['shoulders_front', 'triceps', 'traps'],
  'military press': ['shoulders_front', 'triceps', 'traps'],
  'махи гантелями': ['shoulders_side'],
  'lateral raise': ['shoulders_side'],
  'тяга к подбородку': ['shoulders_side', 'traps'],
  'upright row': ['shoulders_side', 'traps'],
  
  // Руки (бицепс, трицепс)
  'сгибание рук': ['biceps', 'forearms'],
  'bicep curl': ['biceps', 'forearms'],
  'подъём на бицепс': ['biceps', 'forearms'],
  'разгибание рук': ['triceps'],
  'tricep extension': ['triceps'],
  'французский жим': ['triceps'],
  'skull crusher': ['triceps'],
  'отжимания на брусьях': ['triceps', 'chest', 'shoulders_front'],
  'dips': ['triceps', 'chest', 'shoulders_front'],
  
  // Пресс
  'планка': ['abs'],
  'plank': ['abs'],
  'скручивания': ['abs'],
  'crunches': ['abs'],
  'велосипед': ['abs'],
  'bicycle': ['abs'],
  'подъём ног': ['abs'],
  'leg raise': ['abs'],
  'бёрпи': ['chest', 'shoulders_front', 'quads', 'abs'],
  'burpee': ['chest', 'shoulders_front', 'quads', 'abs'],
  
  // Икры
  'подъём на носки': ['calves'],
  'calf raise': ['calves'],
};

// Функция для расчёта интенсивности мышц на основе тренировки
export function calculateMuscleIntensity(
  exercises: Array<{ name: string; sets: number; reps: number; weight: number }>
): Record<string, number> {
  const muscleVolume: Record<string, number> = {};
  
  exercises.forEach(ex => {
    const muscles = EXERCISE_MUSCLE_MAP[ex.name.toLowerCase()] || [];
    const volume = ex.sets * ex.reps * (ex.weight || 0);
    
    muscles.forEach(muscle => {
      if (!muscleVolume[muscle]) {
        muscleVolume[muscle] = 0;
      }
      muscleVolume[muscle] += volume;
    });
  });
  
  // Нормализуем до процентов (0-100)
  const maxVolume = Math.max(...Object.values(muscleVolume), 1);
  const intensities: Record<string, number> = {};
  
  Object.entries(muscleVolume).forEach(([muscle, volume]) => {
    intensities[muscle] = Math.min(Math.round((volume / maxVolume) * 100), 100);
  });
  
  return intensities;
}

// Названия мышц на русском
export const MUSCLE_NAMES_RU: Record<string, string> = {
  chest: 'Грудь',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  shoulders_front: 'Плечи (передние)',
  shoulders_side: 'Плечи (средние)',
  abs: 'Пресс',
  quads: 'Квадрицепсы',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  back: 'Спина',
  lats: 'Широчайшие',
  traps: 'Трапеция',
  forearms: 'Предплечья',
  calves: 'Икры',
};
