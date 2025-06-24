
import { useAuth } from '@/components/MobileFastAuthProvider';

export const useMobileAuth = () => {
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
  };
};
