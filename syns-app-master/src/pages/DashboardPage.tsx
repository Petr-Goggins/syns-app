import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useWaterStore } from '@/store/waterStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, Dumbbell, Utensils, Moon, Droplet, Target, Award, TrendingUp, Zap, Clock } from 'lucide-react';

export default function DashboardPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const waterStore = useWaterStore();
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
  const [waterAmount, setWaterAmount] = useState(200);

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

        // Загружаем воду из store
        await waterStore.fetchToday(user.id);
        const totalWater = waterStore.todayAmount;

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

  const handleWaterAdd = async (amount: number) => {
    if (!user) return;
    await waterStore.addWater(user.id, amount);
    setStats(prev => ({ ...prev, water: Math.round((prev.water + amount / 1000) * 10) / 10 }));
  };
  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin"></div></div>;

  const widgets = [
    { label: 'Калории', value: `${stats.calories} ккал`, icon: Utensils, color: 'text-accent-orange', bg: 'bg-accent-orange/10', path: '/nutrition' },
    { label: 'Вода', value: `${stats.water.toFixed(1)} л`, icon: Droplet, color: 'text-accent-blue', bg: 'bg-accent-blue/10', path: '/nutrition' },
    { label: 'Сон', value: `${stats.sleep} ч`, icon: Moon, color: 'text-accent-purple', bg: 'bg-accent-purple/10', path: '/sleep' },
    { label: 'Тренировки', value: `${stats.workouts} сегодня`, icon: Dumbbell, color: 'text-accent-green', bg: 'bg-accent-green/10', path: '/workouts' },
    { label: 'Прогресс', value: `${stats.progress}%`, icon: TrendingUp, color: 'text-accent-blue', bg: 'bg-accent-blue/10', path: '/reports' },
    { label: 'Серия', value: `${stats.streak} дней`, icon: Zap, color: 'text-accent-gold', bg: 'bg-accent-gold/10', path: '/achievements' },
  ];

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

      {/* Цитата дня */}
      <div className="card-modern mb-6 bg-gradient-to-r from-accent-blue/5 to-transparent border-accent-blue/20 text-center py-4">
        <p className="text-text italic">"Маленькие шаги ведут к большим результатам!"</p>
        <p className="text-text-secondary text-sm">— Мотивация дня</p>
      </div>

      {/* Карточка приветствия */}
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

      {/* Виджеты */}
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
          <button onClick={() => handleWaterAdd(200)} className="btn-secondary flex-1 py-2">+200</button>
          <button onClick={() => handleWaterAdd(500)} className="btn-secondary flex-1 py-2">+500</button>
          <button onClick={() => handleWaterAdd(1000)} className="btn-secondary flex-1 py-2">+1 л</button>
        </div>
      </div>

      {/* Прогресс-бар цели */}
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