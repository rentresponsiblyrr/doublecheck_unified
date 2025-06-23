
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/MobileFastAuthProvider";

interface MobileAuthState {
  user: any;
  userRole: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  loadUserRole: () => Promise<void>;
}

export const useMobileAuth = (): MobileAuthState => {
  const { user, userRole, loading, error, loadUserRole } = useAuth();
  
  // Single source of truth for authentication state
  const isAuthenticated = !!user && !loading;

  console.log('📱 Mobile Auth State:', {
    hasUser: !!user,
    userRole,
    loading,
    isAuthenticated,
    timestamp: new Date().toISOString()
  });

  return {
    user,
    userRole,
    loading,
    error,
    isAuthenticated,
    loadUserRole
  };
};
