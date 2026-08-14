// Маппинг упражнений на мышечные группы для тепловой карты

export interface MuscleMapping {
  exercisePattern: string;
  muscles: string[];
  primaryMuscle: string;
}

export const muscleMapping: MuscleMapping[] = [
  // Грудь
  { exercisePattern: 'жим лёжа', muscles: ['chest'], primaryMuscle: 'chest' },
  { exercisePattern: 'жим гантелей', muscles: ['chest'], primaryMuscle: 'chest' },
  { exercisePattern: 'отжимания', muscles: ['chest', 'triceps'], primaryMuscle: 'chest' },
  { exercisePattern: 'разводка', muscles: ['chest'], primaryMuscle: 'chest' },
  { exercisePattern: 'сведение рук', muscles: ['chest'], primaryMuscle: 'chest' },
  
  // Спина
  { exercisePattern: 'подтягивания', muscles: ['back', 'biceps'], primaryMuscle: 'back' },
  { exercisePattern: 'тяга в наклоне', muscles: ['back', 'lats'], primaryMuscle: 'back' },
  { exercisePattern: 'тяга верхнего блока', muscles: ['back', 'lats'], primaryMuscle: 'back' },
  { exercisePattern: 'тяга горизонтального блока', muscles: ['back'], primaryMuscle: 'back' },
  { exercisePattern: 'тяга гантели', muscles: ['back', 'lats'], primaryMuscle: 'back' },
  { exercisePattern: 'становая тяга', muscles: ['back', 'glutes', 'hamstrings'], primaryMuscle: 'back' },
  
  // Ноги (квадрицепсы)
  { exercisePattern: 'присед', muscles: ['quads', 'glutes'], primaryMuscle: 'quads' },
  { exercisePattern: 'жим ногами', muscles: ['quads'], primaryMuscle: 'quads' },
  { exercisePattern: 'выпады', muscles: ['quads', 'glutes'], primaryMuscle: 'quads' },
  { exercisePattern: 'фронтальный присед', muscles: ['quads'], primaryMuscle: 'quads' },
  
  // Ноги (бицепс бедра)
  { exercisePattern: 'румынская тяга', muscles: ['hamstrings', 'glutes'], primaryMuscle: 'hamstrings' },
  { exercisePattern: 'сгибание ног', muscles: ['hamstrings'], primaryMuscle: 'hamstrings' },
  
  // Ягодицы
  { exercisePattern: 'ягодичный мост', muscles: ['glutes'], primaryMuscle: 'glutes' },
  { exercisePattern: 'отведение ноги', muscles: ['glutes'], primaryMuscle: 'glutes' },
  
  // Плечи (дельты)
  { exercisePattern: 'жим стоя', muscles: ['shoulders'], primaryMuscle: 'shoulders' },
  { exercisePattern: 'армейский жим', muscles: ['shoulders'], primaryMuscle: 'shoulders' },
  { exercisePattern: 'махи гантелями', muscles: ['shoulders'], primaryMuscle: 'shoulders' },
  { exercisePattern: 'разведение рук', muscles: ['shoulders'], primaryMuscle: 'shoulders' },
  { exercisePattern: 'тяга к подбородку', muscles: ['shoulders', 'traps'], primaryMuscle: 'shoulders' },
  
  // Бицепс
  { exercisePattern: 'бицепс', muscles: ['biceps'], primaryMuscle: 'biceps' },
  { exercisePattern: 'подъём на бицепс', muscles: ['biceps'], primaryMuscle: 'biceps' },
  { exercisePattern: 'сгибание рук', muscles: ['biceps', 'forearms'], primaryMuscle: 'biceps' },
  { exercisePattern: 'молотки', muscles: ['biceps', 'forearms'], primaryMuscle: 'biceps' },
  
  // Трицепс
  { exercisePattern: 'трицепс', muscles: ['triceps'], primaryMuscle: 'triceps' },
  { exercisePattern: 'разгибание на трицепс', muscles: ['triceps'], primaryMuscle: 'triceps' },
  { exercisePattern: 'отжимания на брусьях', muscles: ['triceps', 'chest'], primaryMuscle: 'triceps' },
  { exercisePattern: 'французский жим', muscles: ['triceps'], primaryMuscle: 'triceps' },
  
  // Пресс
  { exercisePattern: 'пресс', muscles: ['abs'], primaryMuscle: 'abs' },
  { exercisePattern: 'скручивания', muscles: ['abs'], primaryMuscle: 'abs' },
  { exercisePattern: 'подъём ног', muscles: ['abs'], primaryMuscle: 'abs' },
  { exercisePattern: 'планка', muscles: ['abs', 'core'], primaryMuscle: 'abs' },
  { exercisePattern: 'велосипед', muscles: ['abs'], primaryMuscle: 'abs' },
  
  // Икры
  { exercisePattern: 'икры', muscles: ['calves'], primaryMuscle: 'calves' },
  { exercisePattern: 'голень', muscles: ['calves'], primaryMuscle: 'calves' },
  { exercisePattern: 'подъём на носки', muscles: ['calves'], primaryMuscle: 'calves' },
  
  // Предплечья
  { exercisePattern: 'предплечья', muscles: ['forearms'], primaryMuscle: 'forearms' },
  { exercisePattern: 'сгибание запястий', muscles: ['forearms'], primaryMuscle: 'forearms' },
  
  // Трапеция
  { exercisePattern: 'трапеция', muscles: ['traps'], primaryMuscle: 'traps' },
  { exercisePattern: 'шраги', muscles: ['traps'], primaryMuscle: 'traps' },
];

/**
 * Получить мышцы для упражнения по названию
 */
export function getMusclesForExercise(exerciseName: string): { muscles: string[]; primaryMuscle: string } {
  const normalizedName = exerciseName.toLowerCase();
  
  // Ищем совпадение по паттерну
  for (const mapping of muscleMapping) {
    if (normalizedName.includes(mapping.exercisePattern)) {
      return { muscles: mapping.muscles, primaryMuscle: mapping.primaryMuscle };
    }
  }
  
  // По умолчанию возвращаем пустой массив
  return { muscles: [], primaryMuscle: '' };
}

/**
 * Рассчитать нагрузку на мышцы за период тренировок
 */
export function calculateMuscleLoad(
  exercises: Array<{ name: string; weight: number; reps: number; sets: number }>,
  oneRMs: Record<string, number>
): Record<string, number> {
  const muscleLoad: Record<string, number> = {};
  
  for (const exercise of exercises) {
    const { muscles, primaryMuscle } = getMusclesForExercise(exercise.name);
    const volumeLoad = exercise.weight * exercise.reps * exercise.sets;
    
    for (const muscle of muscles) {
      const oneRM = oneRMs[primaryMuscle] || oneRMs[muscle] || 100;
      const loadPercent = Math.min(100, (volumeLoad / oneRM) * 100);
      
      // Добавляем нагрузку к мышце
      muscleLoad[muscle] = (muscleLoad[muscle] || 0) + loadPercent;
    }
  }
  
  // Нормализуем до 0-100
  const maxLoad = Math.max(...Object.values(muscleLoad), 1);
  const normalized: Record<string, number> = {};
  
  for (const [muscle, load] of Object.entries(muscleLoad)) {
    normalized[muscle] = Math.round((load / maxLoad) * 100);
  }
  
  return normalized;
}
