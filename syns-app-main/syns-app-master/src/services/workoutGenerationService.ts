interface UserProfile {
  level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  goal: string;
  equipment: string[];
  gender: 'male' | 'female';
  weak_muscles?: string[];
  injuries?: string[];
}

interface WorkoutDay {
  day: number;
  focus: string;
  exercises: Exercise[];
  warmup: Exercise[];
  cooldown: Exercise[];
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
  rir: number;
  equipment?: string;
}

interface WeeklyPlan {
  microcycle: 'loading' | 'deload';
  weekNumber: number;
  days: WorkoutDay[];
  totalVolume: number;
  estimatedDuration: number;
}

// Exercise database with equipment requirements and muscle groups
const EXERCISE_DATABASE = {
  // Push exercises
  'bench_press': { name: 'Жим лёжа', muscles: ['chest', 'triceps', 'shoulders'], equipment: ['barbell', 'gym'], type: 'push' },
  'pushups': { name: 'Отжимания', muscles: ['chest', 'triceps', 'shoulders'], equipment: ['bodyweight'], type: 'push' },
  'dumbbell_press': { name: 'Жим гантелей', muscles: ['chest', 'triceps', 'shoulders'], equipment: ['dumbbells'], type: 'push' },
  'overhead_press': { name: 'Жим стоя', muscles: ['shoulders', 'triceps'], equipment: ['barbell', 'dumbbells'], type: 'push' },
  'dips': { name: 'Отжимания на брусьях', muscles: ['chest', 'triceps', 'shoulders'], equipment: ['pullup_bar', 'gym'], type: 'push' },
  
  // Pull exercises
  'pullups': { name: 'Подтягивания', muscles: ['back', 'biceps'], equipment: ['pullup_bar', 'gym'], type: 'pull' },
  'rows': { name: 'Тяга штанги в наклоне', muscles: ['back', 'biceps'], equipment: ['barbell', 'dumbbells'], type: 'pull' },
  'lat_pulldown': { name: 'Тяга верхнего блока', muscles: ['back', 'biceps'], equipment: ['gym'], type: 'pull' },
  'face_pulls': { name: 'Тяга к лицу', muscles: ['shoulders', 'traps'], equipment: ['cable', 'resistance_bands'], type: 'pull' },
  
  // Squat exercises
  'squat': { name: 'Приседания со штангой', muscles: ['legs', 'glutes'], equipment: ['barbell', 'gym'], type: 'squat' },
  'goblet_squat': { name: 'Приседания с гантелей', muscles: ['legs', 'glutes'], equipment: ['dumbbells'], type: 'squat' },
  'lunges': { name: 'Выпады', muscles: ['legs', 'glutes'], equipment: ['bodyweight', 'dumbbells'], type: 'squat' },
  'leg_press': { name: 'Жим ногами', muscles: ['legs', 'glutes'], equipment: ['gym'], type: 'squat' },
  
  // Hinge exercises
  'deadlift': { name: 'Становая тяга', muscles: ['back', 'legs', 'glutes'], equipment: ['barbell', 'gym'], type: 'hinge' },
  'romanian_deadlift': { name: 'Румынская тяга', muscles: ['hamstrings', 'glutes'], equipment: ['barbell', 'dumbbells'], type: 'hinge' },
  'hip_thrust': { name: 'Ягодичный мост', muscles: ['glutes', 'hamstrings'], equipment: ['barbell', 'dumbbells', 'bodyweight'], type: 'hinge' },
  'good_mornings': { name: 'Доброе утро', muscles: ['hamstrings', 'lower_back'], equipment: ['barbell'], type: 'hinge' },
  
  // Isolation exercises
  'bicep_curl': { name: 'Сгибание рук', muscles: ['biceps'], equipment: ['dumbbells', 'barbell'], type: 'isolation' },
  'tricep_extension': { name: 'Разгибание рук', muscles: ['triceps'], equipment: ['dumbbells', 'cable'], type: 'isolation' },
  'lateral_raise': { name: 'Махи гантелями в стороны', muscles: ['shoulders'], equipment: ['dumbbells'], type: 'isolation' },
  'face_pulls_iso': { name: 'Тяга к лицу (изоляция)', muscles: ['rear_delts'], equipment: ['cable', 'resistance_bands'], type: 'isolation' },
  'calf_raises': { name: 'Подъём на носки', muscles: ['calves'], equipment: ['bodyweight', 'gym'], type: 'isolation' },
  'crunches': { name: 'Скручивания', muscles: ['abs'], equipment: ['bodyweight'], type: 'isolation' },
  'plank': { name: 'Планка', muscles: ['abs', 'core'], equipment: ['bodyweight'], type: 'isolation' },
};

