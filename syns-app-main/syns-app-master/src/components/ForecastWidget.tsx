import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWorkoutLogStore } from '@/store/workoutLogStore';
import { useProfileStore } from '@/store/profileStore';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Target, Lightbulb, Activity, Dumbbell, Scale } from 'lucide-react';
import MuscleSilhouette from './MuscleSilhouette';

interface PredictionData {
  date: string;
  strength: number;
  weight?: number;
  volume?: number;
}

interface AIRecommendation {
  type: 'nutrition' | 'training' | 'recovery';
  title: string;
  description: string;
}

export default function ForecastWidget() {
  const user = useAuthStore((s) => s.user);
  const workoutLogStore = useWorkoutLogStore();
  const { profile } = useProfileStore();
  const [predictionData, setPredictionData] = useState<PredictionData[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [goalType, setGoalType] = useState<'weight' | 'strength' | 'volume'>('weight');
  const [goalValue, setGoalValue] = useState('');
  const [goalWeeks, setGoalWeeks] = useState('4');
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [muscleIntensities, setMuscleIntensities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    // Загружаем историю тренировок
    await workoutLogStore.fetchLogs(user!.id);
    
    // Генерируем прогноз на основе истории
    generatePrediction();
    
    // Вычисляем интенсивность мышц
    calculateMuscleIntensities();
  };

  const generatePrediction = () => {
    const logs = workoutLogStore.logs;
    if (!logs || logs.length === 0) return;

    // Группируем по датам
    const byDate = new Map<string, { strength: number; volume: number }>();
    logs.forEach(log => {
      const date = log.log_date;
      const volume = (log.sets || 0) * (log.reps || 0) * (log.weight || 0);
      
      if (!byDate.has(date)) {
        byDate.set(date, { strength: log.weight || 0, volume: 0 });
      }
      const data = byDate.get(date)!;
      data.volume += volume;
      if (log.weight > data.strength) data.strength = log.weight;
    });

    // Преобразуем в массив и сортируем
    const history = Array.from(byDate.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
        strength: data.strength,
        volume: Math.round(data.volume / 100), // Нормализуем объём
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Экстраполяция на 4 недели вперёд
    const predictions: PredictionData[] = [...history];
    if (history.length >= 2) {
      const last = history[history.length - 1];
      const prev = history[history.length - 2];
      
      // Вычисляем тренд
      const strengthTrend = last.strength - prev.strength;
      const volumeTrend = last.volume - prev.volume;
      
      // Добавляем прогноз
      for (let i = 1; i <= 4; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + i * 7);
        
        predictions.push({
          date: futureDate.toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
          strength: Math.round(last.strength + strengthTrend * i),
          volume: Math.round(last.volume + volumeTrend * i),
        });
      }
    }

    setPredictionData(predictions);
  };

  const calculateMuscleIntensities = () => {
    const logs = workoutLogStore.logs;
    if (!logs || logs.length === 0) return;

    const intensities: Record<string, number> = {};
    const exerciseMuscleMap: Record<string, string[]> = {
      'жим': ['chest', 'shoulders_front', 'biceps'],
      'присед': ['quads', 'glutes', 'hamstrings'],
      'тяга': ['back', 'lats', 'biceps'],
      'становая': ['back', 'hamstrings', 'glutes'],
      'подтягивания': ['back', 'lats', 'biceps'],
      'отжимания': ['chest', 'shoulders_front', 'triceps'],
      'планка': ['abs'],
      'выпады': ['quads', 'glutes'],
      'скручивания': ['abs'],
    };

    logs.forEach(log => {
      const exerciseName = log.exercise_name.toLowerCase();
      Object.entries(exerciseMuscleMap).forEach(([key, muscles]) => {
        if (exerciseName.includes(key)) {
          muscles.forEach(muscle => {
            intensities[muscle] = Math.min(100, (intensities[muscle] || 0) + 15);
          });
        }
      });
    });

    setMuscleIntensities(intensities);
  };

  const handleAnalyze = async () => {
    if (!customGoal || !goalValue) return;
    
    setAnalyzing(true);
    
    // Имитация ИИ-анализа (заглушка)
    setTimeout(() => {
      const recommendations: AIRecommendation[] = [];
      const value = Number(goalValue);
      
      if (goalType === 'weight') {
        const currentWeight = profile?.weight || 0;
        const diff = currentWeight - value;
        
        if (diff > 0) {
          recommendations.push({
            type: 'nutrition',
            title: 'Дефицит калорий',
            description: `Для потери ${diff} кг за ${goalWeeks} недель рекомендуется дефицит 300-500 ккал/день. Увеличьте потребление белка до 1.6-2г на кг веса.`,
          });
          recommendations.push({
            type: 'training',
            title: 'Кардио + Силовые',
            description: 'Добавьте 2-3 кардио сессии в неделю по 30-45 минут. Сохраняйте силовые тренировки для поддержания мышечной массы.',
          });
        } else {
          recommendations.push({
            type: 'nutrition',
            title: 'Профицит калорий',
            description: `Для набора ${Math.abs(diff)} кг за ${goalWeeks} недель добавьте 300-500 ккал/день. Фокус на белок (2г/кг) и сложные углеводы.`,
          });
          recommendations.push({
            type: 'training',
            title: 'Прогрессивная перегрузка',
            description: 'Увеличивайте рабочие веса на 2.5-5% каждую неделю. Базовые упражнения должны составлять 70% тренировочного объёма.',
          });
        }
      } else if (goalType === 'strength') {
        recommendations.push({
          type: 'training',
          title: 'Силовой цикл',
          description: `Для достижения ${value} кг используйте периодизацию: 3 недели работы на силу (3-5 повторений) + 1 неделя разгрузки.`,
        });
        recommendations.push({
          type: 'recovery',
          title: 'Восстановление ЦНС',
          description: 'Между тяжёлыми сессиями отдыхайте 48-72 часа. Сон 7-9 часов критически важен для силового прогресса.',
        });
      }
      
      recommendations.push({
        type: 'recovery',
        title: 'Мониторинг прогресса',
        description: 'Записывайте результаты каждой тренировки. Взвешивайтесь 2-3 раза в неделю утром натощак.',
      });
      
      setAiRecommendations(recommendations);
      setAnalyzing(false);
    }, 1500);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Графики прогноза */}
      <div className="card-modern">
        <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-accent-blue" />
          Прогноз прогресса
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={predictionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: '#9ca3af' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#9ca3af' }} 
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
              <ReferenceLine 
                x={predictionData.filter(d => d.strength)[predictionData.filter(d => d.strength).length - 5]?.date} 
                stroke="#ef4444" 
                strokeDasharray="3 3"
                label={{ value: 'Прогноз', fill: '#ef4444', fontSize: 10 }}
              />
              <Line 
                type="monotone" 
                dataKey="strength" 
                stroke="#58A6FF" 
                strokeWidth={2} 
                dot={{ r: 3, fill: '#58A6FF' }}
                name="Сила (кг)"
              />
              <Line 
                type="monotone" 
                dataKey="volume" 
                stroke="#22c55e" 
                strokeWidth={2} 
                dot={{ r: 3, fill: '#22c55e' }}
                name="Объём"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ввод пользовательской цели */}
      <div className="card-modern bg-gradient-to-r from-accent-purple/10 to-transparent border-accent-purple/30">
        <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
          <Target size={20} className="text-accent-purple" />
          Моя цель
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Тип цели</label>
            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as any)}
              className="input-field w-full px-3 py-2 rounded-lg text-sm"
            >
              <option value="weight">Вес тела</option>
              <option value="strength">Сила (1ПМ)</option>
              <option value="volume">Тренировочный объём</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">Срок (недель)</label>
            <input
              type="number"
              value={goalWeeks}
              onChange={(e) => setGoalWeeks(e.target.value)}
              className="input-field w-full px-3 py-2 rounded-lg text-sm"
              min="1"
              max="24"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs text-text-secondary mb-1">
              {goalType === 'weight' ? 'Целевой вес (кг)' : 
               goalType === 'strength' ? 'Целевой вес снаряда (кг)' : 'Целевой объём'}
            </label>
            <input
              type="number"
              value={goalValue}
              onChange={(e) => setGoalValue(e.target.value)}
              placeholder="Например: 75"
              className="input-field w-full px-3 py-2 rounded-lg text-sm"
            />
          </div>
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !goalValue}
          className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <Activity size={18} className="animate-pulse" /> Анализ...
            </>
          ) : (
            <>
              <Lightbulb size={18} /> Анализировать цель
            </>
          )}
        </button>
      </div>

      {/* ИИ-рекомендации */}
      {aiRecommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text flex items-center gap-2">
            <Lightbulb size={16} className="text-accent-gold" />
            Рекомендации ИИ
          </h4>
          {aiRecommendations.map((rec, idx) => (
            <div 
              key={idx}
              className={`card-modern p-4 border-l-4 ${
                rec.type === 'nutrition' ? 'border-accent-orange' :
                rec.type === 'training' ? 'border-accent-blue' :
                'border-accent-purple'
              }`}
            >
              <p className="font-semibold text-text text-sm mb-1">{rec.title}</p>
              <p className="text-text-secondary text-xs">{rec.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Тепловая карта мышц */}
      <div className="card-modern">
        <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
          <Dumbbell size={20} className="text-accent-green" />
          Проработанные мышцы
        </h3>
        <MuscleSilhouette
          mode="heatmap"
          muscleIntensities={muscleIntensities}
          size="md"
          showLabels={true}
        />
      </div>
    </div>
  );
}
