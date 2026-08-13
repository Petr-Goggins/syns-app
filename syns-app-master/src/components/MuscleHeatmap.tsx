import React from 'react';

interface MuscleIntensity {
  muscle: string;
  intensity: number; // 0-100
  lastTrained?: string;
}

interface MuscleHeatmapProps {
  intensities?: Record<string, MuscleIntensity>;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  onClick?: (muscle: string) => void;
}

// SVG силуэт тела с группами мышц
const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({ 
  intensities = {}, 
  size = 'md',
  showLabels = true,
  onClick 
}) => {
  const getSize = () => {
    switch (size) {
      case 'sm': return { width: 120, height: 200, fontSize: 10 };
      case 'lg': return { width: 280, height: 450, fontSize: 16 };
      default: return { width: 180, height: 300, fontSize: 12 };
    }
  };

  const { width, height, fontSize } = getSize();

  // Карта мышц с координатами для SVG
  const muscles: { id: string; name: string; path: string; frontOnly?: boolean }[] = [
    { id: 'chest', name: 'Грудь', path: 'M45,60 Q60,55 75,60 L75,85 Q60,90 45,85 Z' },
    { id: 'abs', name: 'Пресс', path: 'M52,90 L68,90 L68,130 L52,130 Z' },
    { id: 'quads', name: 'Квадрицепсы', path: 'M48,135 L60,135 L60,180 L48,180 Z M62,135 L74,135 L74,180 L62,180 Z' },
    { id: 'shoulders', name: 'Плечи', path: 'M35,55 Q50,45 65,55 M55,55 Q70,45 85,55' },
    { id: 'biceps', name: 'Бицепсы', path: 'M35,65 L45,65 L45,95 L35,95 Z M75,65 L85,65 L85,95 L75,95 Z' },
    { id: 'triceps', name: 'Трицепсы', path: 'M30,70 L40,70 L40,90 L30,90 Z M80,70 L90,70 L90,90 L80,90 Z' },
    { id: 'back', name: 'Спина', path: 'M40,60 Q60,55 80,60 L80,100 Q60,105 40,100 Z', frontOnly: true },
    { id: 'lats', name: 'Широчайшие', path: 'M38,65 L50,65 L50,95 L38,95 Z M70,65 L82,65 L82,95 L70,95 Z', frontOnly: true },
    { id: 'glutes', name: 'Ягодицы', path: 'M48,130 Q60,125 72,130 L72,150 Q60,155 48,150 Z', frontOnly: true },
    { id: 'hamstrings', name: 'Бицепс бедра', path: 'M48,180 L60,180 L60,220 L48,220 Z M62,180 L74,180 L74,220 L62,220 Z', frontOnly: true },
    { id: 'calves', name: 'Икры', path: 'M50,225 L58,225 L58,260 L50,260 Z M64,225 L72,225 L72,260 L64,260 Z', frontOnly: true },
    { id: 'forearms', name: 'Предплечья', path: 'M33,95 L43,95 L43,120 L33,120 Z M77,95 L87,95 L87,120 L77,120 Z' },
    { id: 'traps', name: 'Трапеция', path: 'M50,45 Q60,40 70,45 L70,55 Q60,58 50,55 Z' },
    { id: 'neck', name: 'Шея', path: 'M55,35 L65,35 L65,50 L55,50 Z' },
  ];

  const getColor = (intensity: number): string => {
    if (intensity === 0) return '#374151'; // bg-tertiary
    if (intensity < 30) return '#22c55e'; // light green
    if (intensity < 60) return '#16a34a'; // medium green
    if (intensity < 80) return '#15803d'; // dark green
    return '#14532d'; // darkest green
  };

  const getIntensity = (muscleId: string): number => {
    return intensities[muscleId]?.intensity || 0;
  };

  return (
    <div className="flex flex-col items-center">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="transition-all duration-300"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* Голова */}
        <circle cx={width/2} cy={30} r={15} fill="#374151" />
        
        {/* Тело - передняя часть */}
        {muscles.filter(m => !m.frontOnly).map((muscle) => {
          const intensity = getIntensity(muscle.id);
          const color = getColor(intensity);
          
          return (
            <g key={muscle.id}>
              <path
                d={muscle.path}
                fill={color}
                stroke="#4b5563"
                strokeWidth="0.5"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onClick?.(muscle.name)}
              />
              {showLabels && intensity > 0 && (
                <text
                  x={width/2}
                  y={height - 10}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize={fontSize * 0.7}
                  className="pointer-events-none"
                >
                  {muscle.name}: {intensity}%
                </text>
              )}
            </g>
          );
        })}
        
        {/* Индикаторы для проработанных мышц */}
        {Object.entries(intensities).filter(([_, data]) => data.intensity > 0).map(([muscleId, data]) => {
          const muscle = muscles.find(m => m.id === muscleId);
          if (!muscle || muscle.frontOnly) return null;
          
          return (
            <title key={muscleId}>
              {data.name || muscle.name}: {data.intensity}%{data.lastTrained ? `\nПоследняя тренировка: ${data.lastTrained}` : ''}
            </title>
          );
        })}
      </svg>
      
      {showLabels && Object.keys(intensities).length > 0 && (
        <div className="mt-4 w-full">
          <h4 className="text-sm font-semibold text-text mb-2">Активные мышцы:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(intensities)
              .filter(([_, data]) => data.intensity > 0)
              .sort((a, b) => b[1].intensity - a[1].intensity)
              .slice(0, 5)
              .map(([muscleId, data]) => {
                const muscle = muscles.find(m => m.id === muscleId);
                return (
                  <span 
                    key={muscleId}
                    className="px-2 py-1 rounded-full text-xs font-medium bg-accent-green/20 text-accent-green border border-accent-green/30"
                  >
                    {muscle?.name || muscleId}: {data.intensity}%
                  </span>
                );
              })}
          </div>
        </div>
      )}
      
      {showLabels && Object.keys(intensities).length === 0 && (
        <p className="mt-4 text-text-secondary text-sm text-center">
          Начните тренировки, чтобы увидеть тепловую карту мышц
        </p>
      )}
    </div>
  );
};

export default MuscleHeatmap;
