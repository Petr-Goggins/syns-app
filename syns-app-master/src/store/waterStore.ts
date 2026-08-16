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
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', userId)
      .eq('date', today);
    if (error) {
      set({ loading: false });
      return;
    }
    const total = (data ?? []).reduce((sum, l) => sum + (l.amount_ml || 0), 0);
    set({ logs: data as WaterLog[] ?? [], todayAmount: total, loading: false });
  },
  addWater: async (userId: string, amount: number) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('water_logs')
      .insert({ user_id: userId, date: today, amount_ml: amount })
      .select();
    if (error) return;
    const newLog = (data as WaterLog[])[0];
    set({
      logs: [newLog, ...get().logs],
      todayAmount: get().todayAmount + amount,
    });
  },
  setGoal: (goal) => set({ goal }),
  reset: () => set({ logs: [], todayAmount: 0, loading: false }),
}));
