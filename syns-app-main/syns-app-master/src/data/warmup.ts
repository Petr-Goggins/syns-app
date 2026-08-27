// Упражнения для разминки и заминки

export interface WarmupExercise {
  id: string;
  name: string;
  description: string;
  duration?: string; // например, "30 секунд" или "1 минута"
  reps?: string; // например, "10-12 раз"
  category: 'warmup' | 'cooldown';
  intensity: 'low' | 'medium';
}

// Упражнения для разминки (5-7 минут)
export const warmupExercises: WarmupExercise[] = [
  {
    id: 'w1',
    name: 'Лёгкое кардио',
    description: 'Ходьба на месте, прыжки на месте или бег трусцой',
    duration: '2-3 минуты',
    category: 'warmup',
    intensity: 'low',
  },
  {
    id: 'w2',
    name: 'Вращения головой',
    description: 'Медленные вращения головой по кругу в обе стороны',
    duration: '30 секунд',
    category: 'warmup',
    intensity: 'low',
  },
  {
    id: 'w3',
    name: 'Вращения плечами',
    description: 'Поднимайте плечи вверх и вращайте ими назад и вперёд',
    reps: '10-12 раз в каждую сторону',
    category: 'warmup',
    intensity: 'low',
  },
  {
    id: 'w4',
    name: 'Махи руками',
    description: 'Энергичные махи прямыми руками вперёд-назад',
    reps: '10-15 раз',
    category: 'warmup',
    intensity: 'low',
  },
  {
    id: 'w5',
    name: 'Вращения кистями',
    description: 'Вращение кистей рук в обе стороны',
    duration: '30 секунд',
    category: 'warmup',
    intensity: 'low',
  },
  {
    id: 'w6',
    name: 'Наклоны корпуса',
    description: 'Наклоны вперёд, вправо, влево с прямой спиной',
    reps: '8-10 раз в каждую сторону',
    category: 'warmup',
    intensity: 'low',
  },
  {
    id: 'w7',
    name: 'Вращения тазом',
    description: 'Круговые движения тазом в обе стороны',
    reps: '10 раз в каждую сторону',
    category: 'warmup',
    intensity: 'low',
  },
  {
    id: 'w8',
    name: 'Приседания без веса',
    description: 'Классические приседания с прямой спиной',
    reps: '10-15 раз',
    category: 'warmup',
    intensity: 'medium',
  },
  {
    id: 'w9',
    name: 'Вращения коленями',
    description: 'Поставьте ноги вместе, слегка присядте и вращайте коленями',
    duration: '30 секунд',
    category: 'warmup',
    intensity: 'low',
  },
  {
    id: 'w10',
    name: 'Вращения голеностопом',
    description: 'Вращение стоп в обе стороны',
    duration: '30 секунд на каждую ногу',
    category: 'warmup',
    intensity: 'low',
  },
];

// Упражнения для заминки (5-10 минут)
export const cooldownExercises: WarmupExercise[] = [
  {
    id: 'c1',
    name: 'Растяжка квадрицепсов',
    description: 'Стоя на одной ноге, подтяните пятку другой ноги к ягодице',
    duration: '30 секунд на каждую ногу',
    category: 'cooldown',
    intensity: 'low',
  },
  {
    id: 'c2',
    name: 'Растяжка hamstring',
    description: 'Наклон вперёд с прямыми ногами, тянитесь к носкам',
    duration: '30-45 секунд',
    category: 'cooldown',
    intensity: 'low',
  },
  {
    id: 'c3',
    name: 'Растяжка грудных мышц',
    description: 'Заведите руки за спину и соедините пальцы, раскройте грудь',
    duration: '30 секунд',
    category: 'cooldown',
    intensity: 'low',
  },
  {
    id: 'c4',
    name: 'Растяжка плеч',
    description: 'Прижмите прямую руку к груди другой рукой',
    duration: '30 секунд на каждую руку',
    category: 'cooldown',
    intensity: 'low',
  },
  {
    id: 'c5',
    name: 'Растяжка трицепса',
    description: 'Заведите руку за голову, надавите другой рукой на локоть',
    duration: '30 секунд на каждую руку',
    category: 'cooldown',
    intensity: 'low',
  },
  {
    id: 'c6',
    name: 'Растяжка спины (поза ребёнка)',
    description: 'Сядьте на пятки, наклонитесь вперёд с вытянутыми руками',
    duration: '45-60 секунд',
    category: 'cooldown',
    intensity: 'low',
  },
  {
    id: 'c7',
    name: 'Растяжка шеи',
    description: 'Медленно наклоняйте голову в стороны, вперёд и назад',
    duration: '30 секунд в каждую сторону',
    category: 'cooldown',
    intensity: 'low',
  },
  {
    id: 'c8',
    name: 'Глубокое дыхание',
    description: 'Медленные глубокие вдохи и выдохи для восстановления пульса',
    duration: '1-2 минуты',
    category: 'cooldown',
    intensity: 'low',
  },
];

// Техника безопасности для новичков
export const safetyGuidelines = [
  {
    title: 'Начинайте с малых весов',
    description: 'Сначала отработайте технику без веса или с минимальным отягощением. Прогрессируйте постепенно.',
  },
  {
    title: 'Следите за дыханием',
    description: 'Выдох на усилии, вдох при возврате в исходное положение. Не задерживайте дыхание.',
  },
  {
    title: 'Если чувствуете боль — остановитесь',
    description: 'Дискомфорт допустим, острая боль — нет. Прекратите упражнение при появлении боли.',
  },
  {
    title: 'Пейте воду во время тренировки',
    description: 'Небольшие глотки между подходами помогут поддерживать водный баланс.',
  },
  {
    title: 'Разминайтесь перед тренировкой',
    description: 'Никогда не пропускайте разминку — она подготавливает мышцы и суставы к нагрузке.',
  },
  {
    title: 'Делайте заминку после тренировки',
    description: 'Растяжка помогает мышцам восстановиться и снижает крепатуру.',
  },
  {
    title: 'Слушайте своё тело',
    description: 'Если вы устали или плохо себя чувствуете, снизьте интенсивность или возьмите дополнительный день отдыха.',
  },
];

// Функция для получения случайных упражнений разминки
export function getRandomWarmup(count: number = 5): WarmupExercise[] {
  const shuffled = [...warmupExercises].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Функция для получения случайных упражнений заминки
export function getRandomCooldown(count: number = 4): WarmupExercise[] {
  const shuffled = [...cooldownExercises].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Получить все упражнения разминки
export function getAllWarmupExercises(): WarmupExercise[] {
  return warmupExercises;
}

// Получить все упражнения заминки
export function getAllCooldownExercises(): WarmupExercise[] {
  return cooldownExercises;
}