// Warm-up exercises
const WARMUP_EXERCISES = [
  { name: 'Лёгкий кардио (5 мин)', duration: 5, type: 'cardio' },
  { name: 'Вращения руками', duration: 1, type: 'mobility' },
  { name: 'Вращения корпусом', duration: 1, type: 'mobility' },
  { name: 'Приседания без веса', duration: 2, type: 'mobility' },
  { name: 'Махи ногами', duration: 1, type: 'mobility' },
];

// Cool-down exercises
const COOLDOWN_EXERCISES = [
  { name: 'Растяжка грудных', duration: 2, type: 'stretch' },
  { name: 'Растяжка спины', duration: 2, type: 'stretch' },
  { name: 'Растяжка ног', duration: 3, type: 'stretch' },
  { name: 'Растяжка плеч', duration: 2, type: 'stretch' },
  { name: 'Глубокое дыхание', duration: 1, type: 'breathing' },
];

// Training frequency based on level
const FREQUENCY_BY_LEVEL = {
  beginner: 3,
  intermediate: 4,
  advanced: 5,
  professional: 6,
};

// Volume dose (working sets) by level
const VOLUME_DOSE_BY_LEVEL = {
  beginner: { min: 10, max: 12 },
  intermediate: { min: 12, max: 15 },
  advanced: { min: 15, max: 20 },
  professional: { min: 18, max: 22 },
};

// RIR (Reps in Reserve) by level
const RIR_BY_LEVEL = {
  beginner: { min: 3, max: 4 },
  intermediate: { min: 2, max: 3 },
  advanced: { min: 1, max: 2 },
  professional: { min: 0, max: 1 },
};

// Exercise patterns for different splits
const SPLIT_PATTERNS = {
  3: [
    { day: 1, focus: 'full_body', pattern: ['squat', 'push', 'pull', 'hinge'] },
    { day: 2, focus: 'rest', pattern: [] },
    { day: 3, focus: 'full_body', pattern: ['push', 'pull', 'squat', 'hinge'] },
    { day: 4, focus: 'rest', pattern: [] },
    { day: 5, focus: 'full_body', pattern: ['hinge', 'squat', 'push', 'pull'] },
    { day: 6, focus: 'rest', pattern: [] },
    { day: 7, focus: 'rest', pattern: [] },
  ],
  4: [
    { day: 1, focus: 'upper', pattern: ['push', 'pull', 'push', 'pull'] },
    { day: 2, focus: 'lower', pattern: ['squat', 'hinge', 'squat', 'hinge'] },
    { day: 3, focus: 'rest', pattern: [] },
    { day: 4, focus: 'upper', pattern: ['pull', 'push', 'pull', 'push'] },
    { day: 5, focus: 'lower', pattern: ['hinge', 'squat', 'hinge', 'squat'] },
    { day: 6, focus: 'rest', pattern: [] },
    { day: 7, focus: 'rest', pattern: [] },
  ],
  5: [
    { day: 1, focus: 'chest_triceps', pattern: ['push', 'push', 'isolation', 'isolation'] },
    { day: 2, focus: 'back_biceps', pattern: ['pull', 'pull', 'isolation', 'isolation'] },
    { day: 3, focus: 'legs', pattern: ['squat', 'hinge', 'squat', 'isolation'] },
    { day: 4, focus: 'shoulders', pattern: ['push', 'isolation', 'isolation', 'pull'] },
    { day: 5, focus: 'legs_upper', pattern: ['hinge', 'squat', 'isolation', 'isolation'] },
    { day: 6, focus: 'rest', pattern: [] },
    { day: 7, focus: 'rest', pattern: [] },
  ],
  6: [
    { day: 1, focus: 'chest', pattern: ['push', 'push', 'isolation', 'isolation'] },
    { day: 2, focus: 'back', pattern: ['pull', 'pull', 'isolation', 'isolation'] },
    { day: 3, focus: 'legs', pattern: ['squat', 'hinge', 'isolation', 'isolation'] },
    { day: 4, focus: 'shoulders', pattern: ['push', 'isolation', 'isolation', 'pull'] },
    { day: 5, focus: 'arms', pattern: ['isolation', 'isolation', 'isolation', 'isolation'] },
    { day: 6, focus: 'legs_upper', pattern: ['hinge', 'squat', 'isolation', 'isolation'] },
    { day: 7, focus: 'rest', pattern: [] },
  ],
};

