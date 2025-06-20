
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Maximum wait time for authentication (10 seconds)
  const AUTH_TIMEOUT = 10000;
  const ROLE_TIMEOUT = 5000;

  // Enhanced role fetching with aggressive timeout and fallback
  const fetchUserRole = async (userId: string): Promise<string> => {
    return new Promise((resolve) => {
      // Set a timeout for role fetching
      roleTimeoutRef.current = setTimeout(() => {
        console.warn('⏰ Role fetch timeout, using fallback role');
        resolve('inspector');
      }, ROLE_TIMEOUT);

      const fetchRole = async () => {
        try {
          console.log('🔍 Fetching user role for:', userId);
          
          // First try the optimized function
          const { data, error } = await supabase.rpc('get_user_role_simple', { 
            _user_id: userId 
          });
          
          if (error) {
            console.warn('⚠️ Primary role fetch failed, using fallback:', error);
            // Clear timeout and resolve with fallback
            if (roleTimeoutRef.current) {
              clearTimeout(roleTimeoutRef.current);
              roleTimeoutRef.current = null;
            }
            resolve('inspector');
            return;
          }
          
          // Clear timeout and resolve with fetched role
          if (roleTimeoutRef.current) {
            clearTimeout(roleTimeoutRef.current);
            roleTimeoutRef.current = null;
          }
          
          const role = data || 'inspector';
          console.log('✅ Role fetch successful:', role);
          resolve(role);
        } catch (error) {
          console.error('💥 Role fetch error:', error);
          // Clear timeout and resolve with fallback
          if (roleTimeoutRef.current) {
            clearTimeout(roleTimeoutRef.current);
            roleTimeoutRef.current = null;
          }
          resolve('inspector');
        }
      };

      fetchRole();
    });
  };

  // Cleanup function
  const cleanup = () => {
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
    if (roleTimeoutRef.current) {
      clearTimeout(roleTimeoutRef.current);
      roleTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set overall authentication timeout
    authTimeoutRef.current = setTimeout(() => {
      if (isMounted) {
        console.warn('⏰ Authentication timeout reached, stopping loading state');
        setLoading(false);
      }
    }, AUTH_TIMEOUT);

    const initializeAuth = async () => {
      try {
        console.log('🔍 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
          if (isMounted) {
            setUser(null);
            setUserRole(null);
            setLoading(false);
          }
          cleanup();
          return;
        }
        
        if (!isMounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User found, fetching role...');
          try {
            const role = await fetchUserRole(session.user.id);
            if (isMounted) {
              setUserRole(role);
              console.log('✅ Initial auth setup complete with role:', role);
            }
          } catch (roleError) {
            console.error('❌ Role fetch failed during init:', roleError);
            if (isMounted) {
              setUserRole('inspector'); // Fallback role
            }
          }
        } else {
          if (isMounted) {
            setUserRole(null);
          }
        }
        
        if (isMounted) {
          setLoading(false);
          cleanup();
        }
      } catch (error) {
        console.error('💥 Error during auth initialization:', error);
        if (isMounted) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
        cleanup();
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        // Always update user immediately
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User authenticated in state change, fetching role...');
          try {
            const role = await fetchUserRole(session.user.id);
            if (isMounted) {
              setUserRole(role);
              console.log('✅ Auth state change complete with role:', role);
            }
          } catch (roleError) {
            console.error('❌ Role fetch failed during state change:', roleError);
            if (isMounted) {
              setUserRole('inspector'); // Fallback role
            }
          }
        } else {
          if (isMounted) {
            setUserRole(null);
          }
        }
        
        // Ensure loading state is cleared after auth state change
        if (isMounted) {
          setLoading(false);
          cleanup();
        }
      }
    );

    // Initialize authentication
    initializeAuth();

    return () => {
      isMounted = false;
      cleanup();
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    console.log('📝 Signing up user with email:', email);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    
    if (error) {
      console.error('❌ Signup error:', error);
    } else {
      console.log('✅ Signup successful - role will be assigned automatically');
    }
    
    return { error };
  };

  const signOut = async () => {
    cleanup();
    setUserRole(null);
    await supabase.auth.signOut();
  };

  const value = {
    user,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
  };

  if (loading) {
    console.log('⏳ AuthProvider loading...', { user: !!user, userRole });
    return <LoadingSpinner message="Authenticating..." />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
