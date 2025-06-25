
import { useAuth } from '@/components/AuthProvider';

export const useFastAuth = () => {
  const authContext = useAuth();
  
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
    authDebugInfo: {
      hasUser: !!authContext.user,
      hasRole: !!authContext.userRole,
      isLoading: authContext.loading,
      hasError: !!authContext.error
    }
  };
};
