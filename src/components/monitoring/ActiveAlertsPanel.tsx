/**
 * Active Alerts Panel - Enterprise Grade
 *
 * Displays active monitoring alerts with severity indicators
 */

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { MonitoringAlert } from "@/lib/monitoring/inspection-error-monitor";

interface ActiveAlertsPanelProps {
  alerts: MonitoringAlert[];
}

export const ActiveAlertsPanel: React.FC<ActiveAlertsPanelProps> = ({
  alerts,
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "warning":
        return "warning";
      default:
        return "default";
    }
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div id="active-alerts-panel">
      <h3 className="text-lg font-semibold mb-3">Active Alerts</h3>
      <div id="alerts-grid" className="space-y-2">
        {alerts.map((alert) => (
          <Alert key={alert.id} className="border-l-4 border-l-red-500">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              {alert.message}
              <Badge variant={getSeverityColor(alert.severity)}>
                {alert.severity}
              </Badge>
            </AlertTitle>
            <AlertDescription>
              <div className="flex justify-between items-center mt-2">
                <span>
                  Current: {alert.currentValue} | Threshold: {alert.threshold}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
};
