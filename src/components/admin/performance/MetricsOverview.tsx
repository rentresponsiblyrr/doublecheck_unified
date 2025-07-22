import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  Database, 
  MemoryStick, 
  HardDrive, 
  TrendingUp, 
  TrendingDown 
} from 'lucide-react';
import { SystemMetrics, ApplicationMetrics, DatabaseMetrics } from '@/types/performance-monitoring';

interface MetricsOverviewProps {
  systemMetrics: SystemMetrics | null;
  appMetrics: ApplicationMetrics | null;
  dbMetrics: DatabaseMetrics | null;
  isLoading: boolean;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  systemMetrics,
  appMetrics,
  dbMetrics,
  isLoading
}) => {
  const getPerformanceBadge = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return <Badge variant="secondary">Good</Badge>;
    if (value <= thresholds.warning) return <Badge variant="outline">Warning</Badge>;
    return <Badge variant="destructive">Critical</Badge>;
  };

  if (isLoading) {
    return <div id="metrics-loading">Loading metrics...</div>;
  }

  return (
    <div id="metrics-overview-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card id="cpu-metrics-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent id="cpu-content">
          <div className="text-2xl font-bold">
            {systemMetrics?.cpu.usage.toFixed(1)}%
          </div>
          <div className="flex items-center space-x-2 mt-2">
            {getPerformanceBadge(systemMetrics?.cpu.usage || 0, { good: 70, warning: 85 })}
            {systemMetrics?.cpu.trend === 'up' ? 
              <TrendingUp className="h-3 w-3 text-red-500" /> : 
              <TrendingDown className="h-3 w-3 text-green-500" />
            }
          </div>
        </CardContent>
      </Card>

      <Card id="memory-metrics-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          <MemoryStick className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent id="memory-content">
          <div className="text-2xl font-bold">
            {systemMetrics?.memory.usage.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {((systemMetrics?.memory.used || 0) / 1024 / 1024 / 1024).toFixed(1)}GB used
          </p>
        </CardContent>
      </Card>

      <Card id="database-metrics-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">DB Response</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent id="database-content">
          <div className="text-2xl font-bold">
            {dbMetrics?.responseTime.toFixed(0)}ms
          </div>
          {getPerformanceBadge(dbMetrics?.responseTime || 0, { good: 100, warning: 500 })}
        </CardContent>
      </Card>

      <Card id="app-metrics-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">App Performance</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent id="app-content">
          <div className="text-2xl font-bold">
            {appMetrics?.responseTime.toFixed(0)}ms
          </div>
          <p className="text-xs text-muted-foreground">
            {appMetrics?.requestsPerSecond.toFixed(1)} req/s
          </p>
        </CardContent>
      </Card>
    </div>
  );
};