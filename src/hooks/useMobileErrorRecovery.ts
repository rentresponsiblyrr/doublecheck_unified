
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMobileAuth } from '@/hooks/useMobileAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface ErrorRecoveryState {
  errorCount: number;
  lastErrorTime: Date | null;
  recoveryInProgress: boolean;
  errorHistory: Array<{
    error: string;
    timestamp: Date;
    context: string;
    recovered: boolean;
  }>;
}

interface RecoveryStrategy {
  name: string;
  description: string;
  action: () => Promise<boolean>;
  priority: number;
}

export interface RecoveryAction {
  id: string;
  title: string;
  description: string;
  action: () => void;
  status: 'pending' | 'loading' | 'success' | 'error';
}

export const useMobileErrorRecovery = (
  error?: Error | null,
  onRetry?: () => void,
  onReset?: () => void,
  onNavigateHome?: () => void,
  onContactSupport?: () => void
) => {
  const [recoveryState, setRecoveryState] = useState<ErrorRecoveryState>({
    errorCount: 0,
    lastErrorTime: null,
    recoveryInProgress: false,
    errorHistory: []
  });

  const { forceRefresh, clearSession } = useMobileAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isOnline = useNetworkStatus();

  // Recovery strategies ordered by priority
  const getRecoveryStrategies = useCallback((): RecoveryStrategy[] => [
    {
      name: 'network-check',
      description: 'Check network connectivity',
      priority: 1,
      action: async () => {
        if (!isOnline) {
          toast({
            title: "Network Issue",
            description: "Please check your internet connection.",
            variant: "destructive",
          });
          return false;
        }
        return true;
      }
    },
    {
      name: 'auth-refresh',
      description: 'Refresh authentication',
      priority: 2,
      action: async () => {
        try {
          await forceRefresh();
          toast({
            title: "Session Refreshed",
            description: "Authentication has been refreshed.",
          });
          return true;
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'cache-clear',
      description: 'Clear local cache',
      priority: 3,
      action: async () => {
        try {
          // Clear various caches
          localStorage.removeItem('doublecheck_cached_properties');
          localStorage.removeItem('doublecheck_cached_inspections');
          
          // Clear browser cache if available
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          }
          
          toast({
            title: "Cache Cleared",
            description: "Local cache has been cleared.",
          });
          return true;
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'session-reset',
      description: 'Reset user session',
      priority: 4,
      action: async () => {
        try {
          clearSession();
          navigate('/', { replace: true });
          
          toast({
            title: "Session Reset",
            description: "Please sign in again.",
          });
          return true;
        } catch (error) {
          return false;
        }
      }
    },
    {
      name: 'page-reload',
      description: 'Reload the application',
      priority: 5,
      action: async () => {
        // NUCLEAR REMOVED: window.location.replace('/');
        return true;
      }
    }
  ], [isOnline, forceRefresh, clearSession, navigate, toast]);

  const recordError = useCallback((error: string, context: string) => {
    const errorRecord = {
      error,
      timestamp: new Date(),
      context,
      recovered: false
    };

    setRecoveryState(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1,
      lastErrorTime: new Date(),
      errorHistory: [...prev.errorHistory.slice(-9), errorRecord] // Keep last 10 errors
    }));

  }, []);

  const attemptRecovery = useCallback(async (context: string = 'unknown') => {
    if (recoveryState.recoveryInProgress) {
      return false;
    }

    
    setRecoveryState(prev => ({ ...prev, recoveryInProgress: true }));

    const strategies = getRecoveryStrategies();
    let recoverySuccessful = false;

    for (const strategy of strategies) {
      try {
        
        const success = await strategy.action();
        
        if (success) {
          recoverySuccessful = true;
          break;
        }
      } catch (error) {
      }
      
      // Wait between strategies to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Mark last error as recovered if successful
    if (recoverySuccessful) {
      setRecoveryState(prev => ({
        ...prev,
        recoveryInProgress: false,
        errorHistory: prev.errorHistory.map((record, index) => 
          index === prev.errorHistory.length - 1 
            ? { ...record, recovered: true }
            : record
        )
      }));
    } else {
      setRecoveryState(prev => ({ ...prev, recoveryInProgress: false }));
    }

    return recoverySuccessful;
  }, [recoveryState.recoveryInProgress, getRecoveryStrategies]);

  // Auto-recovery for frequent errors
  useEffect(() => {
    if (recoveryState.errorCount >= 3 && !recoveryState.recoveryInProgress) {
      const timeSinceLastError = recoveryState.lastErrorTime 
        ? Date.now() - recoveryState.lastErrorTime.getTime()
        : Infinity;
      
      // Auto-recover if errors are frequent (within 30 seconds)
      if (timeSinceLastError < 30000) {
        setTimeout(() => {
          attemptRecovery('auto-recovery');
        }, 2000);
      }
    }
  }, [recoveryState.errorCount, recoveryState.lastErrorTime, recoveryState.recoveryInProgress, attemptRecovery]);

  const getRecoveryStats = useCallback(() => ({
    totalErrors: recoveryState.errorCount,
    recentErrors: recoveryState.errorHistory.filter(
      record => Date.now() - record.timestamp.getTime() < 300000 // Last 5 minutes
    ).length,
    recoveryRate: recoveryState.errorHistory.length > 0 
      ? recoveryState.errorHistory.filter(r => r.recovered).length / recoveryState.errorHistory.length 
      : 0,
    isRecovering: recoveryState.recoveryInProgress,
    lastErrorAge: recoveryState.lastErrorTime 
      ? Date.now() - recoveryState.lastErrorTime.getTime() 
      : null
  }), [recoveryState]);

  const resetErrorCount = useCallback(() => {
    setRecoveryState(prev => ({
      ...prev,
      errorCount: 0,
      errorHistory: []
    }));
  }, []);

  // Create recovery actions for the UI
  const recoveryActions: RecoveryAction[] = [
    {
      id: 'refresh-page',
      title: 'Refresh Page',
      description: 'Reload the current page to clear temporary issues',
      action: () => {
        if (onRetry) {
          onRetry();
        } else {
          window.location.reload();
        }
      },
      status: 'pending'
    },
    {
      id: 'check-connection',
      title: 'Check Connection',
      description: 'Verify your internet connection is working',
      action: () => {
        // Simple connection test
        fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
          .then(() => {
            toast({
              title: "Connection OK",
              description: "Your internet connection is working."
            });
          })
          .catch(() => {
            toast({
              title: "Connection Issue",
              description: "Please check your internet connection.",
              variant: "destructive"
            });
          });
      },
      status: 'pending'
    },
    {
      id: 'clear-cache',
      title: 'Clear Cache',
      description: 'Clear browser cache and restart session',
      action: () => {
        if (onReset) {
          onReset();
        } else {
          clearSession();
        }
      },
      status: 'pending'
    }
  ];

  const handleAutoRecovery = useCallback(() => {
    attemptRecovery();
  }, [attemptRecovery]);

  return {
    recordError,
    attemptRecovery,
    getRecoveryStats,
    resetErrorCount,
    isRecovering: recoveryState.recoveryInProgress,
    recoveryActions,
    connectionStatus: isOnline ? 'connected' : 'disconnected',
    handleAutoRecovery
  };
};
