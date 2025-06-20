
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

interface AuthDebugInfo {
  authStatus: {
    authenticated: boolean;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    timestamp: string;
    roleSource: 'database' | 'fallback' | 'default';
    loadingState: boolean;
  };
}

export const usePropertyFormAuth = () => {
  const { user, userRole, loading } = useAuth();
  const [authDebugInfo, setAuthDebugInfo] = useState<AuthDebugInfo>({} as AuthDebugInfo);

  // Enhanced authentication validation with loading state tracking
  useEffect(() => {
    console.log('🔍 PropertyFormAuth - Auth state updated:', {
      user: !!user,
      userRole,
      loading,
      timestamp: new Date().toISOString()
    });

    if (loading) {
      console.log('⏳ Auth still loading...');
      return;
    }

    if (!user) {
      console.warn('⚠️ User not authenticated');
      setAuthDebugInfo({
        authStatus: {
          authenticated: false,
          loadingState: loading,
          roleSource: 'default',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Determine role source for debugging
    const roleSource = userRole === 'inspector' ? 'fallback' : 'database';

    console.log('👤 Enhanced Auth Status:', {
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
        roleSource,
        loading
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
        timestamp: new Date().toISOString()
      }
    });
  }, [user, userRole, loading]);

  return {
    user,
    userRole,
    loading,
    authDebugInfo
  };
};
