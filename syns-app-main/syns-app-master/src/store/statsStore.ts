import { create } from 'zustand';
import type { UserStats } from '@/types';
import { supabase } from '@/lib/supabase';

interface StatsState {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  stats: null,
  loading: false,
  error: null,
  fetchStats: async (userId: string) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    if (!data) {
      const { data: created, error: createErr } = await supabase
        .from('user_stats')
        .insert({ user_id: userId })
        .select()
        .single();
      if (createErr) {
        set({ loading: false, error: createErr.message });
        return;
      }
      set({ stats: created as UserStats, loading: false });
      return;
    }
    set({ stats: data as UserStats, loading: false });
  },
  reset: () => set({ stats: null, loading: false, error: null }),
}));
