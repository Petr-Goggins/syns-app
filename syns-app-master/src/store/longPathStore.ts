import { create } from 'zustand';
import type { UserGoal, WorkoutLog } from '@/types';
import { supabase } from '@/lib/supabase';

export interface GoalLevel {
  level: number;
  targetValue: number;
  unit: string;
  completed: boolean;
  completedAt?: string;
}

export interface Prediction {
  oneWeek: number;
  oneMonth: number;
  threeMonths: number;
}

export interface ActivityDay {
  date: string;
  hasWorkout: boolean;
  volume?: number;
  exercises?: string[];
}

interface LongPathState {
  userGoals: UserGoal[];
  goalLevels: GoalLevel[];
  predictions: Prediction | null;
  activityCalendar: ActivityDay[];
  streak: number;
  currentLevelIndex: number;
  progressToNextLevel: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchUserGoals: (userId: string) => Promise<void>;
  createUserGoal: (
    userId: string,
    goalType: string,
    targetValue: number,
    unit: string,
    targetWeeks: number,
    startValue: number
  ) => Promise<void>;
  updateGoalProgress: (goalId: string, currentValue: number) => Promise<void>;
  calculateLevels: (goalType: string, startValue: number, targetValue: number) => GoalLevel[];
  calculatePrediction: (currentValue: number, trend: number[], weeks: number[]) => Prediction;
  fetchActivityCalendar: (userId: string, months?: number) => Promise<void>;
  calculateStreak: (userId: string) => Promise<void>;
  updateCurrentLevel: (currentValue: number) => void;
  reset: () => void;
}

