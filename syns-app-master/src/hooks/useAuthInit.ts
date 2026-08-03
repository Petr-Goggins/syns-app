import { useEffect } from 'react';
<<<<<<< HEAD
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export const useAuthInit = () => {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (data?.session?.user) {
          setUser(data.session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);
};
=======
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useAuthInit() {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      if (data.session?.user) {
        setUser({ id: data.session.user.id, email: data.session.user.email ?? '' });
      }
      setLoading(false);
    }).catch((err) => {
      console.error('Session restore error:', err);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email ?? '' });
        } else {
          setUser(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [setUser, setLoading]);
}
>>>>>>> 6946a4955e76153e38721c207ba4d118934cd0c6
