
import React from 'react';
import { Activity, Wifi, Clock, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/components/MobileFastAuthProvider';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

export const PerformanceMonitor = () => {
  const { userRole } = useAuth();
  const { metrics, isVisible } = usePerformanceMonitoring();

  if (!isVisible) return null;

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-50 bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Performance Monitor
          <Badge variant="outline" className="text-xs ml-auto">
            {userRole === 'admin' ? 'Admin' : 'Dev'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Load Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs">Load Time</span>
          </div>
          <span className={`text-xs font-medium ${getStatusColor(metrics.loadTime, { good: 1000, warning: 3000 })}`}>
            {metrics.loadTime}ms
          </span>
        </div>

        {/* Network Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-3 h-3 text-gray-500" />
            <span className="text-xs">Network</span>
          </div>
          <Badge 
            variant={metrics.networkStatus === 'online' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {metrics.networkStatus}
          </Badge>
        </div>

        {/* DB Response Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-gray-500" />
            <span className="text-xs">DB Response</span>
          </div>
          <span className={`text-xs font-medium ${getStatusColor(metrics.dbResponseTime, { good: 200, warning: 500 })}`}>
            {metrics.dbResponseTime}ms
          </span>
        </div>

        {/* Cache Hit Rate */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs">Cache Hit Rate</span>
            <span className="text-xs font-medium">{metrics.cacheHitRate}%</span>
          </div>
          <Progress value={metrics.cacheHitRate} className="h-1" />
        </div>

        {/* Memory Usage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs">Memory Usage</span>
            <span className="text-xs font-medium">{metrics.memoryUsage}%</span>
          </div>
          <Progress value={metrics.memoryUsage} className="h-1" />
        </div>
      </CardContent>
    </Card>
  );
};
