import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
<<<<<<< HEAD
    if (!user) {
      navigate('/auth');
    }
=======
    if (!user) navigate('/auth');
>>>>>>> 6946a4955e76153e38721c207ba4d118934cd0c6
  }, [user, navigate]);

  if (!user) return null;
  return <>{children}</>;
}