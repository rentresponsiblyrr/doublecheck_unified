
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCachedRole } from '@/utils/mobileCacheUtils';

interface UseAuthStateListenerProps {
  setSession: (session: any) => void;
  setUser: (user: any) => void;
  setUserRole: (role: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchUserRole: (userId: string, useCache?: boolean) => Promise<string>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStateListener = ({
  setSession,
  setUser,
  setUserRole,
  setLoading,
  setError,
  fetchUserRole,
  initializeAuth
}: UseAuthStateListenerProps) => {
  
  useEffect(() => {
    let isMounted = true;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('📱 Mobile auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const cachedRole = getCachedRole(session.user.id);
          if (cachedRole) {
            setUserRole(cachedRole);
          } else {
            setUserRole('inspector');
            
            // Background mobile role fetch
            fetchUserRole(session.user.id, false).then(role => {
              if (isMounted) {
                setUserRole(role);
              }
            }).catch(error => {
              console.error('📱 Background mobile role fetch failed:', error);
            });
          }
        } else {
          if (isMounted) {
            setUserRole(null);
          }
        }
        
        if (isMounted) {
          setLoading(false);
          setError(null);
        }
      }
    );

    initializeAuth().catch((error) => {
      if (isMounted) {
        console.error('📱 Failed to initialize mobile auth:', error);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setUser, setUserRole, setLoading, setError, fetchUserRole, initializeAuth]);
};
