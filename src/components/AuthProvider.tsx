
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

  // Function to fetch user role with error handling and timeout
  const fetchUserRole = async (userId: string): Promise<string | null> => {
    try {
      console.log('🔍 Fetching user role for:', userId);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Role fetch timeout')), 10000); // 10 second timeout
      });

      // Race the actual fetch against the timeout
      const fetchPromise = supabase.rpc('get_user_roles', { 
        _user_id: userId 
      });

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (error) {
        console.error('❌ Error fetching user role:', error);
        return 'inspector'; // Default fallback role
      }
      
      console.log('✅ User roles fetched:', data);
      // Return the first role if multiple exist, or default to inspector
      return data && data.length > 0 ? data[0] : 'inspector';
    } catch (error) {
      console.error('💥 Error in fetchUserRole:', error);
      return 'inspector'; // Default fallback role
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const getSession = async () => {
      try {
        console.log('🔍 Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        
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
          setLoading(false); // Always resolve loading state
        }
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 User authenticated, fetching role...');
          // Fetch role for the user
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
          setLoading(false); // Always resolve loading state
        }
      }
    );

    // Cleanup function
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
