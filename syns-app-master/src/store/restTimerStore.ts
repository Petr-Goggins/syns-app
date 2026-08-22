import { create } from 'zustand';

export interface RestTimerState {
  isActive: boolean;
  remainingSeconds: number;
  initialSeconds: number;
  exerciseType?: string;
  onComplete: (() => void) | null;
}

interface RestTimerActions {
  startTimer: (seconds: number, exerciseType?: string, onComplete?: () => void) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  setRemainingTime: (seconds: number) => void;
  tick: () => void;
  stopTimer: () => void;
}

// Внутренний интерфейс для хранения ID интервала
interface RestTimerInternal {
  _intervalId?: number | null;
}

export const useRestTimerStore = create<RestTimerState & RestTimerActions & RestTimerInternal>((set, get) => ({
  _intervalId: null,
  isActive: false,
  remainingSeconds: 0,
  initialSeconds: 0,
  exerciseType: undefined,
  onComplete: null,

  startTimer: (seconds, exerciseType, onComplete) => {
    // Валидация секунд
    if (typeof seconds !== 'number' || seconds <= 0 || seconds > 3600) {
      console.error('Invalid timer seconds:', seconds);
      return;
    }

    const intervalId = setInterval(() => {
      const current = get().remainingSeconds;
      if (current <= 1) {
        clearInterval(intervalId);
        const callback = get().onComplete;
        if (callback) callback();
        set({ isActive: false, remainingSeconds: 0, _intervalId: null });
        // Звуковой сигнал
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA==');
          audio.play().catch(() => {});
        } catch (e) {}
      } else {
        set({ remainingSeconds: current - 1 });
      }
    }, 1000);
    
    // Сохраняем ID интервала в state
    set({ _intervalId: intervalId as unknown as number });
    
    set({ 
      isActive: true, 
      remainingSeconds: seconds, 
      initialSeconds: seconds,
      exerciseType,
      onComplete: onComplete || null
    });
  },

  pauseTimer: () => {
    const state = get();
    if (state._intervalId) {
      clearInterval(state._intervalId as unknown as number);
      set({ _intervalId: null, isActive: false });
    }
  },

  resumeTimer: () => {
    const { remainingSeconds, exerciseType, onComplete } = get();
    if (remainingSeconds > 0 && remainingSeconds <= 3600) {
      get().startTimer(remainingSeconds, exerciseType, onComplete || undefined);
    }
  },

  resetTimer: () => {
    const state = get();
    if (state._intervalId) {
      clearInterval(state._intervalId as unknown as number);
      set({ _intervalId: null });
    }
    const { initialSeconds, exerciseType, onComplete } = get();
    set({ 
      isActive: false, 
      remainingSeconds: initialSeconds,
      exerciseType,
      onComplete
    });
  },

  setRemainingTime: (seconds) => {
    if (typeof seconds === 'number' && seconds >= 0 && seconds <= 3600) {
      set({ remainingSeconds: seconds });
    }
  },

  tick: () => {
    const { remainingSeconds, onComplete } = get();
    if (remainingSeconds <= 1) {
      if (onComplete) onComplete();
      set({ isActive: false, remainingSeconds: 0 });
    } else {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
  },

  stopTimer: () => {
    const state = get();
    if (state._intervalId) {
      clearInterval(state._intervalId as unknown as number);
      set({ _intervalId: null });
    }
    set({ isActive: false, remainingSeconds: 0, initialSeconds: 0 });
  },
}));

// Утилита для расчёта времени отдыха
export const calculateRestTime = (exerciseName: string): number => {
  const name = exerciseName.toLowerCase();
  
  // Базовые упражнения - 2-3 минуты
  const compoundExercises = ['присед', 'жим', 'тяга', 'становая', 'deadlift', 'squat', 'bench'];
  if (compoundExercises.some(ex => name.includes(ex))) {
    return 150; // 2:30
  }
  
  // Изолирующие - 60-90 секунд
  const isolationExercises = ['бицепс', 'трицепс', 'разводка', 'curl', 'fly', 'raise'];
  if (isolationExercises.some(ex => name.includes(ex))) {
    return 75; // 1:15
  }
  
  // По умолчанию - 90 секунд
  return 90;
};
