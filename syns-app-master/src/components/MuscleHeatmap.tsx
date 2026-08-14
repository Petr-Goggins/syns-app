import React, { useState } from 'react';

interface MuscleHeatmapProps {
  data?: {
    chest_upper?: number;
    chest_lower?: number;
    biceps_left?: number;
    biceps_right?: number;
    triceps_left?: number;
    triceps_right?: number;
    front_delts_left?: number;
    front_delts_right?: number;
    abs_upper?: number;
    abs_lower?: number;
    quads_left?: number;
    quads_right?: number;
    calves_left?: number;
    calves_right?: number;
    lats?: number;
    traps_upper?: number;
    traps_lower?: number;
    rear_delts_left?: number;
    rear_delts_right?: number;
    hamstrings_left?: number;
    hamstrings_right?: number;
    glutes_left?: number;
    glutes_right?: number;
    lower_back?: number;
  };
  view?: 'front' | 'back';
}

// Интерполяция цвета по FLIR-шкале (0-100%)
const interpolateColor = (intensity: number): string => {
  const stops = [
    { percent: 0, r: 0, g: 0, b: 0 },       // чёрный
    { percent: 25, r: 0, g: 0, b: 128 },    // тёмно-синий
    { percent: 50, r: 0, g: 0, b: 255 },    // синий
    { percent: 75, r: 255, g: 0, b: 0 },    // красный
    { percent: 90, r: 255, g: 165, b: 0 },  // оранжевый
    { percent: 100, r: 255, g: 255, b: 255 } // белый
  ];

  if (intensity <= 0) return '#000000';
  if (intensity >= 100) return '#ffffff';

  for (let i = 0; i < stops.length - 1; i++) {
    const stop1 = stops[i];
    const stop2 = stops[i + 1];
    
    if (intensity >= stop1.percent && intensity <= stop2.percent) {
      const ratio = (intensity - stop1.percent) / (stop2.percent - stop1.percent);
      const r = Math.round(stop1.r + (stop2.r - stop1.r) * ratio);
      const g = Math.round(stop1.g + (stop2.g - stop1.g) * ratio);
      const b = Math.round(stop1.b + (stop2.b - stop1.b) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }

  return '#ffffff';
};

// Зоны мышц для вида спереди
const frontMuscles = [
  { id: 'chest_upper', name: 'Грудные верх', path: 'M105 70 Q125 90 115 120 L145 120 Q135 90 155 70 Z', labelX: 130, labelY: 95, key: 'chest_upper' },
  { id: 'chest_lower', name: 'Грудные низ', path: 'M105 120 Q125 145 115 160 L145 160 Q135 145 155 120 Z', labelX: 130, labelY: 140, key: 'chest_lower' },
  { id: 'biceps_left', name: 'Бицепс левый', path: 'M75 85 L65 120 L85 135 L95 110 Z', labelX: 60, labelY: 115, key: 'biceps_left' },
  { id: 'biceps_right', name: 'Бицепс правый', path: 'M185 85 L195 120 L175 135 L165 110 Z', labelX: 200, labelY: 115, key: 'biceps_right' },
  { id: 'triceps_left', name: 'Трицепс левый', path: 'M85 135 L75 170 L95 185 L100 155 Z', labelX: 70, labelY: 160, key: 'triceps_left' },
  { id: 'triceps_right', name: 'Трицепс правый', path: 'M175 135 L185 170 L165 185 L160 155 Z', labelX: 190, labelY: 160, key: 'triceps_right' },
  { id: 'front_delts_left', name: 'Дельта перед левая', path: 'M90 60 L85 45 L100 45 L105 60 Z', labelX: 80, labelY: 52, key: 'front_delts_left' },
  { id: 'front_delts_right', name: 'Дельта перед правая', path: 'M170 60 L175 45 L160 45 L155 60 Z', labelX: 180, labelY: 52, key: 'front_delts_right' },
  { id: 'abs_upper', name: 'Пресс верх', path: 'M120 165 L120 195 L150 195 L150 165 Z', labelX: 135, labelY: 180, key: 'abs_upper' },
  { id: 'abs_lower', name: 'Пресс низ', path: 'M120 195 L120 230 L150 230 L150 195 Z', labelX: 135, labelY: 212, key: 'abs_lower' },
  { id: 'quads_left', name: 'Квадрицепс левый', path: 'M105 240 L95 310 L85 370 L105 375 L115 310 L125 375 L140 370 L135 310 L125 240 Z', labelX: 115, labelY: 305, key: 'quads_left' },
  { id: 'quads_right', name: 'Квадрицепс правый', path: 'M145 240 L155 310 L165 370 L180 375 L170 310 L160 240 Z', labelX: 160, labelY: 305, key: 'quads_right' },
  { id: 'calves_left', name: 'Икра левая', path: 'M95 370 L85 420 L95 435 L110 430 L105 375 Z', labelX: 95, labelY: 405, key: 'calves_left' },
  { id: 'calves_right', name: 'Икра правая', path: 'M160 370 L170 420 L160 435 L145 430 L150 375 Z', labelX: 160, labelY: 405, key: 'calves_right' },
];

// Зоны мышц для вида сзади
const backMuscles = [
  { id: 'traps_upper', name: 'Трапеции верх', path: 'M125 45 L150 45 L155 65 L140 70 L125 65 Z', labelX: 140, labelY: 58, key: 'traps_upper' },
  { id: 'traps_lower', name: 'Трапеции низ', path: 'M125 65 L140 70 L155 65 L150 95 L125 95 Z', labelX: 140, labelY: 82, key: 'traps_lower' },
  { id: 'lats_left', name: 'Широчайшие левые', path: 'M110 85 L95 135 L105 185 L125 195 L140 185 L145 135 L130 85 Z', labelX: 115, labelY: 140, key: 'lats' },
  { id: 'lats_right', name: 'Широчайшие правые', path: 'M150 85 L165 135 L155 185 L135 195 L120 185 L115 135 L130 85 Z', labelX: 145, labelY: 140, key: 'lats' },
  { id: 'rear_delts_left', name: 'Дельта зад левая', path: 'M95 55 L90 40 L105 40 L110 55 Z', labelX: 85, labelY: 50, key: 'rear_delts_left' },
  { id: 'rear_delts_right', name: 'Дельта зад правая', path: 'M165 55 L170 40 L155 40 L150 55 Z', labelX: 175, labelY: 50, key: 'rear_delts_right' },
  { id: 'lower_back', name: 'Поясница', path: 'M125 195 L125 235 L150 235 L150 195 Z', labelX: 137, labelY: 215, key: 'lower_back' },
  { id: 'glutes_left', name: 'Ягодицы левые', path: 'M105 240 L95 285 L115 295 L130 285 L125 240 Z', labelX: 110, labelY: 267, key: 'glutes_left' },
  { id: 'glutes_right', name: 'Ягодицы правые', path: 'M155 240 L165 285 L145 295 L130 285 L135 240 Z', labelX: 150, labelY: 267, key: 'glutes_right' },
  { id: 'hamstrings_left', name: 'Бицепс бедра левый', path: 'M95 295 L85 360 L95 375 L110 370 L105 300 Z', labelX: 95, labelY: 337, key: 'hamstrings_left' },
  { id: 'hamstrings_right', name: 'Бицепс бедра правый', path: 'M165 295 L175 360 L165 375 L150 370 L155 300 Z', labelX: 165, labelY: 337, key: 'hamstrings_right' },
  { id: 'calves_left', name: 'Икра левая', path: 'M85 375 L75 425 L85 440 L100 435 L95 380 Z', labelX: 85, labelY: 410, key: 'calves_left' },
  { id: 'calves_right', name: 'Икра правая', path: 'M175 375 L185 425 L175 440 L160 435 L165 380 Z', labelX: 175, labelY: 410, key: 'calves_right' },
];

export default function MuscleHeatmap({ data = {}, view: propView = 'front' }: MuscleHeatmapProps) {
  const [view, setView] = useState<'front' | 'back'>(propView);
  const [hoveredMuscle, setHoveredMuscle] = useState<{ name: string; intensity: number } | null>(null);
  
  const muscles = view === 'front' ? frontMuscles : backMuscles;

  const getIntensity = (key: string): number => {
    return (data as any)[key] || 0;
  };

  return (
    <div className="flex flex-col items-center" style={{ maxWidth: '280px' }}>
      {/* Переключатель вида */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('front')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === 'front' 
              ? 'bg-accent-blue text-white' 
              : 'bg-bg-tertiary text-text-secondary hover:text-text'
          }`}
        >
          Спереди
        </button>
        <button
          onClick={() => setView('back')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            view === 'back' 
              ? 'bg-accent-blue text-white' 
              : 'bg-bg-tertiary text-text-secondary hover:text-text'
          }`}
        >
          Сзади
        </button>
      </div>

      <svg viewBox="0 0 300 500" className="w-full h-auto" style={{ transition: 'opacity 0.3s ease' }}>
        {/* Определение фильтров для теней */}
        <defs>
          <filter id="muscleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
          {/* Градиент для легенды */}
          <linearGradient id="heatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="25%" stopColor="#000080" />
            <stop offset="50%" stopColor="#0000FF" />
            <stop offset="75%" stopColor="#FF0000" />
            <stop offset="90%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
        </defs>

        {/* Голова (силуэт) */}
        <ellipse cx="150" cy="35" rx="20" ry="25" fill="#1f2937" filter="url(#muscleShadow)" />

        {/* Зоны мышц */}
        {muscles.map((muscle) => {
          const intensity = getIntensity(muscle.key);
          const color = interpolateColor(intensity);
          
          return (
            <g key={muscle.id}>
              <path
                d={muscle.path}
                fill={color}
                stroke="var(--border-color, #4b5563)"
                strokeWidth="1.5"
                filter="url(#muscleShadow)"
                className="transition-all duration-1000 ease-out"
                style={{
                  opacity: hoveredMuscle === null || hoveredMuscle.name === muscle.name ? 1 : 0.5,
                }}
                onMouseEnter={() => setHoveredMuscle({ name: muscle.name, intensity })}
                onMouseLeave={() => setHoveredMuscle(null)}
              />
              {/* Подпись мышцы - font-size: 6px как в задании */}
              <text
                x={muscle.labelX}
                y={muscle.labelY}
                fontSize="6"
                fill="var(--text-secondary, #9ca3af)"
                textAnchor="middle"
                pointerEvents="none"
                className="select-none"
              >
                {muscle.name.split(' ')[0]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Всплывающая подсказка */}
      {hoveredMuscle && (
        <div 
          className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-10"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="font-semibold">{hoveredMuscle.name}</div>
          <div className="text-gray-300">Нагрузка: {hoveredMuscle.intensity}%</div>
        </div>
      )}

      {/* Легенда тепловизора */}
      <div className="mt-3 w-full">
        <div className="h-3 rounded" style={{
          background: 'linear-gradient(to right, #000000, #000080, #0000FF, #FF0000, #FFA500, #FFFFFF)'
        }} />
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-secondary, #9ca3af)' }}>
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
