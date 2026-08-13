// Система уровней и званий в Sync
export interface LevelInfo {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  description: string;
}

export const LEVELS: LevelInfo[] = [
  // Уровни 1-2: Новичок
  { level: 1, title: 'Новичок', minXP: 0, maxXP: 100, description: 'Первые шаги в мире фитнеса' },
  { level: 2, title: 'Новичок', minXP: 100, maxXP: 250, description: 'Начинаешь понимать основы' },
  
  // Уровни 3-5: Начинающий
  { level: 3, title: 'Начинающий', minXP: 250, maxXP: 450, description: 'Регулярные тренировки входят в привычку' },
  { level: 4, title: 'Начинающий', minXP: 450, maxXP: 700, description: 'Видны первые результаты' },
  { level: 5, title: 'Начинающий', minXP: 700, maxXP: 1000, description: 'Уверенно выполняешь базовые упражнения' },
  
  // Уровни 6-10: Средний
  { level: 6, title: 'Средний', minXP: 1000, maxXP: 1400, description: 'Стабильный прогресс и техника' },
  { level: 7, title: 'Средний', minXP: 1400, maxXP: 1900, description: 'Тренировки становятся образом жизни' },
  { level: 8, title: 'Средний', minXP: 1900, maxXP: 2500, description: 'Преодолевал первые плато' },
  { level: 9, title: 'Средний', minXP: 2500, maxXP: 3200, description: 'Значительный рост показателей' },
  { level: 10, title: 'Средний', minXP: 3200, maxXP: 4000, description: 'Половина пути к мастерству' },
  
  // Уровни 11-15: Продвинутый
  { level: 11, title: 'Продвинутый', minXP: 4000, maxXP: 5000, description: 'Опытный атлет с серьёзными результатами' },
  { level: 12, title: 'Продвинутый', minXP: 5000, maxXP: 6200, description: 'Техника отточена до автоматизма' },
  { level: 13, title: 'Продвинутый', minXP: 6200, maxXP: 7600, description: 'Можешь помогать новичкам советом' },
  { level: 14, title: 'Продвинутый', minXP: 7600, maxXP: 9200, description: 'Результаты выше среднего' },
  { level: 15, title: 'Продвинутый', minXP: 9200, maxXP: 11000, description: 'Готов к следующим вершинам' },
  
  // Уровни 16-20: Профи
  { level: 16, title: 'Профи', minXP: 11000, maxXP: 13500, description: 'Профессиональный подход к тренировкам' },
  { level: 17, title: 'Профи', minXP: 13500, maxXP: 16500, description: 'Впечатляющие физические кондиции' },
  { level: 18, title: 'Профи', minXP: 16500, maxXP: 20000, description: 'Знаешь своё тело идеально' },
  { level: 19, title: 'Профи', minXP: 20000, maxXP: 24000, description: 'Редкие достижения в зале' },
  { level: 20, title: 'Профи', minXP: 24000, maxXP: 28500, description: 'Признанный авторитет' },
  
  // Уровни 21-30: Мастер
  { level: 21, title: 'Мастер', minXP: 28500, maxXP: 34000, description: 'Мастерство в каждом движении' },
  { level: 22, title: 'Мастер', minXP: 34000, maxXP: 40000, description: 'Гармония силы и техники' },
  { level: 23, title: 'Мастер', minXP: 40000, maxXP: 47000, description: 'Вдохновляешь других' },
  { level: 24, title: 'Мастер', minXP: 47000, maxXP: 55000, description: 'Непрерывное совершенствование' },
  { level: 25, title: 'Мастер', minXP: 55000, maxXP: 64000, description: 'Четверть века опыта в XP' },
  { level: 26, title: 'Мастер', minXP: 64000, maxXP: 74000, description: 'Эталон для подражания' },
  { level: 27, title: 'Мастер', minXP: 74000, maxXP: 85000, description: 'Феноменальная форма' },
  { level: 28, title: 'Мастер', minXP: 85000, maxXP: 97000, description: 'Искусство в каждом повторе' },
  { level: 29, title: 'Мастер', minXP: 97000, maxXP: 110000, description: 'Почти достиг предела' },
  { level: 30, title: 'Мастер', minXP: 110000, maxXP: 125000, description: 'Вершина мастерства' },
  
  // Уровни 31-40: Легенда
  { level: 31, title: 'Легенда', minXP: 125000, maxXP: 145000, description: 'Легендарные достижения' },
  { level: 32, title: 'Легенда', minXP: 145000, maxXP: 167000, description: 'Имя известно в зале' },
  { level: 33, title: 'Легенда', minXP: 167000, maxXP: 192000, description: 'Рекорды становятся нормой' },
  { level: 34, title: 'Легенда', minXP: 192000, maxXP: 220000, description: 'Непревзойдённая выносливость' },
  { level: 35, title: 'Легенда', minXP: 220000, maxXP: 252000, description: 'Сила воли как у стали' },
  { level: 36, title: 'Легенда', minXP: 252000, maxXP: 288000, description: 'Трансформация завершена' },
  { level: 37, title: 'Легенда', minXP: 288000, maxXP: 328000, description: 'Живая легенда фитнеса' },
  { level: 38, title: 'Легенда', minXP: 328000, maxXP: 372000, description: 'Превосходишь ожидания' },
  { level: 39, title: 'Легенда', minXP: 372000, maxXP: 420000, description: 'Путь мастера почти пройден' },
  { level: 40, title: 'Легенда', minXP: 420000, maxXP: 475000, description: 'Легендарный статус подтверждён' },
  
  // Уровни 41-50: Абсолют
  { level: 41, title: 'Абсолют', minXP: 475000, maxXP: 540000, description: 'Абсолютная преданность делу' },
  { level: 42, title: 'Абсолют', minXP: 540000, maxXP: 615000, description: 'Абсолютная концентрация' },
  { level: 43, title: 'Абсолют', minXP: 615000, maxXP: 700000, description: 'Абсолютная дисциплина' },
  { level: 44, title: 'Абсолют', minXP: 700000, maxXP: 795000, description: 'Абсолютная мощь' },
  { level: 45, title: 'Абсолют', minXP: 795000, maxXP: 900000, description: 'Абсолютная выносливость' },
  { level: 46, title: 'Абсолют', minXP: 900000, maxXP: 1020000, description: 'Абсолютное превосходство' },
  { level: 47, title: 'Абсолют', minXP: 1020000, maxXP: 1150000, description: 'Абсолютный контроль' },
  { level: 48, title: 'Абсолют', minXP: 1150000, maxXP: 1300000, description: 'Абсолютная гармония' },
  { level: 49, title: 'Абсолют', minXP: 1300000, maxXP: 1470000, description: 'Абсолютное совершенство' },
  { level: 50, title: 'Абсолют', minXP: 1470000, maxXP: Infinity, description: 'Абсолют — высшая форма существования в фитнесе' },
];

export function getLevelByXP(xp: number): { level: number; title: string; progressInLevel: number } {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      const levelInfo = LEVELS[i];
      const range = levelInfo.maxXP - levelInfo.minXP;
      const progressInLevel = range === Infinity ? 100 : Math.min(((xp - levelInfo.minXP) / range) * 100, 100);
      return {
        level: levelInfo.level,
        title: levelInfo.title,
        progressInLevel: Math.round(progressInLevel),
      };
    }
  }
  return { level: 1, title: 'Новичок', progressInLevel: 0 };
}

export function getNextLevelXP(xp: number): number {
  const currentLevel = getLevelByXP(xp);
  const levelInfo = LEVELS.find(l => l.level === currentLevel.level);
  return levelInfo?.maxXP === Infinity ? 0 : (levelInfo?.maxXP || 100) - xp;
}

export function calculateXP(workoutCount: number, streak: number): number {
  // 10 XP за тренировку + 5 XP бонус за каждый день стрика
  return workoutCount * 10 + streak * 5;
}
