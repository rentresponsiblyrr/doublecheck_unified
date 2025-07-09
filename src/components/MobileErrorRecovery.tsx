
import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface MobileErrorRecoveryProps {
  error: Error | string;
  onRetry: () => void;
  onNavigateHome: () => void;
  context?: string;
  showOfflineMode?: boolean;
}

export const MobileErrorRecovery: React.FC<MobileErrorRecoveryProps> = ({
  error,
  onRetry,
  onNavigateHome,
  context = 'operation',
  showOfflineMode = true
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const isOnline = useNetworkStatus();
  const maxRetries = 3;

  const errorMessage = error instanceof Error ? error.message : error;
  const canRetry = retryCount < maxRetries;

  // Auto-retry on network reconnection
  useEffect(() => {
    if (isOnline && retryCount > 0 && canRetry) {
      console.log('📱 Network reconnected, auto-retrying...');
      setTimeout(() => {
        handleRetry();
      }, 1000);
    }
  }, [isOnline, retryCount, canRetry, handleRetry]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    onRetry();
  }, [onRetry]);

  const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                        errorMessage.toLowerCase().includes('fetch') ||
                        !isOnline;

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-sm w-full">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          
          <CardTitle className="text-lg text-gray-900">
            {context} Failed
          </CardTitle>
          
          {/* Network Status */}
          <div className={`flex items-center justify-center gap-2 px-3 py-1 rounded-full text-xs ${
            isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700 text-sm">
              {errorMessage}
            </AlertDescription>
          </Alert>

          {/* Retry Status */}
          {maxRetries > 1 && (
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Attempt {retryCount + 1} of {maxRetries + 1}</span>
              <div className="flex gap-1">
                {Array.from({ length: maxRetries + 1 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i <= retryCount 
                        ? i === retryCount && !canRetry
                          ? 'bg-red-400'
                          : 'bg-blue-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mobile Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Quick fixes:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              {isNetworkError ? (
                <>
                  <li>• Check your mobile data or WiFi</li>
                  <li>• Move to an area with better signal</li>
                  <li>• Try switching between WiFi and mobile data</li>
                </>
              ) : (
                <>
                  <li>• Close and reopen the app</li>
                  <li>• Clear browser cache</li>
                  <li>• Try again in a few moments</li>
                </>
              )}
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {canRetry && (
              <Button
                onClick={handleRetry}
                className="w-full"
                disabled={!isOnline && isNetworkError}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {!isOnline && isNetworkError ? 'Waiting for connection...' : `Try Again (${maxRetries - retryCount} left)`}
              </Button>
            )}
            
            <Button
              onClick={onNavigateHome}
              variant="outline"
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Properties
            </Button>
          </div>

          {/* Offline Mode Info */}
          {showOfflineMode && !isOnline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                📱 Some features work offline. Photos can be saved locally and will sync when reconnected.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
