import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Dumbbell, Utensils, BarChart2, User } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'Главная', icon: Home },
    { path: '/workouts', label: 'Тренировки', icon: Dumbbell },
    { path: '/nutrition', label: 'Питание', icon: Utensils },
    { path: '/reports', label: 'Статистика', icon: BarChart2 },
    { path: '/profile', label: 'Профиль', icon: User },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const isActive = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
