import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text flex">
      {/* Desktop Sidebar - показывается только на экранах >= 768px */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Header - показывается только на экранах < 768px */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-30">
        <header className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-primary">Sync</h1>
          <button onClick={() => setSidebarOpen(true)} className="text-text-secondary hover:text-text">
            <Menu size={24} />
          </button>
        </header>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-14 lg:pt-0 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Bottom Navigation - показывается только на мобильных < 768px */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
