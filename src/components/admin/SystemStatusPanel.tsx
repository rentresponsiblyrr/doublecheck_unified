/**
 * @fileoverview Enterprise System Status Panel Component
 * Displays real-time system health monitoring with comprehensive error handling
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  XCircle,
  Activity,
  Database,
  Brain,
  HardDrive,
  Zap,
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import type { HealthCheckResult } from '@/lib/monitoring/health-check';

/**
 * Props interface for SystemStatusPanel component
 */
interface SystemStatusPanelProps {
  /** Whether the panel is in expanded state */
  isExpanded: boolean;
  /** Callback function to toggle panel state */
  onToggle: () => void;
  /** Optional CSS class name for styling */
  className?: string;
  /** Optional refresh interval override (milliseconds) */
  refreshInterval?: number;
  /** Whether to show detailed metrics */
  showDetailedMetrics?: boolean;
}

/**
 * Enterprise System Status Panel Component
 * 
 * Displays comprehensive system health monitoring with:
 * - Real-time service status indicators
 * - Performance metrics visualization  
 * - Error handling with retry mechanisms
 * - Responsive design for mobile and desktop
 * - Accessibility features for screen readers
 * 
 * @param props - Component props
 * @returns React functional component
 */
export const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({
  isExpanded,
  onToggle,
  className = '',
  refreshInterval = 30000,
  showDetailedMetrics = true
}) => {
  const { 
    health, 
    isLoading, 
    error, 
    lastUpdated, 
    refresh, 
    retryCount, 
    isConnected 
  } = useSystemHealth({ 
    refreshInterval,
    maxRetries: 3,
    enableDebugLogging: process.env.NODE_ENV === 'development'
  });

  const getOverallStatus = (health: HealthCheckResult | null) => {
    if (!health) return { status: 'unknown', color: 'text-gray-500', bgColor: 'bg-gray-500' };
    
    switch (health.status) {
      case 'healthy':
        return { status: 'healthy', color: 'text-green-500', bgColor: 'bg-green-500' };
      case 'degraded':
        return { status: 'degraded', color: 'text-yellow-500', bgColor: 'bg-yellow-500' };
      case 'unhealthy':
        return { status: 'unhealthy', color: 'text-red-500', bgColor: 'bg-red-500' };
      default:
        return { status: 'unknown', color: 'text-gray-500', bgColor: 'bg-gray-500' };
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'ai':
        return <Brain className="h-4 w-4" />;
      case 'storage':
        return <HardDrive className="h-4 w-4" />;
      case 'cache':
        return <Zap className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getServiceStatus = (status: string) => {
    switch (status) {
      case 'up':
        return { icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'text-green-600', label: 'Online' };
      case 'degraded':
        return { icon: <AlertCircle className="h-4 w-4 text-yellow-500" />, color: 'text-yellow-600', label: 'Degraded' };
      case 'down':
        return { icon: <XCircle className="h-4 w-4 text-red-500" />, color: 'text-red-600', label: 'Offline' };
      default:
        return { icon: <Clock className="h-4 w-4 text-gray-500" />, color: 'text-gray-600', label: 'Unknown' };
    }
  };

  const overallStatus = getOverallStatus(health);

  // Compact status button
  if (!isExpanded) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onToggle}
        className={`${className} ${
          !isConnected ? 'bg-red-50 border-red-200' :
          overallStatus.status === 'healthy' ? 'bg-green-50 border-green-200' : 
          overallStatus.status === 'degraded' ? 'bg-yellow-50 border-yellow-200' : 
          overallStatus.status === 'unhealthy' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
        }`}
        disabled={isLoading}
        aria-label={`System Status: ${overallStatus.status}${!isConnected ? ' - Disconnected' : ''}${retryCount > 0 ? ` - Retry ${retryCount}` : ''}`}
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : !isConnected ? (
          <WifiOff className="h-4 w-4 mr-2 text-red-500" />
        ) : (
          <AlertCircle className={`h-4 w-4 mr-2 ${overallStatus.color}`} />
        )}
        System Status
        {!isConnected && (
          <Badge variant="destructive" className="ml-2 text-xs">
            Offline
          </Badge>
        )}
        {isConnected && health && (
          <Badge 
            variant="secondary" 
            className={`ml-2 text-xs ${overallStatus.color}`}
          >
            {overallStatus.status}
          </Badge>
        )}
        {retryCount > 0 && (
          <Badge variant="outline" className="ml-1 text-xs">
            Retry {retryCount}
          </Badge>
        )}
      </Button>
    );
  }

  // Expanded status panel
  return (
    <Card className={`${className} border-0 rounded-none`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">System Status</CardTitle>
            {health && (
              <Badge 
                variant="secondary"
                className={`${overallStatus.color}`}
              >
                {overallStatus.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              ×
            </Button>
          </div>
        </div>
        {lastUpdated && (
          <CardDescription>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <span className="text-sm text-red-700 font-medium">
                    System Health Check Failed
                  </span>
                  <p className="text-xs text-red-600 mt-1">
                    {error.message}
                  </p>
                  {retryCount > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Retry attempt: {retryCount} of 3
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {!isConnected && !error && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-700">
                Connection lost. Attempting to reconnect...
              </span>
            </div>
          </div>
        )}

        {isLoading && !health && (
          <div className="flex items-center space-x-2 py-4">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading system status...</span>
          </div>
        )}

        {health && (
          <>
            {/* Services Status */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Services</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(health.services).map(([key, service]) => {
                  const status = getServiceStatus(service.status);
                  return (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-2">
                        {getServiceIcon(key)}
                        <span className="text-sm font-medium capitalize">{service.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {service.latency && (
                          <span className="text-xs text-gray-500">{service.latency}ms</span>
                        )}
                        <div className="flex items-center space-x-1">
                          {status.icon}
                          <span className={`text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* System Metrics */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Performance</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Memory Usage</span>
                  <span className="text-xs font-medium">
                    {health.metrics.memory.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={health.metrics.memory.percentage} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">CPU Usage</span>
                  <span className="text-xs font-medium">
                    {health.metrics.performance.cpuUsage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={health.metrics.performance.cpuUsage} className="h-2" />
              </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* Environment Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-900">Environment</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-600">Deployment:</span>
                  <span className="ml-1 font-medium">{health.environment.deployment}</span>
                </div>
                <div>
                  <span className="text-gray-600">Uptime:</span>
                  <span className="ml-1 font-medium">
                    {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                  </span>
                </div>
                {health.environment.region && (
                  <div>
                    <span className="text-gray-600">Region:</span>
                    <span className="ml-1 font-medium">{health.environment.region}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Version:</span>
                  <span className="ml-1 font-medium">{health.version}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};