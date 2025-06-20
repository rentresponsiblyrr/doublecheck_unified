
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

interface AuthDebugInfo {
  authStatus: {
    authenticated: boolean;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    timestamp: string;
  };
}

export const usePropertyFormAuth = () => {
  const { user, userRole } = useAuth();
  const [authDebugInfo, setAuthDebugInfo] = useState<AuthDebugInfo>({} as AuthDebugInfo);

  // Enhanced authentication validation
  useEffect(() => {
    if (!user) {
      console.warn('⚠️ User not authenticated, redirecting to login');
      return;
    }

    console.log('👤 Auth Status:', {
      user: {
        id: user.id,
        email: user.email,
        role: userRole
      },
      timestamp: new Date().toISOString()
    });

    setAuthDebugInfo({
      authStatus: {
        authenticated: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userRole,
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
