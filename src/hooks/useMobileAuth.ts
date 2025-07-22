
import { useAuth } from '@/hooks/useAuth';

export const useMobileAuth = () => {
  const authContext = useAuth();
  
  if (!authContext) {
    return {
      user: null,
      userRole: null,
      loading: true,
      error: null,
      isAuthenticated: false,
      signIn: async () => ({ error: new Error('Auth not available') }),
      signUp: async () => ({ error: new Error('Auth not available') }),
      signOut: async () => {},
      forceRefresh: async () => {},
      clearSession: () => {},
      loadUserRole: async () => 'inspector' as const,
    };
  }
  
  return {
    user: authContext.user,
    userRole: authContext.userRole,
    loading: authContext.loading,
    error: authContext.error,
    isAuthenticated: !!authContext.user,
    signIn: authContext.signIn,
    signUp: authContext.signUp,
    signOut: authContext.signOut,
    forceRefresh: authContext.forceRefresh,
    clearSession: authContext.clearSession,
    loadUserRole: authContext.loadUserRole,
  };
};
