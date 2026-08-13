import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useAuthInit } from '@/hooks/useAuthInit';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import WorkoutLogPage from '@/pages/WorkoutLogPage';
import SleepLogPage from '@/pages/SleepLogPage';
import AchievementsPage from '@/pages/AchievementsPage';
import SettingsPage from '@/pages/SettingsPage';
import PlanPage from '@/pages/PlanPage';
import NutritionPage from '@/pages/NutritionPage';
import ProgressPage from '@/pages/ProgressPage';
import CoachPage from '@/pages/CoachPage';
import ReportsPage from '@/pages/ReportsPage';
import CyclePage from '@/pages/CyclePage';
import LongPathPage from '@/pages/LongPathPage';

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar для десктопа */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Основной контент со сдвигом для десктопа */}
      <div className="lg:ml-60 pb-20 lg:pb-0">
        <Outlet />
      </div>
      
      {/* BottomNav только для мобилок */}
      <BottomNav />
    </div>
  );
}

function AppRoutes() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce-dot"
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="long-path" element={<LongPathPage />} />
        <Route path="coach" element={<CoachPage />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="nutrition" element={<NutritionPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="cycle" element={<CyclePage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="workouts" element={<WorkoutLogPage />} />
        <Route path="sleep" element={<SleepLogPage />} />
        <Route path="achievements" element={<AchievementsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  useAuthInit();
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}
