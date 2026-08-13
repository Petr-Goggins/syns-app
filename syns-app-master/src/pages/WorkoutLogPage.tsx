import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useWorkoutLogStore } from '../store/workoutLogStore';
import { useRestTimerStore, calculateRestTime } from '../store/restTimerStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MuscleHeatmap from '../components/MuscleHeatmap';
import ForecastWidget from '../components/ForecastWidget';

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

// Советы от ИИ для разных ситуаций
const AI_TIPS = {
  rest: [
    'Оптимальное время отдыха зависит от цели: для силы — 2-5 мин, для массы — 1-2 мин, для выносливости — 30-60 сек.',
    'Дышите глубоко во время отдыха: это помогает быстрее восстановить пульс.',
    'Не сидите на месте между подходами — лёгкая ходьба улучшает кровообращение.',
  ],
  technique: [
    'Контролируйте негативную фазу движения — это ключ к росту мышц.',
    'Держите спину прямой во всех тяговых упражнениях.',
    'Фокусируйтесь на мышце, которую прорабатываете — ментальная связь улучшает результат.',
  ],
  progress: [
    'Прогрессивная перегрузка — главный принцип роста: увеличивайте вес, повторения или подходы каждую неделю.',
    'Если застряли на плато, попробуйте изменить порядок упражнений или темп выполнения.',
    'Записывайте результаты каждой тренировки — визуальный прогресс мотивирует!',
  ],
};

import { Plus, Dumbbell, Trash2, ChevronLeft, ChevronRight, Search, Calendar, Zap, Timer, TrendingUp, Lightbulb, Play, Pause, RotateCcw } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'log' | 'progress' | 'forecast'>('log');
  const [exerciseHistory, setExerciseHistory] = useState<any[]>([]);
  const [showGraph, setShowGraph] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [aiTipVisible, setAiTipVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState<{category: string; text: string} | null>(null);

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
    // Показываем случайный совет при загрузке
    showRandomTip();
  }, [user, date]);

  const showRandomTip = () => {
    const categories = Object.keys(AI_TIPS) as Array<keyof typeof AI_TIPS>;
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const tips = AI_TIPS[randomCategory];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setCurrentTip({ category: randomCategory, text: randomTip });
    setAiTipVisible(true);
  };

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
      // Запускаем умный таймер отдыха
      const restTime = calculateRestTime(form.exercise_name);
      restTimerStore.startTimer(restTime, form.exercise_name);
      
      // Показываем совет по технике для этого упражнения
      showTechniqueTip(form.exercise_name);
      
      setForm({ exercise_name: '', sets: 3, reps: 10, weight: 0 });
      setSearchTerm('');
      loadLogs();
    } else {
      alert('Ошибка: ' + workoutLogStore.error);
    }
  };

  const showTechniqueTip = (exerciseName: string) => {
    const name = exerciseName.toLowerCase();
    let tip = '';
    
    if (name.includes('жим') || name.includes('press')) {
      tip = 'При жиме держите лопатки сведёнными, а ноги плотно упертыми в пол.';
    } else if (name.includes('присед') || name.includes('squat')) {
      tip = 'Колени должны смотреть в том же направлении, что и носки. Глубина — до параллели бёдер с полом.';
    } else if (name.includes('тяга') || name.includes('deadlift')) {
      tip = 'Спина прямая на протяжении всего движения. Гриф должен скользить вдоль голеней.';
    } else {
      tip = 'Контролируйте движение в обеих фазах. Избегайте рывков и читинга.';
    }
    
    setCurrentTip({ category: 'technique', text: tip });
    setAiTipVisible(true);
  };

  const loadExerciseHistory = async (exerciseName: string) => {
    setSelectedExercise(exerciseName);
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
        reps: d.reps,
      })));
      setShowGraph(true);
      setActiveTab('progress');
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

  const handleDelete = async (id: string) => {
    if (confirm('Удалить эту запись?')) {
      await workoutLogStore.deleteLog(id);
      loadLogs();
    }
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

      {/* Вкладки: Дневник / Прогресс / Прогноз */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'log'
              ? 'bg-accent-blue text-white shadow-lg'
              : 'bg-bg-secondary text-text-secondary hover:text-text'
          }`}
        >
          Дневник
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'progress'
              ? 'bg-accent-blue text-white shadow-lg'
              : 'bg-bg-secondary text-text-secondary hover:text-text'
          }`}
        >
          Прогресс
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'forecast'
              ? 'bg-accent-blue text-white shadow-lg'
              : 'bg-bg-secondary text-text-secondary hover:text-text'
          }`}
        >
          Прогноз
        </button>
      </div>

      {/* AI Совет */}
      {aiTipVisible && currentTip && (
        <div className="card-modern mb-4 bg-gradient-to-r from-accent-green/10 to-transparent border-accent-green/30">
          <div className="flex items-start gap-3">
            <Lightbulb size={20} className="text-accent-gold mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-text text-sm">{currentTip.text}</p>
              <button 
                onClick={() => setAiTipVisible(false)}
                className="text-text-secondary text-xs mt-2 hover:text-text"
              >
                Скрыть совет
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Умный таймер отдыха */}
      {restTimerStore.isActive && (
        <div className="card-modern mb-4 bg-gradient-to-r from-accent-orange/10 to-transparent border-accent-orange/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer size={24} className="text-accent-orange" />
              <div>
                <p className="text-text font-semibold text-sm">Отдых после: {restTimerStore.exerciseType}</p>
                <p className="text-2xl font-bold text-accent-orange">{formatTime(restTimerStore.remainingSeconds)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => restTimerStore.pauseTimer()}
                className="p-2 rounded-full bg-bg-tertiary hover:bg-accent-orange/20 transition"
              >
                <Pause size={18} className="text-text" />
              </button>
              <button
                onClick={() => restTimerStore.resumeTimer()}
                className="p-2 rounded-full bg-bg-tertiary hover:bg-accent-orange/20 transition"
              >
                <Play size={18} className="text-text" />
              </button>
              <button
                onClick={() => restTimerStore.stopTimer()}
                className="p-2 rounded-full bg-bg-tertiary hover:bg-accent-red/20 transition"
              >
                <RotateCcw size={18} className="text-text" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'log' ? (
        <>
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
        </>
      ) : (
        /* Вкладка Прогресс */
        <div className="space-y-4">
          {!showGraph ? (
            <div className="text-center py-12">
              <TrendingUp size={48} className="mx-auto text-text-tertiary opacity-30 mb-3" />
              <p className="text-text-secondary">Выберите упражнение для просмотра прогресса</p>
              <p className="text-text-tertiary text-sm mt-1">Нажмите на упражнение в дневнике</p>
            </div>
          ) : (
            <>
              <div className="card-modern">
                <h3 className="text-lg font-bold text-text mb-4">{selectedExercise}</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exerciseHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 11, fill: '#9ca3af' }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: '#9ca3af' }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: '#1f2937', 
                          border: '1px solid #374151', 
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#58A6FF" 
                        strokeWidth={2} 
                        dot={{ r: 3, fill: '#58A6FF' }}
                        name="Вес (кг)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="#22c55e" 
                        strokeWidth={2} 
                        dot={{ r: 3, fill: '#22c55e' }}
                        name="Объём (кг)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Muscle Heatmap для выбранного упражнения */}
              <div className="card-modern">
                <h3 className="text-lg font-bold text-text mb-4">Проработанные мышцы</h3>
                <MuscleHeatmap size="md" showLabels={true} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}