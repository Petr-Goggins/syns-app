import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useLongPathStore } from '@/store/longPathStore';
import { Award, Lock, Target, TrendingUp, ChevronRight, Zap } from 'lucide-react';
import { getLevelByXP, LEVELS } from '@/lib/levels';
import { ACHIEVEMENTS } from '@/data/achievements';

type Tab = 'levels' | 'achievements';
type AchievementFilter = 'all' | 'unlocked' | 'in_progress' | 'locked';

export default function ProgressPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const longPathStore = useLongPathStore();
  const [activeTab, setActiveTab] = useState<Tab>('levels');
  const [achievementFilter, setAchievementFilter] = useState<AchievementFilter>('all');
  const [loading, setLoading] = useState(true);
  const [userXP, setUserXP] = useState(0);
  const [levelInfo, setLevelInfo] = useState<{ level: number; title: string; progressInLevel: number } | null>(null);
  const [achievements, setAchievements] = useState(ACHIEVEMENTS);

  if (!user) {
    return <div className="p-4">Пожалуйста, войдите в аккаунт.</div>;
  }

  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);
      try {
        const { data: workouts } = await supabase
          .from('workout_logs')
          .select('id')
          .eq('user_id', user.id);

        const workoutCount = workouts?.length || 0;
        const streak = longPathStore.streak || 0;
        
        const calculatedXP = workoutCount * 10 + streak * 5;
        setUserXP(calculatedXP);
        
        const lvlInfo = getLevelByXP(calculatedXP);
        setLevelInfo(lvlInfo);

        const updatedAchievements = ACHIEVEMENTS.map(a => ({
          ...a,
          unlocked: checkAchievementUnlocked(a.id, workoutCount, streak, lvlInfo.level),
        }));
        setAchievements(updatedAchievements);

        await longPathStore.fetchUserGoals(user.id);
        await longPathStore.calculateStreak(user.id);
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, [user]);

  const checkAchievementUnlocked = (id: string, workouts: number, streak: number, level: number): boolean => {
    switch (id) {
      case 'first_workout': return workouts >= 1;
      case 'week_streak': return streak >= 7;
      case 'level_5': return level >= 5;
      case 'level_10': return level >= 10;
      case 'century': return workouts >= 100;
      case 'water_master': return streak >= 30;
      case 'iron_will': return workouts >= 30;
      default: return false;
    }
  };

  const filteredAchievements = achievements.filter(a => {
    if (achievementFilter === 'unlocked') return a.unlocked;
    if (achievementFilter === 'locked') return !a.unlocked;
    if (achievementFilter === 'in_progress') return false;
    return true;
  });

  if (loading) return <div className="p-4 flex justify-center"><div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div></div>;

  const nextLevelXP = LEVELS.find(l => l.level === (levelInfo?.level || 1))?.maxXP || 0;
  const currentLevelMinXP = LEVELS.find(l => l.level === (levelInfo?.level || 1))?.minXP || 0;
  const progressToNext = nextLevelXP === Infinity ? 100 : Math.round(((userXP - currentLevelMinXP) / (nextLevelXP - currentLevelMinXP)) * 100);

  return (
    <div className="p-4 max-w-3xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Award className="text-accent-gold" size={28} />
          Прогресс
        </h1>
      </div>

      <div className="flex gap-2 mb-6 bg-bg-secondary p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('levels')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'levels'
              ? 'bg-accent-blue text-white shadow-lg'
              : 'text-text-secondary hover:text-text'
          }`}
        >
          Уровни
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'achievements'
              ? 'bg-accent-gold text-white shadow-lg'
              : 'text-text-secondary hover:text-text'
          }`}
        >
          Достижения
        </button>
      </div>

      {activeTab === 'levels' && (
        <div className="space-y-6">
          <div className="card-modern bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 border-accent-blue/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wide">Текущее звание</p>
                <h2 className="text-2xl font-bold text-text">{levelInfo?.title}</h2>
                <p className="text-accent-blue font-semibold">Уровень {levelInfo?.level}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-accent-blue">{levelInfo?.level}</p>
                <p className="text-xs text-text-secondary">из 50</p>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between text-xs text-text-secondary mb-1">
                <span>XP: {userXP}</span>
                <span>{progressToNext}% до следующего</span>
              </div>
              <div className="w-full bg-bg-tertiary rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-accent-blue to-accent-purple h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
              <p className="text-xs text-text-secondary mt-2">
                Следующий уровень: {nextLevelXP === Infinity ? 'Максимум' : `${nextLevelXP} XP`}
              </p>
            </div>

            <div className="mt-4 p-3 bg-bg-tertiary/50 rounded-lg">
              <p className="text-sm text-text">{levelInfo?.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card-modern">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-accent-gold" />
                <span className="text-text-secondary text-sm">Серия</span>
              </div>
              <p className="text-2xl font-bold text-text">{longPathStore.streak} дней</p>
            </div>
            <div className="card-modern">
              <div className="flex items-center gap-2 mb-2">
                <Target size={18} className="text-accent-green" />
                <span className="text-text-secondary text-sm">Тренировок</span>
              </div>
              <p className="text-2xl font-bold text-text">{workoutCountFromXP(userXP)}+</p>
            </div>
          </div>

          <div className="card-modern">
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-accent-blue" />
              Путь к мастерству
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {LEVELS.map((lvl) => {
                const isCompleted = (levelInfo?.level || 0) > lvl.level;
                const isCurrent = (levelInfo?.level || 0) === lvl.level;
                
                return (
                  <div
                    key={lvl.level}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isCurrent
                        ? 'bg-accent-blue/10 border-accent-blue/40'
                        : isCompleted
                        ? 'bg-accent-green/5 border-accent-green/20'
                        : 'bg-bg-tertiary/30 border-border'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isCurrent
                          ? 'bg-accent-blue text-white'
                          : isCompleted
                          ? 'bg-accent-green text-white'
                          : 'bg-bg-tertiary text-text-secondary'
                      }`}
                    >
                      {isCompleted ? '✓' : lvl.level}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${isCurrent ? 'text-accent-blue' : 'text-text'}`}>
                        {lvl.title}
                      </p>
                      <p className="text-xs text-text-secondary">{lvl.description}</p>
                    </div>
                    {isCurrent && <ChevronRight size={18} className="text-accent-blue" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'Все' },
              { id: 'unlocked', label: 'Полученные' },
              { id: 'in_progress', label: 'В процессе' },
              { id: 'locked', label: 'Заблокированные' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setAchievementFilter(filter.id as AchievementFilter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  achievementFilter === filter.id
                    ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/40'
                    : 'bg-bg-secondary text-text-secondary border border-border hover:border-text-tertiary'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="card-modern bg-gradient-to-r from-accent-gold/5 to-transparent border-accent-gold/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Получено достижений</p>
                <p className="text-2xl font-bold text-accent-gold">
                  {achievements.filter(a => a.unlocked).length} / {achievements.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-accent-gold">
                  {Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%
                </p>
                <p className="text-xs text-text-secondary">прогресс</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`card-modern p-4 flex items-start gap-4 transition-all ${
                  achievement.unlocked
                    ? 'border-accent-gold/30 hover:border-accent-gold/50'
                    : 'opacity-60'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${
                    achievement.unlocked
                      ? 'bg-accent-gold/15'
                      : 'bg-bg-tertiary grayscale'
                  }`}
                >
                  {achievement.unlocked ? achievement.icon : <Lock size={24} className="text-text-tertiary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-text text-sm truncate">{achievement.title}</h4>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                    {achievement.description}
                  </p>
                  {achievement.unlocked && (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-gold/20 text-accent-gold">
                      Получено
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Lock size={48} className="mx-auto text-text-tertiary mb-3" />
              <p className="text-text-secondary">Нет достижений в этой категории</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function workoutCountFromXP(xp: number): number {
  return Math.floor(xp / 10);
}
