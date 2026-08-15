import React, { useState, useEffect } from 'react';
import { Body, ExtendedBodyPart } from 'react-body-selector';
import { supabase } from '@/lib/supabase';

interface MuscleHeatmapProps {
  userId: string;
}

// Словарь упражнений → мышцы
const muscleMapping: Record<string, string> = {
  'Присед': 'legs',
  'Приседания': 'legs',
  'Жим лёжа': 'chest',
  'Жим лежа': 'chest',
  'Жим гантелей': 'chest',
  'Тяга': 'back',
  'Тяга штанги': 'back',
  'Тяга гантели': 'back',
  'Бицепс': 'biceps',
  'Сгибание рук': 'biceps',
  'Трицепс': 'triceps',
  'Разгибание рук': 'triceps',
  'Пресс': 'abs',
  'Скручивания': 'abs',
  'Плечи': 'shoulders',
  'Жим стоя': 'shoulders',
  'Махи': 'shoulders',
  'Становая': 'back',
  'Мёртвая тяга': 'hamstrings',
  'Выпады': 'legs',
  'Подтягивания': 'back',
  'Отжимания': 'chest',
};

// Маппинг наших мышц на slug'и react-body-selector
const bodyPartSlugMap: Record<string, string> = {
  'chest': 'chest',
  'biceps': 'biceps',
  'triceps': 'triceps',
  'abs': 'abs',
  'back': 'upper_back',
  'shoulders': 'shoulders',
  'legs': 'quads',
  'hamstrings': 'hamstrings',
};

export default function MuscleHeatmap({ userId }: MuscleHeatmapProps) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selectedParts, setSelectedParts] = useState<ExtendedBodyPart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    const loadWorkoutData = async () => {
      setLoading(true);
      try {
        // Запрашиваем workout_logs за 7 дней
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: workouts, error } = await supabase
          .from('workout_logs')
          .select('exercises, log_date')
          .eq('user_id', userId)
          .gte('log_date', sevenDaysAgo.toISOString().split('T')[0]);
        
        if (error) {
          console.error('Ошибка загрузки workout_logs:', error);
          setSelectedParts([]);
          return;
        }

        // Рассчитываем нагрузку для каждой мышцы
        const muscleLoad: Record<string, number> = {
          chest: 0,
          biceps: 0,
          triceps: 0,
          abs: 0,
          back: 0,
          shoulders: 0,
          legs: 0,
          hamstrings: 0,
        };

        workouts?.forEach(workout => {
          const exercises = workout.exercises as any[] || [];
          exercises.forEach(exercise => {
            const exerciseName = exercise.name || '';
            // Ищем совпадение в словаре
            for (const [key, muscle] of Object.entries(muscleMapping)) {
              if (exerciseName.toLowerCase().includes(key.toLowerCase())) {
                muscleLoad[muscle] = (muscleLoad[muscle] || 0) + 1;
                break;
              }
            }
          });
        });

        // Нормализуем нагрузку в интенсивность 0–3
        const maxLoad = Math.max(...Object.values(muscleLoad), 1);
        const bodyParts: ExtendedBodyPart[] = [];

        Object.entries(muscleLoad).forEach(([muscle, load]) => {
          if (load > 0) {
            const intensity = Math.min(3, Math.ceil((load / maxLoad) * 3));
            const slug = bodyPartSlugMap[muscle];
            if (slug && !bodyParts.find(p => p.slug === slug)) {
              bodyParts.push({ slug, intensity });
            }
          }
        });

        setSelectedParts(bodyParts);
      } catch (err) {
        console.error('Ошибка при загрузке данных о тренировках:', err);
        setSelectedParts([]);
      } finally {
        setLoading(false);
      }
    };

    loadWorkoutData();
  }, [userId]);

  const handleBodyPartPress = (bodyPart: ExtendedBodyPart) => {
    // Можно добавить интерактивность при клике
    console.log('Clicked:', bodyPart);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm text-text-secondary">Загрузка тепловой карты...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Переключатель вида */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('front')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === 'front' 
              ? 'bg-accent-blue text-white' 
              : 'bg-bg-card text-text-secondary hover:text-text'
          }`}
        >
          Спереди
        </button>
        <button
          onClick={() => setView('back')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === 'back' 
              ? 'bg-accent-blue text-white' 
              : 'bg-bg-card text-text-secondary hover:text-text'
          }`}
        >
          Сзади
        </button>
      </div>

      {/* Компонент Body из react-body-selector */}
      <div className="w-full max-w-[280px]">
        <Body
          data={selectedParts}
          gender="male"
          side={view}
          scale={1.2}
          colors={['#3b82f6', '#60a5fa', '#93c5fd']}
          border="#4b5563"
          onBodyPartPress={handleBodyPartPress}
        />
      </div>

      {/* Легенда */}
      <div className="mt-4 w-full max-w-[200px]">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
          <span>Нагрузка</span>
        </div>
        <div className="flex gap-1">
          <div className="flex-1 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
          <div className="flex-1 h-3 rounded" style={{ backgroundColor: '#60a5fa' }}></div>
          <div className="flex-1 h-3 rounded" style={{ backgroundColor: '#93c5fd' }}></div>
        </div>
        <div className="flex justify-between text-xs mt-1 text-text-secondary">
          <span>Низкая</span>
          <span>Средняя</span>
          <span>Высокая</span>
        </div>
      </div>
    </div>
  );
}