export const useLongPathStore = create<LongPathState>((set, get) => ({
  userGoals: [],
  goalLevels: [],
  predictions: null,
  activityCalendar: [],
  streak: 0,
  currentLevelIndex: 0,
  progressToNextLevel: 0,
  loading: false,
  error: null,

  fetchUserGoals: async (userId: string) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    
    set({ userGoals: (data as UserGoal[]) ?? [], loading: false });
  },

  createUserGoal: async (userId, goalType, targetValue, unit, targetWeeks, startValue) => {
    set({ loading: true, error: null });
    
    const { data, error } = await supabase
      .from('user_goals')
      .insert({
        user_id: userId,
        goal_type: goalType,
        goal_amount: targetValue,
        goal_unit: unit,
        target_weeks: targetWeeks,
        start_value: startValue,
        current_value: startValue,
        target_value: targetValue,
        status: 'active'
      })
      .select()
      .single();
    
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    
    const levels = get().calculateLevels(goalType, startValue, targetValue);
    set({ 
      userGoals: [...get().userGoals, data as UserGoal],
      goalLevels: levels,
      loading: false 
    });
  },

  updateGoalProgress: async (goalId, currentValue) => {
    const { error } = await supabase
      .from('user_goals')
      .update({ current_value: currentValue, updated_at: new Date().toISOString() })
      .eq('id', goalId);
    
    if (!error) {
      set({
        userGoals: get().userGoals.map(g => 
          g.id === goalId ? { ...g, current_value: currentValue, updated_at: new Date().toISOString() } : g
        )
      });
    }
  },

  calculateLevels: (goalType, startValue, targetValue) => {
    const levels: GoalLevel[] = [];
    const diff = targetValue - startValue;
    const steps = 5; // 5 уровней до цели
    const stepSize = diff / steps;
    
    for (let i = 1; i <= steps; i++) {
      levels.push({
        level: i,
        targetValue: Math.round((startValue + stepSize * i) * 10) / 10,
        unit: goalType.includes('weight') || goalType.includes('kg') ? 'кг' : goalType.includes('run') ? 'км' : 'ед.',
        completed: false
      });
    }
    
    return levels;
  },

  calculatePrediction: (currentValue, trend, weeks) => {
    // Простая линейная регрессия для прогноза
    if (trend.length < 2) {
      return {
        oneWeek: currentValue,
        oneMonth: currentValue,
        threeMonths: currentValue
      };
    }
    
    const n = trend.length;
    const sumX = n * (n - 1) / 2;
    const sumY = trend.reduce((a, b) => a + b, 0);
    const sumXY = trend.reduce((sum, val, idx) => sum + idx * val, 0);
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return {
      oneWeek: Math.round((intercept + slope * (n + 7)) * 10) / 10,
      oneMonth: Math.round((intercept + slope * (n + 30)) * 10) / 10,
      threeMonths: Math.round((intercept + slope * (n + 90)) * 10) / 10
    };
  },

  fetchActivityCalendar: async (userId, months = 3) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const { data, error } = await supabase
      .from('workout_logs')
      .select('log_date, weight, reps, sets, exercise_name')
      .eq('user_id', userId)
      .gte('log_date', startDate.toISOString().split('T')[0])
      .lte('log_date', endDate.toISOString().split('T')[0]);
    
    if (error) return;
    
    // Группируем по датам
    const byDate = new Map<string, ActivityDay>();
    (data as WorkoutLog[]).forEach(log => {
      const date = log.log_date;
      if (!byDate.has(date)) {
        byDate.set(date, { 
          date, 
          hasWorkout: true, 
          volume: 0, 
          exercises: [] 
        });
      }
      const day = byDate.get(date)!;
      day.volume = (day.volume || 0) + (log.sets * log.reps * log.weight);
      if (!day.exercises?.includes(log.exercise_name)) {
        day.exercises?.push(log.exercise_name);
      }
    });
    
    // Заполняем все дни в диапазоне
    const calendar: ActivityDay[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      calendar.push(byDate.get(dateStr) || { date: dateStr, hasWorkout: false });
      current.setDate(current.getDate() + 1);
    }
    
    set({ activityCalendar: calendar });
  },

  calculateStreak: async (userId) => {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('log_date')
      .eq('user_id', userId)
      .order('log_date', { ascending: false });
    
    if (error || !data || data.length === 0) {
      set({ streak: 0 });
      return;
    }
    
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const dates = [...new Set((data as any[]).map(d => d.log_date))].sort().reverse();
    
    // Проверяем, была ли тренировка сегодня или вчера
    const lastDate = dates[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (lastDate !== today && lastDate !== yesterdayStr) {
      set({ streak: 0 });
      return;
    }
    
    // Считаем серию
    let currentDate = new Date(lastDate);
    for (const date of dates) {
      const expectedDate = currentDate.toISOString().split('T')[0];
      if (date === expectedDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (new Date(date) < currentDate) {
        break;
      }
    }
    
    set({ streak });
  },

  updateCurrentLevel: (currentValue) => {
    const { goalLevels, userGoals } = get();
    if (goalLevels.length === 0 || userGoals.length === 0) return;
    
    // Находим текущий уровень
    let currentIndex = 0;
    for (let i = 0; i < goalLevels.length; i++) {
      if (currentValue >= goalLevels[i].targetValue) {
        currentIndex = i + 1;
      } else {
        break;
      }
    }
    
    // Вычисляем прогресс до следующего уровня
    const prevLevel = currentIndex > 0 ? goalLevels[currentIndex - 1]?.targetValue : userGoals[0]?.start_value || 0;
    const nextLevel = goalLevels[currentIndex]?.targetValue || currentValue;
    const progress = nextLevel > prevLevel ? ((currentValue - prevLevel) / (nextLevel - prevLevel)) * 100 : 100;
    
    set({ 
      currentLevelIndex: Math.min(currentIndex, goalLevels.length - 1),
      progressToNextLevel: Math.min(progress, 100)
    });
  },

  reset: () => set({ 
    userGoals: [], 
    goalLevels: [], 
    predictions: null, 
    activityCalendar: [],
    streak: 0,
    currentLevelIndex: 0,
    progressToNextLevel: 0,
    loading: false, 
    error: null 
  }),
}));
