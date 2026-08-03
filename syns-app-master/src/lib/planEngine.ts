import type {
  CoachData,
  Exercise,
  PlanDay,
  PlanExercise,
  PlanWeek,
  Profile,
  UserPlan,
  WorkoutTemplate,
} from '@/types';
import type { CyclePhase } from '@/lib/cycle';
import type { SupabaseClient } from '@supabase/supabase-js';

export type WorkoutType = 'strength' | 'yoga' | 'cardio' | 'stretching' | 'functional';

// ── Equipment mapping ─────────────────────────────────────
const PROFILE_TO_EX_EQUIPMENT: Record<string, string[]> = {
  dumbbells: ['гантели'],
  bands: ['резинка'],
  pullup_bar: ['турник'],
  mat: ['без оборудования', 'коврик'],
  gym: ['штанга', 'тренажёр', 'брусья', 'гантели', 'турник'],
};

const EQUIPMENT_FALLBACKS: Record<string, string[]> = {
  'штанга': ['гантели', 'без оборудования', 'резинка'],
  'гантели': ['без оборудования', 'резинка'],
  'турник': ['без оборудования', 'резинка'],
  'брусья': ['без оборудования', 'гантели'],
  'тренажёр': ['гантели', 'резинка', 'без оборудования'],
  'резинка': ['без оборудования', 'гантели'],
};

export function getAvailableExerciseEquipment(profileEquipment: string[]): Set<string> {
  const available = new Set<string>(['без оборудования', 'коврик']);
  for (const eq of profileEquipment) {
    const mapped = PROFILE_TO_EX_EQUIPMENT[eq];
    if (mapped) mapped.forEach((e) => available.add(e));
  }
  return available;
}

export function equipmentIsAvailable(exEq: string, available: Set<string>): boolean {
  if (available.has(exEq)) return true;
  const fallbacks = EQUIPMENT_FALLBACKS[exEq];
  if (!fallbacks) return false;
  return fallbacks.some((f) => available.has(f));
}

// ── Injury-based exclusion rules ──────────────────────────
// Exercises to exclude by injury location (matched by name substring)
const INJURY_EXCLUSIONS: Record<string, string[]> = {
  'колено': ['Приседания со штангой', 'Приседания с гантелями', 'Пистолетик', 'Выпады с гантелями', 'Жим ногами'],
  'спина': ['Становая тяга', 'Румынская тяга', 'Румынская тяга с гантелями', 'Мёртвая тяга на одной ноге'],
  'плечо': ['Армейский жим', 'Жим гантелей сидя', 'Жим Арнольда', 'Отжимания "домиком"', 'Тяга штанги к подбородку'],
};

function isExcludedByInjury(exercise: Exercise, injuries: string[]): boolean {
  for (const injury of injuries) {
    const exclusions = INJURY_EXCLUSIONS[injury];
    if (exclusions && exclusions.some((name) => exercise.name.includes(name))) {
      return true;
    }
  }
  return false;
}

// ── Template selection ────────────────────────────────────
function profileGoalToTemplateGoal(goal: string): string {
  if (goal === 'lose') return 'lose';
  if (goal === 'gain') return 'gain';
  return 'maintain';
}

function profileLevelToTemplateDifficulty(level: string): string {
  if (level === 'beginner') return 'новичок';
  if (level === 'intermediate') return 'средний';
  return 'продвинутый';
}

export function selectTemplate(
  templates: WorkoutTemplate[],
  profile: Profile,
  coachData?: CoachData | null
): WorkoutTemplate | null {
  const targetGoal = profileGoalToTemplateGoal(profile.goal);
  const targetDifficulty = profileLevelToTemplateDifficulty(profile.training_level);
  const targetDays = coachData?.days_per_week ?? profile.days_per_week;

  let best: WorkoutTemplate | null = null;
  let bestScore = -1;

  for (const t of templates) {
    let score = 0;
    if (t.goal === targetGoal) score += 10;
    if (t.difficulty_level === targetDifficulty) score += 5;
    if (
      (targetDifficulty === 'новичок' && t.difficulty_level === 'средний') ||
      (targetDifficulty === 'средний' && t.difficulty_level === 'продвинутый')
    ) {
      score += 2;
    }
    if (t.days_per_week === targetDays) score += 3;
    if (Math.abs(t.days_per_week - targetDays) === 1) score += 1;

    // Focus-based template preference
    const focus = coachData?.focus_type;
    if (focus === 'strength' && t.goal === 'gain') score += 2;
    if (focus === 'endurance' && t.goal === 'lose') score += 2;
    if (focus === 'rehab' && t.difficulty_level === 'новичок') score += 3;

    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }

  return best;
}

