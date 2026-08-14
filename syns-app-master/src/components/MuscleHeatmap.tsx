import React from 'react';

interface MuscleHeatmapProps {
  data?: {
    chest?: number;
    biceps?: number;
    triceps?: number;
    abs?: number;
    legs?: number;
    shoulders?: number;
    back?: number;
  };
}

// Цветовая шкала тепловизора: от чёрного к белому через синий, красный, оранжевый
const getHeatColor = (intensity: number): string => {
  if (intensity <= 0) return '#000000'; // чёрный
  if (intensity < 25) return '#1e3a8a'; // тёмно-синий
  if (intensity < 50) return '#3b82f6'; // синий
  if (intensity < 75) return '#ef4444'; // красный
  if (intensity < 90) return '#f97316'; // оранжевый
  return '#ffffff'; // белый
};

export default function MuscleHeatmap({ data = {} }: MuscleHeatmapProps) {
  const muscles = [
    { id: 'chest', name: 'Грудь', path: 'M45,60 Q60,55 75,60 L75,85 Q60,90 45,85 Z' },
    { id: 'biceps_left', name: 'Бицепс левый', path: 'M35,65 L45,65 L45,95 L35,95 Z' },
    { id: 'biceps_right', name: 'Бицепс правый', path: 'M75,65 L85,65 L85,95 L75,95 Z' },
    { id: 'triceps_left', name: 'Трицепс левый', path: 'M30,70 L40,70 L40,90 L30,90 Z' },
    { id: 'triceps_right', name: 'Трицепс правый', path: 'M80,70 L90,70 L90,90 L80,90 Z' },
    { id: 'abs', name: 'Пресс', path: 'M52,90 L68,90 L68,130 L52,130 Z' },
    { id: 'legs_left', name: 'Ноги левые', path: 'M48,135 L60,135 L60,180 L48,180 Z' },
    { id: 'legs_right', name: 'Ноги правые', path: 'M62,135 L74,135 L74,180 L62,180 Z' },
    { id: 'shoulders_left', name: 'Дельты левые', path: 'M35,55 Q50,45 60,55' },
    { id: 'shoulders_right', name: 'Дельты правые', path: 'M60,55 Q70,45 85,55' },
    { id: 'back', name: 'Спина', path: 'M40,60 Q60,55 80,60 L80,100 Q60,105 40,100 Z' },
  ];

  const getIntensity = (muscleId: string): number => {
    const map: Record<string, number | undefined> = {
      chest: data.chest,
      biceps_left: data.biceps,
      biceps_right: data.biceps,
      triceps_left: data.triceps,
      triceps_right: data.triceps,
      abs: data.abs,
      legs_left: data.legs,
      legs_right: data.legs,
      shoulders_left: data.shoulders,
      shoulders_right: data.shoulders,
      back: data.back,
    };
    return map[muscleId] || 0;
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 200" className="w-48 h-80">
        {/* Голова */}
        <circle cx={60} cy={30} r={15} fill="#1f2937" />
        
        {/* Зоны мышц с цветовой шкалой тепловизора */}
        {muscles.map((muscle) => {
          const intensity = getIntensity(muscle.id);
          const color = getHeatColor(intensity);
          
          return (
            <path
              key={muscle.id}
              d={muscle.path}
              fill={color}
              stroke="#4b5563"
              strokeWidth="0.5"
              className="transition-colors duration-300"
            />
          );
        })}
      </svg>
      
      {/* Легенда */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <span>0%</span>
        <div className="w-32 h-2 rounded" style={{
          background: 'linear-gradient(to right, #000000, #1e3a8a, #3b82f6, #ef4444, #f97316, #ffffff)'
        }} />
        <span>100%</span>
      </div>
    </div>
  );
}
