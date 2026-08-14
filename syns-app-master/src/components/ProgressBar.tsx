import React from 'react';

interface ProgressBarProps {
  current: number;
  goal: number;
  label: string;
  color: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({
  current,
  goal,
  label,
  color,
  unit = 'г',
  size = 'md',
}: ProgressBarProps) {
  const pct = Math.min(100, (current / goal) * 100);
  const isOver = current > goal;
  
  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className={`text-sm font-medium ${isOver ? 'text-accent-gold' : 'text-text'}`}>
          {Math.round(current)}{unit} / {goal}{unit}
        </span>
      </div>
      <div className={`w-full bg-bg-tertiary rounded-full ${heightClass}`} style={{ overflow: 'hidden' }}>
        <div
          className={`${heightClass} rounded-full transition-all duration-700 ease-out`}
          style={{ 
            width: `${pct}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
