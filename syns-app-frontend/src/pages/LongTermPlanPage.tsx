import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Circle,
  Target,

} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ===== КОМПОНЕНТ ЧЕЛОВЕЧКА (MUSCLE MAP) =====
function MuscleMap({ muscles }: { muscles: string[] }) {
  return (
    <div className="w-full max-w-xs mx-auto">
      <svg viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Голова */}
        <circle cx="100" cy="40" r="25" stroke="#8B949E" strokeWidth="2" />
        {/* Тело */}
        <path d="M70 80 L130 80 L120 180 L80 180 Z" stroke="#8B949E" strokeWidth="2" />
        {/* Левая рука */}
        <path d="M70 80 L40 130 L50 140" stroke="#8B949E" strokeWidth="2" />
        {/* Правая рука */}
        <path d="M130 80 L160 130 L150 140" stroke="#8B949E" strokeWidth="2" />
        {/* Левая нога */}
        <path d="M80 180 L70 260 L90 280" stroke="#8B949E" strokeWidth="2" />
        {/* Правая нога */}
        <path d="M120 180 L130 260 L110 280" stroke="#8B949E" strokeWidth="2" />

        {/* Подсветка мышц (если есть в списке) */}
        {muscles.includes('грудь') && <rect x="70" y="90" width="60" height="40" fill="#58A6FF" opacity="0.4" rx="5" />}
        {muscles.includes('спина') && <rect x="70" y="90" width="60" height="40" fill="#3FB950" opacity="0.4" rx="5" />}
        {muscles.includes('ноги') && <rect x="75" y="190" width="50" height="60" fill="#D29922" opacity="0.4" rx="5" />}
        {muscles.includes('плечи') && <rect x="55" y="70" width="20" height="30" fill="#F0883E" opacity="0.4" rx="5" />}
        {muscles.includes('руки') && <rect x="125" y="70" width="20" height="30" fill="#BB86FC" opacity="0.4" rx="5" />}
        {muscles.includes('пресс') && <rect x="85" y="130" width="30" height="30" fill="#F85149" opacity="0.4" rx="5" />}
        {muscles.includes('ягодицы') && <rect x="75" y="170" width="50" height="20" fill="#58A6FF" opacity="0.4" rx="5" />}
      </svg>
      <p className="text-center text-text-secondary text-sm mt-2">
        Проработано: {muscles.length > 0 ? muscles.join(', ') : 'нет данных'}
      </p>
    </div>
  );
}

