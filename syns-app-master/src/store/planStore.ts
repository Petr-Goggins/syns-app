import { create } from 'zustand';
import type { UserPlan, ExerciseLog, Exercise } from '@/types';
import type { PlanExercise } from '@/types';
import { supabase } from '@/lib/supabase';
import { fetchExercisesAndTemplates, generatePlan, suggestReplacements, regenerateDay, getAvailableExerciseEquipment, type ReplacementSuggestion, type WorkoutType } from '@/lib/planEngine';
import { useProfileStore } from '@/store/profileStore';
import { useStatsStore } from '@/store/statsStore';
import { useCoachStore } from '@/store/coachStore';
import { calculateCyclePhase } from '@/lib/cycle';

interface PlanState {
  plan: UserPlan | null;
  logs: ExerciseLog[];
  loading: boolean;
  generating: boolean;
  error: string | null;
  replacementHistory: { week: number; day: number; index: number; oldExercise: PlanExercise }[];
  fetchPlan: (userId: string) => Promise<void>;
  fetchLogs: (userId: string, planId: string) => Promise<void>;
  generate: (userId: string, workoutType?: WorkoutType) => Promise<boolean>;
  setWorkoutType: (userId: string, workoutType: WorkoutType) => Promise<boolean>;
  toggleExerciseComplete: (
    userId: string,
    planId: string,
    exerciseId: number,
    week: number,
    day: number,
    completed: boolean
  ) => Promise<void>;
  updateExerciseLog: (
    logId: string,
    data: { sets?: number; reps?: number; weight?: number }
  ) => Promise<void>;
  suggestReplacementsForExercise: (
    exerciseId: number,
    week: number,
    day: number,
    query: string
  ) => Promise<ReplacementSuggestion[]>;
  replaceExercise: (week: number, day: number, index: number, newExercise: Exercise) => Promise<boolean>;
  undoReplace: (week: number, day: number) => Promise<boolean>;
  regenerateDay: (week: number, day: number) => Promise<boolean>;
  reset: () => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plan: null,
  logs: [],
  loading: false,
  generating: false,
  error: null,
  replacementHistory: [],

