
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const initializationRef = useRef<Promise<void> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Configuration
  const MAX_RETRIES = 3;
  const AUTH_TIMEOUT = 8000; // Reduced from 10s to 8s
  const ROLE_TIMEOUT = 3000; // Reduced from 5s to 3s
  const RETRY_DELAY = 1000;

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (roleTimeoutRef.current) {
      clearTimeout(roleTimeoutRef.current);
      roleTimeoutRef.current = null;
    }
  }, []);

  // Clear session and force re-authentication
  const clearSession = useCallback(() => {
    console.log('🔄 Clearing corrupted session data...');
    
    try {
      // Clear all auth-related storage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-urrydhjchgxnhyggqtzr-auth-token');
      sessionStorage.clear();
      
      // Reset state
      setUser(null);
      setSession(null);
      setUserRole(null);
      setError('Session cleared - please sign in again');
      
      console.log('✅ Session cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  }, []);

  // Fetch user role with aggressive timeout and fallback
  const fetchUserRole = useCallback(async (userId: string): Promise<string> => {
    return new Promise((resolve) => {
      console.log('🔍 Fetching user role for:', userId);
      
      // Set timeout for role fetching
      roleTimeoutRef.current = setTimeout(() => {
        console.warn('⏰ Role fetch timeout, using fallback');
        resolve('inspector');
      }, ROLE_TIMEOUT);

      const fetchRole = async () => {
        try {
          const { data, error } = await supabase.rpc('get_user_role_simple', { 
            _user_id: userId 
          });
          
          if (roleTimeoutRef.current) {
            clearTimeout(roleTimeoutRef.current);
            roleTimeoutRef.current = null;
          }
          
          if (error) {
            console.warn('⚠️ Role fetch failed:', error);
            resolve('inspector');
            return;
          }
          
          const role = data || 'inspector';
          console.log('✅ Role fetched:', role);
          resolve(role);
        } catch (error) {
          console.error('💥 Role fetch error:', error);
          if (roleTimeoutRef.current) {
            clearTimeout(roleTimeoutRef.current);
            roleTimeoutRef.current = null;
          }
          resolve('inspector');
        }
      };

      fetchRole();
    });
  }, []);

  // Initialize authentication with retry logic
  const initializeAuth = useCallback(async (attempt = 1): Promise<void> => {
    if (initializationRef.current) {
      return initializationRef.current;
    }

    console.log(`🔍 Initializing auth (attempt ${attempt}/${MAX_RETRIES + 1})...`);
    setError(null);

    const initPromise = new Promise<void>(async (resolve, reject) => {
      try {
        // Set overall timeout
        timeoutRef.current = setTimeout(() => {
          console.warn(`⏰ Auth initialization timeout (attempt ${attempt})`);
          
          if (attempt <= MAX_RETRIES) {
            // Clear corrupted session and retry
            clearSession();
            setRetryCount(attempt);
            
            setTimeout(() => {
              initializationRef.current = null;
              initializeAuth(attempt + 1).then(resolve).catch(reject);
            }, RETRY_DELAY);
          } else {
            // Max retries reached, continue without auth
            console.error('💥 Max auth retries reached, continuing without authentication');
            setUser(null);
            setSession(null);
            setUserRole(null);
            setError('Authentication timeout - please try signing in manually');
            setLoading(false);
            resolve();
          }
        }, AUTH_TIMEOUT);

        // Try to get existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        clearTimers();
        
        if (error) {
          console.error(`❌ Session error (attempt ${attempt}):`, error);
          throw error;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User found, fetching role...');
          try {
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
            console.log('✅ Auth initialization complete with role:', role);
          } catch (roleError) {
            console.warn('⚠️ Role fetch failed, using fallback:', roleError);
            setUserRole('inspector');
          }
        } else {
          setUserRole(null);
          console.log('👤 No active session found');
        }
        
        setLoading(false);
        setError(null);
        setRetryCount(0);
        resolve();
        
      } catch (error) {
        clearTimers();
        console.error(`💥 Auth initialization error (attempt ${attempt}):`, error);
        
        if (attempt <= MAX_RETRIES) {
          setTimeout(() => {
            initializationRef.current = null;
            initializeAuth(attempt + 1).then(resolve).catch(reject);
          }, RETRY_DELAY);
        } else {
          setUser(null);
          setSession(null);
          setUserRole(null);
          setError(`Authentication failed after ${MAX_RETRIES} attempts`);
          setLoading(false);
          reject(error);
        }
      }
    });

    initializationRef.current = initPromise;
    return initPromise;
  }, [clearSession, fetchUserRole, clearTimers]);

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

  // Enhanced sign in with better error handling
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

  // Enhanced sign up with better error handling
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
      clearTimers();
      setLoading(true);
      setUserRole(null);
      setSession(null);
      setUser(null);
      setError(null);
      
      await supabase.auth.signOut();
      
      // Clear storage
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
  }, [clearTimers, clearSession, toast]);

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
          try {
            const role = await fetchUserRole(session.user.id);
            if (isMounted) {
              setUserRole(role);
            }
          } catch (error) {
            console.error('❌ Role fetch failed during state change:', error);
            if (isMounted) {
              setUserRole('inspector');
            }
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
      clearTimers();
      subscription.unsubscribe();
      initializationRef.current = null;
    };
  }, [initializeAuth, fetchUserRole, clearTimers]);

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
  };

  // Enhanced loading screen with recovery options
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <LoadingSpinner message="Authenticating..." />
          
          {retryCount > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-2">
                Authentication is taking longer than usual...
              </p>
              <p className="text-xs text-yellow-600">
                Retry attempt: {retryCount}/{MAX_RETRIES}
              </p>
            </div>
          )}
          
          {loading && retryCount === 0 && (
            <div className="mt-6">
              <button
                onClick={() => {
                  console.log('🔄 Manual recovery triggered');
                  clearSession();
                  forceRefresh();
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Having trouble? Click here to reset
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
