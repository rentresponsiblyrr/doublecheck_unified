
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

// Role cache with expiration
const ROLE_CACHE_KEY = 'doublecheck_user_role';
const ROLE_CACHE_EXPIRY = 'doublecheck_role_expiry';
const ROLE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedRole = (userId: string): string | null => {
  try {
    const cachedRole = localStorage.getItem(`${ROLE_CACHE_KEY}_${userId}`);
    const expiry = localStorage.getItem(`${ROLE_CACHE_EXPIRY}_${userId}`);
    
    if (cachedRole && expiry && Date.now() < parseInt(expiry)) {
      console.log('🎯 Using cached role:', cachedRole);
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

export const FastAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const initializationRef = useRef<Promise<void> | null>(null);
  const { toast } = useToast();

  // Fast role fetching with cache and timeout
  const fetchUserRole = useCallback(async (userId: string, useCache = true): Promise<string> => {
    // Check cache first if enabled
    if (useCache) {
      const cachedRole = getCachedRole(userId);
      if (cachedRole) {
        return cachedRole;
      }
    }

    console.log('🔍 Fetching fresh role for:', userId);
    
    return new Promise((resolve) => {
      // Aggressive timeout for role fetching
      const timeout = setTimeout(() => {
        console.warn('⏰ Role fetch timeout, using fallback');
        resolve('inspector');
      }, 1500); // Reduced from 3s to 1.5s

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
          console.log('✅ Fresh role fetched:', role);
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

  // Lazy role loading - only when explicitly requested
  const loadUserRole = useCallback(async () => {
    if (!user?.id) return;
    
    console.log('🔄 Loading user role...');
    try {
      const role = await fetchUserRole(user.id, false); // Skip cache for manual refresh
      setUserRole(role);
    } catch (error) {
      console.error('❌ Failed to load role:', error);
      setUserRole('inspector');
    }
  }, [user?.id, fetchUserRole]);

  // Clear session data
  const clearSession = useCallback(() => {
    console.log('🔄 Clearing session data...');
    
    try {
      // Clear auth storage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-urrydhjchgxnhyggqtzr-auth-token');
      
      // Clear role cache
      if (user?.id) {
        localStorage.removeItem(`${ROLE_CACHE_KEY}_${user.id}`);
        localStorage.removeItem(`${ROLE_CACHE_EXPIRY}_${user.id}`);
      }
      
      // Reset state
      setUser(null);
      setSession(null);
      setUserRole(null);
      setError('Session cleared - please sign in again');
      
      console.log('✅ Session cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  }, [user?.id]);

  // Fast initialization - minimal auth check
  const initializeAuth = useCallback(async (): Promise<void> => {
    if (initializationRef.current) {
      return initializationRef.current;
    }

    console.log('🚀 Fast auth initialization...');
    setError(null);

    const initPromise = new Promise<void>(async (resolve) => {
      try {
        // Quick session check with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Auth timeout')), 3000); // Reduced from 8s to 3s
        });

        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Skip role loading on initialization - use cache or lazy load
        if (session?.user) {
          console.log('👤 User found, checking cached role...');
          const cachedRole = getCachedRole(session.user.id);
          if (cachedRole) {
            setUserRole(cachedRole);
          } else {
            // Set default role immediately, fetch real role in background
            setUserRole('inspector');
            
            // Background role fetch (don't wait for it)
            fetchUserRole(session.user.id, false).then(role => {
              setUserRole(role);
            }).catch(() => {
              console.warn('Background role fetch failed, keeping default');
            });
          }
        } else {
          setUserRole(null);
          console.log('👤 No active session found');
        }
        
        setLoading(false);
        setError(null);
        console.log('✅ Fast auth initialization complete');
        resolve();
        
      } catch (error) {
        console.error('💥 Fast auth initialization error:', error);
        setUser(null);
        setSession(null);
        setUserRole(null);
        setError('Authentication failed - please try signing in');
        setLoading(false);
        resolve(); // Don't reject, just continue
      }
    });

    initializationRef.current = initPromise;
    return initPromise;
  }, [fetchUserRole]);

  // Force refresh authentication
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing authentication...');
    setLoading(true);
    setError(null);
    initializationRef.current = null;
    
    try {
      await initializeAuth();
      toast({
        title: "Authentication Refreshed",
        description: "Your session has been refreshed successfully.",
      });
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh authentication. Please try signing in again.",
        variant: "destructive",
      });
    }
  }, [initializeAuth, toast]);

  // Enhanced sign in
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

  // Enhanced sign up
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

  // Enhanced sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setUserRole(null);
      setSession(null);
      setUser(null);
      setError(null);
      
      await supabase.auth.signOut();
      
      // Clear all cached data
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

  // Set up auth state listener and initialize
  useEffect(() => {
    let isMounted = true;
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use cached role or default, then fetch in background
          const cachedRole = getCachedRole(session.user.id);
          if (cachedRole) {
            setUserRole(cachedRole);
          } else {
            setUserRole('inspector'); // Default immediately
            
            // Background role fetch
            fetchUserRole(session.user.id, false).then(role => {
              if (isMounted) {
                setUserRole(role);
              }
            }).catch(error => {
              console.error('❌ Background role fetch failed:', error);
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

    // Initialize authentication
    initializeAuth().catch((error) => {
      if (isMounted) {
        console.error('💥 Failed to initialize auth:', error);
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

  // Simplified loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <LoadingSpinner message="Loading..." />
          
          {loading && (
            <div className="mt-6">
              <button
                onClick={() => {
                  console.log('🔄 Manual recovery triggered');
                  clearSession();
                  forceRefresh();
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Taking too long? Click here to refresh
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
