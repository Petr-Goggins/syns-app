import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { useCoachStore } from '@/store/coachStore';
import { Calendar, Dumbbell, Sparkles, CheckCircle, Loader2, ArrowRight, Clock, Target, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlanPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const { profile, fetchProfile } = useProfileStore();
  const { coachData, fetchCoachData } = useCoachStore();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Загружаем профиль и анкету при монтировании
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      await fetchProfile(user.id);
      await fetchCoachData(user.id);
      await loadPlan();
      setLoading(false);
    };
    loadData();
  }, [user]);

  const loadPlan = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    if (!error && data) {
      setPlan(data);
    } else {
      setPlan(null);
    }
  };

  const generatePlan = async () => {
    if (!user || !profile) return;
    setGenerating(true);

    // Собираем данные для генерации
    const goal = coachData?.main_goal || profile.goal || 'maintain_tone';
    const focus = coachData?.focus_type || 'strength';
    const days = coachData?.days_per_week || 3;
    const duration = coachData?.workout_duration || '45_60';

    // Имитация ИИ-генерации (заглушка с разными вариантами)
    const plans = {
      'gain_muscle': {
        goal: 'Набор мышечной массы',
        structure: {
          'Неделя 1': {
            'Понедельник': ['Приседания со штангой 4×8', 'Жим лёжа 4×8', 'Тяга штанги 4×8', 'Планка 3×45с'],
            'Среда': ['Выпады с гантелями 3×10', 'Жим гантелей сидя 3×10', 'Тяга вертикального блока 3×10', 'Скручивания 3×20'],
            'Пятница': ['Становая тяга 4×6', 'Отжимания на брусьях 3×8', 'Подтягивания 3×6', 'Гиперэкстензия 3×12']
          },
          'Неделя 2': {
            'Понедельник': ['Приседания 4×10', 'Жим лёжа 4×10', 'Тяга штанги 4×10', 'Планка 3×50с'],
            'Среда': ['Выпады 3×12', 'Жим гантелей 3×12', 'Тяга блока 3×12', 'Скручивания 3×25'],
            'Пятница': ['Становая 4×8', 'Брусья 3×10', 'Подтягивания 3×8', 'Гиперэкстензия 3×15']
          }
        }
      },
      'lose_weight': {
        goal: 'Похудение',
        structure: {
          'Неделя 1': {
            'Понедельник': ['Бег 30 мин', 'Приседания 3×15', 'Отжимания 3×12', 'Планка 3×30с'],
            'Среда': ['Велотренажёр 20 мин', 'Выпады 3×12', 'Жим гантелей 3×12', 'Скручивания 3×20'],
            'Пятница': ['Бег 20 мин', 'Бёрпи 3×10', 'Тяга гантели 3×12', 'Растяжка']
          }
        }
      },
      // другие цели можно добавить
    };

    // Выбираем подходящий план
    const selectedPlan = plans[goal as keyof typeof plans] || plans['gain_muscle'];

    // Сохраняем план в Supabase
    const newPlan = {
      user_id: user.id,
      goal: selectedPlan.goal,
      structure: selectedPlan.structure,
      current_week: 1,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('plans')
      .insert(newPlan)
      .select()
      .single();

    if (!error) {
      setPlan(data);
      toast.success('План создан! 🎉');
    } else {
      toast.error('Ошибка при создании плана');
      console.error(error);
    }
    setGenerating(false);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-accent-blue" size={32} /></div>;

  return (
    <div className="p-4 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Dumbbell className="text-accent-blue" size={28} />
          Мой план
        </h1>
        <button
          onClick={generatePlan}
          disabled={generating}
          className="flex items-center gap-2 bg-accent-blue text-bg px-5 py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-lg shadow-accent-blue/20 hover:shadow-accent-blue/40 transition-all"
        >
          {generating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {generating ? 'Генерация...' : 'Создать план'}
        </button>
      </div>

      {plan ? (
        <div className="space-y-6">
          {/* Карточка цели */}
          <div className="bg-bg-secondary p-5 rounded-xl border border-border shadow-lg transition-all hover:shadow-xl">
            <div className="flex items-center gap-3">
              <Target size={22} className="text-accent-blue" />
              <span className="text-text-secondary">Цель: <span className="text-text font-semibold">{plan.goal}</span></span>
              <span className="ml-auto text-xs bg-accent-green/10 text-accent-green px-3 py-1 rounded-full">Активен</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-text-secondary">
              <Clock size={16} /> Неделя {plan.current_week || 1}
            </div>
          </div>

          {/* Дни плана */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.structure && Object.entries(plan.structure).map(([week, days]: [string, any]) => (
              <div key={week} className="col-span-full">
                <h2 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                  <Calendar size={20} className="text-accent-blue" />
                  {week}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(days).map(([day, exercises]: [string, any]) => (
                    <div key={day} className="bg-bg-secondary p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all">
                      <p className="font-medium text-text flex items-center gap-2">
                        <Zap size={16} className="text-accent-gold" />
                        {day}
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {exercises.map((ex: string, i: number) => (
                          <li key={i} className="text-text-secondary text-sm flex items-start gap-2">
                            <span className="text-accent-blue">•</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-text-secondary py-16 bg-bg-secondary rounded-xl border border-border shadow-lg animate-fade-in">
          <Dumbbell size={64} className="mx-auto mb-4 opacity-30 text-accent-blue" />
          <p className="text-xl font-medium text-text">У вас ещё нет плана</p>
          <p className="text-sm mt-1">Заполните анкету тренера, чтобы получить персонализированную программу</p>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="mt-6 bg-accent-blue text-bg px-8 py-3 rounded-xl hover:opacity-90 transition shadow-lg shadow-accent-blue/20 flex items-center gap-2 mx-auto"
          >
            {generating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {generating ? 'Генерация...' : 'Создать план'}
          </button>
        </div>
      )}
    </div>
  );
}