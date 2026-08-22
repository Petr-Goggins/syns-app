import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Валидация и санитайзинг environment variables
const getSupabaseUrl = (): string => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url || typeof url !== 'string') {
    throw new Error('VITE_SUPABASE_URL is not configured');
  }
  // Валидация формата URL
  if (!/^https:\/\/[a-zA-Z0-9\-_]+\.supabase\.co$/.test(url)) {
    console.warn('Supabase URL may be invalid:', url);
  }
  return url.trim().slice(0, 256);
};

const getSupabaseAnonKey = (): string => {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!key || typeof key !== 'string') {
    throw new Error('VITE_SUPABASE_ANON_KEY is not configured');
  }
  // Базовая валидация JWT ключа
  if (key.length < 20 || !key.includes('.')) {
    console.warn('Supabase anon key may be invalid');
  }
  return key.trim().slice(0, 512);
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'User-Agent': 'Sync-App/1.0',
        },
      },
    });
  }
  return supabaseInstance;
};

// Экспорт для обратной совместимости
export const supabase = getSupabaseClient();