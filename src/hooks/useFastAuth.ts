
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/FastAuthProvider";

interface FastAuthDebugInfo {
  authStatus: {
    authenticated: boolean;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    timestamp: string;
    roleSource: 'cached' | 'fresh' | 'default';
    loadingState: boolean;
    error?: string;
  };
}

export const useFastAuth = () => {
  const { user, userRole, loading, error, loadUserRole } = useAuth();
  const [authDebugInfo, setAuthDebugInfo] = useState<FastAuthDebugInfo>({} as FastAuthDebugInfo);

  // Simplified authentication validation
  useEffect(() => {
    console.log('🔍 FastAuth - Auth state updated:', {
      user: !!user,
      userRole,
      loading,
      error,
      timestamp: new Date().toISOString()
    });

    if (loading) {
      console.log('⏳ Auth loading...');
      setAuthDebugInfo({
        authStatus: {
          authenticated: false,
          loadingState: loading,
          roleSource: 'default',
          timestamp: new Date().toISOString(),
          error: error || undefined
        }
      });
      return;
    }

    if (!user && !loading) {
      console.log('⚠️ User not authenticated');
      setAuthDebugInfo({
        authStatus: {
          authenticated: false,
          loadingState: loading,
          roleSource: 'default',
          timestamp: new Date().toISOString(),
          error: error || undefined
        }
      });
      return;
    }

    // Determine role source
    const roleSource = userRole ? 'cached' : 'default';

    console.log('👤 Fast Auth Status:', {
      user: {
        id: user?.id,
        email: user?.email,
        role: userRole,
        roleSource,
        loading,
        error
      },
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
        error: error || undefined
      }
    });
  }, [user, userRole, loading, error]);

  return {
    user,
    userRole,
    loading,
    error,
    authDebugInfo,
    loadUserRole
  };
};
