import { useEffect } from 'react';
import { LogOut, Palette, Info, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/TopBar';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { useProfileStore } from '@/store/profileStore';
import { useWaterStore } from '@/store/waterStore';
import { useChatStore } from '@/store/chatStore';
import { useTrackingStore } from '@/store/trackingStore';
import { useStatsStore } from '@/store/statsStore';
import { usePlanStore } from '@/store/planStore';
// import { useNutritionStore } from '@/store/nutritionStore';  // УДАЛЕНО
import { useProgressStore } from '@/store/progressStore';
import { useCoachStore } from '@/store/coachStore';
import { THEME_OPTIONS } from '@/store/themeStore';

const THEME_SWATCHES: Record<string, { bg: string; card: string; accent: string }> = {
  'dark-blue': { bg: '#0D1117', card: '#161B22', accent: '#58A6FF' },
  'light': { bg: '#FFFFFF', card: '#F0F2F5', accent: '#58A6FF' },
  'gray': { bg: '#1E1E1E', card: '#2C2C2C', accent: '#A0A0A0' },
  'black': { bg: '#0A0A0A', card: '#121212', accent: '#BB86FC' },
};

export default function SettingsPage({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const navigate = useNavigate();
  const { theme, setTheme, initTheme } = useSettingsStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    useAuthStore.getState().reset();
    useProfileStore.getState().reset();
    useWaterStore.getState().reset();
    useChatStore.getState().reset();
    useTrackingStore.getState().reset();
    useStatsStore.getState().reset();
    usePlanStore.getState().reset();
    useProgressStore.getState().reset();
    useCoachStore.getState().reset();
    navigate('/auth');
  };

  return (
    <div>
      <TopBar title="Настройки" onOpenSidebar={onOpenSidebar} />
      <main className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6 animate-slide-up">
        {/* Theme selection */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={18} className="text-accent-blue" />
            <h3 className="text-base font-bold text-text">Тема оформления</h3>
          </div>
          <p className="text-sm text-text-secondary mb-5">Выберите цветовую схему интерфейса</p>
          <div className="grid grid-cols-2 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const sw = THEME_SWATCHES[opt.id];
              const isActive = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`card p-4 flex items-center gap-3 transition-all relative ${
                    isActive ? 'border-accent-blue ring-1 ring-accent-blue/30' : ''
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: sw.bg, border: `2px solid ${sw.card}` }}
                  >
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: sw.accent }} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-text">{opt.label}</p>
                    <p className="text-xs text-text-tertiary">{opt.description}</p>
                  </div>
                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-blue flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Account info */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info size={18} className="text-text-secondary" />
            <h3 className="text-base font-bold text-text">Аккаунт</h3>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-secondary">Email</span>
            <span className="text-sm text-text font-medium">{user?.email ?? '—'}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="card w-full p-5 flex items-center gap-3 hover:border-accent-red/40 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-lg bg-accent-red/15 flex items-center justify-center">
            <LogOut size={20} className="text-accent-red" />
          </div>
          <div>
            <p className="font-bold text-accent-red">Выйти</p>
            <p className="text-xs text-text-secondary">Завершить текущую сессию</p>
          </div>
        </button>

        <p className="text-center text-xs text-text-tertiary">
          Sync · Фитнес-трекер с ИИ-наставником
        </p>
      </main>
    </div>
  );
}
