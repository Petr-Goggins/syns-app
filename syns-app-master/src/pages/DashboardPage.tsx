import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useWaterStore } from '@/store/waterStore';
import { useLongPathStore } from '@/store/longPathStore';
import { useWorkoutLogStore } from '@/store/workoutLogStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, Dumbbell, Utensils, Moon, Droplet, Target, Award, TrendingUp, Zap, Clock, Plus, ChevronRight, X } from 'lucide-react';
import { getPhaseRecommendation } from '@/lib/cycle';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Modal from '@/components/Modal';
import CircularProgress from '@/components/CircularProgress';

export default function DashboardPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const waterStore = useWaterStore();
  const longPathStore = useLongPathStore();
  const workoutLogStore = useWorkoutLogStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    weight: 0,
    calories: 0,
    water: 0,
    sleep: 0,
    workouts: 0,
    goal: 'Поддержание',
    progress: 0,
    streak: 0,
  });
  const [cycleRecommendation, setCycleRecommendation] = useState<string | null>(null);
  const [waterAmount, setWaterAmount] = useState(200);
  const [forecastData, setForecastData] = useState<any[]>([]);
  
  // Модальное окно для добавления воды
  const [showWaterModal, setShowWaterModal] = useState(false);
  
  // Модальное окно для сна
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [sleepHours, setSleepHours] = useState('');
  
  useEffect(() => {
    if (!user) return;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('weight, goal, cycle_phase, cycle_last_period, cycle_length')
          .eq('id', user.id)
          .single();

        // Рекомендация по биоритмам
        if (profile?.cycle_phase && profile.cycle_phase !== 'not_specified') {
          const rec = getPhaseRecommendation(profile.cycle_phase as any);
          setCycleRecommendation(rec.recommendation);
        }

        const today = new Date().toISOString().split('T')[0];
        const { data: meals } = await supabase
          .from('meals')
          .select('calories')
          .eq('user_id', user.id)
          .eq('date', today);
        const totalCalories = meals?.reduce((sum, m) => sum + (m.calories || 0), 0) || 0;

        const { data: sleep } = await supabase
          .from('sleep_logs')
          .select('hours')
          .eq('user_id', user.id)
          .eq('date', today)
          .single();
        const sleepHours = sleep?.hours || 0;

        const { count: workoutsCount } = await supabase
          .from('workout_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('log_date', today);

        // Загружаем воду из store
        await waterStore.fetchToday(user.id);
        const totalWater = waterStore.todayAmount;

        // Загружаем серию и календарь активности
        await longPathStore.calculateStreak(user.id);
        await longPathStore.fetchActivityCalendar(user.id, 1);

        // Загружаем историю тренировок для прогноза
        await workoutLogStore.fetchLogs(user.id);

        // Генерируем прогноз на неделю на основе истории
        const forecast = generateWeekForecast(workoutLogStore.logs);
        setForecastData(forecast);

        setStats({
          weight: profile?.weight || 0,
          calories: totalCalories,
          water: totalWater / 1000,
          sleep: sleepHours,
          workouts: workoutsCount || 0,
          goal: profile?.goal || 'Поддержание',
          progress: 65,
          streak: longPathStore.streak,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [user]);

  // Генерация прогноза на неделю (на основе истории тренировок)
  const generateWeekForecast = (logs: any[]) => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const today = new Date();
    
    // Если нет логов, возвращаем пустой прогноз
    if (!logs || logs.length === 0) {
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
        return {
          day: dayName,
          date: date.toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
          activity: 0,
          isToday: i === 0,
          volume: 0,
        };
      });
    }

    // 1. Анализируем последние тренировки (берем до 10 последних)
    const recentLogs = [...logs]
      .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())
      .slice(0, 10);

    // 2. Считаем объем каждой тренировки (Weight * Reps * Sets)
    const volumes = recentLogs.map((log) => {
      const totalVolume = log.exercises.reduce((acc: number, ex: any) => {
        return acc + (ex.weight || 0) * (ex.reps || 0) * (ex.sets || 0);
      }, 0);
      return {
        date: new Date(log.log_date).getTime(),
        volume: totalVolume,
        dayOfWeek: new Date(log.log_date).getDay(),
      };
    });

    // 3. Вычисляем средний объем и тренд
    const avgVolume = volumes.reduce((acc, curr) => acc + curr.volume, 0) / volumes.length;
    
    // Простая линейная регрессия для наклона тренда
    let slope = 0;
    if (volumes.length > 1) {
      const n = volumes.length;
      const sumX = volumes.reduce((acc, _, i) => acc + i, 0);
      const sumY = volumes.reduce((acc, v) => acc + v.volume, 0);
      const sumXY = volumes.reduce((acc, v, i) => acc + i * v.volume, 0);
      const sumXX = volumes.reduce((acc, _, i) => acc + i * i, 0);
      
      slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    // 4. Определяем частоту тренировок (какие дни недели активны)
    const activeDaysOfWeek = new Set<number>();
    recentLogs.forEach(log => {
      activeDaysOfWeek.add(new Date(log.log_date).getDay()); // 0 = Sun, 1 = Mon...
    });
    
    // Если мало данных, предполагаем стандартный график (Пн, Ср, Пт) или просто каждые 2 дня
    const likelyFrequency = activeDaysOfWeek.size >= 2 
      ? Array.from(activeDaysOfWeek) 
      : [1, 3, 5]; // По умолчанию Пн, Ср, Пт

    // 5. Генерируем прогноз на 7 дней вперед
    const forecast = [];
    
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      
      const dayOfWeek = nextDate.getDay();
      const dayName = days[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
      const isTrainingDay = likelyFrequency.includes(dayOfWeek);
      
      // Базовый объем + тренд + небольшой рандом для реалистичности
      let predictedVolume = 0;
      if (isTrainingDay) {
        // Применяем тренд: slope * (количество шагов вперед)
        const trendAdjustment = slope * (i * 0.3); 
        predictedVolume = Math.max(0, avgVolume + trendAdjustment);
        
        // Добавляем вариативность (±10%)
        const variance = predictedVolume * 0.1;
        predictedVolume = predictedVolume + (Math.random() * variance * 2 - variance);
      }

      // Нормализуем объем в проценты активности (для графика)
      const maxVol = Math.max(...volumes.map(v => v.volume), avgVolume * 1.5);
      const activityPercent = maxVol > 0 ? Math.min(Math.round((predictedVolume / maxVol) * 100), 100) : 0;

      forecast.push({
        day: dayName,
        date: nextDate.toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
        activity: activityPercent,
        volume: Math.round(predictedVolume),
        isToday: i === 0,
      });
    }

    return forecast;
  };

  const handleWaterAdd = async (amount: number) => {
    if (!user) return;
    await waterStore.addWater(user.id, amount);
    setStats(prev => ({ ...prev, water: Math.round((prev.water + amount / 1000) * 10) / 10 }));
    setShowWaterModal(false);
  };

  const handleSleepSave = async () => {
    if (!user || !sleepHours) return;
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('sleep_logs').insert({
      user_id: user.id,
      date: today,
      hours: parseFloat(sleepHours),
      quality: 80,
    });
    setStats(prev => ({ ...prev, sleep: parseFloat(sleepHours) }));
    setShowSleepModal(false);
    setSleepHours('');
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div></div>;

  const waterPercent = Math.min((waterAmount / 3000) * 100, 100);
  const rangeStyle = (percent: number) => ({
    background: `linear-gradient(to right, #58A6FF 0%, #58A6FF ${percent}%, #374151 ${percent}%, #374151 100%)`,
  });

  return (
    <div className="p-4 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text">Главная</h1>
        <span className="text-sm text-text-secondary">{new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>

      {/* Круговой индикатор калорий */}
      <div className="card-modern mb-6 flex justify-center py-6">
        <CircularProgress current={1850} goal={2500} size={180} strokeWidth={14} label="1850/2500" />
      </div>
      <div className="text-center mb-6">
        <p className="text-text-secondary text-sm">Осталось калорий: <span className="text-accent-blue font-semibold">650</span></p>
      </div>

      {/* Блок выбора глобальной цели */}
      <div className="card-modern mb-6 bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 border-accent-blue/30">
        {!longPathStore.userGoals || longPathStore.userGoals.length === 0 ? (
          <div className="flex flex-col items-center text-center py-4">
            <Target size={40} className="text-accent-blue mb-3" />
            <p className="text-text font-semibold text-lg mb-2">Выбери свою цель</p>
            <p className="text-text-secondary text-sm mb-4">Определи направление движения к лучшей версии себя</p>
            <button 
              onClick={() => navigate('/coach')}
              className="btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2"
            >
              Начать путь <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="py-2">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-text-secondary text-xs uppercase tracking-wide">Глобальная цель</p>
                <h3 className="text-xl font-bold text-text flex items-center gap-2">
                  <Award size={20} className="text-accent-gold" />
                  {longPathStore.userGoals[0]?.goal_type === 'strength' ? 'Сила' : 
                   longPathStore.userGoals[0]?.goal_type === 'cardio' ? 'Выносливость' : 
                   longPathStore.userGoals[0]?.goal_type === 'weight_loss' ? 'Похудение' : 'Масса'}
                </h3>
              </div>
              <button 
                onClick={() => navigate('/coach')}
                className="text-accent-blue text-sm hover:underline flex items-center gap-1"
              >
                Изменить <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                  <span>Уровень {longPathStore.currentLevelIndex + 1}</span>
                  <span>{Math.round(longPathStore.progressToNextLevel)}%</span>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-accent-blue to-accent-purple h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${longPathStore.progressToNextLevel}%` }} 
                  />
                </div>
              </div>
            </div>
            <p className="text-text-secondary text-xs">
              До следующей ступени: {longPathStore.goalLevels[longPathStore.currentLevelIndex + 1]?.targetValue || 'Финиш'} {longPathStore.userGoals[0]?.goal_unit}
            </p>
          </div>
        )}
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

      {/* Прогноз на неделю */}
      <div className="card-modern mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-text font-semibold flex items-center gap-2">
            <TrendingUp size={18} className="text-accent-blue" />
            Прогноз активности
          </h3>
          <span className="text-text-secondary text-xs">7 дней</span>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11, fill: '#9ca3af' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  background: '#1f2937', 
                  border: '1px solid #374151', 
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`${value}%`, 'Активность']}
                labelFormatter={(label) => `День: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="activity" 
                stroke="#58A6FF" 
                strokeWidth={2} 
                dot={{ r: 3, fill: '#58A6FF' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Цитата дня */}
      <div className="card-modern mb-6 bg-gradient-to-r from-accent-blue/5 to-transparent border-accent-blue/20 text-center py-4">
        <p className="text-text italic">"Маленькие шаги ведут к большим результатам!"</p>
        <p className="text-text-secondary text-sm">— Мотивация дня</p>
      </div>

      {/* Отдельные карточки метрик с кнопками "Начать" */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Калории */}
        <div 
          className="card-modern p-4 bg-gradient-to-br from-accent-orange/10 to-transparent border-accent-orange/20 cursor-pointer hover:border-accent-orange/50 transition-colors"
          onClick={() => navigate('/nutrition')}
        >
          <div className="flex items-center justify-between mb-2">
            <Utensils size={20} className="text-accent-orange" />
            <span className="text-xs text-text-secondary">ккал</span>
          </div>
          <p className="text-2xl font-bold text-text">{stats.calories > 0 ? stats.calories : '—'}</p>
          <p className="text-xs text-text-secondary mt-1">
            {stats.calories === 0 ? (
              <span className="text-accent-orange font-medium">+ Добавь первый приём пищи</span>
            ) : 'Сегодня'}
          </p>
        </div>

        {/* Вода */}
        <div 
          className="card-modern p-4 bg-gradient-to-br from-accent-blue/10 to-transparent border-accent-blue/20 cursor-pointer hover:border-accent-blue/50 transition-colors"
          onClick={() => setShowWaterModal(true)}
        >
          <div className="flex items-center justify-between mb-2">
            <Droplet size={20} className="text-accent-blue" />
            <Plus size={16} className="text-accent-blue" />
          </div>
          <p className="text-2xl font-bold text-text">{stats.water > 0 ? `${stats.water.toFixed(1)}` : '—'}</p>
          <p className="text-xs text-text-secondary mt-1">
            {stats.water === 0 ? (
              <span className="text-accent-blue font-medium">+ Выпей стакан воды</span>
            ) : 'Сегодня'}
          </p>
        </div>

        {/* Сон */}
        <div 
          className="card-modern p-4 bg-gradient-to-br from-accent-purple/10 to-transparent border-accent-purple/20 cursor-pointer hover:border-accent-purple/50 transition-colors"
          onClick={() => setShowSleepModal(true)}
        >
          <div className="flex items-center justify-between mb-2">
            <Moon size={20} className="text-accent-purple" />
            <span className="text-xs text-text-secondary">часы</span>
          </div>
          <p className="text-2xl font-bold text-text">{stats.sleep > 0 ? `${stats.sleep}` : '—'}</p>
          <p className="text-xs text-text-secondary mt-1">
            {stats.sleep === 0 ? (
              <span className="text-accent-purple font-medium">+ Запиши сон</span>
            ) : 'Сегодня'}
          </p>
        </div>

        {/* Тренировки */}
        <div 
          className="card-modern p-4 bg-gradient-to-br from-accent-green/10 to-transparent border-accent-green/20 cursor-pointer hover:border-accent-green/50 transition-colors"
          onClick={() => navigate('/workouts')}
        >
          <div className="flex items-center justify-between mb-2">
            <Dumbbell size={20} className="text-accent-green" />
            <span className="text-xs text-text-secondary">тренировки</span>
          </div>
          <p className="text-2xl font-bold text-text">{stats.workouts > 0 ? stats.workouts : '—'}</p>
          <p className="text-xs text-text-secondary mt-1">
            {stats.workouts === 0 ? (
              <span className="text-accent-green font-medium">+ Начни первую тренировку</span>
            ) : 'Сегодня'}
          </p>
        </div>
      </div>

      {/* Прогресс и Серия в одной строке */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card-modern p-4 bg-gradient-to-br from-accent-blue/10 to-transparent border-accent-blue/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-accent-blue" />
            <span className="text-sm text-text-secondary">Прогресс</span>
          </div>
          <p className="text-2xl font-bold text-text">{stats.progress}%</p>
          <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-2">
            <div className="bg-accent-blue h-1.5 rounded-full transition-all duration-700" style={{ width: `${stats.progress}%` }} />
          </div>
        </div>

        <div className="card-modern p-4 bg-gradient-to-br from-accent-gold/10 to-transparent border-accent-gold/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} className="text-accent-gold" />
            <span className="text-sm text-text-secondary">Серия</span>
          </div>
          <p className="text-2xl font-bold text-text">{stats.streak}</p>
          <p className="text-xs text-text-secondary mt-1">дней подряд</p>
        </div>
      </div>

      {/* Приветствие и цель (упрощённый блок) */}
      <div className="card-modern mb-6 bg-gradient-to-r from-accent-blue/5 to-transparent border-accent-blue/20">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-text font-semibold">Привет, {user?.email?.split('@')[0] || 'Пользователь'}!</p>
            <p className="text-text-secondary text-sm mt-1">Цель: {stats.goal}</p>
          </div>
          <div className="flex items-center gap-2">
            <Target size={18} className="text-accent-blue" />
            <span className="text-sm text-text-secondary">{stats.weight} кг</span>
          </div>
        </div>
      </div>

      {/* Добавление воды */}
      <div className="card-modern mt-6">
        <p className="text-text-secondary text-sm mb-2">Добавить воду</p>
        <div className="flex items-center gap-3 mb-3">
          <input
            type="range"
            min="0"
            max="3000"
            step="50"
            value={waterAmount}
            onChange={(e) => setWaterAmount(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-all"
            style={rangeStyle(waterPercent)}
          />
          <span className="text-text font-medium min-w-[60px] text-right">{waterAmount} мл</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleWaterAdd(waterAmount)} className="btn-primary flex-1 py-2">
            Добавить
          </button>
          <button onClick={() => { setWaterAmount(200); setShowWaterModal(true); }} className="btn-secondary flex-1 py-2">+200</button>
          <button onClick={() => { setWaterAmount(500); setShowWaterModal(true); }} className="btn-secondary flex-1 py-2">+500</button>
          <button onClick={() => { setWaterAmount(1000); setShowWaterModal(true); }} className="btn-secondary flex-1 py-2">+1 л</button>
        </div>
      </div>

      {/* Модальное окно для воды */}
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
              <button onClick={() => setShowWaterModal(false)} className="btn-secondary py-3">
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