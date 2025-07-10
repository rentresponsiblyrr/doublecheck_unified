
import { useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getCachedRole } from '@/utils/mobileCacheUtils';
import { useMobileAuthHooks } from '@/hooks/useMobileAuthHooks';
import { useToast } from '@/hooks/use-toast';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const initializationRef = useRef<Promise<void> | null>(null);
  const roleLoadingRef = useRef<Promise<void> | null>(null);
  const { toast } = useToast();
  const { fetchUserRole, clearSession, signIn, signUp, signOut } = useMobileAuthHooks();

  const loadUserRole = useCallback(async () => {
    if (!user?.id) return;
    
    // Prevent concurrent role loading
    if (roleLoadingRef.current) {
      console.log('📱 Role loading already in progress, waiting...');
      await roleLoadingRef.current;
      return;
    }
    
    console.log('📱 Loading mobile user role...');
    
    const roleLoadingPromise = (async () => {
      try {
        const role = await fetchUserRole(user.id, false);
        setUserRole(role);
      } catch (error) {
        console.error('📱 Failed to load mobile role:', error);
        setUserRole('inspector');
      } finally {
        roleLoadingRef.current = null;
      }
    })();
    
    roleLoadingRef.current = roleLoadingPromise;
    await roleLoadingPromise;
  }, [user?.id, fetchUserRole]);

  const handleClearSession = useCallback(() => {
    clearSession(user?.id);
    setUser(null);
    setSession(null);
    setUserRole(null);
    setError('Session cleared - please sign in again');
  }, [user?.id, clearSession]);

  const forceRefresh = useCallback(async () => {
    console.log('📱 Mobile force refresh...');
    setLoading(true);
    setError(null);
    initializationRef.current = null;
    
    try {
      // This will be handled by the auth initialization
      toast({
        title: "Mobile Session Refreshed",
        description: "Your mobile session has been refreshed.",
      });
    } catch (error) {
      console.error('📱 Mobile refresh failed:', error);
      toast({
        title: "Mobile Refresh Failed",
        description: "Please try signing in again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signIn(email, password);
      return result;
    } finally {
      setLoading(false);
    }
  }, [signIn]);

  const handleSignUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signUp(email, password);
      return result;
    } finally {
      setLoading(false);
    }
  }, [signUp]);

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    setUserRole(null);
    setSession(null);
    setUser(null);
    setError(null);
    
    try {
      await signOut(user?.id);
    } finally {
      setLoading(false);
    }
  }, [signOut, user?.id]);

  return {
    // State
    user,
    session,
    userRole,
    loading,
    error,
    initializationRef,
    
    // Setters
    setUser,
    setSession,
    setUserRole,
    setLoading,
    setError,
    
    // Actions
    loadUserRole,
    handleClearSession,
    forceRefresh,
    handleSignIn,
    handleSignUp,
    handleSignOut,
    
    // Utilities
    fetchUserRole
  };
};
