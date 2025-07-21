import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Activity, Database, Users, FileText, Zap, Clock, TrendingUp } from 'lucide-react';
import { productionDb } from '@/services/productionDatabaseService';
import { logger } from '@/lib/utils/logger';

interface SystemMetrics {
  totalProperties: number;
  totalInspections: number;
  totalUsers: number;
  activeInspectors: number;
  completedInspections: number;
  pendingInspections: number;
  avgCompletionTime: number;
  systemUptime: number;
}

interface SystemStatusPanelProps {
  className?: string;
}

export const SystemStatusPanel: React.FC<SystemStatusPanelProps> = ({ className }) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSystemMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch properties
      const { data: properties } = await productionDb.getProperties();
      
      // Fetch inspections
      const { data: inspections } = await productionDb.getInspections();
      
      // Fetch users
      const { data: users } = await productionDb.getUsers();
      
      // Calculate metrics
      const completedInspections = inspections?.filter(i => i.status === 'completed').length || 0;
      const pendingInspections = inspections?.filter(i => ['draft', 'in_progress'].includes(i.status)).length || 0;
      const activeInspectors = users?.filter(u => u.role === 'inspector' && u.status === 'active').length || 0;
      
      // Mock some additional metrics (replace with real calculations)
      const avgCompletionTime = 45; // minutes
      const systemUptime = 99.8; // percentage
      
      const systemMetrics: SystemMetrics = {
        totalProperties: properties?.length || 0,
        totalInspections: inspections?.length || 0,
        totalUsers: users?.length || 0,
        activeInspectors,
        completedInspections,
        pendingInspections,
        avgCompletionTime,
        systemUptime
      };
      
      setMetrics(systemMetrics);
      setLastUpdated(new Date());
      logger.info('System metrics updated', systemMetrics);
    } catch (error) {
      logger.error('Failed to fetch system metrics', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemMetrics();
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchSystemMetrics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !metrics) {
    return (
      <Card id="system-status-loading" className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Loading System Status...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card id="system-status-error" className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Unable to load system status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div id="system-status-panel-container" className={className}>
      <Card id="system-status-panel">
        <CardHeader id="system-status-header" className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {lastUpdated?.toLocaleTimeString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent id="system-status-content">
          {/* Core Metrics */}
          <div id="core-metrics-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div id="properties-metric" className="text-center p-3 border rounded-lg">
              <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{metrics.totalProperties}</div>
              <div className="text-sm text-muted-foreground">Properties</div>
            </div>
            
            <div id="inspections-metric" className="text-center p-3 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{metrics.totalInspections}</div>
              <div className="text-sm text-muted-foreground">Inspections</div>
            </div>
            
            <div id="users-metric" className="text-center p-3 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{metrics.totalUsers}</div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            
            <div id="active-inspectors-metric" className="text-center p-3 border rounded-lg">
              <Zap className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{metrics.activeInspectors}</div>
              <div className="text-sm text-muted-foreground">Active Inspectors</div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Performance Metrics */}
          <div id="performance-metrics" className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Metrics
            </h4>
            
            <div id="inspection-completion-progress" className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Inspection Completion Rate</span>
                <span className={getStatusColor(
                  (metrics.completedInspections / Math.max(metrics.totalInspections, 1)) * 100,
                  { good: 80, warning: 60 }
                )}>
                  {Math.round((metrics.completedInspections / Math.max(metrics.totalInspections, 1)) * 100)}%
                </span>
              </div>
              <Progress 
                value={(metrics.completedInspections / Math.max(metrics.totalInspections, 1)) * 100} 
                className="h-2"
              />
            </div>

            <div id="system-uptime-progress" className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>System Uptime</span>
                <span className={getStatusColor(metrics.systemUptime, { good: 99, warning: 95 })}>
                  {metrics.systemUptime}%
                </span>
              </div>
              <Progress value={metrics.systemUptime} className="h-2" />
            </div>

            <div id="avg-completion-time" className="flex justify-between items-center py-2 px-3 bg-muted rounded-lg">
              <span className="text-sm">Avg. Completion Time</span>
              <Badge variant="outline">
                {metrics.avgCompletionTime} min
              </Badge>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Workload Distribution */}
          <div id="workload-distribution" className="space-y-4">
            <h4 className="font-medium">Current Workload</h4>
            <div className="grid grid-cols-2 gap-4">
              <div id="completed-inspections-card" className="p-3 border rounded-lg">
                <div className="text-lg font-semibold text-green-600">{metrics.completedInspections}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div id="pending-inspections-card" className="p-3 border rounded-lg">
                <div className="text-lg font-semibold text-yellow-600">{metrics.pendingInspections}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStatusPanel;