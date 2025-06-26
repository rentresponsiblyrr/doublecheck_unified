
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { debugLogger } from '@/utils/debugLogger';

export const useCleanAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    debugLogger.info('CleanAuth', 'Initializing clean auth system');

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        debugLogger.debug('CleanAuth', 'Fetching session');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (sessionError) {
          debugLogger.error('CleanAuth', 'Session error', sessionError);
          setError(sessionError.message);
          setUser(null);
        } else {
          debugLogger.info('CleanAuth', 'Session fetched successfully', { 
            hasSession: !!session,
            userId: session?.user?.id,
            email: session?.user?.email 
          });
          setUser(session?.user ?? null);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        
        debugLogger.error('CleanAuth', 'Auth initialization failed', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        setUser(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        debugLogger.info('CleanAuth', 'Auth state changed', { 
          event, 
          hasSession: !!session,
          userId: session?.user?.id 
        });
        
        setUser(session?.user ?? null);
        setError(null);
        
        if (loading) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      debugLogger.debug('CleanAuth', 'Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user && !error
  };
};