export function generateWorkoutPlan(
  profile: UserProfile,
  weekNumber: number = 1,
  apiKey?: string
): WeeklyPlan {
  // Principle 1: Linear micro-periodization 3:1
  const microcycle = (weekNumber % 4 === 0) ? 'deload' : 'loading';
  
  // Principle 2: Frequency split by training level
  const frequency = FREQUENCY_BY_LEVEL[profile.level];
  const pattern = SPLIT_PATTERNS[frequency as keyof typeof SPLIT_PATTERNS] || SPLIT_PATTERNS[3];
  
  // Principle 5: Volume dose by level
  const volumeRange = VOLUME_DOSE_BY_LEVEL[profile.level];
  const targetVolume = Math.floor((volumeRange.min + volumeRange.max) / 2);
  
  // Principle 7: RIR by level
  const rirRange = RIR_BY_LEVEL[profile.level];
  const targetRIR = Math.floor((rirRange.min + rirRange.max) / 2);
  
  // Adjust for deload week
  const volumeMultiplier = microcycle === 'deload' ? 0.6 : 1.0;
  const adjustedVolume = Math.floor(targetVolume * volumeMultiplier);
  
  const days: WorkoutDay[] = [];
  
  pattern.forEach((dayPattern) => {
    if (dayPattern.focus === 'rest') {
      days.push({
        day: dayPattern.day,
        focus: 'rest',
        exercises: [],
        warmup: [],
        cooldown: [],
      });
      return;
    }
    
    // Principle 3: Alternate planes and vectors
    const exercises = generateExercisesForPattern(
      dayPattern.pattern,
      profile,
      adjustedVolume,
      targetRIR,
      microcycle
    );
    
    // Principle 11: Minimal warm-up
    const warmup = generateWarmup(dayPattern.focus);
    
    // Principle 11: Mandatory cool-down
    const cooldown = generateCooldown();
    
    days.push({
      day: dayPattern.day,
      focus: dayPattern.focus,
      exercises,
      warmup,
      cooldown,
    });
  });
  
  // Calculate total volume
  const totalVolume = days.reduce((sum, day) => {
    return sum + day.exercises.reduce((daySum, ex) => daySum + ex.sets, 0);
  }, 0);
  
  // Principle 14: Practicality and timing (45-75 minutes)
  const estimatedDuration = calculateEstimatedDuration(days);
  
  return {
    microcycle,
    weekNumber,
    days,
    totalVolume,
    estimatedDuration,
  };
}

