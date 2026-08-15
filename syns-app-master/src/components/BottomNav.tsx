import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Utensils, BarChart2, User, BookOpen } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/', icon: Home },
    { path: '/workouts', icon: Dumbbell },
    { path: '/technique', icon: BookOpen },
    { path: '/nutrition', icon: Utensils },
    { path: '/reports', icon: BarChart2 },
    { path: '/profile', icon: User },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
          </button>
        );
      })}
    </nav>
  );
}
