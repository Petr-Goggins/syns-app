import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { DESKTOP_NAV_ITEMS } from '@/config/navigation';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent size={20} /> : null;
  };

  return (
    <>
      {/* Overlay для мобильных */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <Icons.Zap className="text-accent-blue" size={24} />
              Sync
            </h1>
            <button
              onClick={onClose}
              className="lg:hidden text-text-secondary hover:text-text"
            >
              <Icons.X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {DESKTOP_NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        navigate(item.path);
                        onClose?.();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                          : 'text-text-secondary hover:text-text hover:bg-bg-secondary'
                      }`}
                    >
                      {getIcon(item.icon)}
                      <span>{item.label}</span>
                      {isActive && (
                        <Icons.ChevronRight size={16} className="ml-auto" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2 text-xs text-text-secondary">
              <Icons.Info size={16} />
              <span>Sync v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
