import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Target,
  Dumbbell,
  Sparkles,
  Trophy,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useAuthStore } from '@/store/authStore';
import { useCoachStore } from '@/store/coachStore';
import { useProfileStore } from '@/store/profileStore';
import { useLongPathStore } from '@/store/longPathStore';
import { supabase } from '@/lib/supabase';
import type { CoachData } from '@/types';

// Конкретные цели вместо абстрактных
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

const STEPS = [
  { icon: Target, title: 'Цель + Опыт' },
  { icon: Dumbbell, title: 'Данные + Инвентарь' },
  { icon: Sparkles, title: 'Фокус + Личная цель' },
];

export default function CoachPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { saveCoachData, saving } = useCoachStore();
  const { profile, fetchProfile } = useProfileStore();
  const { createUserGoal } = useLongPathStore();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState<Partial<CoachData>>({
    main_goal: '',
    experience_duration: '',
    training_level: '',
    injuries: [],
    health_restrictions: '',
    stress_level: '',
    diet_preference: '',
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

  // Для шага 3 - целевой вес и текущий вес
  const [currentWeight, setCurrentWeight] = useState<number>(0);
  const [targetWeight, setTargetWeight] = useState<number>(0);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<string[]>([]);
  const [customGoalText, setCustomGoalText] = useState('');
  const [strengthExercise, setStrengthExercise] = useState('bench');
  const [strengthTarget, setStrengthTarget] = useState<number>(0);

  if (!user) return null;

  const set = <K extends keyof CoachData>(key: K, value: CoachData[K]) =>
    setForm({ ...form, [key]: value });

  const isFemale = form.gender === 'female';
  const totalSteps = 3; // 3 шага: Цель+Опыт, Данные+Инвентарь, Фокус+Личная цель
  const isLastStep = step === totalSteps - 1;

  const canProceed = (): boolean => {
    switch (step) {
      case 0: 
        if (!form.main_goal) return false;
        if (form.main_goal === 'increase_strength' && !strengthTarget) return false;
        if (form.main_goal === 'custom' && !customGoalText) return false;
        return !!form.experience_duration && !!form.training_level && form.injuries!.length > 0;
      case 1: 
        return !!form.gender && !!form.age && !!form.weight && !!form.height && selectedInventory.length > 0;
      case 2: 
        return selectedMuscles.length > 0 && (customGoalText || form.main_goal !== 'custom');
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = async () => {
    if (!user) return;
    
    // Сохраняем личную цель
    if (form.main_goal === 'custom') {
      set('personal_goal', customGoalText);
    } else if (form.main_goal === 'increase_strength') {
      set('personal_goal', `${strengthExercise === 'bench' ? 'Жим лёжа' : strengthExercise === 'squat' ? 'Присед' : 'Становая тяга'} ${strengthTarget} кг`);
    } else if (form.main_goal === 'lose_weight') {
      set('personal_goal', `Похудение до ${targetWeight} кг`);
    } else if (form.main_goal === 'gain_muscle') {
      set('personal_goal', 'Набор мышечной массы');
    }
    
    // Сохраняем акцентные мышцы
    if (selectedMuscles.length > 0) {
      set('focus_muscle', selectedMuscles.join(','));
    }
    
    // Сохраняем инвентарь
    if (selectedInventory.length > 0) {
      set('inventory', selectedInventory);
    }
    
    // Сохраняем тип цели
    if (form.main_goal === 'lose_weight') {
      set('goal_type', 'weight_loss');
      set('goal_amount', targetWeight);
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

  // Загрузка данных профиля при монтировании
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
        {/* Progress bar */}
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

        {/* Step header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/15 flex items-center justify-center">
            <StepIcon size={20} className="text-accent-blue" />
          </div>
          <div>
            <p className="text-xs text-text-tertiary">Шаг {step + 1} из {totalSteps}</p>
            <h2 className="text-lg font-bold text-text">{STEPS[step].title}</h2>
          </div>
        </div>

        {/* Step content */}
        <div className="card p-6 space-y-5">
        {/* Step 0: Goal + Experience */}
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
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Опыт тренировок</label>
                <div className="space-y-2">
                  {[
                    ['never', 'Никогда'],
                    ['up_3m', 'До 3 месяцев'],
                    ['3_12m', '3-12 месяцев'],
                    ['over_year', 'Более года'],
                  ].map(([val, label]) => (
                    <OptionButton key={val} active={form.experience_duration === val} onClick={() => set('experience_duration', val)} label={label} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Уровень подготовки</label>
                <div className="space-y-2">
                  {[
                    ['beginner', 'Начинающий'],
                    ['intermediate', 'Средний'],
                    ['advanced', 'Продвинутый'],
                    ['professional', 'Профессиональный'],
                  ].map(([val, label]) => (
                    <OptionButton key={val} active={form.training_level === val} onClick={() => set('training_level', val)} label={label} />
                  ))}
                </div>
              </div>
              {form.main_goal && (
                <div className="p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/20 mt-3 animate-fade-in">
                  <p className="text-xs text-text-secondary">
                    {form.main_goal === 'gain_muscle' && 'План будет состоять из силовых упражнений с прогрессией весов'}
                    {form.main_goal === 'lose_weight' && 'План: силовые + кардио для максимального жиросжигания'}
                    {form.main_goal === 'maintain_tone' && 'План: функциональные упражнения + стретчинг'}
                    {form.main_goal === 'recovery' && 'План: йога, стретчинг и лёгкие упражнения для восстановления'}
                    {form.main_goal === 'flexibility' && 'План: стретчинг и йога для гибкости и подвижности'}
                    {form.main_goal === 'general_health' && 'План: смешанные тренировки с умеренной интенсивностью'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Step 1: Global Goal + Muscle Silhouette */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={18} className="text-accent-gold" />
                <p className="text-sm text-text-secondary">Выберите вашу большую цель на ближайшие месяцы</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Глобальная цель</label>
                <div className="space-y-2">
                  {LONG_PATH_GOALS.map((goal) => (
                    <OptionButton
                      key={goal.id}
                      active={selectedLongPathGoal === goal.id}
                      onClick={() => setSelectedLongPathGoal(goal.id)}
                      label={goal.label}
                    />
                  ))}
                </div>
              </div>
              
              {/* Поле для ввода целевого веса при похудении */}
              {selectedLongPathGoal === 'weight_loss' && (
                <div className="p-4 rounded-lg bg-accent-blue/10 border border-accent-blue/20 animate-fade-in">
                  <label className="block text-sm font-medium text-text-secondary mb-2">Целевой вес (кг)</label>
                  <input
                    type="number"
                    value={targetWeight || ''}
                    onChange={(e) => setTargetWeight(Number(e.target.value))}
                    placeholder={`Текущий: ${profile?.weight || '--'} кг`}
                    className="input-field w-full px-3 py-2.5 text-sm"
                    min="1"
                    step="0.5"
                  />
                  <p className="text-xs text-text-secondary mt-2">
                    Рекомендуемая потеря: 0.5-1 кг в неделю
                  </p>
                </div>
              )}
              
              <div className="pt-4 border-t border-border">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Акцентные мышцы (кликните на силуэте)
                </label>
                <MuscleSilhouette
                  selectedMuscles={selectedMuscles}
                  onMuscleClick={toggleMuscle}
                  mode="selection"
                  size="md"
                  showLabels={true}
                />
              </div>
            </>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Дней в неделю</label>
                <div className="flex gap-2 flex-wrap">
                  {[1,2,3,4,5,6,7].map((d) => (
                    <button
                      key={d}
                      onClick={() => set('days_per_week', d)}
                      className={`w-12 h-12 rounded-lg text-sm font-bold border transition-all ${
                        form.days_per_week === d ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue' : 'border-border text-text-secondary'
                      }`}
                    >{d}</button>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                <p className="text-sm text-text-secondary">
                  💡 Эти настройки можно будет изменить позже при создании плана тренировок
                </p>
              </div>
            </>
          )}

          {/* Step 3: Health + Recovery + Nutrition */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Уровень стресса</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['low', 'Низкий'],
                    ['medium', 'Средний'],
                    ['high', 'Высокий'],
                  ].map(([val, label]) => (
                    <OptionButton key={val} active={form.stress_level === val} onClick={() => set('stress_level', val)} label={label} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Диетические предпочтения</label>
                <div className="space-y-2">
                  {[
                    ['none', 'Нет'],
                    ['vegetarian', 'Вегетарианство'],
                    ['vegan', 'Веганство'],
                    ['halal', 'Халяль'],
                    ['kosher', 'Кошер'],
                    ['other', 'Другое'],
                  ].map(([val, label]) => (
                    <OptionButton key={val} active={form.diet_preference === val} onClick={() => set('diet_preference', val)} label={label} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Травмы</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => set('injuries', [])}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      form.injuries!.length === 0 ? 'bg-accent-green/15 border-accent-green/40 text-accent-green' : 'border-border text-text-secondary'
                    }`}
                  >Нет травм</button>
                  {INJURY_OPTIONS.map((inj) => (
                    <button
                      key={inj.id}
                      onClick={() => set('injuries', toggleArr(form.injuries!, inj.id))}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                        form.injuries!.includes(inj.id) ? 'bg-accent-red/15 border-accent-red/40 text-accent-red' : 'border-border text-text-secondary'
                      }`}
                    >{inj.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Ограничения по здоровью</label>
                <input
                  type="text"
                  value={form.health_restrictions ?? ''}
                  onChange={(e) => set('health_restrictions', e.target.value)}
                  placeholder="Например: гипертония, диабет..."
                  className="input-field w-full px-3 py-2.5 text-sm"
                />
              </div>
              {isFemale && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays size={18} className="text-accent-purple" />
                    <p className="text-sm text-text-secondary">Женский цикл (необязательно)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Дата начала последних месячных</label>
                    <input
                      type="date"
                      value={cycleLastPeriod}
                      onChange={(e) => setCycleLastPeriod(e.target.value)}
                      className="input-field w-full px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Длительность цикла (дней)</label>
                    <input
                      type="number"
                      value={cycleLength}
                      onChange={(e) => setCycleLength(Number(e.target.value))}
                      className="input-field w-full px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 4: Focus Muscles (Silhouette) */}
          {step === 4 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Heart size={18} className="text-accent-red" />
                <p className="text-sm text-text-secondary">Кликните на зоны, которые хотите проработать</p>
              </div>
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => setSilhouetteView('front')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    silhouetteView === 'front' ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue' : 'border-border text-text-secondary'
                  }`}>Спереди</button>
                <button
                  onClick={() => setSilhouetteView('back')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    silhouetteView === 'back' ? 'bg-accent-blue/15 border-accent-blue/40 text-accent-blue' : 'border-border text-text-secondary'
                  }`}>Сзади</button>
              </div>
              <MuscleSilhouette
                selectedMuscles={selectedMuscles}
                onMuscleClick={toggleMuscle}
                mode="selection"
                size="lg"
                showLabels={true}
                view={silhouetteView}
              />
              <div className="mt-4 p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                <p className="text-sm text-text-secondary">
                  Выбрано мышц: {selectedMuscles.length > 0 ? selectedMuscles.join(', ') : 'ничего'}
                </p>
              </div>
            </>
          )}

          {/* Step 5: Personal Goal */}
          {step === 5 && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-accent-gold" />
                <p className="text-sm text-text-secondary">Опишите вашу конкретную цель</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Какая у вас конкретная цель?</label>
                <textarea
                  value={form.personal_goal ?? ''}
                  onChange={(e) => set('personal_goal', e.target.value)}
                  placeholder="Например: присесть 150 кг, пробежать марафон, сбросить 10 кг..."
                  className="input-field w-full px-3 py-2.5 text-sm min-h-[120px] resize-none"
                />
                <p className="text-xs text-text-secondary mt-2">Опишите вашу цель максимально конкретно</p>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">Какие упражнения вы любите или не любите?</label>
                <textarea
                  value={form.exercise_likes ?? ''}
                  onChange={(e) => set('exercise_likes', e.target.value)}
                  placeholder="Любимые: например, приседания, тяга гантели..."
                  className="input-field w-full px-3 py-2.5 text-sm min-h-[80px] resize-none mb-4"
                />
                <textarea
                  value={form.exercise_dislikes ?? ''}
                  onChange={(e) => set('exercise_dislikes', e.target.value)}
                  placeholder="Нелюбимые: например, берпи, прыжки..."
                  className="input-field w-full px-3 py-2.5 text-sm min-h-[80px] resize-none"
                />
                <p className="text-xs text-text-secondary mt-2">Мы учтём ваши предпочтения при составлении программы</p>
              </div>
            </>
          )}

          {/* Step 6: Additional Parameters */}
          {step === 6 && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Уровень стресса</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['low', 'Низкий'],
                    ['medium', 'Средний'],
                    ['high', 'Высокий'],
                  ].map(([val, label]) => (
                    <OptionButton key={val} active={form.stress_level === val} onClick={() => set('stress_level', val)} label={label} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Диетические предпочтения</label>
                <div className="space-y-2">
                  {[
                    ['none', 'Нет'],
                    ['vegetarian', 'Вегетарианство'],
                    ['vegan', 'Веганство'],
                    ['halal', 'Халяль'],
                    ['kosher', 'Кошер'],
                    ['other', 'Другое'],
                  ].map(([val, label]) => (
                    <OptionButton key={val} active={form.diet_preference === val} onClick={() => set('diet_preference', val)} label={label} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Ограничения по здоровью</label>
                <input
                  type="text"
                  value={form.health_restrictions ?? ''}
                  onChange={(e) => set('health_restrictions', e.target.value)}
                  placeholder="Например: гипертония, диабет..."
                  className="input-field w-full px-3 py-2.5 text-sm"
                />
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
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
              disabled={!canProceed()}
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-40"
            >
              Далее <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-40"
            >
              <Sparkles size={18} /> Создать план
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
