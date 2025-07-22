import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Server, 
  Globe 
} from 'lucide-react';
import { SystemHealthScore, PerformanceAlert } from '@/types/performance-monitoring';

interface SystemHealthPanelProps {
  healthScore: SystemHealthScore | null;
  alerts: PerformanceAlert[];
  isOnline: boolean;
}

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
  healthScore,
  alerts,
  isOnline
}) => {
  const getHealthIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');

  return (
    <div id="system-health-panel" className="space-y-4">
      <Card id="health-score-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>System Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent id="health-score-content">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {healthScore && getHealthIcon(healthScore.overall)}
              <div>
                <div className={`text-2xl font-bold ${healthScore ? getHealthColor(healthScore.overall) : ''}`}>
                  {healthScore?.overall || 0}/100
                </div>
                <p className="text-sm text-muted-foreground">Overall Health</p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <Badge variant={isOnline ? "secondary" : "destructive"}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card id="service-status-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Service Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent id="service-status-content">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Database</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">API Server</span>
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-green-500" />
                <span className="text-sm">CDN</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm">Cache</span>
                <Badge variant="secondary">Active</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <div id="alerts-section" className="space-y-2">
          {criticalAlerts.map((alert, index) => (
            <Alert key={`critical-${index}`} variant="destructive" id={`critical-alert-${index}`}>
              <XCircle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
          
          {warningAlerts.map((alert, index) => (
            <Alert key={`warning-${index}`} id={`warning-alert-${index}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};