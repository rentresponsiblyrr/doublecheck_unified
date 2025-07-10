/**
 * Offline Indicator Component for STR Certified
 * Shows network status and offline mode notifications
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  WifiOff, 
  Wifi, 
  Signal, 
  SignalLow, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OfflineIndicatorProps {
  showWhenOnline?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Displays current network status and provides retry options
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  showWhenOnline = false,
  className = '',
  compact = false
}) => {
  const { 
    isOnline, 
    isSlowConnection, 
    effectiveType, 
    wasOffline, 
    reconnectedAt,
    retryConnection,
    getConnectionQuality 
  } = useNetworkStatus();

  const [isRetrying, setIsRetrying] = React.useState(false);
  const quality = getConnectionQuality();

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryConnection();
    } finally {
      setIsRetrying(false);
    }
  };

  // Don't show anything if online and showWhenOnline is false
  if (isOnline && !showWhenOnline && !wasOffline) {
    return null;
  }

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    
    if (isSlowConnection) {
      return <SignalLow className="h-4 w-4" />;
    }
    
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'destructive';
    if (isSlowConnection) return 'default';
    return 'default';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSlowConnection) return `Slow (${effectiveType})`;
    return `Online (${effectiveType})`;
  };

  // Compact version for header/navbar
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge variant={getStatusColor()} className="flex items-center space-x-1">
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusText()}</span>
        </Badge>
        
        {!isOnline && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    );
  }

  // Full alert version
  if (!isOnline) {
    return (
      <Alert variant="destructive" className={className}>
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>You're currently offline.</strong>
            <br />
            Some features may not be available. Changes will be saved locally and synced when connection is restored.
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
            className="ml-4"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show reconnection notification
  if (wasOffline && reconnectedAt) {
    const timeAgo = Math.floor((Date.now() - reconnectedAt.getTime()) / 1000);
    
    if (timeAgo < 10) { // Show for 10 seconds after reconnection
      return (
        <Alert className={`border-green-200 bg-green-50 text-green-800 ${className}`}>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Connection restored!</strong> You're back online. Any pending changes are being synced.
          </AlertDescription>
        </Alert>
      );
    }
  }

  // Show slow connection warning
  if (isSlowConnection) {
    return (
      <Alert variant="default" className={`border-yellow-200 bg-yellow-50 text-yellow-800 ${className}`}>
        <SignalLow className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <strong>Slow connection detected.</strong> Some features may take longer to load.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

/**
 * Simple network status indicator for headers/toolbars
 */
export const NetworkStatusBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return <OfflineIndicator compact showWhenOnline className={className} />;
};

/**
 * Connection quality indicator
 */
export const ConnectionQualityIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { getConnectionQuality, effectiveType, isOnline } = useNetworkStatus();
  const quality = getConnectionQuality();

  if (!isOnline) {
    return (
      <div className={`flex items-center space-x-1 text-red-600 ${className}`}>
        <WifiOff className="h-4 w-4" />
        <span className="text-sm">Offline</span>
      </div>
    );
  }

  const getQualityIcon = () => {
    switch (quality) {
      case 'good':
        return <Signal className="h-4 w-4 text-green-600" />;
      case 'poor':
        return <SignalLow className="h-4 w-4 text-yellow-600" />;
      default:
        return <WifiOff className="h-4 w-4 text-red-600" />;
    }
  };

  const getQualityColor = () => {
    switch (quality) {
      case 'good':
        return 'text-green-600';
      case 'poor':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${getQualityColor()} ${className}`}>
      {getQualityIcon()}
      <span className="text-sm capitalize">{quality} ({effectiveType})</span>
    </div>
  );
};

export default OfflineIndicator;