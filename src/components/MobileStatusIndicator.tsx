
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Battery, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useEnhancedOfflineStorage } from '@/hooks/useEnhancedOfflineStorage';
import { useMobileErrorRecovery } from '@/hooks/useMobileErrorRecovery';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useMobileAuth } from '@/hooks/useMobileAuth';

export const MobileStatusIndicator: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isOnline = useNetworkStatus();
  const { getStorageStats, syncOfflinePhotos, forceRetryFailed } = useEnhancedOfflineStorage();
  const { getRecoveryStats, attemptRecovery, resetErrorCount } = useMobileErrorRecovery();
  const { metrics, isVisible } = usePerformanceMonitoring();
  const { user, userRole } = useMobileAuth();

  // Only show to authenticated users
  if (!user || !isVisible) return null;

  const storageStats = getStorageStats();
  const recoveryStats = getRecoveryStats();

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (recoveryStats.recentErrors > 0) return 'bg-yellow-500';
    if (storageStats.pendingCount > 0) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (recoveryStats.recentErrors > 0) return 'Issues Detected';
    if (storageStats.pendingCount > 0) return 'Syncing';
    return 'All Good';
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-4 md:w-80">
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                  <CardTitle className="text-sm font-medium">
                    Mobile Status
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {getStatusText()}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
              
              {/* Quick status indicators */}
              {!isExpanded && (
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    {isOnline ? (
                      <Wifi className="w-3 h-3 text-green-600" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-600" />
                    )}
                    <span>{isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  
                  {storageStats.pendingCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span>{storageStats.pendingCount} pending</span>
                    </div>
                  )}
                  
                  {recoveryStats.recentErrors > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-yellow-600" />
                      <span>{recoveryStats.recentErrors} errors</span>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Network Status */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-600" />
                  )}
                  Network
                </h4>
                <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                  <div>Status: {isOnline ? 'Connected' : 'Disconnected'}</div>
                  <div>Type: {metrics.networkStatus}</div>
                </div>
              </div>

              {/* Storage Status */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  Storage
                </h4>
                <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                  <div>Pending: {storageStats.pendingCount}</div>
                  <div>Failed: {storageStats.failedCount}</div>
                  <div>Size: {storageStats.storageUsageMB}MB</div>
                  <div>Last sync: {storageStats.lastSyncAttempt ? 'Recently' : 'Never'}</div>
                </div>
                
                {(storageStats.pendingCount > 0 || storageStats.failedCount > 0) && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={syncOfflinePhotos}
                      disabled={!isOnline}
                      className="flex-1 h-7 text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Sync Now
                    </Button>
                    
                    {storageStats.failedCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={forceRetryFailed}
                        className="flex-1 h-7 text-xs"
                      >
                        Retry Failed
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Error Recovery */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  {recoveryStats.recentErrors > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  Recovery
                </h4>
                <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                  <div>Total errors: {recoveryStats.totalErrors}</div>
                  <div>Recent: {recoveryStats.recentErrors}</div>
                  <div>Recovery rate: {(recoveryStats.recoveryRate * 100).toFixed(0)}%</div>
                  <div>Status: {recoveryStats.isRecovering ? 'Recovering' : 'Ready'}</div>
                </div>
                
                {(recoveryStats.recentErrors > 0 || recoveryStats.totalErrors > 0) && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => attemptRecovery('manual')}
                      disabled={recoveryStats.isRecovering}
                      className="flex-1 h-7 text-xs"
                    >
                      {recoveryStats.isRecovering ? 'Recovering...' : 'Force Recovery'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetErrorCount}
                      className="flex-1 h-7 text-xs"
                    >
                      Reset Count
                    </Button>
                  </div>
                )}
              </div>

              {/* Performance */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Battery className="w-4 h-4 text-purple-600" />
                  Performance
                </h4>
                <div className="text-xs text-gray-600 grid grid-cols-2 gap-2">
                  <div>Load time: {metrics.loadTime}ms</div>
                  <div>Memory: {metrics.memoryUsage}%</div>
                  <div>DB response: {metrics.dbResponseTime}ms</div>
                  <div>Cache rate: {metrics.cacheHitRate}%</div>
                </div>
              </div>

              {/* User Info */}
              <div className="pt-2 border-t text-xs text-gray-500 flex justify-between">
                <span>Role: {userRole}</span>
                <span>Mobile Optimized</span>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};
