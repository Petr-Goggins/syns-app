import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useAuthInit } from '@/hooks/useAuthInit';
import Layout from '@/components/Layout';
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

function AppRoutes() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        path="/*"
        element={
          <ProtectedRoute>
            <Layout sidebarOpen={sidebarOpen} onCloseSidebar={() => setSidebarOpen(false)}>
              <Routes>
                <Route path="/" element={<DashboardPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/dashboard" element={<DashboardPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/coach" element={<CoachPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/plan" element={<PlanPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/nutrition" element={<NutritionPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/reports" element={<ReportsPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/cycle" element={<CyclePage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/chat" element={<ChatPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/profile" element={<ProfilePage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/workouts" element={<WorkoutLogPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/sleep" element={<SleepLogPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/achievements" element={<AchievementsPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/settings" element={<SettingsPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="/progress" element={<ProgressPage onOpenSidebar={() => setSidebarOpen(true)} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
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
