
import React, { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/contexts/AuthContext';
import { MobileAuthLoading } from '@/components/MobileAuthLoading';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthInitialization } from '@/hooks/useAuthInitialization';
import { useAuthStateListener } from '@/hooks/useAuthStateListener';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authState = useAuthState();
  const { initializeAuth } = useAuthInitialization(authState);
  
  useAuthStateListener({
    ...authState,
    initializeAuth
  });

  const value: AuthContextType = {
    user: authState.user,
    userRole: authState.userRole,
    loading: authState.loading,
    error: authState.error,
    signIn: authState.handleSignIn,
    signUp: authState.handleSignUp,
    signOut: authState.handleSignOut,
    forceRefresh: authState.forceRefresh,
    clearSession: authState.handleClearSession,
    loadUserRole: authState.loadUserRole,
  };

  // Mobile-optimized loading screen
  if (authState.loading) {
    return <MobileAuthLoading onRefresh={() => {
      authState.handleClearSession();
      authState.forceRefresh();
    }} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
