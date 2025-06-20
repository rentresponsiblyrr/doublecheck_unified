
import React, { createContext, useContext, useEffect, useState } from 'react';
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

  // Enhanced role fetching with fallback strategy
  const fetchUserRole = async (userId: string): Promise<string> => {
    try {
      console.log('🔍 Fetching user role for:', userId);
      
      // First try the optimized function with shorter timeout
      const { data, error } = await supabase.rpc('get_user_role_simple', { 
        _user_id: userId 
      });
      
      if (error) {
        console.warn('⚠️ Primary role fetch failed, using fallback:', error);
        // Fallback: direct query with minimal timeout
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .limit(1)
          .single();
        
        if (fallbackError) {
          console.warn('⚠️ Fallback role fetch failed, using default:', fallbackError);
          return 'inspector'; // Final fallback
        }
        
        console.log('✅ Fallback role fetch successful:', fallbackData.role);
        return fallbackData.role;
      }
      
      console.log('✅ Primary role fetch successful:', data);
      return data || 'inspector';
    } catch (error) {
      console.error('💥 Role fetch completely failed:', error);
      return 'inspector'; // Always return a valid role
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Get initial session with improved error handling
    const getSession = async () => {
      try {
        console.log('🔍 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
        if (!isMounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User found, fetching role...');
          const role = await fetchUserRole(session.user.id);
          if (isMounted) {
            setUserRole(role);
          }
        }
        
        if (isMounted) {
          console.log('✅ Initial session setup complete');
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Error getting initial session:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    // Listen for auth changes with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User authenticated, fetching role...');
          const role = await fetchUserRole(session.user.id);
          if (isMounted) {
            setUserRole(role);
          }
        } else {
          if (isMounted) {
            setUserRole(null);
          }
        }
        
        if (isMounted) {
          console.log('✅ Auth state change complete');
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
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
    console.log('⏳ AuthProvider still loading...');
    return <LoadingSpinner />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
