
import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext, AuthContextType } from '@/contexts/AuthContext';
import { MobileAuthLoading } from '@/components/MobileAuthLoading';
import { useMobileAuthHooks } from '@/hooks/useMobileAuthHooks';
import { getCachedRole } from '@/utils/mobileCacheUtils';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const MobileFastAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const initializationRef = useRef<Promise<void> | null>(null);
  const { toast } = useToast();
  const { fetchUserRole, clearSession, signIn, signUp, signOut } = useMobileAuthHooks();

  const loadUserRole = useCallback(async () => {
    if (!user?.id) return;
    
    console.log('📱 Loading mobile user role...');
    try {
      const role = await fetchUserRole(user.id, false);
      setUserRole(role);
    } catch (error) {
      console.error('📱 Failed to load mobile role:', error);
      setUserRole('inspector');
    }
  }, [user?.id, fetchUserRole]);

  const handleClearSession = useCallback(() => {
    clearSession(user?.id);
    setUser(null);
    setSession(null);
    setUserRole(null);
    setError('Session cleared - please sign in again');
  }, [user?.id, clearSession]);

  // Mobile-optimized initialization
  const initializeAuth = useCallback(async (): Promise<void> => {
    if (initializationRef.current) {
      return initializationRef.current;
    }

    console.log('📱 Mobile auth initialization...');
    setError(null);

    const initPromise = new Promise<void>((resolve) => {
      const initAsync = async () => {
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
          console.log('📱 Mobile user found, setting role...');
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
          console.log('📱 No mobile session found');
        }
        
        setLoading(false);
        setError(null);
        console.log('📱 Mobile auth initialization complete');
        resolve();
        
      } catch (error) {
        console.error('📱 Mobile auth initialization error:', error);
        setUser(null);
        setSession(null);
        setUserRole(null);
        setError('Mobile authentication failed');
        setLoading(false);
        resolve();
      }
      };
      
      initAsync();
    });

    initializationRef.current = initPromise;
    return initPromise;
  }, [fetchUserRole]);

  const forceRefresh = useCallback(async () => {
    console.log('📱 Mobile force refresh...');
    setLoading(true);
    setError(null);
    initializationRef.current = null;
    
    try {
      await initializeAuth();
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
  }, [initializeAuth, toast]);

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

  // Mobile-optimized auth state listener
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
      initializationRef.current = null;
    };
  }, [initializeAuth, fetchUserRole]);

  const value: AuthContextType = {
    user,
    userRole,
    loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    forceRefresh,
    clearSession: handleClearSession,
    loadUserRole,
  };

  // Mobile-optimized loading screen
  if (loading) {
    return <MobileAuthLoading onRefresh={() => {
      handleClearSession();
      forceRefresh();
    }} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
