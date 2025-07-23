/**
 * Key Metrics Grid - Enterprise Grade
 *
 * Display key monitoring metrics in a responsive grid layout
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ErrorMetrics } from "@/lib/monitoring/inspection-error-monitor";

interface KeyMetricsGridProps {
  metrics: ErrorMetrics;
}

export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({ metrics }) => {
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
    <div
      id="key-metrics-grid"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {/* Success Rate */}
      <Card id="success-rate-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${getSuccessRateColor(metrics.successRate)}`}
          >
            {(metrics.successRate * 100).toFixed(1)}%
          </div>
          <Progress value={metrics.successRate * 100} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">Last 24 hours</p>
        </CardContent>
      </Card>

      {/* Total Errors */}
      <Card id="total-errors-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalErrors}</div>
          <div className="flex items-center space-x-1 mt-2">
            {metrics.performanceTrends.errorRateChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
            <span
              className={`text-xs ${
                metrics.performanceTrends.errorRateChange > 0
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {Math.abs(metrics.performanceTrends.errorRateChange).toFixed(1)}%
              vs previous period
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Average Response Time */}
      <Card id="response-time-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg Response Time
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(metrics.averageProcessingTime)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            P95: {formatDuration(metrics.performanceTrends.p95ResponseTime)}
          </p>
        </CardContent>
      </Card>

      {/* Critical Errors */}
      <Card id="critical-errors-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              metrics.criticalErrors > 0 ? "text-red-600" : "text-green-600"
            }`}
          >
            {metrics.criticalErrors}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Requires immediate attention
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
