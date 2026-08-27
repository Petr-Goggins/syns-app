// ── Auth ──────────────────────────────────────────────────
export interface AppUser {
  id: string;
  email: string;
}

// ── Profile ───────────────────────────────────────────────
export type Gender = 'male' | 'female' | 'not_specified';
export type Goal = 'lose' | 'gain' | 'maintain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type CyclePhase = 'not_specified' | 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Profile {
  id: string;
  email: string | null;
  gender: Gender;
  age: number | null;
  height: number | null;
  weight: number | null;
  goal: Goal;
  activity_level: ActivityLevel;
  equipment: string[];
  cycle_phase: CyclePhase;
  fasting: string[];
  diet: string[];
  target_weight: number | null;
  start_weight: number | null;
  training_level: TrainingLevel;
  weak_muscles: string[];
  days_per_week: number;
  cycle_last_period: string | null;
  cycle_length: number;
  religion: string;
  updated_at: string | null;
}

// ── Water ─────────────────────────────────────────────────
export interface WaterLog {
  id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

// ── Old workouts (legacy tracking) ────────────────────────
export type LegacyWorkoutType = 'cardio' | 'strength' | 'flexibility' | 'sport' | 'yoga';
export type Intensity = 'low' | 'medium' | 'high';

export interface Workout {
  id: string;
  user_id: string;
  type: LegacyWorkoutType;
  duration: number;
  intensity: Intensity;
  created_at: string;
}

// ── Sleep ─────────────────────────────────────────────────
export interface SleepLog {
  id: string;
  user_id: string;
  hours: number;
  quality: number;
  log_date: string;
  created_at: string;
}

// ── Old meal logs (legacy) ────────────────────────────────
export type MealType = 'home' | 'prepared';

export interface MealLog {
  id: string;
  user_id: string;
  meal_type: MealType;
  in_macros: boolean;
  note: string | null;
  created_at: string;
}

// ── Chat ──────────────────────────────────────────────────
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

// ── Stats ─────────────────────────────────────────────────
export interface UserStats {
  id: string;
  user_id: string;
  level: number;
  xp: number;
  strength: number;
  endurance: number;
  recovery: number;
  nutrition: number;
  updated_at: string | null;
}

// ── Exercise library ──────────────────────────────────────
export type MuscleGroup = 'грудь' | 'спина' | 'ноги' | 'плечи' | 'руки' | 'пресс' | 'ягодицы' | 'кор';
export type Equipment = 'штанга' | 'гантели' | 'турник' | 'брусья' | 'резинка' | 'коврик' | 'без оборудования' | 'тренажёр';
export type Difficulty = 'новичок' | 'средний' | 'продвинутый';
export type WorkoutType = 'strength' | 'yoga' | 'cardio' | 'stretching' | 'functional';

export interface Exercise {
  id: number;
  name: string;
  description: string | null;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  video_url: string | null;
  image_url: string | null;
  safety_level: number;
  effectiveness_score: number;
  enjoyment_score: number;
  joint_friendly: boolean;
  variation_type: string;
  workout_type: string;
}

// ── Workout templates ─────────────────────────────────────
export interface TemplateExercise {
  exercise_id: number;
  sets: number;
  reps: number;
}

export interface TemplateDay {
  day: number;
  name: string;
  muscles: string[];
  exercises: TemplateExercise[];
}

export interface ProgressionRules {
  week2?: { sets_delta?: number; reps_delta?: number; weight_delta?: number };
  week3?: { sets_delta?: number; reps_delta?: number; weight_delta?: number };
  week4?: { sets_delta?: number; reps_delta?: number; weight_delta_pct?: number };
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  goal: string;
  difficulty_level: string;
  days_per_week: number;
  structure: {
    days: TemplateDay[];
    progression: ProgressionRules;
    rest_days_note: string;
  };
}

// ── User plans ────────────────────────────────────────────
export interface PlanExercise {
  exercise_id: number;
  exercise_name: string;
  muscle_group: string;
  equipment: string;
  sets: number;
  reps: number;
  weight: number;
  is_weak_focus: boolean;
}

export interface PlanDay {
  day: number;
  name: string;
  muscles: string[];
  is_rest: boolean;
  exercises: PlanExercise[];
}

export interface PlanWeek {
  week: number;
  days: PlanDay[];
}

export interface UserPlan {
  id: string;
  user_id: string;
  name: string;
  goal: string;
  weeks: number;
  days_per_week: number;
  workout_type: string;
  structure: {
    weeks: PlanWeek[];
    rest_days_note: string;
  };
  weak_muscles: string[];
  created_at: string;
}

// ── Exercise logs ─────────────────────────────────────────
export interface ExerciseLog {
  id: string;
  user_id: string;
  plan_id: string;
  exercise_id: number;
  week: number;
  day: number;
  sets: number;
  reps: number;
  weight: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

// ── Food products ─────────────────────────────────────────
export type FoodCategory = 'овощи' | 'фрукты' | 'мясо' | 'рыба' | 'крупы' | 'молочка' | 'хлеб' | 'сладости' | 'напитки' | 'готовые блюда' | 'прочее';

// ── Quotes ─────────────────────────────────────────────────
export interface Quote {
  id: number;
  text: string;
  author: string;
  category: string;
  tags: string[] | Record<string, unknown>;
  condition: Record<string, unknown>;
  priority: number;
}

export interface FoodProduct {
  id: number;
  name: string;
  brand: string;
  proteins: number;
  fats: number;
  carbs: number;
  calories: number;
  serving_size: number;
  category: string;
  barcode: string | null;
  is_global: boolean;
  source: string;
}

// ── Nutrition logs ────────────────────────────────────────
export type NutritionMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2';

export interface NutritionLog {
  id: string;
  user_id: string;
  product_id: number | null;
  custom_name: string | null;
  meal_type: NutritionMealType;
  grams: number;
  proteins: number;
  fats: number;
  carbs: number;
  calories: number;
  log_date: string;
  created_at: string;
}

// ── Weight logs ───────────────────────────────────────────
export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  log_date: string;
  created_at: string;
}

// ── Derived ───────────────────────────────────────────────
export interface BMICalculation {
  bmi: number | null;
  category: string;
  calories: number | null;
}

export interface DailyMacros {
  proteins: number;
  fats: number;
  carbs: number;
  calories: number;
}

export interface GoalEstimate {
  months: number;
  days: number;
  totalDays: number;
  feasible: boolean;
  weeklyRateKg: number;
}

// ── Coach data ────────────────────────────────────────────
export interface CoachData {
  id: string;
  user_id: string;
  main_goal: string | null;
  experience_duration: string | null;
  training_level: string | null;
  injuries: string[];
  health_restrictions: string | null;
  days_per_week: number;
  preferred_time: string | null;
  workout_duration: string | null;
  free_days: string[];
  exercise_preference: string | null;
  priority: string | null;
  include_cardio: string | null;
  sleep_hours: string | null;
  stress_level: string | null;
  diet_preference: string | null;
  focus_type: string | null;
  focus_muscle: string | null;
  focus_event: string | null;
  goal_type: string | null;
  goal_amount: number | null;
  goal_unit: string | null;
  goal_weeks: number | null;
  personal_goal: string | null;
  exercise_likes: string | null;
  exercise_dislikes: string | null;
  created_at: string;
  updated_at: string;
}

// ── User goals ────────────────────────────────────────────
export interface UserGoal {
  id: string;
  user_id: string;
  goal_type: string;
  goal_amount: number | null;
  goal_unit: string | null;
  target_weeks: number | null;
  start_value: number | null;
  current_value: number | null;
  target_value: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// ── Meal plan ─────────────────────────────────────────────
export interface MealPlanEntry {
  product_id: number | null;
  product_name: string;
  meal_type: NutritionMealType;
  grams: number;
  proteins: number;
  fats: number;
  carbs: number;
  calories: number;
}

export interface MealPlan {
  entries: MealPlanEntry[];
  totals: DailyMacros;
}

// ── Workout logs (training diary) ──────────────────────────
export interface WorkoutLog {
  id: string;
  user_id: string;
  log_date: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  intensity: number;
  note: string | null;
  created_at: string;
}

// ── Meal plan selections ───────────────────────────────────
export interface MealPlanSelection {
  id: string;
  user_id: string;
  category: string;
  plan_index: number;
  log_date: string;
  created_at: string;
}
