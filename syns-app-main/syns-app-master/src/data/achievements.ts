export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_workout', icon: '🌱', title: 'Первый шаг', description: 'Запишите первую тренировку', unlocked: true },
  { id: 'first_plan', icon: '📋', title: 'Стратег', description: 'Сгенерируйте персональный план', unlocked: true },
  { id: 'first_meal', icon: '🍽️', title: 'Первый приём', description: 'Запишите первый продукт в дневник', unlocked: true },
  { id: 'water_master', icon: '💧', title: 'Водный мастер', description: '30 дней нормы воды', unlocked: true },
  { id: 'week_streak', icon: '🔥', title: 'Неделя огня', description: '7 дней подряд с тренировками', unlocked: true },
  { id: 'plan_week', icon: '✅', title: 'Идеальная неделя', description: 'Выполните все тренировки недели плана', unlocked: true },
  { id: 'level_5', icon: '⭐', title: 'Новичок+', description: 'Достигните 5 уровня', unlocked: true },
  { id: 'nutrition_5', icon: '🥗', title: '5 дней чистоты', description: '5 дней в рамках КБЖУ', unlocked: false },
  { id: 'plan_month', icon: '🏆', title: 'Месяц дисциплины', description: 'Завершите 4-недельный план', unlocked: false },
  { id: 'iron_will', icon: '💪', title: 'Железная воля', description: '30 тренировок за месяц', unlocked: false },
  { id: 'recovery_pro', icon: '😴', title: 'Мастер восстановления', description: '14 дней сна 8+ часов', unlocked: false },
  { id: 'level_10', icon: '👑', title: 'Чемпион', description: 'Достигните 10 уровня', unlocked: false },
  { id: 'century', icon: '💯', title: 'Сотня', description: '100 тренировок всего', unlocked: false },
  { id: 'ai_friend', icon: '🤖', title: 'Друг ИИ', description: '50 сообщений наставнику', unlocked: false },
];