  fetchPlan: async (userId: string) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ plan: data as UserPlan | null, loading: false });
    if (data) {
      get().fetchLogs(userId, data.id);
    }
  },

  fetchLogs: async (userId: string, planId: string) => {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_id', planId);
    if (error) return;
    set({ logs: data as ExerciseLog[] ?? [] });
  },

  generate: async (userId: string, workoutType?: WorkoutType) => {
    let profile = useProfileStore.getState().profile;
    if (!profile) {
      await useProfileStore.getState().fetchProfile(userId);
      profile = useProfileStore.getState().profile;
    }
    if (!profile) {
      set({ error: 'Заполните профиль сначала' });
      return false;
    }

    set({ generating: true, error: null });
    try {
      const { exercises, templates } = await fetchExercisesAndTemplates(supabase);

      // Fetch coach data for smart selection
      const coachStore = useCoachStore.getState();
      let coachData = coachStore.coachData;
      if (!coachData) {
        await coachStore.fetchCoachData(userId);
        coachData = useCoachStore.getState().coachData;
      }

      // Auto-select workout type from main_goal if not explicitly provided
      let effectiveType = workoutType;
      if (!effectiveType && coachData?.main_goal) {
        const goalMap: Record<string, WorkoutType> = {
          gain_muscle: 'strength',
          lose_weight: 'cardio',
          maintain_tone: 'functional',
          recovery: 'yoga',
          flexibility: 'stretching',
          general_health: 'functional',
        };
        effectiveType = goalMap[coachData.main_goal] ?? 'strength';
      }
      if (!effectiveType) effectiveType = 'strength';

      // Calculate cycle phase for female users
      let cyclePhase: import('@/lib/cycle').CyclePhase = 'not_specified';
      if (profile.gender === 'female' && profile.cycle_last_period) {
        const cycleInfo = calculateCyclePhase(profile.cycle_last_period, profile.cycle_length);
        cyclePhase = cycleInfo.phase;
      }

      const planData = generatePlan({ profile, exercises, templates, coachData, cyclePhase, workoutType: effectiveType });
      if (!planData) {
        set({ generating: false, error: 'Не удалось подобрать шаблон' });
        return false;
      }

      const { data, error: insertErr } = await supabase
        .from('user_plans')
        .insert({
          user_id: userId,
          name: planData.name,
          goal: planData.goal,
          weeks: planData.weeks,
          days_per_week: planData.days_per_week,
          workout_type: planData.workout_type,
          structure: planData.structure,
          weak_muscles: planData.weak_muscles,
        })
        .select()
        .single();

      if (insertErr) {
        set({ generating: false, error: insertErr.message });
        return false;
      }

      set({ plan: data as UserPlan, generating: false, replacementHistory: [] });
      get().fetchLogs(userId, data.id);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка генерации';
      set({ generating: false, error: msg });
      return false;
    }
  },

  setWorkoutType: async (userId: string, workoutType: WorkoutType) => {
    // Regenerate plan with new workout type
    return get().generate(userId, workoutType);
  },

  toggleExerciseComplete: async (userId, planId, exerciseId, week, day, completed) => {
    // Find existing log
    const existing = get().logs.find(
      (l) => l.exercise_id === exerciseId && l.week === week && l.day === day
    );

    if (existing) {
      const { data, error } = await supabase
        .from('exercise_logs')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (!error && data) {
        set({
          logs: get().logs.map((l) => (l.id === existing.id ? data as ExerciseLog : l)),
        });
      }
    } else {
      // Need exercise info from plan
      const plan = get().plan;
      if (!plan) return;
      const exInfo = plan.structure.weeks
        .find((w) => w.week === week)
        ?.days.find((d) => d.day === day)
        ?.exercises.find((e) => e.exercise_id === exerciseId);
      if (!exInfo) return;

      const { data, error } = await supabase
        .from('exercise_logs')
        .insert({
          user_id: userId,
          plan_id: planId,
          exercise_id: exerciseId,
          week,
          day,
          sets: exInfo.sets,
          reps: exInfo.reps,
          weight: exInfo.weight,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (!error && data) {
        set({ logs: [...get().logs, data as ExerciseLog] });

        // Award XP for completing an exercise
        if (completed) {
          const statsStore = useStatsStore.getState();
          if (statsStore.stats) {
            const newXP = statsStore.stats.xp + 10;
            const newLevel =
              newXP >= statsStore.stats.level * 100
                ? statsStore.stats.level + 1
                : statsStore.stats.level;
            const updatedStats = {
              ...statsStore.stats,
              xp: newXP,
              level: newLevel,
              strength: Math.min(100, statsStore.stats.strength + 1),
            };
            await supabase.from('user_stats').update(updatedStats).eq('id', statsStore.stats.id);
            useStatsStore.setState({ stats: updatedStats });
          }
        }
      }
    }
  },

  updateExerciseLog: async (logId, data) => {
    const { error } = await supabase
      .from('exercise_logs')
      .update(data)
      .eq('id', logId);
    if (error) return;
    set({
      logs: get().logs.map((l) =>
        l.id === logId ? { ...l, ...data } : l
      ),
    });
  },

  suggestReplacementsForExercise: async (exerciseId, week, day, query) => {
    const plan = get().plan;
    const profile = useProfileStore.getState().profile;
    if (!plan || !profile) return [];

    const { exercises } = await fetchExercisesAndTemplates(supabase);
    const current = exercises.find((e) => e.id === exerciseId);
    if (!current) return [];

    const available = getAvailableExerciseEquipment(profile.equipment);
    const injuries = useCoachStore.getState().coachData?.injuries ?? [];
    return suggestReplacements(current, exercises, available, injuries, query);
  },

  replaceExercise: async (week, day, index, newExercise) => {
    const plan = get().plan;
    if (!plan) return false;

    // Find the current exercise to save in history
    const weekData = plan.structure.weeks.find((w) => w.week === week);
    const dayData = weekData?.days.find((d) => d.day === day);
    const oldExercise = dayData?.exercises[index];
    if (!oldExercise) return false;

    // Save to history
    const history = [...get().replacementHistory, { week, day, index, oldExercise }];

    // Build new plan structure
    const newStructure = {
      ...plan.structure,
      weeks: plan.structure.weeks.map((w) => {
        if (w.week !== week) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.day !== day) return d;
            return {
              ...d,
              exercises: d.exercises.map((ex, i) =>
                i === index
                  ? {
                      exercise_id: newExercise.id,
                      exercise_name: newExercise.name,
                      muscle_group: newExercise.muscle_group,
                      equipment: newExercise.equipment,
                      sets: ex.sets,
                      reps: ex.reps,
                      weight: ex.weight,
                      is_weak_focus: ex.is_weak_focus,
                    }
                  : ex
              ),
            };
          }),
        };
      }),
    };

    const { error } = await supabase
      .from('user_plans')
      .update({ structure: newStructure })
      .eq('id', plan.id);

    if (error) return false;

    set({
      plan: { ...plan, structure: newStructure },
      replacementHistory: history,
    });
    return true;
  },

  undoReplace: async (week, day) => {
    const plan = get().plan;
    if (!plan) return false;

    const history = [...get().replacementHistory];
    const lastReplace = [...history].reverse().find((h) => h.week === week && h.day === day);
    if (!lastReplace) return false;

    const newStructure = {
      ...plan.structure,
      weeks: plan.structure.weeks.map((w) => {
        if (w.week !== week) return w;
        return {
          ...w,
          days: w.days.map((d) => {
            if (d.day !== day) return d;
            return {
              ...d,
              exercises: d.exercises.map((ex, i) =>
                i === lastReplace.index ? lastReplace.oldExercise : ex
              ),
            };
          }),
        };
      }),
    };

    const { error } = await supabase
      .from('user_plans')
      .update({ structure: newStructure })
      .eq('id', plan.id);

    if (error) return false;

    const newHistory = history.filter((h) => h !== lastReplace);
    set({ plan: { ...plan, structure: newStructure }, replacementHistory: newHistory });
    return true;
  },

  regenerateDay: async (week, day) => {
    const plan = get().plan;
    const profile = useProfileStore.getState().profile;
    if (!plan || !profile) return false;

    const { exercises } = await fetchExercisesAndTemplates(supabase);
    const available = getAvailableExerciseEquipment(profile.equipment);
    const coachData = useCoachStore.getState().coachData;
    const injuries = coachData?.injuries ?? [];

    const newDay = regenerateDay(plan, week, day, exercises, available, injuries, coachData);
    if (!newDay) return false;

    const newStructure = {
      ...plan.structure,
      weeks: plan.structure.weeks.map((w) => {
        if (w.week !== week) return w;
        return {
          ...w,
          days: w.days.map((d) => (d.day === day ? newDay : d)),
        };
      }),
    };

    const { error } = await supabase
      .from('user_plans')
      .update({ structure: newStructure })
      .eq('id', plan.id);

    if (error) return false;

    set({ plan: { ...plan, structure: newStructure } });
    return true;
  },

  reset: () => set({ plan: null, logs: [], loading: false, generating: false, error: null, replacementHistory: [] }),
}));
