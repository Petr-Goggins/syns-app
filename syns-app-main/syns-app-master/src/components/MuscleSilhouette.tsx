import React, { useState } from 'react';

interface MuscleGroup {
  id: string;
  name: string;
  path: string;
  view: 'front' | 'back' | 'both';
}

interface MuscleSilhouetteProps {
  selectedMuscles?: string[];
  onMuscleClick?: (muscleId: string) => void;
  muscleIntensities?: Record<string, number>; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  mode?: 'selection' | 'heatmap'; // selection - для анкеты, heatmap - для прогресса
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  // Передняя часть
  { id: 'chest', name: 'Грудь', path: 'M45,60 Q60,55 75,60 L75,85 Q60,90 45,85 Z', view: 'front' },
  { id: 'abs', name: 'Пресс', path: 'M52,90 L68,90 L68,130 L52,130 Z', view: 'front' },
  { id: 'quads', name: 'Квадрицепсы', path: 'M48,135 L60,135 L60,180 L48,180 Z M62,135 L74,135 L74,180 L62,180 Z', view: 'front' },
  { id: 'shoulders_front', name: 'Плечи (передние)', path: 'M35,55 Q50,45 65,55 M55,55 Q70,45 85,55', view: 'front' },
  { id: 'biceps', name: 'Бицепсы', path: 'M35,65 L45,65 L45,95 L35,95 Z M75,65 L85,65 L85,95 L75,95 Z', view: 'front' },
  { id: 'forearms', name: 'Предплечья', path: 'M33,95 L43,95 L43,120 L33,120 Z M77,95 L87,95 L87,120 L77,120 Z', view: 'front' },
  { id: 'glutes_front', name: 'Ягодицы', path: 'M48,130 Q60,125 72,130 L72,150 Q60,155 48,150 Z', view: 'front' },
  
  // Задняя часть
  { id: 'back', name: 'Спина', path: 'M40,60 Q60,55 80,60 L80,100 Q60,105 40,100 Z', view: 'back' },
  { id: 'lats', name: 'Широчайшие', path: 'M38,65 L50,65 L50,95 L38,95 Z M70,65 L82,65 L82,95 L70,95 Z', view: 'back' },
  { id: 'traps', name: 'Трапеция', path: 'M50,45 Q60,40 70,45 L70,55 Q60,58 50,55 Z', view: 'back' },
  { id: 'hamstrings', name: 'Бицепс бедра', path: 'M48,180 L60,180 L60,220 L48,220 Z M62,180 L74,180 L74,220 L62,220 Z', view: 'back' },
  { id: 'calves', name: 'Икры', path: 'M50,225 L58,225 L58,260 L50,260 Z M64,225 L72,225 L72,260 L64,260 Z', view: 'both' },
  { id: 'glutes', name: 'Ягодицы', path: 'M48,130 Q60,125 72,130 L72,150 Q60,155 48,150 Z', view: 'back' },
];

const EXERCISE_MUSCLE_MAP: Record<string, string[]> = {
  'жим лёжа': ['chest', 'biceps', 'shoulders_front'],
  'bench press': ['chest', 'biceps', 'shoulders_front'],
  'присед': ['quads', 'glutes', 'hamstrings'],
  'squat': ['quads', 'glutes', 'hamstrings'],
  'становая тяга': ['back', 'lats', 'hamstrings', 'glutes'],
  'deadlift': ['back', 'lats', 'hamstrings', 'glutes'],
  'подтягивания': ['back', 'lats', 'biceps'],
  'pull ups': ['back', 'lats', 'biceps'],
  'отжимания': ['chest', 'biceps', 'shoulders_front', 'abs'],
  'push ups': ['chest', 'biceps', 'shoulders_front', 'abs'],
  'планка': ['abs', 'shoulders_front'],
  'plank': ['abs', 'shoulders_front'],
  'выпады': ['quads', 'glutes', 'hamstrings'],
  'lunges': ['quads', 'glutes', 'hamstrings'],
  'тяга гантели': ['back', 'lats', 'biceps'],
  'row': ['back', 'lats', 'biceps'],
  'жим гантелей': ['shoulders_front', 'chest', 'traps'],
  'shoulder press': ['shoulders_front', 'traps'],
  'сгибание рук': ['biceps', 'forearms'],
  'bicep curl': ['biceps', 'forearms'],
  'разгибание рук': ['triceps'],
  'tricep extension': ['triceps'],
  'скручивания': ['abs'],
  'crunches': ['abs'],
  'велосипед': ['abs'],
  'bicycle': ['abs'],
  'бёрпи': ['chest', 'shoulders_front', 'quads', 'abs'],
  'burpee': ['chest', 'shoulders_front', 'quads', 'abs'],
};

