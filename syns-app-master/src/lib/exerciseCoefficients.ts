// Коэффициенты сложности упражнений для нормализации нагрузки

export interface ExerciseCoefficient {
  name: string;
  coefficient: number;
  category: 'base' | 'accessory' | 'isolation';
}

// Базовые упражнения (многосуставные, задействуют много мышц)
export const baseExercises: ExerciseCoefficient[] = [
  { name: 'присед', coefficient: 1.0, category: 'base' },
  { name: 'жим лёжа', coefficient: 1.0, category: 'base' },
  { name: 'становая тяга', coefficient: 1.0, category: 'base' },
  { name: 'жим стоя', coefficient: 1.0, category: 'base' },
  { name: 'тяга в наклоне', coefficient: 1.0, category: 'base' },
  { name: 'подтягивания', coefficient: 1.0, category: 'base' },
  { name: 'отжимания на брусьях', coefficient: 1.0, category: 'base' },
  { name: 'фронтальный присед', coefficient: 1.0, category: 'base' },
];

// Вспомогательные упражнения (задействуют несколько мышечных групп)
export const accessoryExercises: ExerciseCoefficient[] = [
  { name: 'жим гантелей', coefficient: 0.7, category: 'accessory' },
  { name: 'тяга гантели', coefficient: 0.7, category: 'accessory' },
  { name: 'румынская тяга', coefficient: 0.7, category: 'accessory' },
  { name: 'выпады', coefficient: 0.7, category: 'accessory' },
  { name: 'жим ногами', coefficient: 0.7, category: 'accessory' },
  { name: 'тяга верхнего блока', coefficient: 0.7, category: 'accessory' },
  { name: 'тяга горизонтального блока', coefficient: 0.7, category: 'accessory' },
  { name: 'армейский жим', coefficient: 0.7, category: 'accessory' },
  { name: 'разводка гантелей', coefficient: 0.7, category: 'accessory' },
];

// Изолирующие упражнения (одна мышечная группа)
export const isolationExercises: ExerciseCoefficient[] = [
  { name: 'бицепс', coefficient: 0.5, category: 'isolation' },
  { name: 'трицепс', coefficient: 0.5, category: 'isolation' },
  { name: 'разгибания', coefficient: 0.5, category: 'isolation' },
  { name: 'сгибания', coefficient: 0.5, category: 'isolation' },
  { name: 'подъём на бицепс', coefficient: 0.5, category: 'isolation' },
  { name: 'разгибание на трицепс', coefficient: 0.5, category: 'isolation' },
  { name: 'махи гантелями', coefficient: 0.5, category: 'isolation' },
  { name: 'сведение рук', coefficient: 0.5, category: 'isolation' },
  { name: 'разведение рук', coefficient: 0.5, category: 'isolation' },
  { name: 'подъём ног', coefficient: 0.5, category: 'isolation' },
  { name: 'скручивания', coefficient: 0.5, category: 'isolation' },
  { name: 'планка', coefficient: 0.5, category: 'isolation' },
  { name: 'икры', coefficient: 0.5, category: 'isolation' },
  { name: 'голень', coefficient: 0.5, category: 'isolation' },
];

// Объединённый список всех коэффициентов
export const allExerciseCoefficients: ExerciseCoefficient[] = [
  ...baseExercises,
  ...accessoryExercises,
  ...isolationExercises,
];

/**
 * Получить коэффициент сложности для упражнения по названию
 */
export function getExerciseCoefficient(exerciseName: string): number {
  const normalizedName = exerciseName.toLowerCase();
  
  // Ищем точное совпадение
  const exactMatch = allExerciseCoefficients.find(
    (ex) => normalizedName === ex.name.toLowerCase()
  );
  if (exactMatch) return exactMatch.coefficient;
  
  // Ищем частичное совпадение
  const partialMatch = allExerciseCoefficients.find(
    (ex) => normalizedName.includes(ex.name.toLowerCase())
  );
  if (partialMatch) return partialMatch.coefficient;
  
  // По умолчанию возвращаем 0.6 (среднее между accessory и isolation)
  return 0.6;
}

/**
 * Рассчитать объёмную нагрузку с учётом коэффициента сложности
 * Формула: вес × повторы × подходы × коэффициент
 */
export function calculateVolumeLoad(
  weight: number,
  reps: number,
  sets: number,
  exerciseName: string
): number {
  const coefficient = getExerciseCoefficient(exerciseName);
  return weight * reps * sets * coefficient;
}

/**
 * Рассчитать 1ПМ по формуле Epley
 * Формула: weight * (1 + reps / 30)
 */
export function calculateOneRM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

/**
 * Нормализовать нагрузку относительно 1ПМ
 * Возвращает процент от 1ПМ
 */
export function normalizeLoadByOneRM(
  volumeLoad: number,
  oneRM: number
): number {
  if (oneRM === 0) return 0;
  return Math.min(100, (volumeLoad / oneRM) * 100);
}

/**
 * Конвертировать RPE в процент от 1ПМ
 * RPE 1-3 → 30-40%, RPE 4-6 → 50-70%, RPE 7-9 → 80-95%, RPE 10 → 100%
 */
export function rpeToOneRMPercents(rpe: number): number {
  if (rpe <= 1) return 30;
  if (rpe <= 3) return 30 + ((rpe - 1) / 2) * 10; // 30-40%
  if (rpe <= 6) return 40 + ((rpe - 3) / 3) * 30; // 40-70%
  if (rpe <= 9) return 70 + ((rpe - 6) / 3) * 25; // 70-95%
  return 100;
}
