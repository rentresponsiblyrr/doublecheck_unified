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
      // REMOVED: console.error('Error loading user role:', err);
      setUserRole('admin');
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    // REMOVED: console.log('🔐 Initializing admin authentication...');
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // REMOVED: console.log('🔍 AdminAuth: Getting session with 5s timeout...');
        // Get current session with timeout protection
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AdminAuth session timeout after 5 seconds')), 5000)
        );
        
        const { data: { session: currentSession }, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        // REMOVED: console.log('✅ AdminAuth: Session check completed:', { session: currentSession?.user?.email, sessionError });
        
        if (sessionError) {
          // REMOVED: console.error('Session error:', sessionError);
          setError(sessionError.message);
          setSession(null);
          setUser(null);
          setUserRole(null);
          return;
        }

        if (currentSession?.user) {
          // REMOVED: console.log('✅ Valid admin session found:', currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          
          // REMOVED: console.log('🔍 AdminAuth: Loading user role with timeout...');
          try {
            // Add timeout to loadUserRole as well
            await Promise.race([
              loadUserRole(currentSession.user.id),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('User role loading timeout after 3 seconds')), 3000)
              )
            ]);
            // REMOVED: console.log('✅ AdminAuth: User role loaded successfully');
          } catch (roleError) {
            console.warn('⚠️ AdminAuth: User role loading failed (possibly timeout), continuing...', roleError);
            setUserRole('admin'); // Default fallback
          }
        } else {
          // REMOVED: console.log('❌ No valid admin session found');
          setSession(null);
          setUser(null);
          setUserRole(null);
        }
      } catch (err) {
        // REMOVED: console.error('Auth initialization error (possibly timeout):', err);
        if (err.message?.includes('timeout')) {
          // REMOVED: console.error('🕐 TIMEOUT DETECTED in AdminAuth - Auth service may be hanging');
        }
        setError(err instanceof Error ? err.message : 'Authentication error');
      } finally {
        // REMOVED: console.log('🏁 AdminAuth: Initialization completed, setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // REMOVED: console.log('🔐 Admin auth state changed:', event, newSession?.user?.email);
      
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
        // REMOVED: console.error('Auth state change error:', err);
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
        // REMOVED: console.error('Sign out error:', error);
        setError(error.message);
      } else {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setError(null);
      }
    } catch (err) {
      // REMOVED: console.error('Sign out error:', err);
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
        // REMOVED: console.error('Session refresh error:', error);
        setError(error.message);
        return;
      }

      if (refreshedSession?.user) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
        await loadUserRole(refreshedSession.user.id);
      }
    } catch (err) {
      // REMOVED: console.error('Session refresh error:', err);
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