import React, { useState } from 'react';

interface MuscleHeatmapProps {
  data?: {
    chest?: number;
    biceps?: number;
    triceps?: number;
    abs?: number;
    legs?: number;
    shoulders?: number;
    back?: number;
    traps?: number;
    calves?: number;
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
  { id: 'deltoid_left', name: 'Дельта левая', path: 'M90 65 L85 50 L100 50 L105 65 Z', labelX: 80, labelY: 55, key: 'shoulders' },
  { id: 'deltoid_right', name: 'Дельта правая', path: 'M170 65 L175 50 L160 50 L155 65 Z', labelX: 180, labelY: 55, key: 'shoulders' },
  { id: 'traps', name: 'Трапеции', path: 'M120 45 L150 45 L160 60 L140 65 L120 60 Z', labelX: 140, labelY: 55, key: 'traps' },
  { id: 'chest', name: 'Грудные', path: 'M100 70 Q125 110 115 150 L145 150 Q135 110 160 70 Z', labelX: 130, labelY: 120, key: 'chest' },
  { id: 'biceps_left', name: 'Бицепс левый', path: 'M75 80 L65 115 L85 130 L95 105 Z', labelX: 60, labelY: 110, key: 'biceps' },
  { id: 'biceps_right', name: 'Бицепс правый', path: 'M185 80 L195 115 L175 130 L165 105 Z', labelX: 200, labelY: 110, key: 'biceps' },
  { id: 'triceps_left', name: 'Трицепс левый', path: 'M85 130 L75 165 L95 180 L100 150 Z', labelX: 70, labelY: 155, key: 'triceps' },
  { id: 'triceps_right', name: 'Трицепс правый', path: 'M175 130 L185 165 L165 180 L160 150 Z', labelX: 190, labelY: 155, key: 'triceps' },
  { id: 'abs_upper', name: 'Пресс верх', path: 'M120 155 L120 200 L150 200 L150 155 Z', labelX: 135, labelY: 180, key: 'abs' },
  { id: 'abs_lower', name: 'Пресс низ', path: 'M120 200 L120 240 L150 240 L150 200 Z', labelX: 135, labelY: 220, key: 'abs' },
  { id: 'quads_left', name: 'Квадрицепс левый', path: 'M105 250 L95 330 L85 390 L105 395 L115 330 L125 395 L140 390 L135 330 L125 250 Z', labelX: 115, labelY: 320, key: 'legs' },
  { id: 'quads_right', name: 'Квадрицепс правый', path: 'M145 250 L155 330 L165 390 L180 395 L170 330 L160 250 Z', labelX: 160, labelY: 320, key: 'legs' },
  { id: 'calves_left', name: 'Икра левая', path: 'M95 390 L85 440 L95 450 L110 445 L105 395 Z', labelX: 95, labelY: 420, key: 'calves' },
  { id: 'calves_right', name: 'Икра правая', path: 'M160 390 L170 440 L160 450 L145 445 L150 395 Z', labelX: 160, labelY: 420, key: 'calves' },
];

// Зоны мышц для вида сзади (зеркальное отображение + спина)
const backMuscles = [
  { id: 'deltoid_left', name: 'Дельта левая', path: 'M210 65 L215 50 L200 50 L195 65 Z', labelX: 220, labelY: 55, key: 'shoulders' },
  { id: 'deltoid_right', name: 'Дельта правая', path: 'M130 65 L125 50 L140 50 L145 65 Z', labelX: 120, labelY: 55, key: 'shoulders' },
  { id: 'traps', name: 'Трапеции', path: 'M180 45 L150 45 L140 60 L160 65 L180 60 Z', labelX: 160, labelY: 55, key: 'traps' },
  { id: 'lats', name: 'Широчайшие', path: 'M110 80 L95 130 L105 180 L125 190 L145 180 L155 130 L140 80 Z', labelX: 130, labelY: 135, key: 'back' },
  { id: 'triceps_left', name: 'Трицепс левый', path: 'M215 80 L225 115 L205 130 L195 105 Z', labelX: 230, labelY: 110, key: 'triceps' },
  { id: 'triceps_right', name: 'Трицепс правый', path: 'M115 80 L105 115 L125 130 L135 105 Z', labelX: 100, labelY: 110, key: 'triceps' },
  { id: 'hamstrings_left', name: 'Бицепс бедра левый', path: 'M195 250 L205 330 L215 390 L195 395 L185 330 L175 395 L160 390 L165 330 L175 250 Z', labelX: 185, labelY: 320, key: 'legs' },
  { id: 'hamstrings_right', name: 'Бицепс бедра правый', path: 'M155 250 L145 330 L135 390 L120 395 L130 330 L140 250 Z', labelX: 140, labelY: 320, key: 'legs' },
  { id: 'calves_left', name: 'Икра левая', path: 'M205 390 L215 440 L205 450 L190 445 L195 395 Z', labelX: 205, labelY: 420, key: 'calves' },
  { id: 'calves_right', name: 'Икра правая', path: 'M140 390 L130 440 L140 450 L155 445 L150 395 Z', labelX: 140, labelY: 420, key: 'calves' },
];

export default function MuscleHeatmap({ data = {}, view = 'front' }: MuscleHeatmapProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<{ name: string; intensity: number } | null>(null);
  
  const muscles = view === 'front' ? frontMuscles : backMuscles;

  const getIntensity = (key: string): number => {
    const map: Record<string, number | undefined> = {
      chest: data.chest,
      biceps: data.biceps,
      triceps: data.triceps,
      abs: data.abs,
      legs: data.legs,
      shoulders: data.shoulders,
      back: data.back,
      traps: data.traps,
      calves: data.calves,
    };
    return map[key] || 0;
  };

  return (
    <div className="flex flex-col items-center" style={{ maxWidth: '180px' }}>
      <svg viewBox="0 0 300 500" className="w-full h-auto">
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
              {/* Подпись мышцы */}
              <text
                x={muscle.labelX}
                y={muscle.labelY}
                fontSize="8"
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
