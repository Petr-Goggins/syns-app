import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useWorkoutLogStore } from '../store/workoutLogStore';
import { useRestTimerStore, calculateRestTime } from '../store/restTimerStore';

const EXERCISE_MUSCLE_MAP: Record<string, string[]> = {
  'жим лёжа': ['chest', 'triceps'],
  'bench press': ['chest', 'triceps'],
  'присед': ['quads', 'glutes'],
  'squat': ['quads', 'glutes'],
  'становая тяга': ['back', 'hamstrings'],
  'deadlift': ['back', 'hamstrings'],
};

const EXERCISES = [
  'Приседания со штангой', 'Приседания с гантелями', 'Выпады с гантелями',
  'Становая тяга', 'Тяга гантели в наклоне', 'Жим лёжа',
  'Отжимания от пола', 'Подтягивания', 'Планка', 'Скручивания на пресс',
  'Болгарские выпады', 'Бег на месте', 'Скакалка',
  'Жим гантелей сидя', 'Разведение гантелей в стороны',
  'Сгибание рук с гантелями', 'Разгибание рук с гантелями за голову',
  'Велосипед (пресс)', 'Бёрпи', 'Растяжка',
];

import { Plus, Dumbbell, Trash2, ChevronLeft, ChevronRight, Search, Calendar, Zap, Timer } from 'lucide-react';

export default function WorkoutLogPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const workoutLogStore = useWorkoutLogStore();
  const restTimerStore = useRestTimerStore();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    exercise_name: '',
    sets: 3,
    reps: 10,
    weight: 0,
  });
  const [date, setDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');

  if (!user) {
    return <div className="p-4 text-text-secondary">Пожалуйста, войдите.</div>;
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
    await workoutLogStore.fetchByDate(user.id, formatDate(date));
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.exercise_name.trim()) return;
    
    const success = await workoutLogStore.addLog(user.id, {
      log_date: formatDate(date),
      exercise_name: form.exercise_name,
      sets: form.sets,
      reps: form.reps,
      weight: form.weight,
      intensity: 50,
      note: null,
    });
    
    if (success) {
      // Обновляем тепловую карту мышц
      const muscles = EXERCISE_MUSCLE_MAP[form.exercise_name.toLowerCase()] || [];
      muscles.forEach(muscle => {
        muscleMapStore.updateMuscleIntensity(muscle, 70, formatDate(date));
      });
      
      // Запускаем таймер отдыха
      const restTime = calculateRestTime(form.exercise_name);
      restTimerStore.startTimer(restTime, form.exercise_name);
      
      setForm({ exercise_name: '', sets: 3, reps: 10, weight: 0 });
      setSearchTerm('');
      loadLogs();
    } else {
      alert('Ошибка: ' + workoutLogStore.error);
    }
  };

  const loadExerciseHistory = async (exerciseName: string) => {
    const { data } = await supabase
      .from('workout_logs')
      .select('log_date, weight, reps, sets')
      .eq('user_id', user.id)
      .eq('exercise_name', exerciseName)
      .order('log_date', { ascending: true })
      .limit(20);
    
    if (data) {
      setExerciseHistory(data.map(d => ({
        date: new Date(d.log_date).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
        weight: d.weight,
        volume: d.sets * d.reps * d.weight,
      })));
      setShowGraph(true);
    }
  };

  const filteredExercises = EXERCISES.filter((ex) =>
    ex.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const logs = workoutLogStore.logs;
  const totalSets = logs.reduce((acc, log) => acc + (log.sets || 0), 0);
  const totalWeight = logs.reduce((acc, log) => acc + ((log.weight || 0) * (log.sets || 0)), 0);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Dumbbell size={28} className="text-accent-blue" />
          Тренировки
        </h1>
        <span className="text-xs bg-accent-blue/10 text-accent-blue px-3 py-1 rounded-full">
          {logs.length} упр.
        </span>
      </div>

      {/* Дата — прозрачная, как в питании */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => changeDate(-1)}
          className="text-text-secondary hover:text-text p-1 transition"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="text-text font-medium flex items-center gap-2">
          <Calendar size={16} className="text-text-tertiary" />
          {date.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => changeDate(1)}
          className="text-text-secondary hover:text-text p-1 transition"
        >
          <ChevronRight size={22} />
        </button>
        <button
          onClick={() => setDate(new Date())}
          className="text-xs text-accent-blue hover:underline"
        >
          Сегодня
        </button>
      </div>

      {/* Статистика за день */}
      {logs.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-bg-secondary p-3 rounded-xl border border-border text-center">
            <p className="text-text-secondary text-xs">Подходов</p>
            <p className="text-text font-bold text-lg">{totalSets}</p>
          </div>
          <div className="bg-bg-secondary p-3 rounded-xl border border-border text-center">
            <p className="text-text-secondary text-xs">Общий вес (кг)</p>
            <p className="text-text font-bold text-lg">{totalWeight}</p>
          </div>
        </div>
      )}

      {/* Форма добавления */}
      <form onSubmit={handleAdd} className="bg-bg-secondary p-5 rounded-xl border border-border space-y-4 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Поиск упражнения..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (filteredExercises.length === 1 && filteredExercises[0] === e.target.value) {
                setForm({ ...form, exercise_name: e.target.value });
              }
            }}
            className="input-field w-full pl-10 pr-3 py-2.5 rounded-lg"
          />
          {searchTerm && filteredExercises.length > 0 && (
            <ul className="absolute z-10 w-full bg-bg-secondary border border-border rounded-lg mt-1 max-h-40 overflow-y-auto">
              {filteredExercises.slice(0, 8).map((ex) => (
                <li
                  key={ex}
                  className="px-3 py-2 hover:bg-bg-tertiary cursor-pointer text-text text-sm"
                  onClick={() => {
                    setForm({ ...form, exercise_name: ex });
                    setSearchTerm(ex);
                  }}
                >
                  {ex}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Подходы</label>
            <input
              type="number"
              value={form.sets}
              onChange={(e) => setForm({ ...form, sets: Number(e.target.value) })}
              className="input-field w-full text-center py-2 rounded-lg"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Повторения</label>
            <input
              type="number"
              value={form.reps}
              onChange={(e) => setForm({ ...form, reps: Number(e.target.value) })}
              className="input-field w-full text-center py-2 rounded-lg"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Вес (кг)</label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
              className="input-field w-full text-center py-2 rounded-lg"
              min="0"
              step="0.5"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold"
        >
          <Plus size={18} /> Добавить упражнение
        </button>
      </form>

      {/* Список записей */}
      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-text-secondary text-center py-4">Загрузка...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell size={48} className="mx-auto text-text-tertiary opacity-30 mb-3" />
            <p className="text-text-secondary">Нет тренировок за этот день</p>
            <p className="text-text-tertiary text-sm mt-1">Добавьте первую тренировку!</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex justify-between items-center bg-bg-secondary p-3 rounded-xl border border-border hover:border-accent-blue transition hover:shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center">
                  <Zap size={16} className="text-accent-blue" />
                </div>
                <div>
                  <p className="font-semibold text-text">{log.exercise_name}</p>
                  <p className="text-text-secondary text-sm flex flex-wrap gap-1">
                    <span className="font-medium">Подходы:</span> {log.sets} &nbsp;•&nbsp;
                    <span className="font-medium">Повторения:</span> {log.reps} &nbsp;•&nbsp;
                    <span className="font-medium">Вес:</span> {log.weight} кг
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(log.id)}
                className="text-text-secondary hover:text-accent-red transition opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}