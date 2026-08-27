import { useEffect, useState } from 'react';
import { Activity, Dumbbell, Droplet, Moon, Pause, Play, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

export default function DynamicIsland() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [startedAt, setStartedAt] = useState<number | null>(() => {
    const value = Number(localStorage.getItem('sync_workout_started_at'));
    return Number.isFinite(value) && value > 0 ? value : null;
  });
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<'profile' | 'sleep' | 'cycle' | 'ready'>('ready');
  const [statusText, setStatusText] = useState('Готов к тренировке');
  const onWorkoutPage = location.pathname === '/workouts';

  useEffect(() => {
    if (!user) return;
    const loadStatus = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [{ data: profile }, { data: sleep }] = await Promise.all([
        supabase.from('profiles').select('gender, goal').eq('id', user.id).maybeSingle(),
        supabase.from('sleep_logs').select('id').eq('user_id', user.id).eq('date', today).limit(1),
      ]);
      if (!profile?.goal) { setStatus('profile'); setStatusText('Заполните анкету ->'); }
      else if (!sleep?.length) { setStatus('sleep'); setStatusText('Как спалось? Запишите сон'); }
      else { setStatus('ready'); setStatusText('Готов к тренировке'); }
    };
    loadStatus();
  }, [user, location.pathname]);

  useEffect(() => {
    const syncWorkout = () => {
      const value = Number(localStorage.getItem('sync_workout_started_at'));
      setStartedAt(Number.isFinite(value) && value > 0 ? value : null);
    };
    syncWorkout();
    const timer = window.setInterval(syncWorkout, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (paused || startedAt === null) return;
    const timer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paused, startedAt]);

  const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  const workoutActive = onWorkoutPage && startedAt !== null;
  const Icon = workoutActive ? Dumbbell : status === 'profile' ? User : status === 'sleep' ? Moon : status === 'cycle' ? Droplet : Activity;
  const handleClick = () => {
    if (status === 'profile') navigate('/coach');
    else if (status === 'sleep') navigate('/sleep');
    else if (!onWorkoutPage) navigate('/workouts');
  };

  return (
    <div className="dynamic-island glass" role="status">
      <button type="button" className="dynamic-island__main btn-press" onClick={handleClick} aria-label={statusText}>
        <Icon size={16} aria-hidden="true" />
        <span>{workoutActive ? 'Тренировка' : statusText}</span>
        {workoutActive && <strong>{hours}:{minutes}:{seconds}</strong>}
      </button>
      <button type="button" className="dynamic-island__pause btn-press" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Продолжить таймер' : 'Поставить таймер на паузу'} disabled={!workoutActive}>
        {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
      </button>
    </div>
  );
}
