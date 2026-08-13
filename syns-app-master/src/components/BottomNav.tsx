import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Utensils, BarChart2, User } from 'lucide-react';
import { MOBILE_NAV_ITEMS } from '@/config/navigation';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/workouts', icon: Dumbbell, label: 'Тренировки' },
    { path: '/nutrition', icon: Utensils, label: 'Питание' },
    { path: '/reports', icon: BarChart2, label: 'Статистика' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-pb z-50 lg:hidden">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-accent-blue' : 'text-text-secondary'
              }`}
            >
              <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
