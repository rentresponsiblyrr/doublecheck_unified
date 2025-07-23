/**
 * System Health Status - Enterprise Grade
 *
 * Display overall system health indicators
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorMetrics } from "@/lib/monitoring/inspection-error-monitor";

interface SystemHealthStatusProps {
  metrics: ErrorMetrics;
}

export const SystemHealthStatus: React.FC<SystemHealthStatusProps> = ({
  metrics,
}) => {
  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 0.99) return "text-green-600";
    if (rate >= 0.95) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <Card id="system-health-card">
      <CardHeader>
        <CardTitle>System Health Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          id="health-indicators"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div id="error-rate-health" className="text-center">
            <h4 className="text-sm font-medium mb-2">Error Rate</h4>
            <div
              className={`text-lg font-bold ${
                metrics.errorRate < 5
                  ? "text-green-600"
                  : metrics.errorRate < 10
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {metrics.errorRate.toFixed(1)}/hr
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.errorRate < 5
                ? "Healthy"
                : metrics.errorRate < 10
                  ? "Warning"
                  : "Critical"}
            </p>
          </div>

          <div id="performance-health" className="text-center">
            <h4 className="text-sm font-medium mb-2">Performance</h4>
            <div
              className={`text-lg font-bold ${
                metrics.averageProcessingTime < 500
                  ? "text-green-600"
                  : metrics.averageProcessingTime < 1000
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {formatDuration(metrics.averageProcessingTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.averageProcessingTime < 500
                ? "Fast"
                : metrics.averageProcessingTime < 1000
                  ? "Acceptable"
                  : "Slow"}
            </p>
          </div>

          <div id="availability-health" className="text-center">
            <h4 className="text-sm font-medium mb-2">Availability</h4>
            <div
              className={`text-lg font-bold ${getSuccessRateColor(metrics.successRate)}`}
            >
              {(metrics.successRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.successRate >= 0.99
                ? "Excellent"
                : metrics.successRate >= 0.95
                  ? "Good"
                  : "Poor"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
