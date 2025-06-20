
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
  };
}

export const usePropertyFormAuth = () => {
  const { user, userRole } = useAuth();
  const [authDebugInfo, setAuthDebugInfo] = useState<AuthDebugInfo>({} as AuthDebugInfo);

  // Enhanced authentication validation with role source tracking
  useEffect(() => {
    if (!user) {
      console.warn('⚠️ User not authenticated');
      return;
    }

    // Determine role source for debugging
    const roleSource = userRole === 'inspector' ? 'default' : 'database';

    console.log('👤 Enhanced Auth Status:', {
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
        roleSource
      },
      timestamp: new Date().toISOString()
    });

    setAuthDebugInfo({
      authStatus: {
        authenticated: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userRole,
        roleSource,
        timestamp: new Date().toISOString()
      }
    });
  }, [user, userRole]);

  return {
    user,
    userRole,
    authDebugInfo
  };
};
