import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import {
  Utensils,
  Droplet,
  Moon,
  Dumbbell,
  TrendingUp,
  Zap,
  Target,
} from 'lucide-react';

const QUOTES = [
  { text: 'SpaceX провалился 9 раз, прежде чем достичь успеха.', author: 'Илон Маск' },
  { text: 'Успех — это сумма маленьких усилий, повторяемых день за днём.', author: 'Роберт Колльер' },
  { text: 'Не бойся быть слабой сегодня. Завтра ты станешь сильнее.', author: 'Народная мудрость' },
  { text: 'Пост — это не ограничение, а время для роста.', author: 'Духовная традиция' },
  { text: 'Отдых — часть тренировки.', author: 'Народная мудрость' },
];

export default function DashboardPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
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
  const [dailyQuote, setDailyQuote] = useState(QUOTES[0]);

  useEffect(() => {
    setDailyQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('weight, goal')
          .eq('id', user.id)
          .single();

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
          .eq('date', today);

        const { data: waterData } = await supabase
          .from('water_logs')
          .select('amount_ml')
          .eq('user_id', user.id)
          .eq('date', today);
        const totalWater = waterData?.reduce((sum, w) => sum + w.amount_ml, 0) || 0;

        setStats({
          weight: profile?.weight || 0,
          calories: totalCalories,
          water: totalWater / 1000,
          sleep: sleepHours,
          workouts: workoutsCount || 0,
          goal: profile?.goal || 'Поддержание',
          progress: 65,
          streak: 7,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const widgets = [
    { label: 'Калории', value: `${stats.calories} ккал`, icon: Utensils, color: 'text-accent-orange', bg: 'bg-accent-orange/10', path: '/nutrition' },
    { label: 'Вода', value: `${stats.water.toFixed(1)} л`, icon: Droplet, color: 'text-accent-blue', bg: 'bg-accent-blue/10', path: '/nutrition' },
    { label: 'Сон', value: `${stats.sleep} ч`, icon: Moon, color: 'text-accent-purple', bg: 'bg-accent-purple/10', path: '/sleep' },
    { label: 'Тренировки', value: `${stats.workouts} сегодня`, icon: Dumbbell, color: 'text-accent-green', bg: 'bg-accent-green/10', path: '/workouts' },
    { label: 'Прогресс', value: `${stats.progress}%`, icon: TrendingUp, color: 'text-accent-blue', bg: 'bg-accent-blue/10', path: '/reports' },
    { label: 'Серия', value: `${stats.streak} дней`, icon: Zap, color: 'text-accent-gold', bg: 'bg-accent-gold/10', path: '/achievements' },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text">Главная</h1>
        <span className="text-sm text-text-secondary">
          {new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="card-modern mb-6 bg-gradient-to-r from-accent-blue/5 to-transparent border-accent-blue/20 text-center py-4">
        <p className="text-text italic">"{dailyQuote.text}"</p>
        <p className="text-text-secondary text-sm">— {dailyQuote.author}</p>
      </div>

      <div className="card-modern mb-6 flex flex-wrap items-center justify-between bg-gradient-to-r from-accent-blue/10 to-transparent border-accent-blue/20">
        <div>
          <p className="text-text-secondary text-sm">Привет, {user?.email?.split('@')[0] || 'Пользователь'}!</p>
          <p className="text-text font-semibold text-lg">Цель: {stats.goal}</p>
        </div>
        <div className="flex items-center gap-2">
          <Target size={20} className="text-accent-blue" />
          <span className="text-sm text-text-secondary">Вес: {stats.weight} кг</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {widgets.map((widget) => (
          <div
            key={widget.label}
            onClick={() => navigate(widget.path)}
            className="card-modern cursor-pointer hover:border-accent-blue transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${widget.bg}`}>
                <widget.icon size={20} className={widget.color} />
              </div>
              <div>
                <p className="text-text-secondary text-xs">{widget.label}</p>
                <p className="text-text font-bold text-base">{widget.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card-modern mt-6">
        <p className="text-text-secondary text-sm mb-2">Добавить воду</p>
        <div className="flex gap-2">
          <button className="btn-secondary flex-1 py-2">+200 мл</button>
          <button className="btn-secondary flex-1 py-2">+500 мл</button>
          <button className="btn-secondary flex-1 py-2">+1 л</button>
        </div>
      </div>

      <div className="card-modern mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-secondary text-sm">Прогресс к цели</span>
          <span className="text-text font-bold">{stats.progress}%</span>
        </div>
        <div className="w-full bg-bg-tertiary rounded-full h-2.5">
          <div className="bg-accent-blue h-2.5 rounded-full transition-all duration-700" style={{ width: `${stats.progress}%` }} />
        </div>
      </div>
    </div>
  );
}