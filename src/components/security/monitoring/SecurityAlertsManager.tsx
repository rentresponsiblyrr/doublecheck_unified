import React, { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  X,
} from "lucide-react";

interface SecurityAlert {
  id: string;
  type: "system" | "threat" | "performance" | "maintenance";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  actions?: Array<{
    label: string;
    action: string;
  }>;
}

interface SecurityAlertsManagerProps {
  alerts: SecurityAlert[];
  isLoading: boolean;
  onAcknowledge: (alertId: string) => void;
  onDismiss: (alertId: string) => void;
  onAlertAction: (alertId: string, action: string) => void;
}

export const SecurityAlertsManager: React.FC<SecurityAlertsManagerProps> = ({
  alerts,
  isLoading,
  onAcknowledge,
  onDismiss,
  onAlertAction,
}) => {
  const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged);
  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === "critical",
  );

  const getSeverityIcon = useCallback((severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const getSeverityColor = useCallback((severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "outline";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  }, []);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case "threat":
        return "text-red-600";
      case "system":
        return "text-blue-600";
      case "performance":
        return "text-orange-600";
      case "maintenance":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  }, []);

  if (isLoading) {
    return (
      <Card id="alerts-loading">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading alerts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="security-alerts-manager">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Security Alerts</span>
            {unacknowledgedAlerts.length > 0 && (
              <Badge variant="destructive">{unacknowledgedAlerts.length}</Badge>
            )}
          </CardTitle>

          {criticalAlerts.length > 0 && (
            <Alert
              variant="destructive"
              className="py-2 px-3 border-2"
              id="critical-alerts-banner"
            >
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {criticalAlerts.length} critical alerts require immediate
                attention
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3" id="alerts-list">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>No active security alerts</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 border rounded-lg transition-colors ${
                  alert.acknowledged
                    ? "bg-muted/30"
                    : "bg-background hover:bg-muted/50"
                } ${alert.severity === "critical" ? "border-red-300" : "border-border"}`}
                id={`alert-${alert.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={getTypeColor(alert.type)}
                        >
                          {alert.type}
                        </Badge>
                        {alert.acknowledged && (
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{alert.timestamp.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDismiss(alert.id)}
                      id={`dismiss-alert-${alert.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>

                    {!alert.acknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAcknowledge(alert.id)}
                        id={`acknowledge-alert-${alert.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss(alert.id)}
                      id={`dismiss-alert-${alert.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {alert.actions && alert.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-muted">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        Quick Actions:
                      </span>
                      {alert.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => onAlertAction(alert.id, action.action)}
                          id={`alert-action-${alert.id}-${index}`}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
