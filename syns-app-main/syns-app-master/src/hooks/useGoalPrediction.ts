import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserGoal } from '@/types';

interface GoalPrediction {
  weeksRemaining: number;
  estimatedDate: string;
  weeklyRate: number;
  isSafe: boolean;
  recommendedWeeks: number;
}

interface UseGoalPredictionResult {
  prediction: GoalPrediction | null;
  loading: boolean;
  error: string | null;
  updateGoalWithNewDeadline: (goalId: string, newWeeks: number) => Promise<void>;
  recalculateFromLogs: (userId: string, goal: UserGoal) => Promise<void>;
}

// Safety thresholds
const SAFE_WEIGHT_LOSS_PER_WEEK_KG = 0.5; // Max safe loss
const SAFE_MUSCLE_GAIN_PER_WEEK_KG = 0.25; // Max safe gain
const SAFE_PERCENTAGE_LOSS = 1; // 1% of body weight per week max

export function useGoalPrediction(): UseGoalPredictionResult {
  const [prediction, setPrediction] = useState<GoalPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrediction = useCallback((
    currentValue: number,
    targetValue: number,
    currentWeight: number,
    goalType: string,
    startDate: string
  ): GoalPrediction => {
    const diff = targetValue - currentValue;
    const isLoss = diff < 0;
    
    // Determine safe rate based on goal type
    let safeWeeklyRate: number;
    if (goalType === 'weight_loss') {
      // For weight loss: min(0.5kg, 1% of body weight)
      safeWeeklyRate = Math.min(SAFE_WEIGHT_LOSS_PER_WEEK_KG, currentWeight * SAFE_PERCENTAGE_LOSS / 100);
    } else if (goalType === 'gain_muscle' || goalType === 'strength') {
      safeWeeklyRate = SAFE_MUSCLE_GAIN_PER_WEEK_KG;
    } else {
      safeWeeklyRate = 0.5; // Default
    }

    // Calculate minimum safe weeks
    const absDiff = Math.abs(diff);
    const recommendedWeeks = Math.ceil(absDiff / safeWeeklyRate);
    
    // Standard calculation (assuming average progress)
    const standardWeeks = Math.max(4, Math.min(52, recommendedWeeks));
    
    // Calculate estimated date
    const today = new Date();
    const estimatedDate = new Date(today);
    estimatedDate.setDate(estimatedDate.getDate() + standardWeeks * 7);
    
    // Check if current pace is safe
    const actualWeeklyRate = absDiff / standardWeeks;
    const isSafe = actualWeeklyRate <= safeWeeklyRate * 1.2; // Allow 20% buffer

    return {
      weeksRemaining: standardWeeks,
      estimatedDate: estimatedDate.toLocaleDateString('ru', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      weeklyRate: actualWeeklyRate,
      isSafe,
      recommendedWeeks: Math.max(recommendedWeeks, 4),
    };
  }, []);

  const updateGoalWithNewDeadline = useCallback(async (goalId: string, newWeeks: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_goals')
        .update({ 
          target_weeks: newWeeks,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);
      
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const recalculateFromLogs = useCallback(async (userId: string, goal: UserGoal) => {
    setLoading(true);
    try {
      // Fetch relevant logs based on goal type
      let progressData: number[] = [];
      
      if (goal.goal_type === 'weight_loss' || goal.goal_type === 'gain_muscle') {
        // Get weight logs
        const { data: weightLogs } = await supabase
          .from('weight_logs')
          .select('weight, log_date')
          .eq('user_id', userId)
          .order('log_date', { ascending: true });
        
        if (weightLogs && weightLogs.length > 0) {
          progressData = weightLogs.map(w => w.weight);
        }
      } else if (goal.goal_type === 'strength') {
        // Get workout logs for strength exercises
        const { data: workoutLogs } = await supabase
          .from('workout_logs')
          .select('weight, log_date')
          .eq('user_id', userId)
          .order('log_date', { ascending: true });
        
        if (workoutLogs && workoutLogs.length > 0) {
          progressData = workoutLogs.map(w => w.weight);
        }
      }

      // If we have progress data, recalculate prediction
      if (progressData.length >= 2) {
        // Simple trend analysis
        const recentTrend = progressData.slice(-4); // Last 4 data points
        const avgChange = (recentTrend[recentTrend.length - 1] - recentTrend[0]) / (recentTrend.length - 1);
        
        // Adjust prediction based on actual progress
        const currentValue = goal.current_value || goal.start_value || 0;
        const targetValue = goal.target_value || 0;
        const remaining = targetValue - currentValue;
        
        if (avgChange !== 0) {
          const weeksAtCurrentPace = Math.abs(remaining / avgChange);
          const predictedDate = new Date();
          predictedDate.setDate(predictedDate.getDate() + weeksAtCurrentPace * 7);
          
          setPrediction(prev => prev ? {
            ...prev,
            weeksRemaining: Math.round(weeksAtCurrentPace),
            estimatedDate: predictedDate.toLocaleDateString('ru', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }),
          } : null);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    prediction,
    loading,
    error,
    updateGoalWithNewDeadline,
    recalculateFromLogs,
  };
}

export function calculateGoalPrediction(
  currentValue: number,
  targetValue: number,
  currentWeight: number,
  goalType: string,
  startDate?: string
): GoalPrediction {
  const diff = targetValue - currentValue;
  const isLoss = diff < 0;
  
  // Determine safe rate based on goal type
  let safeWeeklyRate: number;
  if (goalType === 'weight_loss') {
    safeWeeklyRate = Math.min(SAFE_WEIGHT_LOSS_PER_WEEK_KG, currentWeight * SAFE_PERCENTAGE_LOSS / 100);
  } else if (goalType === 'gain_muscle' || goalType === 'strength') {
    safeWeeklyRate = SAFE_MUSCLE_GAIN_PER_WEEK_KG;
  } else {
    safeWeeklyRate = 0.5;
  }

  const absDiff = Math.abs(diff);
  const recommendedWeeks = Math.ceil(absDiff / safeWeeklyRate);
  const standardWeeks = Math.max(4, Math.min(52, recommendedWeeks));
  
  const today = new Date();
  const estimatedDate = new Date(today);
  estimatedDate.setDate(estimatedDate.getDate() + standardWeeks * 7);
  
  const actualWeeklyRate = absDiff / standardWeeks;
  const isSafe = actualWeeklyRate <= safeWeeklyRate * 1.2;

  return {
    weeksRemaining: standardWeeks,
    estimatedDate: estimatedDate.toLocaleDateString('ru', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }),
    weeklyRate: actualWeeklyRate,
    isSafe,
    recommendedWeeks: Math.max(recommendedWeeks, 4),
  };
}
