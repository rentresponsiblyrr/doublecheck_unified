
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  clearSession: () => void;
  loadUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mobile-optimized role cache
const ROLE_CACHE_KEY = 'doublecheck_user_role';
const ROLE_CACHE_EXPIRY = 'doublecheck_role_expiry';
const ROLE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for mobile

const getCachedRole = (userId: string): string | null => {
  try {
    const cachedRole = localStorage.getItem(`${ROLE_CACHE_KEY}_${userId}`);
    const expiry = localStorage.getItem(`${ROLE_CACHE_EXPIRY}_${userId}`);
    
    if (cachedRole && expiry && Date.now() < parseInt(expiry)) {
      console.log('📱 Using mobile cached role:', cachedRole);
      return cachedRole;
    }
  } catch (error) {
    console.warn('📱 Mobile role cache read error:', error);
  }
  return null;
};

const setCachedRole = (userId: string, role: string) => {
  try {
    localStorage.setItem(`${ROLE_CACHE_KEY}_${userId}`, role);
    localStorage.setItem(`${ROLE_CACHE_EXPIRY}_${userId}`, (Date.now() + ROLE_CACHE_DURATION).toString());
    console.log('📱 Mobile cached role:', role);
  } catch (error) {
    console.warn('📱 Mobile role cache write error:', error);
  }
};

export const MobileFastAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const initializationRef = useRef<Promise<void> | null>(null);
  const { toast } = useToast();

  // Mobile-optimized role fetching with aggressive timeout
  const fetchUserRole = useCallback(async (userId: string, useCache = true): Promise<string> => {
    if (useCache) {
      const cachedRole = getCachedRole(userId);
      if (cachedRole) {
        return cachedRole;
      }
    }

    console.log('📱 Fetching mobile role for:', userId);
    
    return new Promise((resolve) => {
      // Mobile-friendly timeout (1 second)
      const timeout = setTimeout(() => {
        console.warn('📱 Mobile role fetch timeout, using fallback');
        resolve('inspector');
      }, 1000);

      const fetchRole = async () => {
        try {
          const { data, error } = await supabase.rpc('get_user_role_simple', { 
            _user_id: userId 
          });
          
          clearTimeout(timeout);
          
          if (error) {
            console.warn('📱 Mobile role fetch failed:', error);
            resolve('inspector');
            return;
          }
          
          const role = data || 'inspector';
          setCachedRole(userId, role);
          console.log('📱 Mobile role fetched:', role);
          resolve(role);
        } catch (error) {
          console.error('📱 Mobile role fetch error:', error);
          clearTimeout(timeout);
          resolve('inspector');
        }
      };

      fetchRole();
    });
  }, []);

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

  const clearSession = useCallback(() => {
    console.log('📱 Clearing mobile session...');
    
    try {
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-urrydhjchgxnhyggqtzr-auth-token');
      
      if (user?.id) {
        localStorage.removeItem(`${ROLE_CACHE_KEY}_${user.id}`);
        localStorage.removeItem(`${ROLE_CACHE_EXPIRY}_${user.id}`);
      }
      
      setUser(null);
      setSession(null);
      setUserRole(null);
      setError('Session cleared - please sign in again');
      
      console.log('📱 Mobile session cleared');
    } catch (error) {
      console.error('📱 Mobile session clear error:', error);
    }
  }, [user?.id]);

  // Mobile-optimized initialization
  const initializeAuth = useCallback(async (): Promise<void> => {
    if (initializationRef.current) {
      return initializationRef.current;
    }

    console.log('📱 Mobile auth initialization...');
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
          title: "Mobile Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in on mobile.",
        });
      }
      
      return { error };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mobile sign in failed';
      setError(message);
      toast({
        title: "Mobile Sign In Error",
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
          title: "Mobile Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created",
          description: "Please check your email to verify your mobile account.",
        });
      }
      
      return { error };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mobile sign up failed';
      setError(message);
      toast({
        title: "Mobile Sign Up Error",
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
      setSession(null);
      setUser(null);
      setError(null);
      
      await supabase.auth.signOut();
      clearSession();
      
      toast({
        title: "Signed Out",
        description: "You have been signed out of your mobile session.",
      });
    } catch (error) {
      console.error('📱 Mobile sign out error:', error);
      toast({
        title: "Mobile Sign Out Error",
        description: "There was an issue signing out.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [clearSession, toast]);

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

  const value = {
    user,
    userRole,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    forceRefresh,
    clearSession,
    loadUserRole,
  };

  // Mobile-optimized loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <LoadingSpinner message="Loading mobile app..." />
          
          <div className="mt-4 space-y-2">
            <button
              onClick={() => {
                console.log('📱 Mobile recovery triggered');
                clearSession();
                forceRefresh();
              }}
              className="text-sm text-blue-600 hover:text-blue-800 underline block w-full"
            >
              Taking too long? Tap to refresh
            </button>
            
            <div className="text-xs text-gray-500">
              Mobile optimization active
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
