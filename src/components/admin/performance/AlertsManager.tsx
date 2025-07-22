import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  XCircle, 
  X, 
  RefreshCw, 
  Bell, 
  BellOff 
} from 'lucide-react';
import { PerformanceAlert } from '@/types/performance-monitoring';

interface AlertsManagerProps {
  alerts: PerformanceAlert[];
  onDismissAlert: (alertId: string) => void;
  onRefreshAlerts: () => void;
  alertsEnabled: boolean;
  onToggleAlerts: (enabled: boolean) => void;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({
  alerts,
  onDismissAlert,
  onRefreshAlerts,
  alertsEnabled,
  onToggleAlerts
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="outline">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  return (
    <Card id="alerts-manager-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            {alertsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            <span>Performance Alerts</span>
            <Badge variant="secondary">{alerts.length}</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleAlerts(!alertsEnabled)}
              id="toggle-alerts-button"
            >
              {alertsEnabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefreshAlerts}
              id="refresh-alerts-button"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent id="alerts-content">
        <div className="space-y-4">
          <div id="alert-filters" className="flex space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              id="filter-all-button"
            >
              All ({alerts.length})
            </Button>
            <Button
              variant={filter === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('critical')}
              id="filter-critical-button"
            >
              Critical ({alerts.filter(a => a.severity === 'critical').length})
            </Button>
            <Button
              variant={filter === 'warning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('warning')}
              id="filter-warning-button"
            >
              Warning ({alerts.filter(a => a.severity === 'warning').length})
            </Button>
          </div>

          <div id="alerts-list" className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No alerts to display
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  id={`alert-${alert.id}`}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm">{alert.message}</p>
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {alert.component} • {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDismissAlert(alert.id)}
                    id={`dismiss-alert-${alert.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};