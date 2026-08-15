/**
 * Расчёт индивидуальной нормы воды
 * @param weight - вес пользователя в кг
 * @param activityLevel - уровень активности
 * @returns норма воды в мл
 */
export const calculateWaterNorm = (weight: number, activityLevel: string): number => {
  const coefficients: Record<string, number> = {
    'sedentary': 1.0,      // Сидячий
    'light': 1.1,          // Легкая активность
    'moderate': 1.2,       // Средняя активность
    'active': 1.3,         // Высокая активность
    'very_active': 1.4,    // Очень высокая активность
  };
  
  const coef = coefficients[activityLevel] || 1.0;
  // Базовая формула: 30 мл на 1 кг веса × коэффициент активности
  return Math.round(weight * 30 * coef);
};

/**
 * Форматирование значения воды в читаемый формат
 * @param ml - количество в мл
 * @returns отформатированная строка
 */
export const formatWaterNorm = (ml: number): string => {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)} л`;
  }
  return `${ml} мл`;
};

/**
 * Получение коэффициента активности по русскому названию
 */
export const getActivityCoefficient = (activityLevel: string): number => {
  const coefficients: Record<string, number> = {
    'sedentary': 1.0,
    'light': 1.1,
    'moderate': 1.2,
    'active': 1.3,
    'very_active': 1.4,
  };
  return coefficients[activityLevel] || 1.0;
};
