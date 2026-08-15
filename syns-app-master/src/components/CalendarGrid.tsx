import React from 'react';

interface CalendarGridProps {
  data: { date: string; color: string; details?: string }[];
  title: string;
  icon?: React.ReactNode;
}

/**
 * Универсальный компонент календаря в стиле GitHub
 * Отображает сетку 7xN дней с цветовой индикацией
 */
export const CalendarGrid: React.FC<CalendarGridProps> = ({ data, title, icon }) => {
  // Создаём массив из последних 30 дней
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    const found = data.find(d => d.date === dateStr);
    return { 
      date: dateStr, 
      color: found?.color || '#d1d5db', 
      details: found?.details || dateStr 
    };
  });

  return (
    <div className="bg-card p-5 rounded-xl shadow-lg">
      <h3 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
        {icon && <span className="text-blue-500">{icon}</span>}
        {title}
      </h3>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-[4px] hover:scale-110 transition-transform cursor-pointer"
            style={{ backgroundColor: d.color }}
            title={d.details}
          />
        ))}
      </div>
    </div>
  );
};

export default CalendarGrid;
