import React from 'react';

interface CircularProgressProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  showRemaining?: boolean;
  sublabel?: string;
}

export default function CircularProgress({
  current,
  goal,
  size = 160,
  strokeWidth = 12,
  color,
  label,
  showRemaining = true,
  sublabel,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1.5, current / goal);
  const offset = circumference * (1 - Math.min(1, pct));
  
  const getCircleColor = () => {
    if (color) return color;
    if (pct <= 1) return 'var(--accent-blue)';
    if (pct <= 1.2) return '#FBBF24';
    return 'var(--text-tertiary)';
  };
  
  const circleColor = getCircleColor();
  const remaining = goal - current;
  const isOver = remaining < 0;
  
  const prevPctRef = React.useRef(0);
  React.useEffect(() => {
    if (prevPctRef.current < 1 && pct >= 1 && navigator.vibrate) {
      navigator.vibrate(50);
    }
    prevPctRef.current = pct;
  }, [pct]);
  
  const centerLabel = label || (showRemaining 
    ? (isOver ? `+${Math.round(Math.abs(remaining))}` : `${Math.round(remaining)}`)
    : `${Math.round(current)}`);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
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
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerLabel && <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{centerLabel}</span>}
        {sublabel && <span className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{sublabel}</span>}
      </div>
    </div>
  );
}
