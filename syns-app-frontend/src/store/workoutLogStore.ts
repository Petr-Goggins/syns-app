import { create } from 'zustand';
import type { WorkoutLog } from '@/types';
import { supabase } from '@/lib/supabase';
import { useStatsStore } from '@/store/statsStore';

interface WorkoutLogState {
  logs: WorkoutLog[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchByDate: (userId: string, date: string) => Promise<void>;
  fetchHistory: (userId: string, limit?: number) => Promise<WorkoutLog[]>;
  addLog: (
    userId: string,
    data: {
      log_date: string;
      exercise_name: string;
      sets: number;
      reps: number;
      weight: number;
      intensity: number;
      note?: string;
    }
  ) => Promise<boolean>;
  deleteLog: (logId: string) => Promise<void>;
  reset: () => void;
}

export const useWorkoutLogStore = create<WorkoutLogState>((set, get) => ({
  logs: [],
  loading: false,
  saving: false,
  error: null,

  fetchByDate: async (userId, date) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .order('created_at', { ascending: true });
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ logs: (data as WorkoutLog[]) ?? [], loading: false });
  },

  fetchHistory: async (userId, limit = 50) => {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data as WorkoutLog[]) ?? [];
  },

  addLog: async (userId, entryData) => {
    set({ saving: true, error: null });
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ user_id: userId, ...entryData })
      .select()
      .single();
    if (error) {
      set({ saving: false, error: error.message });
      return false;
    }
    set({ logs: [...get().logs, data as WorkoutLog], saving: false });

    // Award XP: +50 per workout session (first log of the day)
    const statsStore = useStatsStore.getState();
    if (statsStore.stats) {
      const newXP = statsStore.stats.xp + 50;
      const newLevel = newXP >= statsStore.stats.level * 100 ? statsStore.stats.level + 1 : statsStore.stats.level;
      const updatedStats = {
        ...statsStore.stats,
        xp: newXP,
        level: newLevel,
        strength: Math.min(100, statsStore.stats.strength + 5),
      };
      await supabase.from('user_stats').update(updatedStats).eq('id', statsStore.stats.id);
      useStatsStore.setState({ stats: updatedStats });
    }
    return true;
  },

  deleteLog: async (logId) => {
    await supabase.from('workout_logs').delete().eq('id', logId);
    set({ logs: get().logs.filter((l) => l.id !== logId) });
  },

  reset: () => set({ logs: [], loading: false, saving: false, error: null }),
}));
