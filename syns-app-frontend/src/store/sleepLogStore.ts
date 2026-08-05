import { create } from 'zustand';
import type { SleepLog } from '@/types';
import { supabase } from '@/lib/supabase';
import { useStatsStore } from '@/store/statsStore';

interface SleepLogState {
  logs: SleepLog[];
  todayLog: SleepLog | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchByDate: (userId: string, date: string) => Promise<void>;
  fetchHistory: (userId: string, limit?: number) => Promise<SleepLog[]>;
  saveLog: (
    userId: string,
    data: { log_date: string; hours: number; quality: number }
  ) => Promise<boolean>;
  reset: () => void;
}

export const useSleepLogStore = create<SleepLogState>((set, get) => ({
  logs: [],
  todayLog: null,
  loading: false,
  saving: false,
  error: null,

  fetchByDate: async (userId, date) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .maybeSingle();
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ todayLog: data as SleepLog | null, loading: false });
  },

  fetchHistory: async (userId, limit = 30) => {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data as SleepLog[]) ?? [];
  },

  saveLog: async (userId, entryData) => {
    set({ saving: true, error: null });
    const existing = get().todayLog;

    let savedLog: SleepLog | null = null;

    if (existing) {
      const { data, error } = await supabase
        .from('sleep_logs')
        .update({ hours: entryData.hours, quality: entryData.quality })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) {
        set({ saving: false, error: error.message });
        return false;
      }
      savedLog = data as SleepLog;
    } else {
      const { data, error } = await supabase
        .from('sleep_logs')
        .insert({ user_id: userId, ...entryData })
        .select()
        .single();
      if (error) {
        set({ saving: false, error: error.message });
        return false;
      }
      savedLog = data as SleepLog;
    }

    set({ todayLog: savedLog, saving: false });

    // Award XP based on sleep duration
    const hours = entryData.hours;
    let xpGain = 0;
    if (hours > 9) xpGain = 20;
    else if (hours > 8) xpGain = 15;
    else if (hours > 7) xpGain = 10;

    if (xpGain > 0) {
      const statsStore = useStatsStore.getState();
      if (statsStore.stats) {
        const newXP = statsStore.stats.xp + xpGain;
        const newLevel = newXP >= statsStore.stats.level * 100 ? statsStore.stats.level + 1 : statsStore.stats.level;
        const updatedStats = {
          ...statsStore.stats,
          xp: newXP,
          level: newLevel,
          recovery: Math.min(100, statsStore.stats.recovery + 5),
        };
        await supabase.from('user_stats').update(updatedStats).eq('id', statsStore.stats.id);
        useStatsStore.setState({ stats: updatedStats });
      }
    }

    return true;
  },

  reset: () => set({ logs: [], todayLog: null, loading: false, saving: false, error: null }),
}));
