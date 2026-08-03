import { create } from 'zustand';
import type { FoodProduct, NutritionLog, NutritionMealType } from '@/types';
import { supabase } from '@/lib/supabase';
import { useStatsStore } from '@/store/statsStore';

interface NutritionState {
  logs: NutritionLog[];
  searchResults: FoodProduct[];
  searching: boolean;
  loading: boolean;
  error: string | null;
  fetchDaily: (userId: string, date: string) => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
  searchOpenFoodFacts: (query: string) => Promise<FoodProduct[]>;
  addEntry: (
    userId: string,
    data: {
      product_id: number | null;
      custom_name: string | null;
      meal_type: NutritionMealType;
      grams: number;
      proteins: number;
      fats: number;
      carbs: number;
      calories: number;
      log_date: string;
    }
  ) => Promise<boolean>;
  deleteEntry: (logId: string) => Promise<void>;
  addProduct: (data: Omit<FoodProduct, 'id'>) => Promise<FoodProduct | null>;
  saveApiProduct: (product: Partial<FoodProduct>) => Promise<FoodProduct | null>;
  reset: () => void;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  logs: [],
  searchResults: [],
  searching: false,
  loading: false,
  error: null,

  fetchDaily: async (userId: string, date: string) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .order('created_at', { ascending: true });
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ logs: data as NutritionLog[] ?? [], loading: false });
  },

  searchProducts: async (query: string) => {
    if (query.trim().length < 2) {
      set({ searchResults: [] });
      return;
    }
    set({ searching: true });

    // First search local DB by name and brand
    const { data, error } = await supabase
      .from('food_products')
      .select('*')
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      .limit(10);

    if (error) {
      set({ searching: false });
      return;
    }

    const localResults = (data as FoodProduct[]) ?? [];

    // If not enough local results, also search Open Food Facts
    if (localResults.length < 5) {
      const apiResults = await get().searchOpenFoodFacts(query);
      // Merge, dedup by name+brand, local takes priority
      const seen = new Set(localResults.map((r) => (r.name + r.brand).toLowerCase()));
      const merged = [...localResults, ...apiResults.filter((r) => !seen.has((r.name + (r.brand ?? '')).toLowerCase()))];
      set({ searchResults: merged.slice(0, 15), searching: false });
    } else {
      set({ searchResults: localResults, searching: false });
    }
  },

  searchOpenFoodFacts: async (query: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-search?q=${encodeURIComponent(query)}&limit=10`;
      const res = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.products ?? []) as FoodProduct[];
    } catch {
      return [];
    }
  },

  addEntry: async (userId, entryData) => {
    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({ user_id: userId, ...entryData })
      .select()
      .single();
    if (error) {
      set({ error: error.message });
      return false;
    }
    set({ logs: [...get().logs, data as NutritionLog] });

    // Award XP for logging nutrition
    const statsStore = useStatsStore.getState();
    if (statsStore.stats) {
      const newXP = statsStore.stats.xp + 5;
      const newLevel =
        newXP >= statsStore.stats.level * 100
          ? statsStore.stats.level + 1
          : statsStore.stats.level;
      const updatedStats = {
        ...statsStore.stats,
        xp: newXP,
        level: newLevel,
        nutrition: Math.min(100, statsStore.stats.nutrition + 1),
      };
      await supabase.from('user_stats').update(updatedStats).eq('id', statsStore.stats.id);
      useStatsStore.setState({ stats: updatedStats });
    }

    return true;
  },

  deleteEntry: async (logId: string) => {
    await supabase.from('nutrition_logs').delete().eq('id', logId);
    set({ logs: get().logs.filter((l) => l.id !== logId) });
  },

  addProduct: async (data) => {
    const { data: product, error } = await supabase
      .from('food_products')
      .insert(data)
      .select()
      .single();
    if (error) {
      set({ error: error.message });
      return null;
    }
    // Award +5 XP for creating custom product
    const statsStore = useStatsStore.getState();
    if (statsStore.stats) {
      const newXP = statsStore.stats.xp + 5;
      await supabase.from('user_stats').update({ xp: newXP }).eq('id', statsStore.stats.id);
      useStatsStore.setState({ stats: { ...statsStore.stats, xp: newXP } });
    }
    return product as FoodProduct;
  },

  saveApiProduct: async (product) => {
    const { data: existing } = await supabase
      .from('food_products')
      .select('id')
      .eq('name', product.name ?? '')
      .maybeSingle();
    if (existing) return existing as FoodProduct;

    const { data: saved, error } = await supabase
      .from('food_products')
      .insert({ ...product, is_global: false, source: 'api' })
      .select()
      .single();
    if (error) return null;
    return saved as FoodProduct;
  },

  reset: () => set({ logs: [], searchResults: [], loading: false, error: null }),
}));
