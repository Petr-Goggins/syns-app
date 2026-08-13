import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FULL_NAVIGATION, MOBILE_NAVIGATION, type NavItem } from '@/config/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay для мобильных */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Сайдбар - показывается только на десктопе (>= 768px) */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:block`}
      >
        {/* Логотип и заголовок */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-accent-blue/15 flex items-center justify-center">
            <span className="text-accent-blue font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">Sync</h1>
            <p className="text-xs text-text-secondary">Твой фитнес-путь</p>
          </div>
        </div>

        {/* Навигация */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
          {FULL_NAVIGATION.map((item: NavItem) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                    : 'text-text-secondary hover:text-text hover:bg-bg-tertiary'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-blue" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Инфо о пользователе внизу */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-bg-secondary/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center">
              <span className="text-accent-blue text-sm font-semibold">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text truncate">Пользователь</p>
              <p className="text-xs text-text-secondary truncate">Premium</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
