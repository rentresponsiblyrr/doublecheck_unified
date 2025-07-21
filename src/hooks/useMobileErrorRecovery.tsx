/**
 * Mobile Error Recovery Business Logic Hook
 * Extracted from MobileErrorRecovery.tsx for surgical refactoring
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export interface RecoveryAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  status: 'idle' | 'loading' | 'success' | 'error';
  priority: 'high' | 'medium' | 'low';
}

export const useMobileErrorRecovery = (
  error?: Error | null,
  onRetry?: () => void,
  onReset?: () => void,
  onNavigateHome?: () => void,
  onContactSupport?: () => void
) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check initial connection status
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');

    // Set up connection listeners
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialize recovery actions
    initializeRecoveryActions();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateActionStatus = (actionId: string, status: RecoveryAction['status']) => {
    setRecoveryActions(prev => 
      prev.map(action => 
        action.id === actionId ? { ...action, status } : action
      )
    );
  };

  const handleRefreshPage = useCallback(async () => {
    updateActionStatus('refresh-page', 'loading');
    
    try {
      if (onRetry) {
        await onRetry();
        updateActionStatus('refresh-page', 'success');
        toast({
          title: 'Page Refreshed',
          description: 'The page has been refreshed successfully.',
          duration: 3000,
        });
      } else {
        // Professional fallback navigation
        window.history.pushState(null, '', window.location.pathname);
        navigate(0); // React Router refresh
      }
    } catch (error) {
      updateActionStatus('refresh-page', 'error');
      logger.error('Failed to refresh page', error, 'MOBILE_ERROR_RECOVERY');
    }
  }, [onRetry, toast]);

  const handleCheckConnection = useCallback(async () => {
    updateActionStatus('check-connection', 'loading');
    
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        updateActionStatus('check-connection', 'success');
        setConnectionStatus('online');
        toast({
          title: 'Connection Verified',
          description: 'Your internet connection is working properly.',
          duration: 3000,
        });
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      updateActionStatus('check-connection', 'error');
      setConnectionStatus('offline');
      toast({
        title: 'Connection Issue',
        description: 'Please check your internet connection and try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [toast]);

  const handleClearCache = useCallback(async () => {
    updateActionStatus('clear-cache', 'loading');
    
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB if available
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!);
                deleteReq.onsuccess = () => resolve(void 0);
                deleteReq.onerror = () => reject(deleteReq.error);
              });
            }
          })
        );
      }
      
      updateActionStatus('clear-cache', 'success');
      toast({
        title: 'Cache Cleared',
        description: 'Local storage and cache have been cleared successfully.',
        duration: 3000,
      });
    } catch (error) {
      updateActionStatus('clear-cache', 'error');
      logger.error('Failed to clear cache', error, 'MOBILE_ERROR_RECOVERY');
      toast({
        title: 'Cache Clear Failed',
        description: 'Failed to clear cache. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleRestartCamera = useCallback(async () => {
    updateActionStatus('restart-camera', 'loading');
    
    try {
      // Stop any existing camera streams
      const mediaDevices = navigator.mediaDevices;
      if (mediaDevices && mediaDevices.getUserMedia) {
        // Request camera permission again
        const stream = await mediaDevices.getUserMedia({ video: true });
        
        // Stop the stream immediately (just testing permission)
        stream.getTracks().forEach(track => track.stop());
        
        updateActionStatus('restart-camera', 'success');
        toast({
          title: 'Camera Restarted',
          description: 'Camera permissions and connection have been reset.',
          duration: 3000,
        });
      } else {
        throw new Error('Camera not available');
      }
    } catch (error) {
      updateActionStatus('restart-camera', 'error');
      logger.error('Failed to restart camera', error, 'MOBILE_ERROR_RECOVERY');
      toast({
        title: 'Camera Restart Failed',
        description: 'Failed to restart camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const initializeRecoveryActions = () => {
    const actions: RecoveryAction[] = [
      {
        id: 'refresh-page',
        title: 'Refresh Page',
        description: 'Reload the current page to recover from temporary issues',
        icon: null, // Will be set by component
        action: handleRefreshPage,
        status: 'idle',
        priority: 'high'
      },
      {
        id: 'check-connection',
        title: 'Check Connection',
        description: 'Verify internet connectivity and network status',
        icon: null, // Will be set by component
        action: handleCheckConnection,
        status: 'idle',
        priority: 'high'
      },
      {
        id: 'clear-cache',
        title: 'Clear Cache',
        description: 'Clear local storage and cached data',
        icon: null, // Will be set by component
        action: handleClearCache,
        status: 'idle',
        priority: 'medium'
      },
      {
        id: 'restart-camera',
        title: 'Restart Camera',
        description: 'Reset camera permissions and connection',
        icon: null, // Will be set by component
        action: handleRestartCamera,
        status: 'idle',
        priority: 'medium'
      }
    ];

    setRecoveryActions(actions);
  };

  const handleAutoRecovery = useCallback(async () => {
    setIsRecovering(true);
    
    try {
      logger.info('Starting auto recovery process', { error: error?.message }, 'MOBILE_ERROR_RECOVERY');
      
      // Run high priority recovery actions in sequence
      const highPriorityActions = recoveryActions.filter(action => action.priority === 'high');
      
      for (const action of highPriorityActions) {
        try {
          await action.action();
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between actions
        } catch (actionError) {
          logger.warn(`Recovery action ${action.id} failed`, actionError, 'MOBILE_ERROR_RECOVERY');
        }
      }
      
      toast({
        title: 'Auto Recovery Complete',
        description: 'Automatic recovery process has completed. Please try your action again.',
        duration: 5000,
      });
    } catch (error) {
      logger.error('Auto recovery failed', error, 'MOBILE_ERROR_RECOVERY');
      toast({
        title: 'Auto Recovery Failed',
        description: 'Automatic recovery was unsuccessful. Please try manual steps.',
        variant: 'destructive',
      });
    } finally {
      setIsRecovering(false);
    }
  }, [recoveryActions, error, toast]);

  return {
    isRecovering,
    recoveryActions,
    setRecoveryActions,
    connectionStatus,
    handleAutoRecovery,
    updateActionStatus
  };
};