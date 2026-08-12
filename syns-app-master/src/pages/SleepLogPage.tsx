import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Moon, Trash2, ChevronLeft, ChevronRight, Calendar, Plus, Smile, Meh, Frown, Sun, Cloud, CloudRain } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Moon, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SleepLogPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());

  // Форма сна
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(3); // 1–5
  const [feeling, setFeeling] = useState<'rested' | 'neutral' | 'tired'>('neutral');
  const [wakeUp, setWakeUp] = useState<'never' | 'once' | 'twice' | 'many'>('never');
  const [morningMood, setMorningMood] = useState<'excellent' | 'good' | 'normal' | 'bad' | 'terrible'>('good');

  // Маппинг качества в допустимые значения для БД
  const qualityMap: Record<number, string> = {
    1: 'Нет',
    2: 'Нет',
    3: 'Не очень',
    4: 'Да',
    5: 'Да',
  };

  if (!user) {
    return <div className="p-4 text-text-secondary">Пожалуйста, войдите.</div>;
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState<'Да' | 'Нет' | 'Не очень'>('Да');
  const [date, setDate] = useState(new Date());

  if (!user) {
    return <div className="p-4">Пожалуйста, войдите в аккаунт.</div>;
  }

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const changeDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate);
  };

  useEffect(() => {
    loadLogs();
  }, [user, date]);

  const loadLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', formatDate(date))
      .order('created_at', { ascending: false });
    if (!error) setLogs(data || []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('sleep_logs').insert({
      user_id: user.id,
      hours,
      quality: qualityMap[quality] || 'Не очень',
      feeling,
      wake_up: wakeUp,
      morning_mood: morningMood,
      date: formatDate(date),
    });

    if (!error) {
      loadLogs();
      // alert убран
    const { error } = await supabase.from('sleep_logs').insert({
      user_id: user.id,
      hours: hours,
      quality: quality,
      date: formatDate(date),
    });
    if (!error) {
      loadLogs();
    } else {
      alert('Ошибка: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('sleep_logs').delete().eq('id', id);
    loadLogs();
  };

  // Статистика за 7 дней
  const [weeklyAvg, setWeeklyAvg] = useState(0);
  useEffect(() => {
    const calcWeekly = async () => {
      if (!user) return;
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('hours')
        .eq('user_id', user.id)
        .gte('date', start.toISOString().split('T')[0]);
      if (!error && data.length) {
        const avg = data.reduce((acc, item) => acc + item.hours, 0) / data.length;
        setWeeklyAvg(Math.round(avg * 10) / 10);
      }
    };
    calcWeekly();
  }, [user, date]);

  const getQualityLabel = (val: number) => {
    if (val <= 1) return 'Ужасно';
    if (val === 2) return 'Плохо';
    if (val === 3) return 'Средне';
    if (val === 4) return 'Хорошо';
    return 'Отлично';
  };

  const wakeUpOptions = [
    { value: 'never', label: 'Никогда' },
    { value: 'once', label: '1 раз' },
    { value: 'twice', label: '2–3 раза' },
    { value: 'many', label: '> 3 раз' },
  ];

  const moodOptions = [
    { value: 'excellent', label: 'Отлично', icon: Sun },
    { value: 'good', label: 'Хорошо', icon: Cloud },
    { value: 'normal', label: 'Нормально', icon: Cloud },
    { value: 'bad', label: 'Плохо', icon: CloudRain },
    { value: 'terrible', label: 'Ужасно', icon: CloudRain },
  ];

  const hoursPercent = (hours / 12) * 100;
  const qualityPercent = ((quality - 1) / 4) * 100;

  const rangeStyle = (percent: number) => ({
    background: `linear-gradient(to right, #FBBF24 0%, #FBBF24 ${percent}%, #374151 ${percent}%, #374151 100%)`,
  });

  return (
    <div className="p-4 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Moon size={28} className="text-accent-purple" />
          Сон
        </h1>
        <span className="text-xs bg-accent-purple/10 text-accent-purple px-3 py-1 rounded-full">
          {logs.length} записей
        </span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeDate(-1)} className="text-text-secondary hover:text-text p-1 transition">
          <ChevronLeft size={22} />
        </button>
        <span className="text-text font-medium flex items-center gap-2">
          <Calendar size={16} className="text-text-tertiary" />
          {date.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => changeDate(1)} className="text-text-secondary hover:text-text p-1 transition">
          <ChevronRight size={22} />
  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-text">Сон</h1>
      <div className="mt-4 flex items-center justify-between bg-bg-secondary p-3 rounded-lg border border-border">
        <button onClick={() => changeDate(-1)} className="text-text-secondary hover:text-text">
          <ChevronLeft size={20} />
        </button>
        <span className="text-text font-medium">{date.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <button onClick={() => changeDate(1)} className="text-text-secondary hover:text-text">
          <ChevronRight size={20} />
        </button>
        <button onClick={() => setDate(new Date())} className="text-xs text-accent-blue hover:underline">
          Сегодня
        </button>
      </div>

      {weeklyAvg > 0 && (
        <div className="mb-4 p-3 bg-bg-secondary rounded-xl border border-border text-center">
          <p className="text-text-secondary text-xs">Средний сон за 7 дней</p>
          <p className="text-text font-bold text-lg">{weeklyAvg} ч</p>
        </div>
      )}

      <form onSubmit={handleAdd} className="bg-bg-secondary p-5 rounded-xl border border-border space-y-5 shadow-sm">
        <div>
          <label className="block text-sm text-text-secondary mb-1">
            1. Сколько часов вы спали? <span className="font-medium text-text">{hours} ч</span>
          </label>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(parseFloat(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-all"
            style={rangeStyle(hoursPercent)}
          />
          <div className="flex justify-between text-xs text-text-tertiary mt-1">
            <span>0 ч</span>
            <span>12 ч</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">
            2. Как вы оцениваете качество сна? <span className="font-medium text-text">{getQualityLabel(quality)}</span>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer transition-all"
            style={rangeStyle(qualityPercent)}
          />
          <div className="flex justify-between text-xs text-text-tertiary mt-1">
            <span>😫 Ужасно</span>
            <span>😊 Отлично</span>
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">3. Вы выспались?</label>
          <div className="flex gap-3">
            {[
              { value: 'rested', label: 'Да', icon: Smile },
              { value: 'neutral', label: 'Не уверен', icon: Meh },
              { value: 'tired', label: 'Нет', icon: Frown },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFeeling(opt.value as any)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border transition ${
                  feeling === opt.value
                    ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                    : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-tertiary'
                }`}
              >
                <opt.icon size={24} className={feeling === opt.value ? 'text-accent-blue' : 'text-text-tertiary'} />
                <span className="text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">4. Как часто вы просыпались ночью?</label>
          <div className="grid grid-cols-2 gap-2">
            {wakeUpOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWakeUp(opt.value as any)}
                className={`py-2 rounded-xl border transition ${
                  wakeUp === opt.value
                    ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                    : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-tertiary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">5. Как вы оцениваете своё самочувствие утром?</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {moodOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMorningMood(opt.value as any)}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition ${
                    morningMood === opt.value
                      ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                      : 'bg-bg-tertiary border-border text-text-secondary hover:border-text-tertiary'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold"
        >
          <Plus size={18} /> Записать сон
        </button>
      <form onSubmit={handleAdd} className="mt-4 bg-bg-secondary p-4 rounded-lg border border-border space-y-3">
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Часы сна"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="input-field flex-1"
            min="1"
            max="24"
            step="0.5"
            required
          />
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as any)}
            className="input-field flex-1"
          >
            <option value="Да">Выспался</option>
            <option value="Не очень">Не очень</option>
            <option value="Нет">Не выспался</option>
          </select>
          <button type="submit" className="btn-primary px-4">Добавить</button>
        </div>
      </form>

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-text-secondary text-center py-4">Загрузка...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Moon size={48} className="mx-auto text-text-tertiary opacity-30 mb-3" />
            <p className="text-text-secondary">Нет записей за этот день</p>
            <p className="text-text-tertiary text-sm mt-1">Добавьте первую запись сна!</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex justify-between items-center bg-bg-secondary p-3 rounded-xl border border-border hover:border-accent-purple transition hover:shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center">
                  <Moon size={16} className="text-accent-purple" />
                </div>
                <div>
                  <p className="font-semibold text-text">{log.hours} ч</p>
                  <p className="text-text-secondary text-sm flex items-center gap-1">
                    {log.quality} • {log.feeling === 'rested' ? '☀️' : log.feeling === 'neutral' ? '😐' : '😴'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(log.id)}
                className="text-text-secondary hover:text-accent-red transition opacity-0 group-hover:opacity-100"
              >
          <p className="text-text-secondary">Загрузка...</p>
        ) : logs.length === 0 ? (
          <p className="text-text-secondary text-center py-4">Нет записей за этот день</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex justify-between items-center bg-bg-secondary p-3 rounded-lg border border-border">
              <div>
                <p className="font-semibold text-text">{log.hours} ч</p>
                <p className="text-text-secondary text-sm">Качество: {log.quality}</p>
              </div>
              <button onClick={() => handleDelete(log.id)} className="text-text-secondary hover:text-accent-red">
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
