import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Target,
  Dumbbell,
  Sparkles,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useAuthStore } from '@/store/authStore';
import { useCoachStore } from '@/store/coachStore';
import { useProfileStore } from '@/store/profileStore';
import { supabase } from '@/lib/supabase';
import type { CoachData } from '@/types';

const MAIN_GOAL_OPTIONS = [
  { id: 'lose_weight', label: 'Похудение' },
  { id: 'gain_muscle', label: 'Набор мышечной массы' },
  { id: 'increase_strength', label: 'Увеличение силы' },
  { id: 'custom', label: 'Своя цель' },
];

const EXPERIENCE_OPTIONS = [
  ['never', 'Никогда'],
  ['up_3m', 'До 3 месяцев'],
  ['3_12m', '3-12 месяцев'],
  ['over_year', 'Более года'],
];

const LEVEL_OPTIONS = [
  ['beginner', 'Начинающий'],
  ['intermediate', 'Средний'],
  ['advanced', 'Продвинутый'],
  ['professional', 'Профессиональный'],
];

const INJURY_OPTIONS = [
  { id: 'none', label: 'Нет' },
  { id: 'back', label: 'Спина' },
  { id: 'knees', label: 'Колени' },
  { id: 'shoulders', label: 'Плечи' },
  { id: 'other', label: 'Другое' },
];

const INVENTORY_OPTIONS = [
  { id: 'bodyweight', label: 'Свой вес' },
  { id: 'dumbbells', label: 'Гантели' },
  { id: 'barbell', label: 'Штанга' },
  { id: 'pullup_bar', label: 'Турник' },
  { id: 'gym', label: 'Тренажерный зал' },
  { id: 'resistance_bands', label: 'Резинки' },
];

const FOCUS_MUSCLES = [
  { id: 'chest', label: 'ГРУДНЫЕ' },
  { id: 'biceps', label: 'БИЦЕПС' },
  { id: 'triceps', label: 'ТРИЦЕПС' },
  { id: 'abs', label: 'ПРЕСС' },
  { id: 'legs', label: 'НОГИ' },
  { id: 'back', label: 'СПИНА' },
  { id: 'shoulders', label: 'ПЛЕЧИ' },
];

const toggleArr = (arr: string[], id: string): string[] =>
  arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

