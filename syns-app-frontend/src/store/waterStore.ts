import { create } from 'zustand';
import type { WaterLog } from '@/types';
import { supabase } from '@/lib/supabase';

interface WaterState {
  logs: WaterLog[];
  todayAmount: number;
  goal: number;
  loading: boolean;
  fetchToday: (userId: string) => Promise<void>;
  addWater: (userId: string, amount: number) => Promise<void>;
  setGoal: (goal: number) => void;
  reset: () => void;
}

const WATER_GOAL = 2500;

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export const useWaterStore = create<WaterState>((set, get) => ({
  logs: [],
  todayAmount: 0,
  goal: WATER_GOAL,
  loading: false,
  fetchToday: async (userId: string) => {
    set({ loading: true });
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: false });
    if (error) {
      set({ loading: false });
      return;
    }
    const today = (data ?? []).filter((l) => isToday(l.created_at));
    const total = today.reduce((sum, l) => sum + l.amount, 0);
    set({ logs: today, todayAmount: total, loading: false });
  },
  addWater: async (userId: string, amount: number) => {
    const { data, error } = await supabase
      .from('water_logs')
      .insert({ user_id: userId, amount })
      .select()
      .single();
    if (error) return;
    const newLog = data as WaterLog;
    set({
      logs: [newLog, ...get().logs],
      todayAmount: get().todayAmount + amount,
    });
  },
  setGoal: (goal) => set({ goal }),
  reset: () => set({ logs: [], todayAmount: 0, loading: false }),
}));
