import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Heart,
  Clock,
  Dumbbell,
  Moon,
  Target,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useAuthStore } from '@/store/authStore';
import { useCoachStore } from '@/store/coachStore';
import { useProfileStore } from '@/store/profileStore';
import { supabase } from '@/lib/supabase';
import type { CoachData } from '@/types';

const MAIN_GOAL_OPTIONS = [
  { id: 'gain_muscle', label: 'Набор мышечной массы' },
  { id: 'lose_weight', label: 'Похудение' },
  { id: 'maintain_tone', label: 'Поддержание тонуса' },
  { id: 'recovery', label: 'Восстановление после травмы' },
  { id: 'flexibility', label: 'Улучшение гибкости и подвижности' },
  { id: 'general_health', label: 'Общее укрепление здоровья' },
];

const INJURY_OPTIONS = [
  { id: 'колено', label: 'Колено' },
  { id: 'спина', label: 'Спина' },
  { id: 'плечо', label: 'Плечо' },
];

const FREE_DAYS = [
  { id: '1', label: 'Пн' }, { id: '2', label: 'Вт' }, { id: '3', label: 'Ср' },
  { id: '4', label: 'Чт' }, { id: '5', label: 'Пт' }, { id: '6', label: 'Сб' }, { id: '7', label: 'Вс' },
];

const FOCUS_MUSCLES = [
  { id: 'грудь', label: 'Грудь' }, { id: 'спина', label: 'Спина' }, { id: 'ноги', label: 'Ноги' },
  { id: 'плечи', label: 'Плечи' }, { id: 'руки', label: 'Руки' }, { id: 'пресс', label: 'Пресс' },
  { id: 'ягодицы', label: 'Ягодицы' },
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
  { icon: Target, title: 'Цель и опыт' },
  { icon: Clock, title: 'Режим тренировок' },
  { icon: Heart, title: 'Здоровье и восстановление' },
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
    days_per_week: 3,
    preferred_time: '',
    workout_duration: '',
    free_days: [],
    exercise_preference: '',
    priority: '',
    include_cardio: '',
    sleep_hours: '',
    stress_level: '',
    diet_preference: '',
    focus_type: '',
    focus_muscle: '',
    focus_event: '',
  });

  // Cycle data (saved directly to profile)
  const [cycleLastPeriod, setCycleLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState(28);

  if (!user) return null;

  const set = <K extends keyof CoachData>(key: K, value: CoachData[K]) =>
    setForm({ ...form, [key]: value });

  const isFemale = profile?.gender === 'female';
  const totalSteps = 3; // Всегда 3 шага
  const isLastStep = step === totalSteps - 1;

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!form.main_goal && !!form.experience_duration;
      case 1: return !!form.days_per_week && !!form.preferred_time && !!form.workout_duration;
      case 2: return !!form.stress_level;
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
    const ok = await saveCoachData(user.id, form);
    if (ok && isFemale && cycleLastPeriod) {
      // Save cycle data to profile
      await supabase
        .from('profiles')
        .update({ cycle_last_period: cycleLastPeriod, cycle_length: cycleLength })
        .eq('id', user.id);
      if (profile) fetchProfile(user.id);
    }
    if (ok) navigate('/plan');
  };

  const StepIcon = STEPS[step].icon;

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

          {/* Step 1: Schedule + Preferences */}
          {step === 1 && (
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
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Удобное время</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Утро', 'День', 'Вечер'].map((t) => (
                    <OptionButton key={t} active={form.preferred_time === t} onClick={() => set('preferred_time', t)} label={t} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Длительность тренировки</label>
                <div className="space-y-2">
                  {[
                    ['20_30', '20-30 минут'],
                    ['30_45', '30-45 минут'],
                    ['45_60', '45-60 минут'],
                    ['60+', 'Более 60 минут'],
                  ].map(([val, label]) => (
                    <OptionButton key={val} active={form.workout_duration === val} onClick={() => set('workout_duration', val)} label={label} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Тип упражнений</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['strength', 'Силовые'],
                    ['cardio', 'Кардио'],
                    ['yoga', 'Йога'],
                    ['mixed', 'Смешанные'],
                  ].map(([val, label]) => (
                    <OptionButton key={val} active={form.exercise_preference === val} onClick={() => set('exercise_preference', val)} label={label} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Включать кардио?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['yes', 'Да'],
                    ['sometimes', 'Иногда'],
                    ['no', 'Нет'],
                  ].map(([val, label]) => (
                    <OptionButton key={val} active={form.include_cardio === val} onClick={() => set('include_cardio', val)} label={label} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Health + Recovery + Nutrition */}
          {step === 2 && (
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
