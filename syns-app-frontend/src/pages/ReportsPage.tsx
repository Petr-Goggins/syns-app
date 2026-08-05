import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Utensils, Dumbbell, Moon, Loader2 } from 'lucide-react';

type Period = 'day' | 'week' | 'month';

export default function ReportsPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<Period>('week');
  const [loading, setLoading] = useState(true);
  const [calorieData, setCalorieData] = useState<any[]>([]);
  const [workoutData, setWorkoutData] = useState<any[]>([]);
  const [sleepData, setSleepData] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalCalories: 0,
    totalWorkouts: 0,
    avgSleep: 0,
    avgIntensity: 0,
  });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      if (period === 'day') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      else if (period === 'week') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = now.toISOString().split('T')[0];

      // 1. Калории по дням
      const { data: meals } = await supabase
        .from('meals')
        .select('calories, date')
        .eq('user_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true });

      const calorieMap: Record<string, number> = {};
      meals?.forEach((m) => {
        const d = m.date;
        calorieMap[d] = (calorieMap[d] || 0) + (m.calories || 0);
      });
      const calData = Object.keys(calorieMap).map((d) => ({
        date: d.slice(5),
        calories: calorieMap[d],
      }));
      setCalorieData(calData);

      // 2. Тренировки (подходы)
      const { data: workouts } = await supabase
        .from('workout_logs')
        .select('sets, intensity, date')
        .eq('user_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true });

      const workoutMap: Record<string, { sets: number; intensity: number; count: number }> = {};
      workouts?.forEach((w) => {
        const d = w.date;
        if (!workoutMap[d]) workoutMap[d] = { sets: 0, intensity: 0, count: 0 };
        workoutMap[d].sets += w.sets || 0;
        workoutMap[d].intensity += w.intensity || 0;
        workoutMap[d].count += 1;
      });
      const wData = Object.keys(workoutMap).map((d) => ({
        date: d.slice(5),
        sets: workoutMap[d].sets,
        intensity: Math.round(workoutMap[d].intensity / workoutMap[d].count),
      }));
      setWorkoutData(wData);

      // 3. Сон
      const { data: sleeps } = await supabase
        .from('sleep_logs')
        .select('hours, date')
        .eq('user_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true });

      const sleepMap: Record<string, number> = {};
      sleeps?.forEach((s) => {
        const d = s.date;
        sleepMap[d] = (sleepMap[d] || 0) + (s.hours || 0);
      });
      const sData = Object.keys(sleepMap).map((d) => ({
        date: d.slice(5),
        hours: sleepMap[d],
      }));
      setSleepData(sData);

      // 4. Сводка
      const totalCal = calData.reduce((acc, d) => acc + d.calories, 0);
      const totalW = workouts?.length || 0;
      const totalHours = sleeps?.reduce((acc, s) => acc + (s.hours || 0), 0) || 0;
      const avgH = sleeps?.length ? totalHours / sleeps.length : 0;
      const totalIntensity = workouts?.reduce((acc, w) => acc + (w.intensity || 0), 0) || 0;
      const avgInt = workouts?.length ? Math.round(totalIntensity / workouts.length) : 0;

      setSummary({
        totalCalories: totalCal,
        totalWorkouts: totalW,
        avgSleep: Math.round(avgH * 10) / 10,
        avgIntensity: avgInt,
      });
    } catch (error) {
      console.error('Ошибка загрузки отчётов:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-accent-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text">Статистика</h1>
        <div className="flex gap-2 bg-bg-secondary p-1 rounded-lg border border-border">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                period === p ? 'bg-accent-blue text-bg shadow' : 'text-text-secondary hover:text-text'
              }`}
            >
              {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
            </button>
          ))}
        </div>
      </div>

      {/* Карточки сводки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-secondary p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <Utensils size={24} className="text-accent-orange" />
          <div>
            <p className="text-text-secondary text-xs">Калории</p>
            <p className="text-text font-bold">{summary.totalCalories} ккал</p>
          </div>
        </div>
        <div className="bg-bg-secondary p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <Dumbbell size={24} className="text-accent-green" />
          <div>
            <p className="text-text-secondary text-xs">Тренировки</p>
            <p className="text-text font-bold">{summary.totalWorkouts}</p>
          </div>
        </div>
        <div className="bg-bg-secondary p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <Moon size={24} className="text-accent-purple" />
          <div>
            <p className="text-text-secondary text-xs">Средний сон</p>
            <p className="text-text font-bold">{summary.avgSleep} ч</p>
          </div>
        </div>
        <div className="bg-bg-secondary p-4 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <TrendingUp size={24} className="text-accent-blue" />
          <div>
            <p className="text-text-secondary text-xs">Интенсивность</p>
            <p className="text-text font-bold">{summary.avgIntensity}/10</p>
          </div>
        </div>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Калории */}
        <div className="bg-bg-secondary p-4 rounded-xl border border-border shadow-sm">
          <h2 className="text-text font-semibold mb-3">Калории</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={calorieData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="date" stroke="#8B949E" tick={{ fontSize: 10 }} />
              <YAxis stroke="#8B949E" />
              <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#E6EDF3' }} />
              <Bar dataKey="calories" fill="#F0883E" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Тренировки */}
        <div className="bg-bg-secondary p-4 rounded-xl border border-border shadow-sm">
          <h2 className="text-text font-semibold mb-3">Тренировки (подходы)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={workoutData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="date" stroke="#8B949E" tick={{ fontSize: 10 }} />
              <YAxis stroke="#8B949E" />
              <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#E6EDF3' }} />
              <Bar dataKey="sets" fill="#3FB950" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Сон */}
        <div className="bg-bg-secondary p-4 rounded-xl border border-border shadow-sm col-span-1 lg:col-span-2">
          <h2 className="text-text font-semibold mb-3">Сон (часы)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sleepData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="date" stroke="#8B949E" tick={{ fontSize: 10 }} />
              <YAxis stroke="#8B949E" domain={[0, 12]} />
              <Tooltip contentStyle={{ backgroundColor: '#161B22', borderColor: '#30363D', color: '#E6EDF3' }} />
              <Line type="monotone" dataKey="hours" stroke="#BB86FC" strokeWidth={2} dot={{ fill: '#BB86FC' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}