import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AdminAuthState {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const useAdminAuth = (): AdminAuthState & {
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
} => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user role from users table
  const loadUserRole = useCallback(async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('Could not load user role, defaulting to admin:', profileError);
        setUserRole('admin');
        return;
      }

      setUserRole(profile?.role || 'admin');
    } catch (err) {
      console.error('Error loading user role:', err);
      setUserRole('admin');
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    console.log('🔐 Initializing admin authentication...');
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
          setSession(null);
          setUser(null);
          setUserRole(null);
          return;
        }

        if (currentSession?.user) {
          console.log('✅ Valid admin session found:', currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          await loadUserRole(currentSession.user.id);
        } else {
          console.log('❌ No valid admin session found');
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔐 Admin auth state changed:', event, newSession?.user?.email);
      
      try {
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          await loadUserRole(newSession.user.id);
          setError(null);
        } else {
          setSession(null);
          setUser(null);
          setUserRole(null);
          if (event === 'SIGNED_OUT') {
            setError(null);
          }
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserRole]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        setError(error.message);
      } else {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setError(null);
      }
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        setError(error.message);
        return;
      }

      if (refreshedSession?.user) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
        await loadUserRole(refreshedSession.user.id);
      }
    } catch (err) {
      console.error('Session refresh error:', err);
      setError(err instanceof Error ? err.message : 'Session refresh failed');
    } finally {
      setLoading(false);
    }
  }, [loadUserRole]);

  const isAuthenticated = !!(user && session);

  return {
    user,
    session,
    userRole,
    loading,
    error,
    isAuthenticated,
    signOut,
    refreshSession
  };
};