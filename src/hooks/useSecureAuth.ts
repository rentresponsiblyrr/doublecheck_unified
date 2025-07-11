/**
 * Secure Authentication Hook
 * Handles authentication with proper security measures
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userProfile: any | null;
  userRoles: string[];
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

interface SecureAuthReturn extends AuthState, AuthActions {}

// Session timeout (24 hours)
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

// Failed login attempt tracking
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function useSecureAuth(): SecureAuthReturn {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    userProfile: null,
    userRoles: [],
  });

  // Check for failed login attempts
  const getFailedAttempts = useCallback(() => {
    try {
      const attempts = localStorage.getItem('auth_failed_attempts');
      return attempts ? JSON.parse(attempts) : { count: 0, lastAttempt: 0 };
    } catch {
      return { count: 0, lastAttempt: 0 };
    }
  }, []);

  const setFailedAttempts = useCallback((count: number) => {
    try {
      localStorage.setItem('auth_failed_attempts', JSON.stringify({
        count,
        lastAttempt: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to save login attempts:', error);
    }
  }, []);

  const isAccountLocked = useCallback(() => {
    const attempts = getFailedAttempts();
    if (attempts.count >= MAX_FAILED_ATTEMPTS) {
      const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
      return timeSinceLastAttempt < LOCKOUT_DURATION_MS;
    }
    return false;
  }, [getFailedAttempts]);

  // Validate session timeout
  const isSessionValid = useCallback((session: any) => {
    if (!session?.expires_at) return false;
    
    const expiresAt = new Date(session.expires_at).getTime();
    const now = Date.now();
    
    // Check if session is expired or will expire in next 5 minutes
    return expiresAt > now + (5 * 60 * 1000);
  }, []);

  // Fetch user profile and roles
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new Error(`Profile fetch failed: ${profileError.message}`);
      }

      // Check if user is disabled
      if (userProfile?.status === 'disabled') {
        throw new Error('Account has been disabled');
      }

      // Fetch user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Failed to fetch user roles:', rolesError);
      }

      const roles = userRoles?.map(ur => ur.role) || [];

      return { userProfile, roles };
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      throw error;
    }
  }, []);

  // Update last login time
  const updateLastLogin = useCallback(async (userId: string) => {
    try {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Failed to update last login:', error);
      // Don't throw - this shouldn't block authentication
    }
  }, []);

  // Log security events
  const logSecurityEvent = useCallback(async (event: string, details: any = {}) => {
    try {
      await supabase.from('security_audit_log').insert({
        event_type: event,
        user_id: authState.user?.id || null,
        ip_address: 'unknown', // Would be set server-side in production
        user_agent: navigator.userAgent,
        details: details,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - logging failure shouldn't break authentication
    }
  }, [authState.user?.id]);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    if (isAccountLocked()) {
      const attempts = getFailedAttempts();
      const timeRemaining = Math.ceil((LOCKOUT_DURATION_MS - (Date.now() - attempts.lastAttempt)) / 60000);
      throw new Error(`Account temporarily locked. Try again in ${timeRemaining} minutes.`);
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!email.includes('@') || email.length > 254) {
        throw new Error('Invalid email format');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        // Track failed attempts
        const attempts = getFailedAttempts();
        setFailedAttempts(attempts.count + 1);
        
        await logSecurityEvent('login_failed', {
          email,
          error: error.message,
          attempt_count: attempts.count + 1,
        });

        throw error;
      }

      if (!data.user) {
        throw new Error('Authentication failed');
      }

      // Clear failed attempts on successful login
      setFailedAttempts(0);

      // Fetch user data
      const { userProfile, roles } = await fetchUserData(data.user.id);

      // Update last login
      await updateLastLogin(data.user.id);

      // Log successful login
      await logSecurityEvent('login_success', {
        email,
        user_id: data.user.id,
      });

      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        userProfile,
        userRoles: roles,
      });

    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Sign in failed',
      }));
      throw error;
    }
  }, [isAccountLocked, getFailedAttempts, setFailedAttempts, fetchUserData, updateLastLogin, logSecurityEvent]);

  // Sign out function
  const signOut = useCallback(async () => {
    try {
      await logSecurityEvent('logout', {
        user_id: authState.user?.id,
      });

      await supabase.auth.signOut();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        userProfile: null,
        userRoles: [],
      });

      // Clear any stored auth data
      localStorage.removeItem('auth_failed_attempts');
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      // Even if sign out fails, clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        userProfile: null,
        userRoles: [],
      });
    }
  }, [authState.user?.id, logSecurityEvent]);

  // Refresh session function
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        await signOut();
        return;
      }

      if (data.user) {
        const { userProfile, roles } = await fetchUserData(data.user.id);
        
        setAuthState(prev => ({
          ...prev,
          user: data.user,
          userProfile,
          userRoles: roles,
        }));
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      await signOut();
    }
  }, [fetchUserData, signOut]);

  // Clear error function
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize authentication
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Session initialization error:', error);
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        if (session?.user) {
          // Validate session
          if (!isSessionValid(session)) {
            console.log('Session expired, signing out');
            await supabase.auth.signOut();
            setAuthState(prev => ({ ...prev, isLoading: false }));
            return;
          }

          try {
            const { userProfile, roles } = await fetchUserData(session.user.id);
            
            if (mounted) {
              setAuthState({
                user: session.user,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                userProfile,
                userRoles: roles,
              });
            }
          } catch (error) {
            console.error('User data fetch failed:', error);
            await supabase.auth.signOut();
            if (mounted) {
              setAuthState(prev => ({ ...prev, isLoading: false }));
            }
          }
        } else {
          if (mounted) {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event);

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          const { userProfile, roles } = await fetchUserData(session.user.id);
          
          if (mounted) {
            setAuthState({
              user: session.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              userProfile,
              userRoles: roles,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              userProfile: null,
              userRoles: [],
            });
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          if (mounted) {
            await refreshSession();
          }
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            error: 'Authentication error occurred',
            isLoading: false,
          }));
        }
      }
    });

    // Set up session timeout check
    const timeoutCheck = setInterval(() => {
      if (authState.isAuthenticated && authState.user) {
        // Check if we need to refresh the session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && !isSessionValid(session)) {
            console.log('Session timeout detected');
            signOut();
          }
        });
      }
    }, 60000); // Check every minute

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearInterval(timeoutCheck);
    };
  }, [isSessionValid, fetchUserData, refreshSession, authState.isAuthenticated, authState.user, signOut]);

  return {
    ...authState,
    signIn,
    signOut,
    clearError,
    refreshSession,
  };
}