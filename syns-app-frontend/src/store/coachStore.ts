import { create } from 'zustand';
import type { CoachData, UserGoal } from '@/types';
import { supabase } from '@/lib/supabase';

interface CoachState {
  coachData: CoachData | null;
  goal: UserGoal | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchCoachData: (userId: string) => Promise<void>;
  fetchGoal: (userId: string) => Promise<void>;
  saveCoachData: (userId: string, data: Partial<CoachData>) => Promise<boolean>;
  saveGoal: (userId: string, data: Partial<UserGoal>) => Promise<boolean>;
  reset: () => void;
}

export const useCoachStore = create<CoachState>((set, get) => ({
  coachData: null,
  goal: null,
  loading: false,
  saving: false,
  error: null,

  fetchCoachData: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_coach_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return;
    set({ coachData: data as CoachData | null });
  },

  fetchGoal: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return;
    set({ goal: data as UserGoal | null });
  },

  saveCoachData: async (userId: string, data: Partial<CoachData>) => {
    set({ saving: true, error: null });
    const existing = get().coachData;
    if (existing) {
      const { data: updated, error } = await supabase
        .from('user_coach_data')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) {
        set({ saving: false, error: error.message });
        return false;
      }
      set({ coachData: updated as CoachData, saving: false });
      return true;
    } else {
      const { data: created, error } = await supabase
        .from('user_coach_data')
        .insert({ user_id: userId, ...data })
        .select()
        .single();
      if (error) {
        set({ saving: false, error: error.message });
        return false;
      }
      set({ coachData: created as CoachData, saving: false });
      return true;
    }
  },

  saveGoal: async (userId: string, data: Partial<UserGoal>) => {
    set({ saving: true, error: null });
    const existing = get().goal;
    if (existing) {
      const { data: updated, error } = await supabase
        .from('user_goals')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) {
        set({ saving: false, error: error.message });
        return false;
      }
      set({ goal: updated as UserGoal, saving: false });
      return true;
    } else {
      const { data: created, error } = await supabase
        .from('user_goals')
        .insert({ user_id: userId, status: 'active', ...data })
        .select()
        .single();
      if (error) {
        set({ saving: false, error: error.message });
        return false;
      }
      set({ goal: created as UserGoal, saving: false });
      return true;
    }
  },

  reset: () => set({ coachData: null, goal: null, loading: false, saving: false, error: null }),
}));
