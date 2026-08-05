import { create } from 'zustand';
import type { Quote } from '@/types';
import { supabase } from '@/lib/supabase';

interface QuoteState {
  dailyQuote: Quote | null;
  loading: boolean;
  fetchDailyQuote: () => Promise<void>;
  getAnotherQuote: (category: string) => Promise<void>;
}

export const useQuoteStore = create<QuoteState>((set, get) => ({
  dailyQuote: null,
  loading: false,

  fetchDailyQuote: async () => {
    const { data } = await supabase
      .from('quotes')
      .select('*')
      .eq('category', 'мотивация')
      .order('priority', { ascending: false });
    if (data && data.length > 0) {
      const random = data[Math.floor(Math.random() * data.length)];
      set({ dailyQuote: random as Quote });
    }
  },

  getAnotherQuote: async (category) => {
    const { data } = await supabase
      .from('quotes')
      .select('*')
      .eq('category', category)
      .order('priority', { ascending: false });
    if (data && data.length > 0) {
      const current = get().dailyQuote;
      let random = data[Math.floor(Math.random() * data.length)] as Quote;
      if (data.length > 1) {
        while (random.id === current?.id) {
          random = data[Math.floor(Math.random() * data.length)] as Quote;
        }
      }
      set({ dailyQuote: random });
    }
  },
}));