// ===== ОСНОВНОЙ КОМПОНЕНТ =====
export default function LongTermPlanPage() {
  const user = useAuthStore((s) => s.user);
  const [goal, setGoal] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(0);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [focusMuscles, setFocusMuscles] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({
    goal_type: 'muscle_gain',
    target_value: '',
    deadline: '',
    aesthetic_goal: 'none',
  });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const goalRes = await fetch(`${API_URL}/goals/current`);
      const goalData = await goalRes.json();
      if (goalData.goal) {
        setGoal(goalData.goal);
        const planRes = await fetch(`${API_URL}/plans/long_term`);
        const planData = await planRes.json();
        if (planData.plan) {
          setPlan(planData.plan);
          setFocusMuscles(planData.plan.focus_muscles || []);
          const current = goalData.goal.current_value || 0;
          const target = goalData.goal.target_value || 1;
          setProgress(Math.min((current / target) * 100, 100));
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/goals/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_type: form.goal_type,
          target_value: parseFloat(form.target_value),
          deadline: form.deadline,
          aesthetic_goal: form.aesthetic_goal,
        }),
      });
      const data = await res.json();
      setGoal(data.goal);
      setShowGoalForm(false);
      await generatePlan();
    } catch (error) {
      console.error('Ошибка создания цели:', error);
      alert('Не удалось создать цель');
    }
  };

  const generatePlan = async () => {
    try {
      const res = await fetch(`${API_URL}/plans/generate_long_term`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.plan) {
        setPlan(data.plan);
        await loadData();
      }
    } catch (error) {
      console.error('Ошибка генерации плана:', error);
      alert('Не удалось сгенерировать план');
    }
  };

  const updateFocus = async () => {
    try {
      await fetch(`${API_URL}/plans/focus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus_muscles: focusMuscles }),
      });
      await generatePlan();
    } catch (error) {
      console.error('Ошибка обновления фокуса:', error);
    }
  };

  const toggleWeek = (weekNumber: number) => {
    console.log(`Неделя ${weekNumber} отмечена`);
    setProgress((prev) => Math.min(prev + 5, 100));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-accent-blue" size={32} />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text mb-6">🎯 Мой путь</h1>
        <div className="bg-bg-secondary p-6 rounded-xl border border-border">
          <p className="text-text-secondary mb-4">У вас ещё нет цели. Создайте её!</p>
          <button
            onClick={() => setShowGoalForm(true)}
            className="btn-primary px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={18} /> Создать цель
          </button>
        </div>
        {showGoalForm && (
          <form onSubmit={createGoal} className="mt-6 bg-bg-secondary p-6 rounded-xl border border-border space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Тип цели</label>
              <select
                value={form.goal_type}
                onChange={(e) => setForm({ ...form, goal_type: e.target.value })}
                className="input-field w-full px-3 py-2 rounded-lg"
              >
                <option value="muscle_gain">Набор мышечной массы</option>
                <option value="fat_loss">Похудение</option>
                <option value="strength">Сила</option>
                <option value="endurance">Выносливость</option>
                <option value="aesthetic">Эстетическая форма</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Целевое значение (кг)</label>
              <input
                type="number"
                value={form.target_value}
                onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                className="input-field w-full px-3 py-2 rounded-lg"
                placeholder="например: 10"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Срок (дата)</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="input-field w-full px-3 py-2 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Эстетическая цель</label>
              <select
                value={form.aesthetic_goal}
                onChange={(e) => setForm({ ...form, aesthetic_goal: e.target.value })}
                className="input-field w-full px-3 py-2 rounded-lg"
              >
                <option value="none">Не выбрано</option>
                <option value="v_shape">V-образная</option>
                <option value="hourglass">Песочные часы</option>
                <option value="athletic">Атлетическая</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full py-2 rounded-lg">
              Создать цель
            </button>
            <button
              type="button"
              onClick={() => setShowGoalForm(false)}
              className="btn-secondary w-full py-2 rounded-lg"
            >
              Отмена
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6 flex items-center gap-2">
        <Target size={24} className="text-accent-blue" /> Мой путь
      </h1>

      {/* Человечек */}
      <div className="bg-bg-secondary p-4 rounded-xl border border-border mb-6">
        <MuscleMap muscles={focusMuscles} />
      </div>

      <div className="bg-bg-secondary p-4 rounded-xl border border-border mb-4 flex flex-wrap justify-between items-center">
        <div>
          <p className="text-text-secondary text-sm">Цель</p>
          <p className="text-text font-semibold">
            {goal.goal_type === 'muscle_gain' ? 'Набор массы' :
             goal.goal_type === 'fat_loss' ? 'Похудение' :
             goal.goal_type === 'strength' ? 'Сила' :
             goal.goal_type === 'endurance' ? 'Выносливость' : 'Эстетика'}
            : {goal.target_value} кг
          </p>
          <p className="text-text-secondary text-sm">Дедлайн: {new Date(goal.deadline).toLocaleDateString('ru')}</p>
        </div>
        <div className="text-right">
          <p className="text-text-secondary text-sm">Прогресс</p>
          <p className="text-text font-bold text-lg">{Math.round(progress)}%</p>
        </div>
      </div>

      <div className="w-full bg-bg-tertiary rounded-full h-2.5 mb-6">
        <div className="bg-accent-blue h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>

      <div className="bg-bg-secondary p-4 rounded-xl border border-border mb-6">
        <p className="text-text-secondary text-sm mb-2">Фокус мышц</p>
        <div className="flex flex-wrap gap-2">
          {['грудь', 'спина', 'ноги', 'плечи', 'руки', 'пресс', 'ягодицы'].map((muscle) => (
            <button
              key={muscle}
              onClick={() => {
                const newFocus = focusMuscles.includes(muscle)
                  ? focusMuscles.filter(m => m !== muscle)
                  : [...focusMuscles, muscle];
                setFocusMuscles(newFocus);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                focusMuscles.includes(muscle)
                  ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                  : 'bg-bg-tertiary border-border text-text-secondary'
              }`}
            >
              {muscle}
            </button>
          ))}
        </div>
        <button onClick={updateFocus} className="mt-3 btn-primary px-4 py-1.5 rounded-lg text-sm">
          Применить фокус
        </button>
      </div>

      {plan && plan.months && plan.months.length > 0 ? (
        <div className="space-y-4">
          {plan.months.map((monthData: any, index: number) => (
            <div key={index} className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedMonth(expandedMonth === index ? null : index)}
                className="w-full p-4 flex justify-between items-center hover:bg-bg-tertiary transition"
              >
                <span className="font-semibold text-text">{monthData.name || `Месяц ${index + 1}`}</span>
                <span className="text-text-secondary">
                  {expandedMonth === index ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </span>
              </button>
              {expandedMonth === index && (
                <div className="p-4 pt-0 space-y-3">
                  <p className="text-text-secondary text-sm">Фокус: {monthData.focus || 'Общий'}</p>
                  {monthData.weeks?.map((week: any, wi: number) => (
                    <div key={wi} className="bg-bg-tertiary p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-text">Неделя {week.week || wi + 1}</span>
                        <button
                          onClick={() => toggleWeek(week.week || wi + 1)}
                          className="text-text-secondary hover:text-accent-blue transition"
                        >
                          <Circle size={18} />
                        </button>
                      </div>
                      {week.days?.map((day: any, di: number) => (
                        <div key={di} className="mt-2">
                          <p className="text-text-secondary text-sm font-medium">{day.day}</p>
                          <ul className="list-disc list-inside text-text-secondary text-sm space-y-0.5">
                            {day.exercises?.map((ex: any, ei: number) => (
                              <li key={ei}>
                                {ex.name} – {ex.sets}×{ex.reps} {ex.weight > 0 ? `• ${ex.weight} кг` : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-bg-secondary p-6 rounded-xl border border-border text-center">
          <p className="text-text-secondary">План ещё не сгенерирован</p>
          <button onClick={generatePlan} className="mt-3 btn-primary px-4 py-2 rounded-lg text-sm">
            Сгенерировать план
          </button>
        </div>
      )}

      <button onClick={generatePlan} className="mt-6 btn-secondary w-full py-2 rounded-lg">
        Пересоздать план
      </button>
    </div>
  );
}