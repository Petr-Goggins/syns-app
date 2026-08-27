import { create } from 'zustand';
import type { MealLog, SleepLog, Workout, Intensity, LegacyWorkoutType, MealType } from '@/types';
import { supabase } from '@/lib/supabase';

interface TrackingState {
  workouts: Workout[];
  sleepLogs: SleepLog[];
  mealLogs: MealLog[];
  loading: boolean;
  error: string | null;
  fetchAll: (userId: string) => Promise<void>;
  addWorkout: (
    userId: string,
    data: { type: LegacyWorkoutType; duration: number; intensity: Intensity }
  ) => Promise<void>;
  addSleep: (userId: string, hours: number) => Promise<void>;
  addMeal: (userId: string, data: { meal_type: MealType; in_macros: boolean; note?: string }) => Promise<void>;
  reset: () => void;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  workouts: [],
  sleepLogs: [],
  mealLogs: [],
  loading: false,
  error: null,
  fetchAll: async (userId: string) => {
    set({ loading: true });
    const [w, s, m] = await Promise.all([
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    set({
      workouts: (w.data as Workout[]) ?? [],
      sleepLogs: (s.data as SleepLog[]) ?? [],
      mealLogs: (m.data as MealLog[]) ?? [],
      loading: false,
    });
  },
  addWorkout: async (userId, data) => {
    const { data: row, error } = await supabase
      .from('workouts')
      .insert({ user_id: userId, ...data })
      .select()
      .single();
    if (error) {
      set({ error: error.message });
      return;
    }
    set({ workouts: [row as Workout, ...get().workouts] });
  },
  addSleep: async (userId, hours) => {
    const { data: row, error } = await supabase
      .from('sleep_logs')
      .insert({ user_id: userId, hours })
      .select()
      .single();
    if (error) {
      set({ error: error.message });
      return;
    }
    set({ sleepLogs: [row as SleepLog, ...get().sleepLogs] });
  },
  addMeal: async (userId, data) => {
    const { data: row, error } = await supabase
      .from('meal_logs')
      .insert({ user_id: userId, ...data })
      .select()
      .single();
    if (error) {
      set({ error: error.message });
      return;
    }
    set({ mealLogs: [row as MealLog, ...get().mealLogs] });
  },
  reset: () => set({ workouts: [], sleepLogs: [], mealLogs: [], loading: false, error: null }),
}));