interface OptionButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function OptionButton({ active, onClick, label }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all text-left w-full ${
        active
          ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
          : 'border-border text-text-secondary hover:border-text-tertiary hover:text-text'
      }`}
    >
      {label}
      {active && <Check size={16} className="inline ml-2" />}
    </button>
  );
}

const ACTIVITY_LEVEL_OPTIONS = [
  { id: 'sedentary', label: 'Сидячий' },
  { id: 'light', label: 'Легкая активность (1-2 дня в неделю)' },
  { id: 'moderate', label: 'Средняя (3-4 дня)' },
  { id: 'high', label: 'Высокая (5-7 дней)' },
  { id: 'very_high', label: 'Очень высокая (ежедневные интенсивные тренировки)' },
];

const STEPS = [
  { icon: Target, title: 'Цель + Опыт' },
  { icon: Dumbbell, title: 'Данные + Активность' },
  { icon: Sparkles, title: 'Фокус + Личная цель' },
];

export default function CoachPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { saveCoachData, saving } = useCoachStore();
  const { profile, fetchProfile } = useProfileStore();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState<Partial<CoachData>>({
    main_goal: '',
    experience_duration: '',
    training_level: '',
    injuries: [],
    health_restrictions: '',
    focus_muscle: '',
    goal_type: '',
    goal_amount: null,
    goal_unit: '',
    personal_goal: '',
    exercise_likes: '',
    exercise_dislikes: '',
    inventory: [],
    gender: 'male',
    age: null,
    weight: null,
    height: null,
    activity_level: 'moderate',
    current_weight: null,
    target_weight: null,
    target_weeks: null,
  });

  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [targetWeight, setTargetWeight] = useState<number>(0);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<string[]>([]);
  const [customGoalText, setCustomGoalText] = useState('');
  const [strengthExercise, setStrengthExercise] = useState('bench');
  const [strengthTarget, setStrengthTarget] = useState<number>(0);
  const [unrealisticWarning, setUnrealisticWarning] = useState<string | null>(null);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);

  if (!user) return null;

  const set = <K extends keyof CoachData>(key: K, value: CoachData[K]) =>
    setForm({ ...form, [key]: value });

  const isFemale = form.gender === 'female';
  const totalSteps = 3;
  const isLastStep = step === totalSteps - 1;

  // Проверка реалистичности цели
  useEffect(() => {
    if (form.current_weight && form.target_weight) {
      const diff = Math.abs(form.current_weight - form.target_weight);
      const diffPercent = (diff / form.current_weight) * 100;
      
      if (diffPercent > 30) {
        setUnrealisticWarning('Это очень амбициозная цель. Рекомендуем ставить реалистичные цели (не более 10-15% от текущего веса)');
      } else {
        setUnrealisticWarning(null);
      }
    } else {
      setUnrealisticWarning(null);
    }

    if (form.target_weeks) {
      if (form.target_weeks < 4) {
        setTimeWarning('Слишком короткий срок. Минимум 4 недели для безопасного достижения цели.');
      } else if (form.target_weeks > 52) {
        setTimeWarning('Слишком долгий срок. Максимум 52 недели для эффективной работы.');
      } else {
        setTimeWarning(null);
      }
    } else {
      setTimeWarning(null);
    }
  }, [form.current_weight, form.target_weight, form.target_weeks]);

  const handleNext = () => {
    try {
      if (step < totalSteps - 1) setStep(step + 1);
    } catch (error) {
      console.error('Error moving to next step:', error);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = async () => {
    if (!user) return;

    // Рассчитываем авто-время если не указано
    if (form.current_weight && form.target_weight && !form.target_weeks) {
      const diff = Math.abs(form.current_weight - form.target_weight);
      // Безопасный темп: 0.5 кг в неделю
      const autoWeeks = Math.ceil(diff / 0.5);
      set('target_weeks', Math.min(Math.max(autoWeeks, 4), 52)); // от 4 до 52 недель
    }

    if (form.main_goal === 'custom') {
      set('personal_goal', customGoalText);
    } else if (form.main_goal === 'increase_strength') {
      set('personal_goal', `${strengthExercise === 'bench' ? 'Жим лёжа' : strengthExercise === 'squat' ? 'Присед' : 'Становая тяга'} ${strengthTarget} кг`);
    } else if (form.main_goal === 'lose_weight') {
      set('personal_goal', `Похудение до ${form.target_weight || targetWeight} кг`);
    } else if (form.main_goal === 'gain_muscle') {
      set('personal_goal', 'Набор мышечной массы');
    }

    if (selectedMuscles.length > 0) {
      set('focus_muscle', selectedMuscles.join(','));
    }

    if (selectedInventory.length > 0) {
      set('inventory', selectedInventory);
    }

    if (form.main_goal === 'lose_weight') {
      set('goal_type', 'weight_loss');
      set('goal_amount', form.target_weight || targetWeight);
      set('goal_unit', 'кг');
    } else if (form.main_goal === 'gain_muscle') {
      set('goal_type', 'muscle_gain');
      set('goal_amount', 0);
      set('goal_unit', '');
    } else if (form.main_goal === 'increase_strength') {
      set('goal_type', 'strength');
      set('goal_amount', strengthTarget);
      set('goal_unit', 'кг');
    }

    const ok = await saveCoachData(user.id, form);
    if (ok) navigate('/dashboard');
  };

  const toggleMuscle = (muscleId: string) => {
    setSelectedMuscles(prev =>
      prev.includes(muscleId) ? prev.filter(m => m !== muscleId) : [...prev, muscleId]
    );
  };

  const toggleInventory = (invId: string) => {
    setSelectedInventory(prev =>
      prev.includes(invId) ? prev.filter(i => i !== invId) : [...prev, invId]
    );
  };

  const toggleInjury = (injId: string) => {
    if (injId === 'none') {
      set('injuries', []);
    } else {
      set('injuries', toggleArr(form.injuries!, injId));
    }
  };

  const StepIcon = STEPS[step].icon;

  useEffect(() => {
    if (user) {
      fetchProfile(user.id);
      if (profile?.weight) setCurrentWeight(profile.weight);
    }
  }, [user]);

  return (
    <div>
      <TopBar title="Анкета тренера" />
      <main className="p-4 lg:p-8 max-w-2xl mx-auto animate-slide-up">
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all ${
                i <= step ? 'bg-accent-blue' : 'bg-bg-tertiary'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/15 flex items-center justify-center">
            <StepIcon size={20} className="text-accent-blue" />
          </div>
          <div>
            <p className="text-xs text-text-tertiary">Шаг {step + 1} из {totalSteps}</p>
            <h2 className="text-lg font-bold text-text">{STEPS[step].title}</h2>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          {/* Шаг 0: Цель + Опыт */}
          {step === 0 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="text-accent-blue" />
                <p className="text-sm text-text-secondary">От этого выбора зависит тип тренировок в плане</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Главная цель</label>
                <div className="space-y-2">
                  {MAIN_GOAL_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.id}
                      active={form.main_goal === opt.id}
                      onClick={() => set('main_goal', opt.id)}
                      label={opt.label}
                    />
                  ))}
                </div>
              </div>

              {form.main_goal === 'increase_strength' && (
                <div className="p-4 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Выберите упражнение</label>
                  <div className="space-y-2 mb-3">
                    <OptionButton
                      active={strengthExercise === 'bench'}
                      onClick={() => setStrengthExercise('bench')}
                      label="Жим лёжа"
                    />
                    <OptionButton
                      active={strengthExercise === 'squat'}
                      onClick={() => setStrengthExercise('squat')}
                      label="Приседания"
                    />
                    <OptionButton
                      active={strengthExercise === 'deadlift'}
                      onClick={() => setStrengthExercise('deadlift')}
                      label="Становая тяга"
                    />
                  </div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Целевой вес (кг)</label>
                  <input
                    type="number"
                    value={strengthTarget || ''}
                    onChange={(e) => setStrengthTarget(Number(e.target.value))}
                    placeholder="Например: 100"
                    className="input-field w-full px-3 py-2.5 text-sm"
                    min="1"
                    step="5"
                  />
                  {isFemale && strengthTarget > 100 && (
                    <p className="text-xs text-accent-red mt-2">⚠️ Для женщин такой вес может быть нереалистичен.</p>
                  )}
                </div>
              )}

              {form.main_goal === 'custom' && (
                <div className="p-4 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Опишите вашу цель</label>
                  <textarea
                    value={customGoalText}
                    onChange={(e) => setCustomGoalText(e.target.value)}
                    placeholder="Например: пробежать полумарафон за 2 часа..."
                    className="input-field w-full px-3 py-2.5 text-sm min-h-[100px] resize-none"
                  />
                </div>
              )}

              {form.main_goal === 'lose_weight' && (
                <div className="p-4 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Целевой вес (кг)</label>
                  <input
                    type="number"
                    value={targetWeight || ''}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    placeholder={`Текущий: ${currentWeight || '--'} кг`}
                    className="input-field w-full px-3 py-2.5 text-sm"
                    min="1"
                    step="0.5"
                  />
                  <p className="text-xs text-text-secondary mt-2">Рекомендуемая потеря: 0.5-1 кг в неделю</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Опыт тренировок</label>
                <div className="space-y-2">
                  {EXPERIENCE_OPTIONS.map(([val, label]) => (
                    <OptionButton
                      key={val}
                      active={form.experience_duration === val}
                      onClick={() => set('experience_duration', val)}
                      label={label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Уровень подготовки</label>
                <div className="space-y-2">
                  {LEVEL_OPTIONS.map(([val, label]) => (
                    <OptionButton
                      key={val}
                      active={form.training_level === val}
                      onClick={() => set('training_level', val)}
                      label={label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Травмы</label>
                <div className="flex flex-wrap gap-2">
                  {INJURY_OPTIONS.map((inj) => (
                    <button
                      key={inj.id}
                      onClick={() => toggleInjury(inj.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        inj.id === 'none'
                          ? form.injuries!.length === 0
                            ? 'bg-accent-green/15 border-accent-green/40 text-accent-green'
                            : 'border-border text-text-secondary'
                          : form.injuries!.includes(inj.id)
                            ? 'bg-accent-red/15 border-accent-red/40 text-accent-red'
                            : 'border-border text-text-secondary'
                      }`}
                    >
                      {inj.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Шаг 1: Данные + Активность */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell size={18} className="text-accent-blue" />
                <p className="text-sm text-text-secondary">Ваши данные и уровень активности</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Пол</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => set('gender', 'male')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        form.gender === 'male'
                          ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                          : 'border-border text-text-secondary'
                      }`}
                    >
                      Мужской
                    </button>
                    <button
                      onClick={() => set('gender', 'female')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        form.gender === 'female'
                          ? 'bg-accent-purple/15 border-accent-purple/40 text-accent-purple'
                          : 'border-border text-text-secondary'
                      }`}
                    >
                      Женский
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Возраст</label>
                  <input
                    type="number"
                    value={form.age || ''}
                    onChange={(e) => set('age', Number(e.target.value))}
                    placeholder="лет"
                    className="input-field w-full px-3 py-2.5 text-sm"
                    min="14"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Текущий вес (кг)</label>
                  <input
                    type="number"
                    value={form.current_weight || form.weight || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      set('current_weight', val);
                      set('weight', val);
                    }}
                    placeholder="кг"
                    className="input-field w-full px-3 py-2.5 text-sm"
                    min="30"
                    max="200"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Рост (см)</label>
                  <input
                    type="number"
                    value={form.height || ''}
                    onChange={(e) => set('height', Number(e.target.value))}
                    placeholder="см"
                    className="input-field w-full px-3 py-2.5 text-sm"
                    min="100"
                    max="250"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Уровень физической активности</label>
                <div className="space-y-2">
                  {ACTIVITY_LEVEL_OPTIONS.map((opt) => (
                    <OptionButton
                      key={opt.id}
                      active={form.activity_level === opt.id}
                      onClick={() => set('activity_level', opt.id)}
                      label={opt.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Инвентарь</label>
                <div className="flex flex-wrap gap-2">
                  {INVENTORY_OPTIONS.map((inv) => (
                    <button
                      key={inv.id}
                      onClick={() => toggleInventory(inv.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        selectedInventory.includes(inv.id)
                          ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                          : 'border-border text-text-secondary'
                      }`}
                    >
                      {inv.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-2">Выберите хотя бы один вариант</p>
              </div>
            </>
          )}

          {/* Шаг 2: Фокус + Личная цель */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-accent-gold" />
                <p className="text-sm text-text-secondary">Выберите мышцы и уточните цель</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Акцентные мышцы</label>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_MUSCLES.map((muscle) => (
                    <button
                      key={muscle.id}
                      onClick={() => toggleMuscle(muscle.id)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all ${
                        selectedMuscles.includes(muscle.id)
                          ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                          : 'border-border text-text-secondary'
                      }`}
                    >
                      {muscle.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-secondary mt-2">Выберите хотя бы одну группу мышц</p>
              </div>

              {/* Целевой вес и время достижения для похудения */}
              {(form.main_goal === 'lose_weight' || form.main_goal === 'gain_muscle') && (
                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Текущий вес (кг) *
                      </label>
                      <input
                        type="number"
                        value={form.current_weight || ''}
                        onChange={(e) => set('current_weight', Number(e.target.value))}
                        placeholder="кг"
                        className="input-field w-full px-3 py-2.5 text-sm"
                        min="30"
                        max="200"
                        step="0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Целевой вес (кг) *
                      </label>
                      <input
                        type="number"
                        value={form.target_weight || ''}
                        onChange={(e) => set('target_weight', Number(e.target.value))}
                        placeholder="кг"
                        className="input-field w-full px-3 py-2.5 text-sm"
                        min="30"
                        max="200"
                        step="0.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Желаемое время достижения (недель)
                    </label>
                    <input
                      type="number"
                      value={form.target_weeks || ''}
                      onChange={(e) => set('target_weeks', Number(e.target.value))}
                      placeholder="Оставьте пустым для авто-расчёта"
                      className="input-field w-full px-3 py-2.5 text-sm"
                      min="4"
                      max="52"
                      step="1"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Безопасный темп: 0.5-1 кг в неделю
                    </p>
                  </div>

                  {unrealisticWarning && (
                    <div className="mt-3 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30">
                      <p className="text-xs text-accent-red">{unrealisticWarning}</p>
                    </div>
                  )}
                  {timeWarning && (
                    <div className="mt-3 p-3 rounded-lg bg-accent-orange/10 border border-accent-orange/30">
                      <p className="text-xs text-accent-orange">{timeWarning}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {form.main_goal === 'custom' ? 'Ваша цель' : 'Личная цель'}
                </label>
                {form.main_goal === 'custom' ? (
                  <textarea
                    value={customGoalText}
                    onChange={(e) => setCustomGoalText(e.target.value)}
                    placeholder="Опишите вашу конкретную цель..."
                    className="input-field w-full px-3 py-2.5 text-sm min-h-[100px] resize-none"
                  />
                ) : (
                  <textarea
                    value={form.personal_goal || ''}
                    onChange={(e) => set('personal_goal', e.target.value)}
                    placeholder="Например: хочу подтягиваться 20 раз, сбросить 5 кг..."
                    className="input-field w-full px-3 py-2.5 text-sm min-h-[100px] resize-none"
                  />
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <label className="block text-sm font-medium text-text-secondary mb-2">Предпочтения по упражнениям</label>
                <textarea
                  value={form.exercise_likes || ''}
                  onChange={(e) => set('exercise_likes', e.target.value)}
                  placeholder="Любимые упражнения..."
                  className="input-field w-full px-3 py-2.5 text-sm min-h-[80px] resize-none mb-3"
                />
                <textarea
                  value={form.exercise_dislikes || ''}
                  onChange={(e) => set('exercise_dislikes', e.target.value)}
                  placeholder="Нелюбимые упражнения..."
                  className="input-field w-full px-3 py-2.5 text-sm min-h-[80px] resize-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="btn-secondary px-4 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-30"
          >
            <ChevronLeft size={18} /> Назад
          </button>
          {!isLastStep ? (
            <button
              onClick={handleNext}
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-1.5"
            >
              Далее <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-40"
            >
              <Sparkles size={18} /> Сохранить
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