// ── Exercise scoring based on coach preferences ───────────
export interface SelectionContext {
  focus: string | null;
  priority: string | null;
  injuries: string[];
  cyclePhase: CyclePhase;
  sleepHours: string | null;
  stressLevel: string | null;
  workoutDuration: string | null;
}

function scoreExercise(ex: Exercise, ctx: SelectionContext): number {
  let score = 0;

  // Focus-based scoring
  switch (ctx.focus) {
    case 'strength':
      score += ex.effectiveness_score;
      break;
    case 'endurance':
      score += ex.effectiveness_score * 0.5 + ex.enjoyment_score * 0.3;
      break;
    case 'technique':
      score += ex.safety_level * 0.6 + ex.enjoyment_score * 0.4;
      break;
    case 'rehab':
      score += ex.safety_level + (ex.joint_friendly ? 5 : 0);
      break;
    case 'muscle':
      // Handled separately by muscle group filtering
      score += ex.effectiveness_score;
      break;
  }

  // Priority-based scoring
  switch (ctx.priority) {
    case 'effectiveness':
      score += ex.effectiveness_score * 0.5;
      break;
    case 'safety':
      score += ex.safety_level * 0.5 + (ex.joint_friendly ? 3 : 0);
      break;
    case 'enjoyment':
      score += ex.enjoyment_score * 0.5;
      break;
  }

  // Injury exclusion
  if (isExcludedByInjury(ex, ctx.injuries)) {
    score -= 100;
  }

  // Stress/sleep adjustments
  if (ctx.stressLevel === 'high' || ctx.sleepHours === 'less_5' || ctx.sleepHours === '5_6') {
    // Prefer joint-friendly, lower intensity
    score += ex.safety_level * 0.3;
    if (!ex.joint_friendly) score -= 2;
  }

  // Cycle phase adjustments
  if (ctx.cyclePhase === 'menstrual') {
    if (!ex.joint_friendly) score -= 3;
    score += ex.safety_level * 0.2;
  } else if (ctx.cyclePhase === 'ovulatory') {
    score += ex.effectiveness_score * 0.2;
  }

  return score;
}

// ── Rep/sets adjustment based on focus ────────────────────
function adjustRepsForFocus(baseReps: number, focus: string | null): number {
  if (focus === 'strength') return Math.min(6, baseReps);
  if (focus === 'endurance') return Math.max(15, baseReps);
  if (focus === 'technique') return Math.max(10, baseReps);
  if (focus === 'rehab') return Math.max(12, baseReps);
  return baseReps;
}

function adjustSetsForDuration(baseSets: number, duration: string | null): number {
  if (duration === '20_30') return Math.max(2, baseSets - 1);
  if (duration === '60+') return baseSets + 1;
  return baseSets;
}

// ── Exercise replacement with smart scoring ───────────────
function findReplacementExercise(
  original: Exercise,
  allExercises: Exercise[],
  available: Set<string>,
  ctx: SelectionContext,
  muscleGroup?: string
): Exercise | null {
  const targetMuscle = muscleGroup ?? original.muscle_group;

  const candidates = allExercises
    .filter(
      (e) =>
        e.muscle_group === targetMuscle &&
        equipmentIsAvailable(e.equipment, available) &&
        e.id !== original.id &&
        !isExcludedByInjury(e, ctx.injuries)
    )
    .map((e) => ({ exercise: e, score: scoreExercise(e, ctx) }))
    .sort((a, b) => b.score - a.score);

  return candidates[0]?.exercise ?? null;
}

