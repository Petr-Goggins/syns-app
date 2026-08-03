import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Home,
  MessageSquare,
  User,
  Calendar,
  Dumbbell,
  Utensils,
  BarChart,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export default function Layout({ children, sidebarOpen, onCloseSidebar }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore(); // заменил signOut на logout
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.className = newTheme;
  };

  const navItems = [
    { name: 'Главная', path: '/dashboard', icon: Home },
    { name: 'Тренер', path: '/coach', icon: MessageSquare },
    { name: 'План', path: '/plan', icon: Calendar },
    { name: 'Питание', path: '/nutrition', icon: Utensils },
    { name: 'Статистика', path: '/reports', icon: BarChart },
    { name: 'Цикл', path: '/cycle', icon: Calendar },
    { name: 'Чат', path: '/chat', icon: MessageSquare },
    { name: 'Профиль', path: '/profile', icon: User },
    { name: 'Тренировки', path: '/workouts', icon: Dumbbell },
    { name: 'Сон', path: '/sleep', icon: Moon },
    { name: 'Достижения', path: '/achievements', icon: Award },
    { name: 'Настройки', path: '/settings', icon: Settings },
  ];

  const filteredNavItems = navItems;

  return (
    <div className="min-h-screen bg-bg text-text flex">
      <aside className="hidden md:flex md:flex-col w-64 bg-bg-secondary border-r border-border shrink-0">
        <div className="p-4 border-b border-border">
          <h1 className="text-2xl font-bold text-accent-blue">Sync</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                location.pathname === item.path
                  ? 'bg-accent-blue/15 text-accent-blue'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Выйти</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onCloseSidebar}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-bg-secondary border-r border-border z-50 transform transition-transform md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h1 className="text-2xl font-bold text-accent-blue">Sync</h1>
          <button onClick={onCloseSidebar} className="text-text-secondary hover:text-text">
            <X size={24} />
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-70px)]">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onCloseSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                location.pathname === item.path
                  ? 'bg-accent-blue/15 text-accent-blue'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text'
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Выйти</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="flex items-center justify-between p-4 bg-bg-secondary border-b border-border md:bg-transparent md:border-none">
          <button
            onClick={onCloseSidebar}
            className="md:hidden text-text-secondary hover:text-text"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center">
              <span className="text-sm font-semibold text-accent-blue">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </header>
        <div className="flex-1 p-4">
          {children}
        </div>
      </main>
    </div>
  );
}