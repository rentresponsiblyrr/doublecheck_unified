
import { useState, useEffect } from "react";
import { useAuth } from "@/components/MobileFastAuthProvider";
import { useAuthRecovery } from "@/hooks/useAuthRecovery";

interface AuthDebugInfo {
  authStatus: {
    authenticated: boolean;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    timestamp: string;
    roleSource: 'database' | 'fallback' | 'default';
    loadingState: boolean;
    error?: string;
    recoveryState?: any;
  };
}

export const usePropertyFormAuth = () => {
  const { user, userRole, loading, error } = useAuth();
  const { recoveryState, attemptRecovery, canRecover } = useAuthRecovery();
  const [authDebugInfo, setAuthDebugInfo] = useState<AuthDebugInfo>({} as AuthDebugInfo);

  // Enhanced authentication validation with recovery support
  useEffect(() => {
    console.log('🔍 PropertyFormAuth - Auth state updated:', {
      user: !!user,
      userRole,
      loading,
      error,
      recoveryState,
      timestamp: new Date().toISOString()
    });

    if (loading && !recoveryState.isRecovering) {
      console.log('⏳ Auth still loading...');
      setAuthDebugInfo({
        authStatus: {
          authenticated: false,
          loadingState: loading,
          roleSource: 'default',
          timestamp: new Date().toISOString(),
          error: error || undefined,
          recoveryState
        }
      });
      return;
    }

    if (error && canRecover) {
      console.warn('⚠️ Auth error detected:', error);
      setAuthDebugInfo({
        authStatus: {
          authenticated: false,
          loadingState: loading,
          roleSource: 'default',
          timestamp: new Date().toISOString(),
          error,
          recoveryState
        }
      });
      return;
    }

    if (!user && !loading) {
      console.warn('⚠️ User not authenticated');
      setAuthDebugInfo({
        authStatus: {
          authenticated: false,
          loadingState: loading,
          roleSource: 'default',
          timestamp: new Date().toISOString(),
          error: error || undefined,
          recoveryState
        }
      });
      return;
    }

    // Determine role source for debugging
    const roleSource = userRole === 'inspector' ? 'fallback' : 'database';

    console.log('👤 Enhanced Auth Status:', {
      user: {
        id: user?.id,
        email: user?.email,
        role: userRole,
        roleSource,
        loading,
        error
      },
      recoveryState,
      timestamp: new Date().toISOString()
    });

    setAuthDebugInfo({
      authStatus: {
        authenticated: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userRole: userRole || 'inspector',
        roleSource,
        loadingState: loading,
        timestamp: new Date().toISOString(),
        error: error || undefined,
        recoveryState
      }
    });
  }, [user, userRole, loading, error, recoveryState, canRecover]);

  return {
    user,
    userRole,
    loading,
    error,
    authDebugInfo,
    recoveryState,
    attemptRecovery,
    canRecover
  };
};
