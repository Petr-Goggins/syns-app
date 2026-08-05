import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import WorkoutLogPage from './pages/WorkoutLogPage';
import SleepLogPage from './pages/SleepLogPage';
import AchievementsPage from './pages/AchievementsPage';
import SettingsPage from './pages/SettingsPage';
import PlanPage from './pages/PlanPage';
import NutritionPage from './pages/NutritionPage';
import ProgressPage from './pages/ProgressPage';
import CoachPage from './pages/CoachPage';
import ReportsPage from './pages/ReportsPage';
import CyclePage from './pages/CyclePage';
import LongTermPlanPage from './pages/LongTermPlanPage';

function AppRoutes() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Загружаем пользователя при монтировании
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        useAuthStore.getState().setUser(data?.session?.user || null);
      } catch (error) {
        console.error('Auth init error:', error);
        useAuthStore.getState().setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      useAuthStore.getState().setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-accent-blue animate-bounce-dot"
              style={{ animationDelay: `${i * 0.16}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const dummyOpenSidebar = () => {};

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout sidebarOpen={sidebarOpen} onCloseSidebar={() => setSidebarOpen(false)}>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/coach" element={<CoachPage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/plan" element={<PlanPage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/nutrition" element={<NutritionPage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/reports" element={<ReportsPage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/cycle" element={<CyclePage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/chat" element={<ChatPage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/profile" element={<ProfilePage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/workouts" element={<WorkoutLogPage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/sleep" element={<SleepLogPage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/achievements" element={<AchievementsPage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/settings" element={<SettingsPage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/progress" element={<ProgressPage onOpenSidebar={dummyOpenSidebar} />} />
                <Route path="/long-term-plan" element={<LongTermPlanPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161B22',
            color: '#E6EDF3',
            border: '1px solid #30363D',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }}
      />
      <AppRoutes />
    </BrowserRouter>
  );
}