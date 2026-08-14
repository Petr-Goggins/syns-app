import React, { useState } from 'react';

interface MuscleZone {
  id: string;
  name: string;
  path: string;
  type: 'path' | 'circle' | 'ellipse' | 'rect';
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
  rx_ellipse?: number;
  ry_ellipse?: number;
}

interface MuscleHeatmapProps {
  muscleData?: Record<string, number>;
}

const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({ muscleData = {} }) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; load: number } | null>(null);

  // Функция получения цвета по шкале тепловизора (FLIR)
  const getColor = (load: number): string => {
    if (load === 0) return 'var(--bg-card)';
    
    if (load <= 25) {
      const ratio = load / 25;
      return interpolateColor('#000000', '#000080', ratio);
    } else if (load <= 50) {
      const ratio = (load - 25) / 25;
      return interpolateColor('#000080', '#0000FF', ratio);
    } else if (load <= 75) {
      const ratio = (load - 50) / 25;
      return interpolateColor('#0000FF', '#FF0000', ratio);
    } else if (load <= 90) {
      const ratio = (load - 75) / 15;
      return interpolateColor('#FF0000', '#FFA500', ratio);
    } else {
      const ratio = (load - 90) / 10;
      return interpolateColor('#FFA500', '#FFFFFF', ratio);
    }
  };

  // Интерполяция между двумя цветами
  const interpolateColor = (color1: string, color2: string, ratio: number): string => {
    const hex2rgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const rgb1 = hex2rgb(color1);
    const rgb2 = hex2rgb(color2);

    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * ratio);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * ratio);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Зоны мышц для вида спереди
  const frontZones: MuscleZone[] = [
    { id: 'chest', name: 'Грудные', type: 'path', path: 'M85 60 Q100 90 95 110 L105 110 Q100 90 105 60 Z' },
    { id: 'biceps_left', name: 'Бицепс левый', type: 'path', path: 'M65 70 L60 90 L70 95 L75 80 Z' },
    { id: 'biceps_right', name: 'Бицепс правый', type: 'path', path: 'M135 70 L140 90 L130 95 L125 80 Z' },
    { id: 'triceps_left', name: 'Трицепс левый', type: 'path', path: 'M72 95 L68 115 L78 120 L80 105 Z' },
    { id: 'triceps_right', name: 'Трицепс правый', type: 'path', path: 'M128 95 L132 115 L122 120 L120 105 Z' },
    { id: 'abs', name: 'Пресс', type: 'rect', x: 88, y: 115, width: 24, height: 30, rx: 2 },
    { id: 'legs', name: 'Ноги', type: 'path', path: 'M80 150 L76 210 L70 250 L80 255 L90 210 L100 255 L110 250 L105 210 L100 150 Z' },
    { id: 'shoulders_left', name: 'Дельты левые', type: 'circle', cx: 78, cy: 62, r: 8 },
    { id: 'shoulders_right', name: 'Дельты правые', type: 'circle', cx: 122, cy: 62, r: 8 },
    { id: 'neck', name: 'Шея', type: 'ellipse', cx: 100, cy: 45, rx_ellipse: 12, ry_ellipse: 8 },
  ];

  // Зоны мышц для вида сзади (зеркально)
  const backZones: MuscleZone[] = [
    { id: 'back', name: 'Спина', type: 'path', path: 'M85 70 Q100 100 95 120 L105 120 Q100 100 105 70 Z' },
    { id: 'biceps_left', name: 'Бицепс левый', type: 'path', path: 'M135 70 L140 90 L130 95 L125 80 Z' },
    { id: 'biceps_right', name: 'Бицепс правый', type: 'path', path: 'M65 70 L60 90 L70 95 L75 80 Z' },
    { id: 'triceps_left', name: 'Трицепс левый', type: 'path', path: 'M128 95 L132 115 L122 120 L120 105 Z' },
    { id: 'triceps_right', name: 'Трицепс правый', type: 'path', path: 'M72 95 L68 115 L78 120 L80 105 Z' },
    { id: 'glutes', name: 'Ягодицы', type: 'path', path: 'M85 150 L80 180 L90 190 L100 190 L110 180 L105 150 Z' },
    { id: 'legs', name: 'Ноги', type: 'path', path: 'M80 190 L76 250 L70 290 L80 295 L90 250 L100 295 L110 290 L105 250 L100 190 Z' },
    { id: 'shoulders_left', name: 'Дельты левые', type: 'circle', cx: 122, cy: 62, r: 8 },
    { id: 'shoulders_right', name: 'Дельты правые', type: 'circle', cx: 78, cy: 62, r: 8 },
    { id: 'neck', name: 'Шея', type: 'ellipse', cx: 100, cy: 45, rx_ellipse: 12, ry_ellipse: 8 },
  ];

  const zones = view === 'front' ? frontZones : backZones;

  const handleMouseEnter = (e: React.MouseEvent, zone: MuscleZone) => {
    const load = muscleData[zone.id] || 0;
    const rect = (e.target as SVGElement).getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top,
      name: zone.name,
      load
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleClick = (zone: MuscleZone) => {
    console.log(`Мышца: ${zone.name}, Нагрузка: ${muscleData[zone.id] || 0}%`);
  };

  const renderZone = (zone: MuscleZone) => {
    const load = muscleData[zone.id] || 0;
    const fill = getColor(load);

    const commonProps = {
      key: zone.id,
      onMouseEnter: (e: React.MouseEvent) => handleMouseEnter(e, zone),
      onMouseLeave: handleMouseLeave,
      onClick: () => handleClick(zone),
      style: { cursor: 'pointer', transition: 'opacity 0.2s' }
    };

    if (zone.type === 'path') {
      return <path d={zone.path} fill={fill} {...commonProps} />;
    } else if (zone.type === 'circle') {
      return <circle cx={zone.cx} cy={zone.cy} r={zone.r} fill={fill} {...commonProps} />;
    } else if (zone.type === 'ellipse') {
      return <ellipse cx={zone.cx} cy={zone.cy} rx={zone.rx_ellipse} ry={zone.ry_ellipse} fill={fill} {...commonProps} />;
    } else if (zone.type === 'rect') {
      return <rect x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx={zone.rx} fill={fill} {...commonProps} />;
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Переключатель вида */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setView('front')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: view === 'front' ? 'var(--accent-blue)' : 'var(--bg-card)',
            color: view === 'front' ? '#ffffff' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Спереди
        </button>
        <button
          onClick={() => setView('back')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: view === 'back' ? 'var(--accent-blue)' : 'var(--bg-card)',
            color: view === 'back' ? '#ffffff' : 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Сзади
        </button>
      </div>

      {/* Тепловая карта */}
      <div style={{ position: 'relative', width: '160px', height: '280px' }}>
        <svg viewBox="0 0 200 350" style={{ width: '100%', height: '100%' }}>
          {/* Контур тела (упрощённый) */}
          <path
            d="M100 30 C115 30 125 40 125 55 L125 60 L145 70 L150 95 L145 120 L140 150 L145 200 L140 280 L130 320 L115 350 L85 350 L70 320 L60 280 L55 200 L60 150 L55 120 L50 95 L55 70 L75 60 L75 55 C75 40 85 30 100 30 Z"
            fill="var(--bg-card)"
            stroke="var(--border-color)"
            strokeWidth="2"
          />
          {/* Зоны мышц */}
          {zones.map(renderZone)}
        </svg>

        {/* Всплывающая подсказка */}
        {tooltip && (
          <div style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y - 40,
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--bg-card)',
            padding: '8px 12px',
            borderRadius: '8px',
            boxShadow: 'var(--shadow)',
            zIndex: 1000,
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {tooltip.name}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Нагрузка: {tooltip.load}%
            </div>
          </div>
        )}
      </div>

      {/* Легенда */}
      <div style={{ marginTop: '16px', width: '100%', maxWidth: '200px' }}>
        <div style={{
          height: '12px',
          background: 'linear-gradient(to right, #000000 0%, #000080 25%, #0000FF 50%, #FF0000 75%, #FFA500 90%, #FFFFFF 100%)',
          borderRadius: '6px',
          marginBottom: '4px'
        }} />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'var(--text-secondary)'
        }}>
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>90%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default MuscleHeatmap;