function generateExercisesForPattern(
  pattern: string[],
  profile: UserProfile,
  targetVolume: number,
  targetRIR: number,
  microcycle: 'loading' | 'deload'
): Exercise[] {
  const exercises: Exercise[] = [];
  const volumePerExercise = Math.ceil(targetVolume / pattern.length);
  
  pattern.forEach((movementType) => {
    // Principle 9: Adapt exercises to available equipment
    const availableExercises = getExercisesByType(movementType, profile.equipment);
    
    if (availableExercises.length === 0) return;
    
    // Select exercise (prioritize compound movements - Principle 6)
    const selectedExercise = selectCompoundExercise(availableExercises, profile);
    
    // Principle 4: Double progression (fixed rep range)
    const reps = getRepRange(profile.level, microcycle);
    
    // Principle 7: Autoregulation via RIR
    const rir = microcycle === 'deload' ? targetRIR + 1 : targetRIR;
    
    // Principle 10: Consider menstrual cycle for women
    const adjustedSets = adjustForCycle(profile, volumePerExercise, microcycle);
    
    exercises.push({
      name: selectedExercise.name,
      sets: adjustedSets,
      reps,
      rest: getRestPeriod(movementType, profile.level),
      rir,
      equipment: selectedExercise.equipment?.[0],
    });
  });
  
  return exercises;
}

function getExercisesByType(type: string, equipment: string[]) {
  return Object.values(EXERCISE_DATABASE).filter(ex => {
    if (ex.type !== type && ex.type !== 'isolation') return false;
    return ex.equipment.some(eq => equipment.includes(eq));
  });
}

function selectCompoundExercise(exercises: any[], profile: UserProfile) {
  // Principle 6: Prioritize compound multi-joint movements (70% of program)
  const compoundExercises = exercises.filter(ex => ex.type !== 'isolation');
  
  if (compoundExercises.length > 0 && Math.random() < 0.7) {
    // If user has weak muscles, prioritize exercises targeting them
    if (profile.weak_muscles && profile.weak_muscles.length > 0) {
      const targeted = compoundExercises.find(ex =>
        ex.muscles.some((m: string) => profile.weak_muscles!.includes(m))
      );
      if (targeted) return targeted;
    }
    
    // Avoid exercises that target injured areas
    if (profile.injuries && profile.injuries.length > 0) {
      const safe = compoundExercises.find(ex =>
        !ex.muscles.some((m: string) => profile.injuries!.includes(m))
      );
      if (safe) return safe;
    }
    
    return compoundExercises[Math.floor(Math.random() * compoundExercises.length)];
  }
  
  return exercises[Math.floor(Math.random() * exercises.length)];
}

function getRepRange(level: string, microcycle: 'loading' | 'deload'): string {
  const ranges = {
    beginner: { loading: '8-12', deload: '10-15' },
    intermediate: { loading: '6-10', deload: '8-12' },
    advanced: { loading: '5-8', deload: '6-10' },
    professional: { loading: '3-6', deload: '4-8' },
  };
  
  return ranges[level as keyof typeof ranges]?.[microcycle] || '8-12';
}

function getRestPeriod(movementType: string, level: string): number {
  const baseRest = {
    squat: 120,
    hinge: 150,
    push: 90,
    pull: 90,
    isolation: 60,
  };
  
  const levelMultiplier = {
    beginner: 0.8,
    intermediate: 1.0,
    advanced: 1.2,
    professional: 1.5,
  };
  
  return Math.floor((baseRest[movementType as keyof typeof baseRest] || 90) * 
         (levelMultiplier[level as keyof typeof levelMultiplier] || 1));
}

function adjustForCycle(profile: UserProfile, sets: number, microcycle: 'loading' | 'deload'): number {
  // Principle 10: Consider menstrual cycle phases for women
  if (profile.gender === 'female' && microcycle === 'loading') {
    // Follicular phase → high intensity (no reduction)
    // Luteal phase → reduce intensity (would need cycle tracking data)
    // For now, we'll assume follicular phase
    return sets;
  }
  
  return sets;
}

function generateWarmup(focus: string): Exercise[] {
  return WARMUP_EXERCISES.map((ex: any) => ({
    name: ex.name,
    sets: 1,
    reps: `${ex.duration} мин`,
    rest: 0,
    rir: 0,
  }));
}

function generateCooldown(): Exercise[] {
  return COOLDOWN_EXERCISES.map((ex: any) => ({
    name: ex.name,
    sets: 1,
    reps: `${ex.duration} мин`,
    rest: 0,
    rir: 0,
  }));
}

