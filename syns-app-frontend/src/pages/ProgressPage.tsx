import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export default function ProgressPage({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});

  if (!user) {
    return <div className="p-4">Пожалуйста, войдите в аккаунт.</div>;
  }

  useEffect(() => {
    const loadProgress = async () => {
      setLoading(true);
      // Здесь будут реальные данные
      setData({ progress: 65, level: 12, xp: 850 });
      setLoading(false);
    };
    loadProgress();
  }, [user]);

  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-text">Прогресс</h1>
      <div className="mt-4 bg-bg-secondary p-4 rounded-lg border border-border">
        <p className="text-text-secondary">Уровень: <span className="text-text font-bold">{data.level}</span></p>
        <p className="text-text-secondary">XP: <span className="text-text font-bold">{data.xp}</span></p>
        <p className="text-text-secondary">Прогресс: <span className="text-text font-bold">{data.progress}%</span></p>
        <div className="w-full bg-bg-tertiary rounded-full h-2 mt-2">
          <div className="bg-accent-blue h-2 rounded-full" style={{ width: `${data.progress}%` }} />
        </div>
      </div>
    </div>
  );
}