
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCachedRole } from '@/utils/mobileCacheUtils';

interface UseAuthInitializationProps {
  setSession: (session: any) => void;
  setUser: (user: any) => void;
  setUserRole: (role: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchUserRole: (userId: string, useCache?: boolean) => Promise<string>;
  initializationRef: React.MutableRefObject<Promise<void> | null>;
}

export const useAuthInitialization = ({
  setSession,
  setUser,
  setUserRole,
  setLoading,
  setError,
  fetchUserRole,
  initializationRef
}: UseAuthInitializationProps) => {
  
  const initializeAuth = useCallback(async (): Promise<void> => {
    if (initializationRef.current) {
      return initializationRef.current;
    }

    // REMOVED: console.log('📱 Mobile auth initialization...');
    setError(null);

    const initPromise = new Promise<void>(async (resolve) => {
      try {
        // Mobile-friendly timeout (2 seconds)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Mobile auth timeout')), 2000);
        });

        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // REMOVED: console.log('📱 Mobile user found, setting role...');
          const cachedRole = getCachedRole(session.user.id);
          if (cachedRole) {
            setUserRole(cachedRole);
          } else {
            setUserRole('inspector');
            // Background role fetch for mobile
            fetchUserRole(session.user.id, false).then(role => {
              setUserRole(role);
            }).catch(() => {
              console.warn('📱 Background mobile role fetch failed');
            });
          }
        } else {
          setUserRole(null);
          // REMOVED: console.log('📱 No mobile session found');
        }
        
        setLoading(false);
        setError(null);
        // REMOVED: console.log('📱 Mobile auth initialization complete');
        resolve();
        
      } catch (error) {
        // REMOVED: console.error('📱 Mobile auth initialization error:', error);
        setUser(null);
        setSession(null);
        setUserRole(null);
        setError('Mobile authentication failed');
        setLoading(false);
        resolve();
      }
    });

    initializationRef.current = initPromise;
    return initPromise;
  }, [setSession, setUser, setUserRole, setLoading, setError, fetchUserRole, initializationRef]);

  return { initializeAuth };
};
