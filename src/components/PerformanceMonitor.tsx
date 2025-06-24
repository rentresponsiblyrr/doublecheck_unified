
import React, { useEffect, useState } from 'react';
import { Activity, Wifi, Clock, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PerformanceMetrics {
  loadTime: number;
  networkStatus: 'online' | 'offline' | 'slow';
  dbResponseTime: number;
  cacheHitRate: number;
  memoryUsage: number;
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    networkStatus: 'online',
    dbResponseTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const showPerfMonitor = process.env.NODE_ENV === 'development' || 
                           localStorage.getItem('showPerformanceMonitor') === 'true';
    setIsVisible(showPerfMonitor);

    if (!showPerfMonitor) return;

    const updateMetrics = () => {
      // Calculate load time
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigationTiming ? 
        Math.round(navigationTiming.loadEventEnd - navigationTiming.navigationStart) : 0;

      // Network status
      const connection = (navigator as any).connection;
      let networkStatus: 'online' | 'offline' | 'slow' = 'online';
      if (!navigator.onLine) {
        networkStatus = 'offline';
      } else if (connection?.effectiveType === '2g' || connection?.downlink < 1) {
        networkStatus = 'slow';
      }

      // Simulate DB response time (would be real in production)
      const dbResponseTime = Math.random() * 500 + 100;

      // Simulate cache hit rate
      const cacheHitRate = Math.random() * 30 + 70;

      // Memory usage (approximate)
      const memoryUsage = (performance as any).memory ? 
        Math.round(((performance as any).memory.usedJSHeapSize / (performance as any).memory.totalJSHeapSize) * 100) : 
        Math.random() * 40 + 30;

      setMetrics({
        loadTime,
        networkStatus,
        dbResponseTime: Math.round(dbResponseTime),
        cacheHitRate: Math.round(cacheHitRate),
        memoryUsage
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

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
            Dev Mode
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
