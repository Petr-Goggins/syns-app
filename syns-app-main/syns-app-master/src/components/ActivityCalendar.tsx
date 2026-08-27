import React, { useState } from 'react';
import type { ActivityDay } from '@/store/longPathStore';

interface ActivityCalendarProps {
  days: ActivityDay[];
  weeks?: number; // Number of weeks to display (default 4)
  showTooltip?: boolean;
}

export default function ActivityCalendar({
  days,
  weeks = 4,
  showTooltip = true,
}: ActivityCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  
  // Get the last N weeks
  const calendarDays = days.slice(-weeks * 7);
  
  // Function to get color intensity based on volume
  const getColorClass = (day: ActivityDay) => {
    if (!day.hasWorkout) return 'bg-bg-tertiary';
    
    // Calculate intensity based on volume
    const volume = day.volume || 0;
    if (volume > 10000) return 'bg-accent-green'; // Dark green
    if (volume > 5000) return 'bg-accent-green/80';
    if (volume > 2000) return 'bg-accent-green/60';
    if (volume > 1000) return 'bg-accent-green/40';
    if (volume > 500) return 'bg-accent-green/20';
    return 'bg-accent-green/10'; // Light green
  };

  // Group days into weeks
  const weeksData: ActivityDay[][] = [];
  for (let i = 0; i < weeks; i++) {
    const startIdx = i * 7;
    weeksData.push(calendarDays.slice(startIdx, startIdx + 7));
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => (
          <div
            key={day.date}
            className={`aspect-square rounded-sm ${getColorClass(day)} transition-colors cursor-pointer relative`}
            onMouseEnter={() => showTooltip && setHoveredDay(day.date)}
            onMouseLeave={() => showTooltip && setHoveredDay(null)}
            title={`${day.date}: ${day.hasWorkout ? 'Тренировка' : 'Отдых'}`}
          >
            {showTooltip && hoveredDay === day.date && day.hasWorkout && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-bg-secondary border border-border rounded text-xs whitespace-nowrap z-10 shadow-lg" style={{ color: 'var(--text)' }}>
                <div className="font-medium">{new Date(day.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</div>
                <div className="text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
                  {day.exercises?.join(', ') || 'Тренировка'}
                </div>
                {day.volume && (
                  <div className="text-accent-green">Объём: {Math.round(day.volume)}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex justify-between mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>{weeks} недели назад</span>
        <span>Сегодня</span>
      </div>
      
      {/* Color scale legend */}
      <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>Меньше</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-bg-tertiary"></div>
          <div className="w-3 h-3 rounded-sm bg-accent-green/10"></div>
          <div className="w-3 h-3 rounded-sm bg-accent-green/20"></div>
          <div className="w-3 h-3 rounded-sm bg-accent-green/40"></div>
          <div className="w-3 h-3 rounded-sm bg-accent-green/60"></div>
          <div className="w-3 h-3 rounded-sm bg-accent-green/80"></div>
          <div className="w-3 h-3 rounded-sm bg-accent-green"></div>
        </div>
        <span>Больше</span>
      </div>
    </div>
  );
}
