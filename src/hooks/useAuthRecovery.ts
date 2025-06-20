
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";

interface AuthRecoveryState {
  isRecovering: boolean;
  lastRecoveryAttempt: Date | null;
  recoveryAttempts: number;
  connectionStatus: 'online' | 'offline' | 'checking';
}

export const useAuthRecovery = () => {
  const { user, userRole, loading, error, forceRefresh, clearSession } = useAuth();
  const { toast } = useToast();
  
  const [recoveryState, setRecoveryState] = useState<AuthRecoveryState>({
    isRecovering: false,
    lastRecoveryAttempt: null,
    recoveryAttempts: 0,
    connectionStatus: 'checking'
  });

  // Check network connectivity
  const checkConnection = useCallback(async () => {
    try {
      setRecoveryState(prev => ({ ...prev, connectionStatus: 'checking' }));
      
      // Simple connectivity check
      const response = await fetch('https://urrydhjchgxnhyggqtzr.supabase.co/rest/v1/', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      
      setRecoveryState(prev => ({ ...prev, connectionStatus: 'online' }));
      return true;
    } catch (error) {
      console.warn('🌐 Connection check failed:', error);
      setRecoveryState(prev => ({ ...prev, connectionStatus: 'offline' }));
      return false;
    }
  }, []);

  // Automatic recovery for stuck loading states
  const attemptRecovery = useCallback(async () => {
    console.log('🔧 Attempting auth recovery...');
    
    setRecoveryState(prev => ({
      ...prev,
      isRecovering: true,
      lastRecoveryAttempt: new Date(),
      recoveryAttempts: prev.recoveryAttempts + 1
    }));

    try {
      // Check connection first
      const isOnline = await checkConnection();
      
      if (!isOnline) {
        toast({
          title: "Connection Issue",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
        return false;
      }

      // Clear potentially corrupted session
      clearSession();
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force refresh
      await forceRefresh();
      
      toast({
        title: "Recovery Successful",
        description: "Authentication has been restored.",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Recovery failed:', error);
      toast({
        title: "Recovery Failed",
        description: "Manual sign-in may be required.",
        variant: "destructive",
      });
      return false;
    } finally {
      setRecoveryState(prev => ({ ...prev, isRecovering: false }));
    }
  }, [checkConnection, clearSession, forceRefresh, toast]);

  // Auto-recovery for prolonged loading states
  useEffect(() => {
    if (loading && !recoveryState.isRecovering) {
      const timer = setTimeout(() => {
        console.log('⏰ Prolonged loading detected, attempting recovery...');
        attemptRecovery();
      }, 15000); // Auto-recover after 15 seconds

      return () => clearTimeout(timer);
    }
  }, [loading, recoveryState.isRecovering, attemptRecovery]);

  // Monitor for error states
  useEffect(() => {
    if (error && !recoveryState.isRecovering && recoveryState.recoveryAttempts < 3) {
      console.log('💥 Error detected, scheduling recovery...');
      const timer = setTimeout(attemptRecovery, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, recoveryState.isRecovering, recoveryState.recoveryAttempts, attemptRecovery]);

  // Initial connection check
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    recoveryState,
    attemptRecovery,
    checkConnection,
    canRecover: recoveryState.recoveryAttempts < 3 && !recoveryState.isRecovering
  };
};
