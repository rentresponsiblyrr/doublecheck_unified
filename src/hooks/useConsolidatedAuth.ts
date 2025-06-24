
import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConsolidatedAuthState {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loadUserRole: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  clearSession: () => void;
}

// Role cache configuration
const ROLE_CACHE_KEY = 'doublecheck_user_role';
const ROLE_CACHE_EXPIRY = 'doublecheck_role_expiry';
const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedRole = (userId: string): string | null => {
  try {
    const cachedRole = localStorage.getItem(`${ROLE_CACHE_KEY}_${userId}`);
    const expiry = localStorage.getItem(`${ROLE_CACHE_EXPIRY}_${userId}`);
    
    if (cachedRole && expiry && Date.now() < parseInt(expiry)) {
      console.log('📱 Using cached role:', cachedRole);
      return cachedRole;
    }
  } catch (error) {
    console.warn('⚠️ Error reading role cache:', error);
  }
  return null;
};

const setCachedRole = (userId: string, role: string) => {
  try {
    localStorage.setItem(`${ROLE_CACHE_KEY}_${userId}`, role);
    localStorage.setItem(`${ROLE_CACHE_EXPIRY}_${userId}`, (Date.now() + ROLE_CACHE_DURATION).toString());
    console.log('💾 Cached role:', role);
  } catch (error) {
    console.warn('⚠️ Error caching role:', error);
  }
};

export const useConsolidatedAuth = (): ConsolidatedAuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fast role fetching with timeout
  const fetchUserRole = useCallback(async (userId: string, useCache = true): Promise<string> => {
    if (useCache) {
      const cachedRole = getCachedRole(userId);
      if (cachedRole) {
        return cachedRole;
      }
    }

    console.log('🔍 Fetching user role for:', userId);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('⏰ Role fetch timeout, using fallback');
        resolve('inspector');
      }, 1500);

      const fetchRole = async () => {
        try {
          const { data, error } = await supabase.rpc('get_user_role_simple', { 
            _user_id: userId 
          });
          
          clearTimeout(timeout);
          
          if (error) {
            console.warn('⚠️ Role fetch failed:', error);
            resolve('inspector');
            return;
          }
          
          const role = data || 'inspector';
          setCachedRole(userId, role);
          console.log('✅ Role fetched:', role);
          resolve(role);
        } catch (error) {
          console.error('💥 Role fetch error:', error);
          clearTimeout(timeout);
          resolve('inspector');
        }
      };

      fetchRole();
    });
  }, []);

  const loadUserRole = useCallback(async () => {
    if (!user?.id) return;
    
    console.log('🔄 Loading user role...');
    try {
      const role = await fetchUserRole(user.id, false);
      setUserRole(role);
    } catch (error) {
      console.error('❌ Failed to load role:', error);
      setUserRole('inspector');
    }
  }, [user?.id, fetchUserRole]);

  const clearSession = useCallback(() => {
    console.log('🔄 Clearing session data...');
    
    try {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-urrydhjchgxnhyggqtzr-auth-token');
      
      if (user?.id) {
        localStorage.removeItem(`${ROLE_CACHE_KEY}_${user.id}`);
        localStorage.removeItem(`${ROLE_CACHE_EXPIRY}_${user.id}`);
      }
      
      setUser(null);
      setUserRole(null);
      setError('Session cleared - please sign in again');
      
      console.log('✅ Session cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  }, [user?.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        toast({
          title: "Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
      }
      
      return { error };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setError(message);
      toast({
        title: "Sign In Error",
        description: message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        setError(error.message);
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account.",
        });
      }
      
      return { error };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      setError(message);
      toast({
        title: "Sign Up Error",
        description: message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setUserRole(null);
      setUser(null);
      setError(null);
      
      await supabase.auth.signOut();
      clearSession();
      
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error('❌ Sign out error:', error);
      toast({
        title: "Sign Out Error",
        description: "There was an issue signing out.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [clearSession, toast]);

  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing authentication...');
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const role = await fetchUserRole(session.user.id, false);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      
      toast({
        title: "Authentication Refreshed",
        description: "Your session has been refreshed successfully.",
      });
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh authentication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchUserRole, toast]);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (isMounted) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const cachedRole = getCachedRole(session.user.id);
            if (cachedRole) {
              setUserRole(cachedRole);
            } else {
              setUserRole('inspector');
              fetchUserRole(session.user.id, false).then(role => {
                if (isMounted) {
                  setUserRole(role);
                }
              });
            }
          } else {
            setUserRole(null);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (isMounted) {
          setError('Authentication initialization failed');
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 Auth state changed:', event);
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const cachedRole = getCachedRole(session.user.id);
          if (cachedRole) {
            setUserRole(cachedRole);
          } else {
            setUserRole('inspector');
            fetchUserRole(session.user.id, false).then(role => {
              if (isMounted) {
                setUserRole(role);
              }
            });
          }
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
        setError(null);
      }
    );

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  const isAuthenticated = !!user && !loading;

  return {
    user,
    userRole,
    loading,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    loadUserRole,
    forceRefresh,
    clearSession
  };
};
