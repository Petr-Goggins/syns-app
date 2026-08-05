import { create } from 'zustand';
import type { Profile } from '@/types';
import { supabase } from '@/lib/supabase';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (userId: string, data: Partial<Profile>) => Promise<boolean>;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const emptyProfile = (id: string): Profile => ({
  id,
  email: null,
  gender: 'not_specified',
  age: null,
  height: null,
  weight: null,
  goal: 'maintain',
  activity_level: 'moderate',
  equipment: [],
  cycle_phase: 'not_specified',
  fasting: [],
  diet: [],
  target_weight: null,
  start_weight: null,
  training_level: 'beginner',
  weak_muscles: [],
  days_per_week: 3,
  cycle_last_period: null,
  cycle_length: 28,
  religion: 'none',
  updated_at: null,
});

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  fetchProfile: async (userId: string) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ profile: data ?? emptyProfile(userId), loading: false });
  },
  updateProfile: async (userId: string, data: Partial<Profile>) => {
    set({ loading: true, error: null });
    const payload = { ...data, id: userId, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) {
      set({ loading: false, error: error.message });
      return false;
    }
    const current = get().profile;
    set({ profile: current ? { ...current, ...data } : emptyProfile(userId), loading: false });
    return true;
  },
  setLoading: (loading) => set({ loading }),
  reset: () => set({ profile: null, loading: false, error: null }),
}));
