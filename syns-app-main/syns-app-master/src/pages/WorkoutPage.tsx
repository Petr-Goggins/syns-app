import { Fragment, useEffect, useState } from 'react';
import { Check, ChevronLeft, Dumbbell, Pause, Play, Plus, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type SetEntry = {
  id: number;
  weight: string;
  reps: string;
  completed: boolean;
};

type ExerciseEntry = {
  id: number;
  name: string;
  sets: SetEntry[];
};

const initialExercises: ExerciseEntry[] = [
  { id: 1, name: 'Жим гантелей лёжа', sets: [{ id: 1, weight: '20', reps: '10', completed: false }, { id: 2, weight: '20', reps: '10', completed: false }, { id: 3, weight: '18', reps: '12', completed: false }] },
  { id: 2, name: 'Тяга гантели в наклоне', sets: [{ id: 1, weight: '18', reps: '10', completed: false }, { id: 2, weight: '18', reps: '10', completed: false }] },
  { id: 3, name: 'Разведение гантелей в стороны', sets: [{ id: 1, weight: '8', reps: '12', completed: false }, { id: 2, weight: '8', reps: '12', completed: false }] },
  { id: 4, name: 'Планка', sets: [{ id: 1, weight: '0', reps: '45', completed: false }] },
];

export default function WorkoutPage() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState(initialExercises);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [activeExercise, setActiveExercise] = useState(0);

  useEffect(() => {
    if (paused || finished || startedAt === null) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [finished, paused, startedAt]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const updateSet = (exerciseId: number, setId: number, field: 'weight' | 'reps', value: string) => {
    setExercises((current) => current.map((exercise) => exercise.id !== exerciseId ? exercise : {
      ...exercise,
      sets: exercise.sets.map((entry) => entry.id === setId ? { ...entry, [field]: value } : entry),
    }));
  };

  const toggleSet = (exerciseId: number, setId: number) => {
    setExercises((current) => current.map((exercise) => exercise.id !== exerciseId ? exercise : {
      ...exercise,
      sets: exercise.sets.map((entry) => entry.id === setId ? { ...entry, completed: !entry.completed } : entry),
    }));
  };

  const addSet = (exerciseId: number) => {
    setExercises((current) => current.map((exercise) => {
      if (exercise.id !== exerciseId) return exercise;
      const nextId = exercise.sets.length + 1;
      return { ...exercise, sets: [...exercise.sets, { id: nextId, weight: '', reps: '', completed: false }] };
    }));
  };

  const startWorkout = () => {
    const timestamp = Date.now();
    localStorage.setItem('sync_workout_started_at', String(timestamp));
    setStartedAt(timestamp);
  };

  if (startedAt === null) {
    return (
      <main className="mx-auto max-w-3xl p-4 pb-10 pt-20 animate-fade-in">
        <header className="mb-6 flex items-center gap-3">
          <button type="button" onClick={() => navigate('/reports')} className="btn-secondary flex items-center gap-1 px-3 py-2"><ChevronLeft size={18} /> Назад</button>
          <div><p className="text-xs uppercase tracking-widest text-text-secondary">Предпросмотр</p><h1 className="text-2xl font-bold text-text">Push-день</h1></div>
        </header>
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <section key={exercise.id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-text">{exercise.name}</h2>
                <span className="text-sm text-text-secondary">{exercise.sets.length} подхода</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-text-secondary">
                <span className="text-xs uppercase">Подход</span><span className="text-xs uppercase">Вес</span><span className="text-xs uppercase">Повторы</span>
                {exercise.sets.map((entry) => <Fragment key={`${exercise.id}-${entry.id}`}><span>{entry.id}</span><span>{entry.weight || '—'} кг</span><span>{entry.reps || '—'}</span></Fragment>)}
              </div>
            </section>
          ))}
        </div>
        <button type="button" onClick={startWorkout} className="btn-primary mt-6 w-full py-4 text-base">Начать тренировку</button>
      </main>
    );
  }

  if (finished) {
    localStorage.removeItem('sync_workout_started_at');
    const completedSets = exercises.reduce((total, exercise) => total + exercise.sets.filter((entry) => entry.completed).length, 0);
    const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    return (
      <main className="mx-auto max-w-3xl p-4 pb-10 pt-20 animate-fade-in">
        <section className="glass rounded-2xl p-8 text-center">
          <Trophy className="mx-auto mb-4 text-accent-gold" size={48} />
          <h1 className="text-2xl font-bold text-text">Тренировка завершена</h1>
          <p className="mt-2 text-text-secondary">Выполнено подходов: {completedSets} из {totalSets}</p>
          <p className="mt-1 text-text-secondary">Время: {formatTime(elapsed)}</p>
          <button type="button" onClick={() => navigate('/')} className="btn-primary mt-6 w-full py-3">Вернуться на главную</button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-28 pt-20">
      <header className="mb-5 flex items-center justify-between gap-3">
        <button type="button" onClick={() => navigate('/reports')} className="btn-secondary flex items-center gap-1 px-3 py-2" aria-label="Назад">
          <ChevronLeft size={18} />
          Назад
        </button>
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-text-secondary">Сегодня</p>
          <h1 className="text-xl font-bold text-text">Push-день</h1>
        </div>
        <button type="button" onClick={() => setPaused((value) => !value)} className="btn-secondary flex h-10 w-10 items-center justify-center p-0" aria-label={paused ? 'Продолжить' : 'Пауза'}>
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
      </header>

      <div className="mb-5 flex items-center justify-center gap-2 text-2xl font-semibold tabular-nums text-text">
        <Dumbbell size={22} className="text-accent-blue" />
        {formatTime(elapsed)}
        {paused && <span className="text-xs font-medium text-accent-gold">Пауза</span>}
      </div>

      <div className="space-y-4">
        {exercises.filter((_, index) => index === activeExercise).map((exercise) => (
          <section key={exercise.id} className="glass rounded-2xl p-4">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-text-secondary">Упражнение {activeExercise + 1} из {exercises.length}</p>
                <h2 className="text-lg font-bold text-text">{exercise.name}</h2>
              </div>
            </div>

            <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              <span>№</span><span>Вес, кг</span><span>Повторы</span><span aria-label="Статус" />
            </div>
            <div className="space-y-2 pt-2">
              {exercise.sets.map((entry) => (
                <div key={entry.id} className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2">
                  <span className="text-sm font-medium text-text-secondary">{entry.id}</span>
                  <input className="input-field w-full px-3 py-2 text-sm" type="number" min="0" value={entry.weight} onChange={(event) => updateSet(exercise.id, entry.id, 'weight', event.target.value)} placeholder="0" aria-label={`Вес, подход ${entry.id}`} />
                  <input className="input-field w-full px-3 py-2 text-sm" type="number" min="0" value={entry.reps} onChange={(event) => updateSet(exercise.id, entry.id, 'reps', event.target.value)} placeholder="0" aria-label={`Повторы, подход ${entry.id}`} />
                  <button type="button" onClick={() => toggleSet(exercise.id, entry.id)} className={`flex h-9 w-9 items-center justify-center rounded-full border ${entry.completed ? 'border-accent-green bg-accent-green text-white' : 'border-border text-text-secondary'}`} aria-label={entry.completed ? `Снять отметку с подхода ${entry.id}` : `Отметить подход ${entry.id}`}>
                    <Check size={17} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addSet(exercise.id)} className="btn-secondary mt-4 flex w-full items-center justify-center gap-2 py-2 text-sm">
              <Plus size={16} /> Добавить подход
            </button>
            {activeExercise < exercises.length - 1 && <button type="button" onClick={() => setActiveExercise((index) => index + 1)} className="btn-primary mt-3 w-full py-2">Далее</button>}
          </section>
        ))}
      </div>

      <button type="button" onClick={() => setFinished(true)} className="btn-primary fixed bottom-20 left-4 right-4 z-30 mx-auto max-w-3xl py-3 text-base shadow-lg">
        Завершить тренировку
      </button>
    </main>
  );
}
