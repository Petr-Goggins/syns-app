import React from 'react';

interface CircularProgressProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export default function CircularProgress({
  current,
  goal,
  size = 160,
  strokeWidth = 12,
  color,
  label,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = current / goal;
  const offset = circumference * (1 - Math.min(1, pct));
  
  // Цвета: зелёный (до 100%), янтарный (100-120%), серый (>120%)
  const getCircleColor = () => {
    if (color) return color;
    if (pct <= 1) return '#22c55e'; // зелёный
    if (pct <= 1.2) return '#FBBF24'; // янтарный
    return '#6B7280'; // серый
  };
  
  const circleColor = getCircleColor();

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#374151"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={circleColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{label || `${Math.round(current)}/${goal}`}</span>
      </div>
    </div>
  );
}
