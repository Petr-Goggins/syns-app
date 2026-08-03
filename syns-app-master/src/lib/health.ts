import type {
  ActivityLevel,
  BMICalculation,
  Gender,
  Goal,
  Profile,
} from '@/types';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUST: Record<Goal, number> = {
  lose: -500,
  gain: 400,
  maintain: 0,
};

export function calculateBMI(weightKg: number, heightCm: number): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function bmiCategory(bmi: number | null): string {
  if (bmi === null) return '—';
  if (bmi < 18.5) return 'Недостаточный вес';
  if (bmi < 25) return 'Норма';
  if (bmi < 30) return 'Избыточный вес';
  return 'Ожирение';
}

export function calculateBMR(
  gender: Gender,
  weightKg: number,
  heightCm: number,
  age: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'female' ? base - 161 : base + 5;
}

export function calculateDailyCalories(profile: Profile): BMICalculation {
  const { weight, height, age, gender, activity_level, goal } = profile;
  if (!weight || !height || !age) {
    return { bmi: null, category: '—', calories: null };
  }
  const bmr = calculateBMR(gender, weight, height, age);
  const tdee = bmr * ACTIVITY_FACTORS[activity_level];
  const calories = Math.round(tdee + GOAL_ADJUST[goal]);
  const bmi = calculateBMI(weight, height);
  return { bmi: bmi ? Math.round(bmi * 10) / 10 : null, category: bmiCategory(bmi), calories };
}

export interface GoalEstimate {
  months: number;
  days: number;
  totalDays: number;
  feasible: boolean;
  weeklyRateKg: number;
}

const HEALTHY_WEIGHT_LOSS_PER_WEEK = 0.5; // kg
const HEALTHY_WEIGHT_GAIN_PER_WEEK = 0.25; // kg

const BMI_UNDERWEIGHT = 18.5;
const BMI_NORMAL_MIN = 18.5;
const BMI_NORMAL_MAX = 24.9;

export function isTargetWeightHealthy(
  targetWeightKg: number,
  heightCm: number
): { healthy: boolean; targetBmi: number; message: string | null } {
  const targetBmi = calculateBMI(targetWeightKg, heightCm);
  if (targetBmi === null) return { healthy: true, targetBmi: 0, message: null };
  if (targetBmi < BMI_UNDERWEIGHT) {
    return {
      healthy: false,
      targetBmi,
      message: `Целевой ИМТ ${targetBmi.toFixed(1)} ниже нормы (${BMI_NORMAL_MIN}–${BMI_NORMAL_MAX}). Это может быть опасно для здоровья. Рекомендуем проконсультироваться с врачом.`,
    };
  }
  if (targetBmi > 30) {
    return {
      healthy: false,
      targetBmi,
      message: `Целевой ИМТ ${targetBmi.toFixed(1)} соответствует ожирению. Рекомендуем выбрать цель в пределах нормы (${BMI_NORMAL_MIN}–${BMI_NORMAL_MAX}).`,
    };
  }
  return { healthy: true, targetBmi, message: null };
}

export function estimateTimeToGoal(
  currentWeightKg: number,
  targetWeightKg: number,
  goal: Goal
): GoalEstimate | null {
  if (!currentWeightKg || !targetWeightKg) return null;
  if (goal === 'maintain') return null;

  const diff = Math.abs(currentWeightKg - targetWeightKg);
  if (diff < 0.1) {
    return { months: 0, days: 0, totalDays: 0, feasible: true, weeklyRateKg: 0 };
  }

  const weeklyRate = goal === 'lose' ? HEALTHY_WEIGHT_LOSS_PER_WEEK : HEALTHY_WEIGHT_GAIN_PER_WEEK;
  const weeks = diff / weeklyRate;
  const totalDays = Math.round(weeks * 7);
  const months = Math.floor(totalDays / 30);
  const days = totalDays - months * 30;

  const feasible = goal === 'lose' ? weeklyRate <= HEALTHY_WEIGHT_LOSS_PER_WEEK : weeklyRate <= HEALTHY_WEIGHT_GAIN_PER_WEEK;

  return { months, days, totalDays, feasible, weeklyRateKg: weeklyRate };
}

export function xpForNextLevel(level: number): number {
  return level * 100;
}

export function levelProgress(xp: number, level: number): number {
  const needed = xpForNextLevel(level);
  return Math.min(100, Math.round((xp / needed) * 100));
}

export const SKILL_LABELS = {
  strength: 'Сила',
  endurance: 'Выносливость',
  sleep_skill: 'Сон',
  nutrition: 'Питание',
} as const;

export const SKILL_META = [
  { key: 'strength' as const, label: 'Сила', color: 'var(--accent-blue)', icon: 'Dumbbell' },
  { key: 'endurance' as const, label: 'Выносливость', color: 'var(--accent-green)', icon: 'Heart' },
  { key: 'recovery' as const, label: 'Восстановление', color: 'var(--accent-gold)', icon: 'Moon' },
  { key: 'nutrition' as const, label: 'Питание', color: 'var(--accent-orange)', icon: 'Apple' },
];