// ── Weak/focus muscle extra exercises ─────────────────────
function findExtraExercisesForMuscles(
  muscles: string[],
  allExercises: Exercise[],
  available: Set<string>,
  ctx: SelectionContext,
  maxPerDay: number = 2
): Exercise[] {
  const result: Exercise[] = [];
  for (const muscle of muscles) {
    const candidates = allExercises
      .filter(
        (e) =>
          e.muscle_group === muscle &&
          equipmentIsAvailable(e.equipment, available) &&
          !isExcludedByInjury(e, ctx.injuries)
      )
      .map((e) => ({ exercise: e, score: scoreExercise(e, ctx) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPerDay);
    result.push(...candidates.map((c) => c.exercise));
  }
  return result.slice(0, 4);
}

// ── Progression application ───────────────────────────────
function applyProgression(
  sets: number,
  reps: number,
  week: number,
  progression: WorkoutTemplate['structure']['progression']
): { sets: number; reps: number } {
  if (week === 1) return { sets, reps };
  const weekKey = `week${week}` as keyof typeof progression;
  const rule = progression[weekKey];
  if (!rule) return { sets, reps };
  return {
    sets: sets + (rule.sets_delta ?? 0),
    reps: reps + (rule.reps_delta ?? 0),
  };
}

// ── Main plan generation ──────────────────────────────────
export interface GeneratePlanParams {
  profile: Profile;
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  coachData?: CoachData | null;
  cyclePhase?: CyclePhase;
  workoutType?: WorkoutType;
}

export function generatePlan({
  profile,
  exercises,
  templates,
  coachData,
  cyclePhase,
  workoutType = 'strength',
}: GeneratePlanParams): {
  name: string;
  goal: string;
  weeks: number;
  days_per_week: number;
  workout_type: WorkoutType;
  structure: { weeks: PlanWeek[]; rest_days_note: string };
  weak_muscles: string[];
} | null {
  const template = selectTemplate(templates, profile, coachData);
  if (!template) return null;

  const available = getAvailableExerciseEquipment(profile.equipment);
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  // Filter exercises by workout type
  const typedExercises = exercises.filter((e) => e.workout_type === workoutType);
  const typedMap = new Map(typedExercises.map((e) => [e.id, e]));

  const ctx: SelectionContext = {
    focus: coachData?.focus_type ?? null,
    priority: coachData?.priority ?? null,
    injuries: coachData?.injuries ?? [],
    cyclePhase: cyclePhase ?? 'not_specified',
    sleepHours: coachData?.sleep_hours ?? null,
    stressLevel: coachData?.stress_level ?? null,
    workoutDuration: coachData?.workout_duration ?? null,
  };

  // Determine focus muscles: combine weak_muscles from profile and focus_muscle from coach
  const focusMuscles: string[] = [...profile.weak_muscles];
  if (coachData?.focus_muscle && !focusMuscles.includes(coachData.focus_muscle)) {
    focusMuscles.push(coachData.focus_muscle);
  }

  const extraExercises =
    focusMuscles.length > 0
      ? findExtraExercisesForMuscles(focusMuscles, exercises, available, ctx)
      : [];

  const planWeeks: PlanWeek[] = [];

  for (let weekNum = 1; weekNum <= 4; weekNum++) {
    const weekDays: PlanDay[] = [];

    for (const templateDay of template.structure.days) {
      const dayExercises: PlanExercise[] = [];

      for (const te of templateDay.exercises) {
        const original = exerciseMap.get(te.exercise_id);
        if (!original) continue;

        // For non-strength workout types, ignore template exercise and pick from typed pool
        if (workoutType !== 'strength') {
          const dayMuscle = templateDay.muscles[0] ?? 'кор';
          const typedCandidate = typedExercises
            .filter(
              (e) =>
                equipmentIsAvailable(e.equipment, available) &&
                !isExcludedByInjury(e, ctx.injuries) &&
                !dayExercises.some((de) => de.exercise_id === e.id) &&
                (e.muscle_group === dayMuscle ||
                  templateDay.muscles.includes(e.muscle_group) ||
                 workoutType === 'cardio' ||
                 workoutType === 'yoga' ||
                 workoutType === 'stretching')
            )
            .map((e) => ({ exercise: e, score: scoreExercise(e, ctx) }))
            .sort((a, b) => b.score - a.score)[0];

          if (typedCandidate) {
            const { sets, reps } = applyProgression(
              adjustSetsForDuration(te.sets, ctx.workoutDuration),
              adjustRepsForFocus(te.reps, ctx.focus),
              weekNum,
              template.structure.progression
            );
            dayExercises.push({
              exercise_id: typedCandidate.exercise.id,
              exercise_name: typedCandidate.exercise.name,
              muscle_group: typedCandidate.exercise.muscle_group,
              equipment: typedCandidate.exercise.equipment,
              sets,
              reps,
              weight: 0,
              is_weak_focus: false,
            });
          }
          continue;
        }

        // Skip if excluded by injury
        if (isExcludedByInjury(original, ctx.injuries)) {
          const replacement = findReplacementExercise(original, exercises, available, ctx);
          if (replacement) {
            const { sets, reps } = applyProgression(
              adjustSetsForDuration(te.sets, ctx.workoutDuration),
              adjustRepsForFocus(te.reps, ctx.focus),
              weekNum,
              template.structure.progression
            );
            dayExercises.push({
              exercise_id: replacement.id,
              exercise_name: replacement.name,
              muscle_group: replacement.muscle_group,
              equipment: replacement.equipment,
              sets,
              reps,
              weight: 0,
              is_weak_focus: false,
            });
          }
          continue;
        }

        // Equipment check
        let exercise = original;
        if (!equipmentIsAvailable(original.equipment, available)) {
          const replacement = findReplacementExercise(original, exercises, available, ctx);
          if (replacement) exercise = replacement;
          else continue;
        }

        const { sets, reps } = applyProgression(
          adjustSetsForDuration(te.sets, ctx.workoutDuration),
          adjustRepsForFocus(te.reps, ctx.focus),
          weekNum,
          template.structure.progression
        );

        dayExercises.push({
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          muscle_group: exercise.muscle_group,
          equipment: exercise.equipment,
          sets,
          reps,
          weight: 0,
          is_weak_focus: false,
        });
      }

      // Add focus/weak muscle extra exercises
      if (extraExercises.length > 0 && dayExercises.length > 0) {
        const extraToAdd = extraExercises.slice(0, 2);
        for (const extra of extraToAdd) {
          if (!dayExercises.some((d) => d.exercise_id === extra.id)) {
            const { sets, reps } = applyProgression(3, 12, weekNum, template.structure.progression);
            dayExercises.push({
              exercise_id: extra.id,
              exercise_name: extra.name,
              muscle_group: extra.muscle_group,
              equipment: extra.equipment,
              sets,
              reps,
              weight: 0,
              is_weak_focus: true,
            });
          }
        }
      }

      weekDays.push({
        day: templateDay.day,
        name: templateDay.name,
        muscles: templateDay.muscles,
        is_rest: false,
        exercises: dayExercises,
      });
    }

    const trainingDays = template.days_per_week;
    const restDays = 7 - trainingDays;
    for (let r = 1; r <= restDays; r++) {
      weekDays.push({
        day: trainingDays + r,
        name: `Отдых ${r}`,
        muscles: [],
        is_rest: true,
        exercises: [],
      });
    }

    weekDays.sort((a, b) => a.day - b.day);
    planWeeks.push({ week: weekNum, days: weekDays });
  }

  return {
    name: template.name,
    goal: template.goal,
    weeks: 4,
    days_per_week: template.days_per_week,
    workout_type: workoutType,
    structure: { weeks: planWeeks, rest_days_note: template.structure.rest_days_note },
    weak_muscles: focusMuscles,
  };
}

// ── Suggest replacements for an exercise ──────────────────
export interface ReplacementSuggestion {
  exercise: Exercise;
  reason: string;
}

export function suggestReplacements(
  currentExercise: Exercise,
  allExercises: Exercise[],
  available: Set<string>,
  injuries: string[],
  userQuery: string,
  limit: number = 3
): ReplacementSuggestion[] {
  const targetMuscle = currentExercise.muscle_group;
  const workoutType = currentExercise.workout_type;

  let candidates = allExercises
    .filter(
      (e) =>
        e.id !== currentExercise.id &&
        equipmentIsAvailable(e.equipment, available) &&
        !isExcludedByInjury(e, injuries)
    );

  // Filter by same workout type if available
  const typed = candidates.filter((e) => e.workout_type === workoutType);
  if (typed.length >= limit) candidates = typed;

  // Filter by same muscle group first
  const sameMuscle = candidates.filter((e) => e.muscle_group === targetMuscle);
  const pool = sameMuscle.length >= limit ? sameMuscle : candidates;

  // Parse user query for preferences
  const q = userQuery.toLowerCase();
  const scored = pool.map((e) => {
    let score = e.effectiveness_score * 0.3 + e.safety_level * 0.3 + e.enjoyment_score * 0.3;
    let reason = 'Похожее упражнение на ту же группу мышц';

    if (q.includes('безопас') || q.includes('колен') || q.includes('сустав')) {
      score += e.safety_level;
      if (e.joint_friendly) { score += 5; reason = 'Щадящее для суставов'; }
    }
    if (q.includes('интерес') || q.includes('разноо') || q.includes('весел')) {
      score += e.enjoyment_score;
      reason = 'Более интересное упражнение';
    }
    if (q.includes('эффект') || q.includes('сильн') || q.includes('мощ')) {
      score += e.effectiveness_score;
      reason = 'Высокая эффективность';
    }
    if (q.includes('легч') || q.includes('прощ') || q.includes('нович')) {
      if (e.difficulty === 'новичок') { score += 5; reason = 'Подходит для начинающих'; }
    }
    if (q.includes('сложн') || q.includes('продвин')) {
      if (e.difficulty === 'продвинутый') { score += 5; reason = 'Для продвинутых'; }
    }

    return { exercise: e, score, reason };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ── Regenerate a single day with new exercises ────────────
export function regenerateDay(
  plan: UserPlan,
  weekNum: number,
  dayNum: number,
  allExercises: Exercise[],
  available: Set<string>,
  injuries: string[],
  coachData?: CoachData | null
): PlanDay | null {
  const week = plan.structure.weeks.find((w) => w.week === weekNum);
  const day = week?.days.find((d) => d.day === dayNum);
  if (!day || day.is_rest) return null;

  const workoutType = (plan.workout_type ?? 'strength') as WorkoutType;
  const ctx: SelectionContext = {
    focus: coachData?.focus_type ?? null,
    priority: coachData?.priority ?? null,
    injuries,
    cyclePhase: 'not_specified',
    sleepHours: coachData?.sleep_hours ?? null,
    stressLevel: coachData?.stress_level ?? null,
    workoutDuration: coachData?.workout_duration ?? null,
  };

  const usedIds = new Set(day.exercises.map((e) => e.exercise_id));
  const newExercises: PlanExercise[] = [];

  // Build pool filtered by workout type and day muscles
  let pool = allExercises.filter(
    (e) =>
      e.workout_type === workoutType &&
      equipmentIsAvailable(e.equipment, available) &&
      !isExcludedByInjury(e, injuries) &&
      !usedIds.has(e.id)
  );

  // Prefer same muscle groups
  const musclePool = pool.filter((e) => day.muscles.includes(e.muscle_group));
  if (musclePool.length >= day.exercises.length) pool = musclePool;

  const scored = pool
    .map((e) => ({ exercise: e, score: scoreExercise(e, ctx) }))
    .sort((a, b) => b.score - a.score);

  for (let i = 0; i < day.exercises.length && i < scored.length; i++) {
    const ex = scored[i].exercise;
    const original = day.exercises[i];
    newExercises.push({
      exercise_id: ex.id,
      exercise_name: ex.name,
      muscle_group: ex.muscle_group,
      equipment: ex.equipment,
      sets: original.sets,
      reps: original.reps,
      weight: original.weight,
      is_weak_focus: original.is_weak_focus,
    });
  }

  return { ...day, exercises: newExercises };
}

// ── Fetch helper ──────────────────────────────────────────
export async function fetchExercisesAndTemplates(supabase: SupabaseClient): Promise<{
  exercises: Exercise[];
  templates: WorkoutTemplate[];
}> {
  const [exRes, tplRes] = await Promise.all([
    supabase.from('exercises').select('*').order('name'),
    supabase.from('workout_templates').select('*'),
  ]);
  return {
    exercises: (exRes.data as Exercise[]) ?? [],
    templates: (tplRes.data as WorkoutTemplate[]) ?? [],
  };
}
