import React from 'react';

interface CircularProgressProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  current,
  goal,
  size = 140,
  strokeWidth = 12,
  label = 'ккал'
}) => {
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Прогресс с ограничением 120% для визуализации
  const progress = Math.min(current / goal, 1.2);
  const dashOffset = circumference - (progress / 1.2) * circumference;
  
  // Определение цвета на основе прогресса
  const getColor = () => {
    if (progress <= 1) return '#22c55e'; // зелёный
    if (progress <= 1.2) return '#eab308'; // жёлтый
    return '#9ca3af'; // серый
  };
  
  const color = getColor();
  const isOver = current > goal;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Фоновый круг */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--bg-card)"
          strokeWidth={strokeWidth}
        />
        {/* Прогресс-круг */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.8s ease',
          }}
        />
      </svg>
      
      {/* Центральный текст */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <span style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: 'var(--text-primary)',
          display: 'block'
        }}>
          {Math.round(current)}
        </span>
        <span style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          display: 'block'
        }}>
          {label}
        </span>
      </div>
    </div>
  );
};

export default CircularProgress;
