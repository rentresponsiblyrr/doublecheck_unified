
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { debugLogger } from '@/utils/debugLogger';

export const useSimpleAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    debugLogger.info('SimpleAuth', 'Initializing simple auth');

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          debugLogger.error('SimpleAuth', 'Session fetch error', error);
          setError(error.message);
        } else {
          debugLogger.info('SimpleAuth', 'Session fetched', { 
            hasSession: !!session,
            userId: session?.user?.id,
            email: session?.user?.email 
          });
          setUser(session?.user ?? null);
        }
      } catch (err) {
        debugLogger.error('SimpleAuth', 'Auth initialization failed', err);
        setError(err instanceof Error ? err.message : 'Auth failed');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        debugLogger.info('SimpleAuth', 'Auth state change', { 
          event, 
          hasSession: !!session,
          userId: session?.user?.id 
        });
        setUser(session?.user ?? null);
        setError(null);
      }
    );

    return () => {
      debugLogger.debug('SimpleAuth', 'Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user
  };
};
