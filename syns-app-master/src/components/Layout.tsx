import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import BottomNav from './BottomNav';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}

export default function Layout({ children, sidebarOpen, onCloseSidebar }: LayoutProps) {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-background text-text flex flex-col pb-20 md:pb-0">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-30">
        <h1 className="text-xl font-bold text-primary">Sync</h1>
        <button onClick={onCloseSidebar} className="text-text-secondary hover:text-text">
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onCloseSidebar}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50 transform transition-transform md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">Sync</h1>
          <button onClick={onCloseSidebar} className="text-text-secondary hover:text-text">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          <button
            onClick={() => { logout(); onCloseSidebar(); }}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-red-500 hover:bg-background transition-all"
          >
            <span className="text-sm font-medium">Выйти</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation (Mobile & Desktop) */}
      <BottomNav />

      {/* Desktop Sidebar - Hidden, using BottomNav instead */}
    </div>
  );
}
