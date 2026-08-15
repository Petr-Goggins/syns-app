import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useWaterStore } from '@/store/waterStore';
import { useLongPathStore } from '@/store/longPathStore';
import { useWorkoutLogStore } from '@/store/workoutLogStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, Dumbbell, Utensils, Moon, Droplet, Target, Award, TrendingUp, Zap, Clock, Plus, ChevronRight, X, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { getPhaseRecommendation } from '@/lib/cycle';
import Modal from '@/components/Modal';

type DateFilter = 'today' | 'yesterday' | 'week';

interface MacroData {
  protein: { current: number; goal: number };
  fats: { current: number; goal: number };
  carbs: { current: number; goal: number };
}

interface DailyStats {
  calories: number;
  macros: MacroData;
  water: number;
  sleep: number;
  workouts: number;
  progress: number;
}

export default function DashboardPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const waterStore = useWaterStore();
  const longPathStore = useLongPathStore();
  const workoutLogStore = useWorkoutLogStore();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [stats, setStats] = useState<DailyStats>({
    calories: 0,
    macros: {
      protein: { current: 0, goal: 150 },
      fats: { current: 0, goal: 70 },
      carbs: { current: 0, goal: 300 },
    },
    water: 0,
    sleep: 0,
    workouts: 0,
    progress: 0,
  });
  const [calorieGoal, setCalorieGoal] = useState(2500);
  const [cycleRecommendation, setCycleRecommendation] = useState<string | null>(null);
  const [waterAmount, setWaterAmount] = useState(200);
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [streak, setStreak] = useState(0);
  const [profile, setProfile] = useState<{ weight: number; goal: string | null } | null>(null);
  
  // Модальное окно для добавления воды
  const [showWaterModal, setShowWaterModal] = useState(false);
  
  // Модальное окно для сна
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [sleepHours, setSleepHours] = useState('');

  // Цитаты дня
  const quotes = [
    { text: 'Маленькие шаги ведут к большим результатам!', author: 'Мотивация дня' },
    { text: 'Твоё тело может всё. Твой мозг должен в это поверить.', author: 'Вдохновение' },
    { text: 'Не останавливайся, когда устал. Останавливайся, когда закончил.', author: 'Дисциплина' },
    { text: 'Единственная плохая тренировка — та, которая не состоялась.', author: 'Фитнес' },
    { text: 'Здоровье — это богатство, которое нужно беречь.', author: 'Мудрость' },
  ];

  useEffect(() => {
    // Выбираем случайную цитату при загрузке
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);
  
  useEffect(() => {
    if (!user) return;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        // Загружаем профиль
        let profileData = null;
        try {
          const { data: pData, error: profileError } = await supabase
            .from('profiles')
            .select('weight, goal, cycle_phase, cycle_last_period, cycle_length')
            .eq('id', user.id)
            .maybeSingle();
          if (profileError) {
            console.error('Ошибка загрузки профиля:', profileError);
          } else if (pData) {
            profileData = pData;
            setProfile({ weight: pData.weight || 0, goal: pData.goal });
          }
        } catch (err) {
          console.error('Ошибка при запросе профиля:', err);
        }

        // Рекомендация по биоритмам
        if (profileData?.cycle_phase && profileData.cycle_phase !== 'not_specified') {
          try {
            const rec = getPhaseRecommendation(profileData.cycle_phase as any);
            setCycleRecommendation(rec.recommendation);
          } catch (err) {
            console.error('Ошибка получения рекомендации:', err);
          }
        }

        // Определяем дату для загрузки данных
        const dateStr = selectedDate.toISOString().split('T')[0];

        // Загружаем калории и макросы из meals
        let totalCalories = 0;
        let totalProtein = 0;
        let totalFats = 0;
        let totalCarbs = 0;
        try {
          const { data: meals, error: mealsError } = await supabase
            .from('meals')
            .select('calories, protein, fat, carbs')
            .eq('user_id', user.id)
            .eq('date', dateStr);
          
          if (mealsError) {
            console.error('Ошибка загрузки meals:', mealsError);
          } else if (meals) {
            totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
            totalProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
            totalFats = meals.reduce((sum, m) => sum + (m.fat || 0), 0);
            totalCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
          }
        } catch (err) {
          console.error('Ошибка при запросе meals:', err);
        }

        // Загружаем сон
        let sleepHoursVal = 0;
        try {
          const { data: sleep, error: sleepError } = await supabase
            .from('sleep_logs')
            .select('hours')
            .eq('user_id', user.id)
            .eq('date', dateStr)
            .maybeSingle();
          if (sleepError) {
            console.error('Ошибка загрузки sleep_logs:', sleepError);
          } else if (sleep) {
            sleepHoursVal = sleep.hours || 0;
          }
        } catch (err) {
          console.error('Ошибка при запросе sleep_logs:', err);
        }

        // Загружаем количество тренировок
        let workoutsCount = 0;
        try {
          const { count, error: workoutError } = await supabase
            .from('workout_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('log_date', dateStr);
          if (workoutError) {
            console.error('Ошибка загрузки workout_logs:', workoutError);
          } else if (count !== null) {
            workoutsCount = count;
          }
        } catch (err) {
          console.error('Ошибка при запросе workout_logs:', err);
        }

        // Загружаем воду за выбранный день
        let totalWater = 0;
        try {
          const { data: waterLogs, error: waterError } = await supabase
            .from('water_logs')
            .select('amount')
            .eq('user_id', user.id)
            .gte('created_at', new Date(dateStr).toISOString())
            .lt('created_at', new Date(new Date(dateStr).setDate(new Date(dateStr).getDate() + 1)).toISOString());
          if (waterError) {
            console.error('Ошибка загрузки water_logs:', waterError);
          } else if (waterLogs) {
            totalWater = waterLogs.reduce((sum, w) => sum + (w.amount || 0), 0);
          }
        } catch (err) {
          console.error('Ошибка при запросе water_logs:', err);
        }

        // Загружаем серию
        let streakVal = 0;
        try {
          await longPathStore.calculateStreak(user.id);
          streakVal = longPathStore.streak || 0;
          setStreak(streakVal);
        } catch (err) {
          console.error('Ошибка при загрузке серии:', err);
        }

        // Расчёт прогресса за неделю
        let progressPct = 0;
        try {
          const weekAgo = new Date(selectedDate);
          weekAgo.setDate(weekAgo.getDate() - 7);
          const { data: weekMeals, error: weekError } = await supabase
            .from('meals')
            .select('calories')
            .eq('user_id', user.id)
            .gte('date', weekAgo.toISOString().split('T')[0])
            .lte('date', dateStr);
          
          if (!weekError && weekMeals) {
            const weekCalories = weekMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
            const targetCalories = (profileData?.goal === 'lose' ? 2000 : profileData?.goal === 'gain' ? 3000 : 2500) * 7;
            progressPct = Math.min(Math.round((weekCalories / targetCalories) * 100), 100);
          }
        } catch (err) {
          console.error('Ошибка расчёта прогресса:', err);
        }

        // Устанавливаем цель калорий из профиля или по умолчанию
        const goalCalories = profileData?.goal ? 
          (profileData.goal === 'lose' ? 2000 : profileData.goal === 'gain' ? 3000 : 2500) : 2500;
        setCalorieGoal(goalCalories);

        setStats({
          calories: totalCalories,
          macros: {
            protein: { current: totalProtein, goal: 150 },
            fats: { current: totalFats, goal: 70 },
            carbs: { current: totalCarbs, goal: 300 },
          },
          water: totalWater / 1000,
          sleep: sleepHoursVal,
          workouts: workoutsCount,
          progress: progressPct,
        });
      } catch (error) {
        console.error('Критическая ошибка загрузки дашборда:', error);
        setStats({
          calories: 0,
          macros: {
            protein: { current: 0, goal: 150 },
            fats: { current: 0, goal: 70 },
            carbs: { current: 0, goal: 300 },
          },
          water: 0,
          sleep: 0,
          workouts: 0,
          progress: 0,
        });
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [user, selectedDate]);

  const handleWaterAdd = async (amount: number) => {
    if (!user) return;
    await waterStore.addWater(user.id, amount);
    setStats(prev => ({ ...prev, water: Math.round((prev.water + amount / 1000) * 10) / 10 }));
    setShowWaterModal(false);
  };

  const handleSleepSave = async () => {
    if (!user || !sleepHours) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      const { error } = await supabase.from('sleep_logs').insert({
        user_id: user.id,
        date: today,
        hours: parseFloat(sleepHours),
        quality: 80,
      });
      if (error) {
        console.error('Ошибка сохранения сна:', error);
        return;
      }
      setStats(prev => ({ ...prev, sleep: parseFloat(sleepHours) }));
    } catch (err) {
      console.error('Ошибка при сохранении сна:', err);
    }
    setShowSleepModal(false);
    setSleepHours('');
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div></div>;

  // Вычисляем процент выполнения калорий и определяем цвет круга
  const caloriePct = stats.calories / calorieGoal;
  const getCircleColor = () => {
    if (caloriePct <= 1) return '#22c55e';
    if (caloriePct <= 1.2) return '#eab308';
    return '#9ca3af';
  };
  const circleColor = getCircleColor();
  const remainingCalories = calorieGoal - stats.calories;

  // Функция для получения цвета макроса (как у YAZIO)
  const getMacroColor = (current: number, goal: number, baseColor: string, overColor: string) => {
    return current > goal ? overColor : baseColor;
  };

  return (
    <div className="p-4 max-w-4xl mx-auto animate-fade-in">
      {/* ШАПКА: Цитата дня, Приветствие, Цель */}
      <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '0s' }}>
        <p className="text-sm italic text-text-secondary mb-2">"{quote.text}"</p>
        <h1 className="text-2xl font-bold text-text mb-1">Привет, {user?.email?.split('@')[0] || 'Пользователь'}!</h1>
        <p className="text-sm text-text-secondary">
          {longPathStore.userGoals && longPathStore.userGoals.length > 0 ? (
            <>Цель: {longPathStore.userGoals[0].goal_type === 'strength' ? 'Сила' : longPathStore.userGoals[0].goal_type === 'cardio' ? 'Выносливость' : longPathStore.userGoals[0].goal_type === 'weight_loss' ? 'Похудение' : longPathStore.userGoals[0].goal_type === 'muscle_gain' ? 'Набор массы' : 'Поддержание'}</>
          ) : (
            <button onClick={() => navigate('/coach')} className="text-accent-blue hover:underline">Выберите свою цель</button>
          )}
        </p>
      </div>

      {/* ПЕРЕКЛЮЧЕНИЕ ДНЕЙ СО СТРЕЛКАМИ */}
      <div className="flex items-center justify-between mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <button
          onClick={() => {
            const prev = new Date(selectedDate);
            prev.setDate(prev.getDate() - 1);
            if (prev <= new Date()) setSelectedDate(prev);
          }}
          className="p-2 rounded-lg bg-bg-card hover:bg-bg-card-hover transition-colors"
          disabled={selectedDate >= new Date()}
        >
          <ChevronLeft size={20} className="text-text-secondary" />
        </button>
        <span className="text-sm font-medium text-text">
          {selectedDate.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => {
            const next = new Date(selectedDate);
            next.setDate(next.getDate() + 1);
            if (next <= new Date()) setSelectedDate(next);
          }}
          className="p-2 rounded-lg bg-bg-card hover:bg-bg-card-hover transition-colors"
          disabled={selectedDate >= new Date()}
        >
          <ChevronRightIcon size={20} className="text-text-secondary" />
        </button>
      </div>

      {/* КРУГОВОЙ ИНДИКАТОР КАЛОРИЙ */}
      <div className="card-modern mb-6 flex flex-col items-center py-6">
        <span className="text-sm text-text-secondary mb-2">Калории</span>
        <div className="relative inline-flex items-center justify-center" style={{ width: 140, height: 140 }}>
          <svg width={140} height={140} className="-rotate-90">
            <circle
              cx={70}
              cy={70}
              r={58}
              fill="none"
              stroke="#374151"
              strokeWidth={12}
            />
            <circle
              cx={70}
              cy={70}
              r={58}
              fill="none"
              stroke={circleColor}
              strokeWidth={12}
              strokeDasharray={2 * Math.PI * 58}
              strokeDashoffset={2 * Math.PI * 58 * (1 - Math.min(1, caloriePct))}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{stats.calories}</span>
            <span className="text-xs text-text-secondary">ккал</span>
          </div>
        </div>
        <span className="text-sm text-text-secondary mt-3">
          {remainingCalories >= 0 
            ? `Осталось ${remainingCalories} ккал` 
            : `Перевыполнено на ${Math.abs(remainingCalories)} ккал`}
        </span>
      </div>

      {/* ТРИ ПРОГРЕСС-БАРА МАКРОСОВ (как у YAZIO) */}
      <div className="card-modern mb-6 space-y-4">
        {/* Белки - #FF6B6B (красный) */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text font-medium">Белки</span>
            <span className="text-text-secondary">{Math.round(stats.macros.protein.current)} / {stats.macros.protein.goal} г</span>
          </div>
          <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stats.macros.protein.current / stats.macros.protein.goal) * 100, 100)}%`, backgroundColor: getMacroColor(stats.macros.protein.current, stats.macros.protein.goal, '#FF6B6B', '#ff4757') }}
            />
          </div>
        </div>

        {/* Жиры - #FECA57 (жёлтый) */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text font-medium">Жиры</span>
            <span className="text-text-secondary">{Math.round(stats.macros.fats.current)} / {stats.macros.fats.goal} г</span>
          </div>
          <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stats.macros.fats.current / stats.macros.fats.goal) * 100, 100)}%`, backgroundColor: getMacroColor(stats.macros.fats.current, stats.macros.fats.goal, '#FECA57', '#ffa502') }}
            />
          </div>
        </div>

        {/* Углеводы - #48DBFB (голубой) */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text font-medium">Углеводы</span>
            <span className="text-text-secondary">{Math.round(stats.macros.carbs.current)} / {stats.macros.carbs.goal} г</span>
          </div>
          <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stats.macros.carbs.current / stats.macros.carbs.goal) * 100, 100)}%`, backgroundColor: getMacroColor(stats.macros.carbs.current, stats.macros.carbs.goal, '#48DBFB', '#0abde3') }}
            />
          </div>
        </div>
      </div>

      {/* КАРТОЧКА ВОДЫ С КНОПКОЙ + */}
      <div className="card-modern mb-6 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Droplet size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-secondary">Вода</p>
            <p className="text-xl font-bold text-text">{Math.round(stats.water * 1000)} мл</p>
          </div>
        </div>
        <button
          onClick={() => setShowWaterModal(true)}
          className="w-10 h-10 rounded-full bg-accent-blue hover:bg-accent-blue/80 flex items-center justify-center transition-colors"
        >
          <Plus size={20} className="text-white" />
        </button>
      </div>

      {/* ЧЕТЫРЕ КАРТОЧКИ: Сон, Тренировки, Прогресс */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {/* Сон */}
        <div 
          className="card-modern p-5 bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 rounded-2xl shadow-lg cursor-pointer active:scale-[0.98] transition-transform duration-100"
          onClick={() => setShowSleepModal(true)}
          style={{ animationDelay: '0.2s' }}
        >
          <Moon size={24} className="text-indigo-500 mb-3" />
          <p className="text-xs font-medium text-text-secondary mb-1">Сон</p>
          <p className="text-2xl font-bold text-text">{stats.sleep > 0 ? `${stats.sleep}` : <span className="text-sm">Запиши сон</span>}</p>
        </div>

        {/* Тренировки */}
        <div 
          className="card-modern p-5 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-2xl shadow-lg cursor-pointer active:scale-[0.98] transition-transform duration-100"
          onClick={() => navigate('/workouts')}
          style={{ animationDelay: '0.3s' }}
        >
          <Dumbbell size={24} className="text-green-500 mb-3" />
          <p className="text-xs font-medium text-text-secondary mb-1">Тренировки</p>
          <p className="text-2xl font-bold text-text">{stats.workouts > 0 ? stats.workouts : <span className="text-sm">Начни первую тренировку</span>}</p>
        </div>

        {/* Прогресс */}
        <div 
          className="card-modern p-5 bg-gradient-to-br from-accent-blue/10 to-accent-blue/5 rounded-2xl shadow-lg active:scale-[0.98] transition-transform duration-100"
          style={{ animationDelay: '0.4s' }}
        >
          <Target size={24} className="text-accent-blue mb-3" />
          <p className="text-xs font-medium text-text-secondary mb-1">Прогресс</p>
          <p className="text-2xl font-bold text-text">{stats.progress > 0 ? `${stats.progress}%` : <span className="text-sm">—</span>}</p>
        </div>
      </div>

      {/* Рекомендация по биоритмам */}
      {cycleRecommendation && (
        <div className="card-modern mb-6 bg-gradient-to-r from-accent-purple/5 to-transparent border-accent-purple/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-accent-purple" />
            <p className="text-text font-semibold text-sm">Биоритмы сегодня</p>
          </div>
          <p className="text-text-secondary text-sm">{cycleRecommendation}</p>
        </div>
      )}

      {/* Календарь активности (GitHub-style) */}
      <div className="card-modern mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-text font-semibold">Активность</h3>
          <span className="text-text-secondary text-xs">Серия: {longPathStore.streak} дн.</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {longPathStore.activityCalendar.slice(-28).map((day, idx) => (
            <div
              key={day.date}
              className={`aspect-square rounded-sm ${
                day.hasWorkout 
                  ? 'bg-accent-green/60 hover:bg-accent-green transition-colors' 
                  : 'bg-bg-tertiary'
              }`}
              title={`${day.date}: ${day.hasWorkout ? (day.exercises?.join(', ') || 'Тренировка') : 'Отдых'}`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-secondary">
          <span>4 недели назад</span>
          <span>Сегодня</span>
        </div>
      </div>

      {/* Приветствие и цель - под шапкой */}
      <div className="card-modern mb-6 bg-gradient-to-r from-accent-blue/5 to-transparent border-accent-blue/20">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-text font-semibold">Цель: {profile?.goal || 'Не выбрана'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Target size={18} className="text-accent-blue" />
            <span className="text-sm text-text-secondary">{profile?.weight ? `${profile.weight} кг` : '—'}</span>
          </div>
        </div>
      </div>

      {/* КАРТОЧКА СЕРИИ - ОДИН БЛОК ВНИЗУ */}
      <div className="card-modern mb-6">
        <p className="text-sm text-text-secondary mb-1">Серия тренировок: {longPathStore.streak} дней</p>
      </div>

      {/* Модальное окно для воды с выбором своего значения */}
      {showWaterModal && (
        <Modal onClose={() => setShowWaterModal(false)} title="Добавить воду">
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">Выберите количество:</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleWaterAdd(200)} className="btn-secondary py-3">
                🥛 200 мл
              </button>
              <button onClick={() => handleWaterAdd(500)} className="btn-secondary py-3">
                🍶 500 мл
              </button>
              <button onClick={() => handleWaterAdd(1000)} className="btn-secondary py-3">
                🪣 1 л
              </button>
              <button onClick={() => {
                const amount = prompt('Введите количество воды (мл):', '250');
                if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
                  handleWaterAdd(Number(amount));
                }
              }} className="btn-secondary py-3">
                ✏️ Своё значение
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowWaterModal(false)} className="btn-secondary flex-1 py-2.5">
                ✕ Отмена
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Модальное окно для сна */}
      {showSleepModal && (
        <Modal onClose={() => setShowSleepModal(false)} title="Записать сон">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-text-secondary">
              Сколько часов вы спали?
            </label>
            <input
              type="number"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="Например: 7.5"
              step="0.5"
              min="0"
              max="24"
              className="input-field w-full px-3 py-2.5"
            />
            <div className="flex gap-3 pt-2">
              <button onClick={handleSleepSave} className="btn-primary flex-1 py-2.5">
                Сохранить
              </button>
              <button onClick={() => setShowSleepModal(false)} className="btn-secondary flex-1 py-2.5">
                Отмена
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}