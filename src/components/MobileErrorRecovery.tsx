import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Database, 
  Camera,
  Home,
  Phone,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface MobileErrorRecoveryProps {
  error?: Error | null;
  errorInfo?: string;
  onRetry?: () => void;
  onReset?: () => void;
  onNavigateHome?: () => void;
  onContactSupport?: () => void;
  className?: string;
}

interface RecoveryAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  status: 'idle' | 'loading' | 'success' | 'error';
  priority: 'high' | 'medium' | 'low';
}

const MobileErrorRecovery: React.FC<MobileErrorRecoveryProps> = ({
  error,
  errorInfo,
  onRetry,
  onReset,
  onNavigateHome,
  onContactSupport,
  className = ''
}) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryActions, setRecoveryActions] = useState<RecoveryAction[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');
  const { toast } = useToast();

  React.useEffect(() => {
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

  const initializeRecoveryActions = () => {
    const actions: RecoveryAction[] = [
      {
        id: 'refresh-page',
        title: 'Refresh Page',
        description: 'Reload the current page to recover from temporary issues',
        icon: <RefreshCw className="w-4 h-4" />,
        action: handleRefreshPage,
        status: 'idle',
        priority: 'high'
      },
      {
        id: 'check-connection',
        title: 'Check Connection',
        description: 'Verify internet connectivity and network status',
        icon: <Wifi className="w-4 h-4" />,
        action: handleCheckConnection,
        status: 'idle',
        priority: 'high'
      },
      {
        id: 'clear-cache',
        title: 'Clear Cache',
        description: 'Clear local storage and cached data',
        icon: <Database className="w-4 h-4" />,
        action: handleClearCache,
        status: 'idle',
        priority: 'medium'
      },
      {
        id: 'restart-camera',
        title: 'Restart Camera',
        description: 'Reset camera permissions and connection',
        icon: <Camera className="w-4 h-4" />,
        action: handleRestartCamera,
        status: 'idle',
        priority: 'medium'
      }
    ];

    setRecoveryActions(actions);
  };

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
        window.location.reload();
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

  const getStatusIcon = (status: RecoveryAction['status']) => {
    switch (status) {
      case 'loading':
        return <LoadingSpinner className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">DoubleCheck</h1>
            <p className="text-sm text-gray-600 mt-1">Mobile Error Recovery</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6">
        {/* Error Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {error.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>
            )}
            
            {errorInfo && (
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <strong>Additional Information:</strong>
                <pre className="mt-2 whitespace-pre-wrap text-xs">{errorInfo}</pre>
              </div>
            )}

            {/* Connection Status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {connectionStatus === 'online' ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Connection Status</span>
              </div>
              <Badge variant={connectionStatus === 'online' ? 'default' : 'destructive'}>
                {connectionStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Auto Recovery */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Quick Recovery</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleAutoRecovery}
              disabled={isRecovering}
              className="w-full"
              variant="default"
            >
              {isRecovering ? (
                <>
                  <LoadingSpinner className="w-4 h-4 mr-2" />
                  Running Auto Recovery...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Auto Recovery
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Recovery Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Manual Recovery Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recoveryActions.map((action, index) => (
              <div key={action.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{action.title}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(action.status)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={action.action}
                      disabled={action.status === 'loading'}
                    >
                      {action.status === 'loading' ? 'Running...' : 'Try'}
                    </Button>
                  </div>
                </div>
                {index < recoveryActions.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Navigation Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={onNavigateHome || (() => window.location.href = '/')}
              variant="outline"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
            
            <Button 
              onClick={onContactSupport || (() => window.location.href = 'tel:+1-555-STR-CERT')}
              variant="outline"
              className="w-full"
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
            
            {onReset && (
              <Button 
                onClick={onReset}
                variant="destructive"
                className="w-full"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Reset Application
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>If the problem persists, please contact our support team.</p>
          <p className="mt-1">Error ID: {error ? btoa(error.message).slice(0, 8) : 'UNKNOWN'}</p>
        </div>
      </div>
    </div>
  );
};

export default MobileErrorRecovery;
export { MobileErrorRecovery };