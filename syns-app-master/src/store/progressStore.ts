import { create } from 'zustand';
import type { WeightLog } from '@/types';
import { supabase } from '@/lib/supabase';

interface ProgressState {
  weightLogs: WeightLog[];
  loading: boolean;
  error: string | null;
  fetchWeightLogs: (userId: string) => Promise<void>;
  logWeight: (userId: string, weight: number) => Promise<void>;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  weightLogs: [],
  loading: false,
  error: null,

  fetchWeightLogs: async (userId: string) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: true });
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ weightLogs: data as WeightLog[] ?? [], loading: false });
  },

  logWeight: async (userId: string, weight: number) => {
    const today = new Date().toISOString().split('T')[0];
    // Upsert: if entry exists for today, update it
    const existing = get().weightLogs.find((w) => w.log_date === today);
    if (existing) {
      const { data, error } = await supabase
        .from('weight_logs')
        .update({ weight })
        .eq('id', existing.id)
        .select()
        .single();
      if (!error && data) {
        set({
          weightLogs: get().weightLogs.map((w) => (w.id === existing.id ? data as WeightLog : w)),
        });
      }
    } else {
      const { data, error } = await supabase
        .from('weight_logs')
        .insert({ user_id: userId, weight, log_date: today })
        .select()
        .single();
      if (!error && data) {
        set({ weightLogs: [...get().weightLogs, data as WeightLog] });
      }
    }
  },

  reset: () => set({ weightLogs: [], loading: false, error: null }),
}));