function calculateEstimatedDuration(days: WorkoutDay[]): number {
  let totalMinutes = 0;
  
  days.forEach(day => {
    if (day.focus === 'rest') return;
    
    // Warm-up: ~8 minutes
    totalMinutes += 8;
    
    // Exercises: sets × (reps + rest)
    day.exercises.forEach(ex => {
      const avgReps = parseInt(ex.reps.split('-')[0]) || 10;
      const setTime = ex.sets * (avgReps * 3 + ex.rest);
      totalMinutes += setTime / 60;
    });
    
    // Cool-down: ~7 minutes
    totalMinutes += 7;
  });
  
  // Principle 14: Should be 45-75 minutes per workout
  return Math.round(totalMinutes);
}

// Principle 8: Balance push-pull ratios
export function checkPushPullBalance(plan: WeeklyPlan): {
  pushCount: number;
  pullCount: number;
  horizontalRatio: number;
  verticalRatio: number;
  balanced: boolean;
} {
  let pushCount = 0;
  let pullCount = 0;
  let horizontalPush = 0;
  let horizontalPull = 0;
  let verticalPush = 0;
  let verticalPull = 0;
  
  plan.days.forEach(day => {
    day.exercises.forEach(ex => {
      const exerciseData = Object.values(EXERCISE_DATABASE).find(e => e.name === ex.name);
      if (!exerciseData) return;
      
      if (exerciseData.type === 'push') {
        pushCount += ex.sets;
        if (['bench_press', 'pushups', 'dumbbell_press'].includes(exerciseData.name)) {
          horizontalPush += ex.sets;
        } else {
          verticalPush += ex.sets;
        }
      } else if (exerciseData.type === 'pull') {
        pullCount += ex.sets;
        if (['rows', 'face_pulls'].includes(exerciseData.name)) {
          horizontalPull += ex.sets;
        } else {
          verticalPull += ex.sets;
        }
      }
    });
  });
  
  const horizontalRatio = horizontalPull > 0 ? horizontalPush / horizontalPull : 0;
  const verticalRatio = verticalPull > 0 ? verticalPush / verticalPull : 0;
  
  // Principle 8: Balance push-pull 1:1 horizontally, 1:1.5 vertically
  const horizontalBalanced = horizontalRatio >= 0.8 && horizontalRatio <= 1.2;
  const verticalBalanced = verticalRatio >= 0.8 && verticalRatio <= 1.8;
  
  return {
    pushCount,
    pullCount,
    horizontalRatio,
    verticalRatio,
    balanced: horizontalBalanced && verticalBalanced,
  };
}

export function getWorkoutPrinciples(): string[] {
  return [
    '1. Линейная микроциклизация 3:1 — 3 нагрузочные недели, 1 разгрузочная',
    '2. Частотный сплит по уровню подготовки — новички 3 дня, средние 4, продвинутые 5–6',
    '3. Чередование плоскостей и векторов нагрузки — жим → тяга → присед → шарнир',
    '4. Двойная прогрессия — фиксированный диапазон повторений, увеличение веса при достижении верхней границы',
    '5. Объёмная доза по количеству рабочих подходов — 10–12 для новичков, 15–20 для продвинутых',
    '6. Приоритет базовых многосуставных движений — 70% программы',
    '7. Авторегуляция через RIR — новички RIR 3–4, средние RIR 2–3, продвинутые RIR 1–2',
    '8. Баланс тяга–жим 1:1 по горизонтали, 1:1.5 по вертикали',
    '9. Адаптация упражнений под инвентарь — банк замен',
    '10. Учёт фаз менструального цикла (для женщин) — фолликулярная фаза → высокая интенсивность, лютеиновая → снижение',
    '11. Минимальная разминка и обязательная заминка',
    '12. Протокол восстановления — сон, питание, дни отдыха',
    '13. Правило "от простого к сложному" — новички с собственным весом',
    '14. Практичность и тайминг — 45–75 минут тренировки',
  ];
}
