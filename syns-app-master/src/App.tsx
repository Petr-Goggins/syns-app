import { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useAuthInit } from '@/hooks/useAuthInit';
import { protectedLoader, authPageLoader } from '@/lib/authLoader';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
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
import ExerciseTechniquePage from '@/pages/ExerciseTechniquePage';

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar для десктопа - всегда виден */}
      {isDesktop && <Sidebar isOpen={true} onClose={() => setSidebarOpen(false)} />}
      
      {/* Sidebar для мобильных - открывается по кнопке */}
      {!isDesktop && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      
      {/* Основной контент со сдвигом для десктопа */}
      <div className={isDesktop ? "lg:ml-60 pb-20 lg:pb-0" : "pb-20"}>
        {/* Передаём onOpenSidebar во все дочерние страницы через context */}
        <Outlet context={{ onOpenSidebar: () => setSidebarOpen(true) }} />
      </div>
      
      {/* BottomNav только для мобилок */}
      {!isDesktop && <BottomNav />}
    </div>
  );
}

// Компонент для отображения лоадера во время инициализации
function LoadingScreen() {
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

// Создаём роутер с loader'ами (как middleware)
const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
    loader: authPageLoader, // ← Проверка ДО рендера: если юзер залогинен - редирект
  },
  {
    path: '/',
    element: <MainLayout />,
    loader: protectedLoader, // ← Проверка ДО рендера: если не авторизован - редирект на /auth
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'long-path', element: <LongPathPage /> },
      { path: 'coach', element: <CoachPage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'nutrition', element: <NutritionPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'cycle', element: <CyclePage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'workouts', element: <WorkoutLogPage /> },
      { path: 'sleep', element: <SleepLogPage /> },
      { path: 'achievements', element: <AchievementsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'technique', element: <ExerciseTechniquePage /> },
      { path: 'technique/:exerciseId', element: <ExerciseTechniquePage /> },
    ],
  },
]);

export default function App() {
  const loading = useAuthStore((s) => s.loading);
  useAuthInit();

  // Показываем лоадер только при первичной инициализации auth
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
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
      <RouterProvider router={router} />
    </>
  );
}