const MuscleSilhouette: React.FC<MuscleSilhouetteProps> = ({
  selectedMuscles = [],
  onMuscleClick,
  muscleIntensities = {},
  size = 'md',
  showLabels = true,
  mode = 'selection',
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  
  const getSize = () => {
    switch (size) {
      case 'sm': return { width: 120, height: 280, fontSize: 10 };
      case 'lg': return { width: 280, height: 520, fontSize: 16 };
      default: return { width: 180, height: 360, fontSize: 12 };
    }
  };

  const { width, height, fontSize } = getSize();

  const getMuscleColor = (muscle: MuscleGroup): string => {
    if (mode === 'heatmap') {
      const intensity = muscleIntensities[muscle.id] || 0;
      if (intensity === 0) return '#374151'; // bg-tertiary
      if (intensity < 30) return '#22c55e'; // light green
      if (intensity < 60) return '#16a34a'; // medium green
      if (intensity < 80) return '#15803d'; // dark green
      return '#14532d'; // darkest green
    } else {
      // Selection mode
      if (selectedMuscles.includes(muscle.id)) {
        return '#58A6FF'; // accent-blue
      }
      return '#374151'; // bg-tertiary
    }
  };

  const visibleMuscles = MUSCLE_GROUPS.filter(m => 
    m.view === 'both' || m.view === view
  );

  const toggleMuscle = (muscleId: string) => {
    if (mode === 'selection' && onMuscleClick) {
      onMuscleClick(muscleId);
    }
  };

  const getIntensity = (muscleId: string): number => {
    return muscleIntensities[muscleId] || 0;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Переключатель вида */}
      {mode === 'selection' && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView('front')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === 'front'
                ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/40'
                : 'bg-bg-secondary text-text-secondary border border-border'
            }`}
          >
            Спереди
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === 'back'
                ? 'bg-accent-blue/20 text-accent-blue border border-accent-blue/40'
                : 'bg-bg-secondary text-text-secondary border border-border'
            }`}
          >
            Сзади
          </button>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="transition-all duration-300"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* Голова */}
        <circle cx={width / 2} cy={30} r={15} fill="#374151" />

        {/* Тело */}
        {visibleMuscles.map((muscle) => {
          const color = getMuscleColor(muscle);
          const isSelected = selectedMuscles.includes(muscle.id);
          const intensity = getIntensity(muscle.id);

          return (
            <g key={muscle.id}>
              <path
                d={muscle.path}
                fill={color}
                stroke={isSelected || intensity > 0 ? '#58A6FF' : '#4b5563'}
                strokeWidth={isSelected || intensity > 0 ? '1.5' : '0.5'}
                className={`cursor-pointer transition-all duration-200 ${
                  mode === 'selection' ? 'hover:opacity-80' : ''
                }`}
                onClick={() => toggleMuscle(muscle.id)}
              />
              {showLabels && (isSelected || intensity > 0) && (
                <text
                  x={width / 2}
                  y={height - 10}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize={fontSize * 0.7}
                  className="pointer-events-none"
                >
                  {muscle.name}: {mode === 'heatmap' ? `${intensity}%` : '✓'}
                </text>
              )}
            </g>
          );
        })}

        {/* Тултипы для мышц */}
        {Object.entries(muscleIntensities)
          .filter(([_, intensity]) => intensity > 0)
          .map(([muscleId, intensity]) => {
            const muscle = MUSCLE_GROUPS.find(m => m.id === muscleId);
            if (!muscle) return null;

            return (
              <title key={muscleId}>
                {muscle.name}: {intensity}%
              </title>
            );
          })}
      </svg>

      {/* Легенда для heatmap режима */}
      {mode === 'heatmap' && showLabels && Object.keys(muscleIntensities).length > 0 && (
        <div className="mt-4 w-full">
          <h4 className="text-sm font-semibold text-text mb-2">Активные мышцы:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(muscleIntensities)
              .filter(([_, intensity]) => intensity > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([muscleId, intensity]) => {
                const muscle = MUSCLE_GROUPS.find(m => m.id === muscleId);
                return (
                  <span
                    key={muscleId}
                    className="px-2 py-1 rounded-full text-xs font-medium bg-accent-green/20 text-accent-green border border-accent-green/30"
                  >
                    {muscle?.name || muscleId}: {intensity}%
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* Подсказка для selection режима */}
      {mode === 'selection' && showLabels && selectedMuscles.length === 0 && (
        <p className="mt-4 text-text-secondary text-sm text-center">
          Нажмите на мышцу, чтобы выбрать её как акцентную
        </p>
      )}

      {/* Выбранные мышцы список */}
      {mode === 'selection' && showLabels && selectedMuscles.length > 0 && (
        <div className="mt-4 w-full">
          <h4 className="text-sm font-semibold text-text mb-2">Выбранные акценты:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedMuscles.map(muscleId => {
              const muscle = MUSCLE_GROUPS.find(m => m.id === muscleId);
              return (
                <span
                  key={muscleId}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-accent-blue/20 text-accent-blue border border-accent-blue/30"
                >
                  {muscle?.name || muscleId}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export { EXERCISE_MUSCLE_MAP };
export default MuscleSilhouette;
