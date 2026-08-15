import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Dumbbell, Flame, Moon, Activity, AlertCircle } from 'lucide-react';

type Period = 'week' | 'month' | 'year';

interface WeightData {
  date: string;
  weight: number;
}

interface OnePMData {
  date: string;
  onePM: number;
}

interface CalorieData {
  date: string;
  calories: number;
}

interface SleepData {
  date: string;
  hours: number;
}

interface Metrics {
  totalWorkouts: number;
  totalVolume: number;
  avgCalories: number;
  avgSleep: number;
}

const EXERCISES = ['Присед', 'Жим лёжа', 'Становая', 'Жим гантелей', 'Тяга штанги', 'Подтягивания'];

export default function ProgressPage() {
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<Period>('month');
  const [selectedExercise, setSelectedExercise] = useState<string>('Присед');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [weightData, setWeightData] = useState<WeightData[]>([]);
  const [onePMData, setOnePMData] = useState<OnePMData[]>([]);
  const [calorieData, setCalorieData] = useState<CalorieData[]>([]);
  const [sleepData, setSleepData] = useState<SleepData[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ totalWorkouts: 0, totalVolume: 0, avgCalories: 0, avgSleep: 0 });
  const [aiInsight, setAiInsight] = useState<string>('');

  if (!user) {
    return <div className="p-4">Пожалуйста, войдите в аккаунт.</div>;
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchWeightData(user.id, period),
          fetchOnePMData(user.id, period, selectedExercise),
          fetchCalorieData(user.id, period),
          fetchSleepData(user.id, period),
          fetchMetrics(user.id, period),
        ]);
      } catch (err) {
        setError('Ошибка загрузки данных');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, period, selectedExercise]);

  // Generate AI insight based on data
  useEffect(() => {
    if (weightData.length >= 2) {
      const firstWeight = weightData[0].weight;
      const lastWeight = weightData[weightData.length - 1].weight;
      const diff = lastWeight - firstWeight;
      
      if (diff < -0.5) {
        setAiInsight(`Вы сбросили ${Math.abs(diff).toFixed(1)} кг за период. Отличная работа!`);
      } else if (diff > 0.5) {
        setAiInsight(`Вы набрали ${diff.toFixed(1)} кг за период. Продолжайте в том же духе!`);
      } else {
        setAiInsight('Ваш вес стабилен. Хорошая работа по поддержанию формы!');
      }
    } else if (onePMData.length >= 2) {
      const firstPM = onePMData[0].onePM;
      const lastPM = onePMData[onePMData.length - 1].onePM;
      const diff = lastPM - firstPM;
      
      if (diff > 2) {
        setAiInsight(`Ваш 1ПМ в упражнении "${selectedExercise}" вырос на ${diff.toFixed(1)} кг. Прогресс очевиден!`);
      } else {
        setAiInsight('Продолжайте тренироваться для улучшения результатов.');
      }
    } else {
      setAiInsight('Данных за выбранный период недостаточно. Заполните дневник питания и тренировок.');
    }
  }, [weightData, onePMData, selectedExercise]);

  const fetchWeightData = async (userId: string, p: Period) => {
    const startDate = getStartDate(p);
    const { data, error } = await supabase
      .from('profiles')
      .select('weight, updated_at')
      .eq('id', userId)
      .gte('updated_at', startDate)
      .order('updated_at', { ascending: true });

    if (error || !data || data.length === 0) {
      // Try body_measurements if profiles has no data
      const { data: bmData } = await supabase
        .from('body_measurements')
        .select('weight, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });
      
      if (bmData && bmData.length > 0) {
        setWeightData(bmData.map(d => ({ date: d.created_at.split('T')[0], weight: d.weight })));
      } else {
        setWeightData([]);
      }
    } else {
      setWeightData(data.map(d => ({ date: d.updated_at.split('T')[0], weight: d.weight })));
    }
  };

  const fetchOnePMData = async (userId: string, p: Period, exercise: string) => {
    const startDate = getStartDate(p);
    const { data, error } = await supabase
      .from('workout_logs')
      .select('log_date, weight, reps')
      .eq('user_id', userId)
      .ilike('exercise_name', `%${exercise}%`)
      .gte('log_date', startDate)
      .order('log_date', { ascending: true });

    if (error || !data || data.length === 0) {
      setOnePMData([]);
      return;
    }

    // Calculate 1PM: weight * (1 + reps / 30)
    const onePMPoints = data.map(d => ({
      date: d.log_date,
      onePM: parseFloat((d.weight * (1 + d.reps / 30)).toFixed(2)),
    }));

    // Group by date and take max 1PM per day
    const grouped: Record<string, number> = {};
    onePMPoints.forEach(p => {
      if (!grouped[p.date] || p.onePM > grouped[p.date]) {
        grouped[p.date] = p.onePM;
      }
    });

    setOnePMData(Object.entries(grouped).map(([date, onePM]) => ({ date, onePM })));
  };

  const fetchCalorieData = async (userId: string, p: Period) => {
    const startDate = getStartDate(p);
    const { data, error } = await supabase
      .from('nutrition_log')
      .select('log_date, calories')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .order('log_date', { ascending: true });

    if (error || !data || data.length === 0) {
      setCalorieData([]);
      return;
    }

    // Sum calories per day
    const daily: Record<string, number> = {};
    data.forEach(d => {
      daily[d.log_date] = (daily[d.log_date] || 0) + d.calories;
    });

    setCalorieData(Object.entries(daily).map(([date, calories]) => ({ date, calories })));
  };

  const fetchSleepData = async (userId: string, p: Period) => {
    const startDate = getStartDate(p);
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('log_date, hours')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .order('log_date', { ascending: true });

    if (error || !data || data.length === 0) {
      setSleepData([]);
      return;
    }

    setSleepData(data.map(d => ({ date: d.log_date, hours: d.hours })));
  };

  const fetchMetrics = async (userId: string, p: Period) => {
    const startDate = getStartDate(p);
    
    // Total workouts
    const { count: workoutCount } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('log_date', startDate);

    // Total volume (weight × sets × reps)
    const { data: volumeData } = await supabase
      .from('workout_logs')
      .select('weight, sets, reps')
      .eq('user_id', userId)
      .gte('log_date', startDate);

    const totalVolume = volumeData?.reduce((sum, d) => sum + (d.weight * d.sets * d.reps), 0) || 0;

    // Avg calories
    const { data: calorieData } = await supabase
      .from('nutrition_log')
      .select('calories')
      .eq('user_id', userId)
      .gte('log_date', startDate);

    const avgCalories = calorieData && calorieData.length > 0
      ? Math.round(calorieData.reduce((sum, d) => sum + d.calories, 0) / calorieData.length)
      : 0;

    // Avg sleep
    const { data: sleepData } = await supabase
      .from('sleep_logs')
      .select('hours')
      .eq('user_id', userId)
      .gte('log_date', startDate);

    const avgSleep = sleepData && sleepData.length > 0
      ? parseFloat((sleepData.reduce((sum, d) => sum + d.hours, 0) / sleepData.length).toFixed(1))
      : 0;

    setMetrics({
      totalWorkouts: workoutCount || 0,
      totalVolume: Math.round(totalVolume),
      avgCalories,
      avgSleep,
    });
  };

  const getStartDate = (p: Period): string => {
    const now = new Date();
    if (p === 'week') {
      now.setDate(now.getDate() - 7);
    } else if (p === 'month') {
      now.setMonth(now.getMonth() - 1);
    } else if (p === 'year') {
      now.setFullYear(now.getFullYear() - 1);
    }
    return now.toISOString().split('T')[0];
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (period === 'week') {
      return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    } else if (period === 'month') {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    } else {
      return date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-8 bg-bg-tertiary rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-bg-tertiary rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-bg-tertiary rounded-2xl animate-pulse" />
        <div className="h-64 bg-bg-tertiary rounded-2xl animate-pulse" />
        <div className="h-64 bg-bg-tertiary rounded-2xl animate-pulse" />
        <div className="h-64 bg-bg-tertiary rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle size={48} className="text-accent-blue mb-4" />
        <p className="text-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto animate-fade-in">
      {/* Header with period selector */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <TrendingUp className="text-accent-blue" size={28} />
          Прогресс
        </h1>
        <div className="flex gap-2 bg-bg-secondary p-1 rounded-xl">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p
                  ? 'bg-accent-blue text-white shadow-lg'
                  : 'text-text-secondary hover:text-text'
              }`}
            >
              {p === 'week' ? 'Неделя' : p === 'month' ? 'Месяц' : 'Год'}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={<Activity size={20} className="text-accent-blue" />}
          label="Всего тренировок"
          value={metrics.totalWorkouts.toString()}
        />
        <MetricCard
          icon={<Dumbbell size={20} className="text-accent-green" />}
          label="Общий объём (кг)"
          value={metrics.totalVolume.toLocaleString()}
        />
        <MetricCard
          icon={<Flame size={20} className="text-accent-orange" />}
          label="Средняя калорийность"
          value={`${metrics.avgCalories} ккал`}
        />
        <MetricCard
          icon={<Moon size={20} className="text-accent-purple" />}
          label="Средний сон"
          value={`${metrics.avgSleep} ч`}
        />
      </div>

      {/* Chart 1: Body weight */}
      <div className="card-modern mb-6">
        <h3 className="text-lg font-semibold text-text mb-4">Изменение веса за выбранный период</h3>
        {weightData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weightData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={2} name="Вес (кг)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartMessage />
        )}
      </div>

      {/* Chart 2: 1PM progress */}
      <div className="card-modern mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-text">Прогресс 1ПМ (кг)</h3>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="bg-bg-tertiary text-text px-3 py-2 rounded-lg text-sm border border-border focus:outline-none focus:border-accent-blue"
          >
            {EXERCISES.map(ex => (
              <option key={ex} value={ex}>{ex}</option>
            ))}
          </select>
        </div>
        {onePMData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={onePMData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="onePM" stroke="#10B981" strokeWidth={2} name="1ПМ (кг)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartMessage />
        )}
      </div>

      {/* Chart 3: Calories */}
      <div className="card-modern mb-6">
        <h3 className="text-lg font-semibold text-text mb-4">Калорийность за день</h3>
        {calorieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={calorieData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="calories" fill="#F97316" name="Калории (ккал)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartMessage />
        )}
      </div>

      {/* Chart 4: Sleep */}
      <div className="card-modern mb-6">
        <h3 className="text-lg font-semibold text-text mb-4">Продолжительность сна (часы)</h3>
        {sleepData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sleepData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={[0, 12]} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="hours" fill="#A855F7" name="Сон (часы)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartMessage />
        )}
      </div>

      {/* AI Insight block */}
      <div className="card-modern bg-gradient-to-r from-accent-blue/10 to-accent-purple/10 border-accent-blue/30">
        <h3 className="text-lg font-semibold text-text mb-2">Ваш прогресс за период</h3>
        <p className="text-text">{aiInsight}</p>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-modern bg-bg-card p-4 rounded-2xl shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-text-secondary text-xs">{label}</span>
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  );
}

function EmptyChartMessage() {
  return (
    <div className="h-[280px] flex items-center justify-center text-text-secondary">
      <p>Нет данных для отображения</p>
    </div>
  );
}
