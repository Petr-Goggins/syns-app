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
import toast from 'react-hot-toast';

const MAIN_GOAL_OPTIONS = [
  { id: 'lose_weight', label: 'Похудение' },
  { id: 'gain_muscle', label: 'Набор мышечной массы' },
  { id: 'increase_strength', label: 'Увеличение силы' },
  { id: 'custom', label: 'Своя цель' },
];

const EXPERIENCE_OPTIONS = [
  ['never', '0–6 мес'],
  ['up_3m', '6–18 мес'],
  ['3_12m', '18+ мес'],
  ['over_year', 'Профессиональный'],
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

const STEPS = [
  { icon: Target, title: 'Данные + Инвентарь' },
  { icon: Dumbbell, title: 'Цель + Опыт' },
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
  });

  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [targetWeight, setTargetWeight] = useState<number>(0);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<string[]>([]);
  const [customGoalText, setCustomGoalText] = useState('');
  const [strengthExercise, setStrengthExercise] = useState('bench');
  const [strengthTarget, setStrengthTarget] = useState<number>(0);
  const [goalTimeEstimate, setGoalTimeEstimate] = useState<{ weeks: number; date: string } | null>(null);
  const [strengthMode, setStrengthMode] = useState<'specific' | 'general'>('specific');

  useEffect(() => {
    // Вычисляем прогноз времени достижения цели при изменении весов
    if ((form.main_goal === 'gain_muscle' || form.main_goal === 'lose_weight') && currentWeight > 0 && targetWeight > 0) {
      let diff = 0;
      if (form.main_goal === 'gain_muscle') {
        diff = targetWeight - currentWeight;
      } else if (form.main_goal === 'lose_weight') {
        diff = currentWeight - targetWeight;
      }
      
      if (diff <= 0) {
        setGoalTimeEstimate(null); // Уже достиг цели или превысил
      } else {
        // Коэффициент опыта: Новичок → 1.2, Средний → 1.0, Продвинутый → 0.8, Профессиональный → 0.6
        let experienceCoeff = 1.0;
        if (form.training_level === 'beginner') experienceCoeff = 1.2;
        else if (form.training_level === 'intermediate') experienceCoeff = 1.0;
        else if (form.training_level === 'advanced') experienceCoeff = 0.8;
        else if (form.training_level === 'professional') experienceCoeff = 0.6;
        
        const weeks = Math.ceil(diff / (0.5 * experienceCoeff));
        const estimatedDate = new Date();
        estimatedDate.setDate(estimatedDate.getDate() + weeks * 7);
        setGoalTimeEstimate({ weeks, date: estimatedDate.toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: '2-digit' }) });
      }
    } else {
      setGoalTimeEstimate(null);
    }
  }, [currentWeight, targetWeight, form.main_goal, form.training_level]);

  if (!user) return null;

  const set = <K extends keyof CoachData>(key: K, value: CoachData[K]) =>
    setForm({ ...form, [key]: value });

  const isFemale = form.gender === 'female';
  const totalSteps = 3;
  const isLastStep = step === totalSteps - 1;

  const canProceed = (): boolean => {
    // Кнопка "Далее" всегда активна, валидация только визуальная
    return true;
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = async () => {
    if (!user) {
      toast.error('Пользователь не авторизован');
      return;
    }

    // Проверка обязательных полей
    if (!form.weight || !form.height || !form.age || !form.main_goal) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    // Сохраняем текущий и целевой вес в form.weight и form.goal_amount
    if (currentWeight > 0) {
      set('weight', currentWeight);
    }
    
    if (form.main_goal === 'custom') {
      set('personal_goal', customGoalText);
    } else if (form.main_goal === 'increase_strength') {
      if (strengthMode === 'specific') {
        const exerciseNames: Record<string, string> = { bench: 'Жим лёжа', squat: 'Присед', deadlift: 'Становая тяга', overhead: 'Жим стоя' };
        set('personal_goal', `${exerciseNames[strengthExercise] || strengthExercise} ${strengthTarget} кг`);
      } else {
        set('personal_goal', 'Общее увеличение силы');
      }
    } else if (form.main_goal === 'lose_weight') {
      set('personal_goal', `Похудение до ${targetWeight} кг`);
    } else if (form.main_goal === 'gain_muscle') {
      set('personal_goal', `Набор мышечной массы до ${targetWeight} кг`);
    }

    if (selectedMuscles.length > 0) {
      set('focus_muscle', selectedMuscles.join(','));
    }

    if (selectedInventory.length > 0) {
      set('inventory', selectedInventory);
    }

    if (form.main_goal === 'lose_weight') {
      set('goal_type', 'weight_loss');
      set('goal_amount', targetWeight);
      set('goal_unit', 'кг');
    } else if (form.main_goal === 'gain_muscle') {
      set('goal_type', 'muscle_gain');
      set('goal_amount', targetWeight);
      set('goal_unit', 'кг');
    } else if (form.main_goal === 'increase_strength') {
      set('goal_type', 'strength');
      set('goal_amount', strengthMode === 'specific' ? strengthTarget : null);
      set('goal_unit', strengthMode === 'specific' ? 'кг' : '');
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          gender: form.gender,
          age: parseInt(form.age?.toString() || '0'),
          weight: parseFloat(form.weight?.toString() || '0'),
          height: parseFloat(form.height?.toString() || '0'),
          target_weight: targetWeight ? parseFloat(targetWeight) : null,
          goal: form.main_goal,
          experience: form.experience_duration,
          level: form.training_level,
          injuries: form.injuries,
          activity_level: form.activity_level || 'moderate',
          inventory: selectedInventory,
          focus_muscles: selectedMuscles.join(','),
          personal_goal: form.personal_goal,
          preferences: form.health_restrictions,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (error) throw error;

      toast.success('Анкета сохранена!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка сохранения анкеты');
    }
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
          {/* Шаг 0: Данные + Инвентарь */}
          {step === 0 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="text-accent-blue" />
                <p className="text-sm text-text-secondary">Ваши данные и доступный инвентарь</p>
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
                  <label className="block text-sm font-medium text-text-secondary mb-2">Вес (кг)</label>
                  <input
                    type="number"
                    value={form.weight || ''}
                    onChange={(e) => set('weight', Number(e.target.value))}
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

          {/* Шаг 1: Цель + Опыт */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell size={18} className="text-accent-blue" />
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
                  <label className="block text-sm font-medium text-text-secondary mb-2">Режим увеличения силы</label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setStrengthMode('specific')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        strengthMode === 'specific'
                          ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                          : 'border-border text-text-secondary'
                      }`}
                    >
                      В конкретном упражнении
                    </button>
                    <button
                      type="button"
                      onClick={() => setStrengthMode('general')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                        strengthMode === 'general'
                          ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue'
                          : 'border-border text-text-secondary'
                      }`}
                    >
                      Просто увеличить силу
                    </button>
                  </div>
                  
                  {strengthMode === 'specific' && (
                    <>
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
                        <OptionButton
                          active={strengthExercise === 'overhead'}
                          onClick={() => setStrengthExercise('overhead')}
                          label="Жим стоя"
                        />
                      </div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Желаемый вес в упражнении (кг)</label>
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
                    </>
                  )}
                  
                  {strengthMode === 'general' && (
                    <p className="text-sm text-text-secondary">Тренировки будут направлены на общее увеличение силы без привязки к конкретному упражнению.</p>
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
                  <label className="block text-sm font-medium text-text-secondary mb-2">Текущий вес (кг)</label>
                  <input
                    type="number"
                    value={currentWeight || ''}
                    onChange={(e) => setCurrentWeight(Number(e.target.value))}
                    placeholder="Например: 80"
                    className="input-field w-full px-3 py-2.5 text-sm"
                    min="1"
                    step="0.5"
                  />
                  <label className="block text-sm font-medium text-text-secondary mb-2 mt-3">Целевой вес (кг)</label>
                  <input
                    type="number"
                    value={targetWeight || ''}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    placeholder="Например: 70"
                    className="input-field w-full px-3 py-2.5 text-sm"
                    min="1"
                    step="0.5"
                  />
                  {goalTimeEstimate ? (
                    <p className="text-xs text-text-secondary mt-2">
                      Примерно через {goalTimeEstimate.weeks} нед. (ориентировочно {goalTimeEstimate.date})
                    </p>
                  ) : currentWeight > 0 && targetWeight > 0 && currentWeight <= targetWeight ? (
                    <p className="text-xs text-accent-green mt-2">Вы уже достигли цели или превысили её</p>
                  ) : null}
                  <p className="text-xs text-text-secondary mt-2">Рекомендуемая потеря: 0.5 кг в неделю</p>
                </div>
              )}

              {form.main_goal === 'gain_muscle' && (
                <div className="p-4 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Текущий вес (кг)</label>
                  <input
                    type="number"
                    value={currentWeight || ''}
                    onChange={(e) => setCurrentWeight(Number(e.target.value))}
                    placeholder="Например: 70"
                    className="input-field w-full px-3 py-2.5 text-sm"
                    min="1"
                    step="0.5"
                  />
                  <label className="block text-sm font-medium text-text-secondary mb-2 mt-3">Целевой вес (кг)</label>
                  <input
                    type="number"
                    value={targetWeight || ''}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    placeholder="Например: 80"
                    className="input-field w-full px-3 py-2.5 text-sm"
                    min="1"
                    step="0.5"
                  />
                  {goalTimeEstimate ? (
                    <p className="text-xs text-text-secondary mt-2">
                      Примерно через {goalTimeEstimate.weeks} нед. (ориентировочно {goalTimeEstimate.date})
                    </p>
                  ) : currentWeight > 0 && targetWeight > 0 && currentWeight >= targetWeight ? (
                    <p className="text-xs text-accent-green mt-2">Вы уже достигли цели или превысили её</p>
                  ) : null}
                  <p className="text-xs text-text-secondary mt-2">Рекомендуемый набор: 0.5 кг в неделю</p>
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
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
