/**
 * CACHE INVALIDATION DASHBOARD - DEVELOPMENT MONITORING
 * 
 * React dashboard component for monitoring intelligent cache invalidation
 * performance, statistics, and debugging. Provides real-time insights
 * into cache behavior and invalidation patterns.
 * 
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Target,
  Database,
  Users
} from 'lucide-react';
import { useCacheInvalidationStats } from '@/lib/cache/useCacheInvalidation';
import { cacheWarmingSystem } from '@/lib/cache/CacheWarmingSystem';

interface CacheInvalidationDashboardProps {
  isVisible?: boolean;
  onToggle?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const CacheInvalidationDashboard: React.FC<CacheInvalidationDashboardProps> = ({
  isVisible = false,
  onToggle,
  position = 'bottom-right'
}) => {
  const invalidationStats = useCacheInvalidationStats(3000); // Update every 3 seconds
  const [warmingStats, setWarmingStats] = useState({
    totalWarmingJobs: 0,
    successfulWarmings: 0,
    failedWarmings: 0,
    averageWarmingTime: 0,
    cacheHitRateImprovement: 0,
    bytesWarmed: 0,
    predictiveAccuracy: 0,
    lastWarmingTime: 0,
  });

  // Update warming stats
  useEffect(() => {
    if (!isVisible) return;

    const updateWarmingStats = () => {
      setWarmingStats(cacheWarmingSystem.getStats());
    };

    updateWarmingStats();
    const interval = setInterval(updateWarmingStats, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Position classes
  const getPositionClasses = () => {
    const baseClasses = "fixed z-50";
    switch (position) {
      case 'bottom-right': return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left': return `${baseClasses} bottom-4 left-4`;
      case 'top-right': return `${baseClasses} top-4 right-4`;
      case 'top-left': return `${baseClasses} top-4 left-4`;
      default: return `${baseClasses} bottom-4 right-4`;
    }
  };

  // Floating button when dashboard is hidden
  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className={`${getPositionClasses()} bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors`}
        title="Open Cache Dashboard"
      >
        <Database className="w-5 h-5" />
      </button>
    );
  }

  const healthColor = invalidationStats.isHealthy ? 'text-green-600' : 'text-red-600';
  const warmingSuccessRate = warmingStats.totalWarmingJobs > 0 
    ? (warmingStats.successfulWarmings / warmingStats.totalWarmingJobs) * 100 
    : 100;

  return (
    <div className={`${getPositionClasses()} bg-white border border-gray-300 rounded-lg shadow-2xl w-96 max-h-[80vh] flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Cache Monitor</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={invalidationStats.isHealthy ? "success" : "destructive"}>
            {invalidationStats.isHealthy ? 'Healthy' : 'Issues'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
          >
            ×
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="invalidation">
              Invalidation
              {invalidationStats.failureRate > 5 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  !
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="warming">
              Warming
              {warmingSuccessRate < 90 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  !
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center">
                    <Activity className="w-3 h-3 mr-1" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-xl font-bold ${healthColor}`}>
                    {invalidationStats.isHealthy ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <XCircle className="w-6 h-6" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600">
                    {invalidationStats.successRate.toFixed(1)}% Success
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Avg Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-blue-600">
                    {invalidationStats.averageInvalidationTime.toFixed(0)}ms
                  </div>
                  <p className="text-xs text-gray-600">
                    Invalidation Time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center">
                    <Target className="w-3 h-3 mr-1" />
                    Cache Hits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-600">
                    {warmingStats.cacheHitRateImprovement.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-600">
                    Improvement
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-purple-600">
                    {warmingStats.predictiveAccuracy.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-600">
                    Accuracy
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Invalidation Success Rate</span>
                      <span>{invalidationStats.successRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={invalidationStats.successRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Warming Success Rate</span>
                      <span>{warmingSuccessRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={warmingSuccessRate} className="h-2" />
                  </div>
                </div>

                {/* Alerts */}
                {(invalidationStats.failureRate > 5 || warmingSuccessRate < 90) && (
                  <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
                      <span className="text-sm text-orange-800">
                        Performance issues detected
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invalidation Tab */}
          <TabsContent value="invalidation" className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Invalidation Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Invalidations:</span>
                      <span className="font-medium">{invalidationStats.totalInvalidations}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Successful:</span>
                      <span className="font-medium text-green-600">{invalidationStats.successfulInvalidations}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Failed:</span>
                      <span className="font-medium text-red-600">{invalidationStats.failedInvalidations}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rules Executed:</span>
                      <span className="font-medium">{invalidationStats.rulesExecuted}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dependency Chains:</span>
                      <span className="font-medium">{invalidationStats.dependencyChainsResolved}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avg Response Time:</span>
                      <span className="font-medium">{invalidationStats.averageInvalidationTime.toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Success Rate:</span>
                      <span className={`font-medium ${invalidationStats.successRate > 95 ? 'text-green-600' : 'text-orange-600'}`}>
                        {invalidationStats.successRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cache Hit Impact:</span>
                      <span className="font-medium">{invalidationStats.cacheHitRateImpact.toFixed(1)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {invalidationStats.lastInvalidationTime > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Last Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {new Date(invalidationStats.lastInvalidationTime).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Warming Tab */}
          <TabsContent value="warming" className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Warming Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Jobs:</span>
                      <span className="font-medium">{warmingStats.totalWarmingJobs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Successful:</span>
                      <span className="font-medium text-green-600">{warmingStats.successfulWarmings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Failed:</span>
                      <span className="font-medium text-red-600">{warmingStats.failedWarmings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Time:</span>
                      <span className="font-medium">{warmingStats.averageWarmingTime.toFixed(0)}ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Data Warmed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Size:</span>
                      <span className="font-medium">{(warmingStats.bytesWarmed / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Hit Rate Improvement:</span>
                      <span className="font-medium text-green-600">
                        +{warmingStats.cacheHitRateImprovement.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Prediction Accuracy:</span>
                      <span className={`font-medium ${warmingStats.predictiveAccuracy > 70 ? 'text-green-600' : 'text-orange-600'}`}>
                        {warmingStats.predictiveAccuracy.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {warmingStats.lastWarmingTime > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Last Warming</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {new Date(warmingStats.lastWarmingTime).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer with Actions */}
      <div className="border-t p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${invalidationStats.isHealthy ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-xs text-gray-600">Live Monitoring</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('Cache Stats:', { invalidationStats, warmingStats });
            }}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Export Data
          </Button>
        </div>
      </div>
    </div>
  );
};