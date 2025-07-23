/**
 * Elite Admin Overview Component
 * Netflix-grade performance, reliability, and user experience
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
  BarChart3,
  DollarSign,
} from "lucide-react";

// Elite imports
import { useEliteAdminDashboard } from "./overview/useEliteAdminDashboard";
import {
  MetricErrorBoundary,
  InspectionCountsErrorBoundary,
  TimeAnalyticsErrorBoundary,
  AIMetricsErrorBoundary,
  RevenueMetricsErrorBoundary,
} from "./overview/MetricErrorBoundary";
import {
  MetricSkeleton,
  DashboardOverviewSkeleton,
  QuickActionsSkeleton,
  TrendChartSkeleton,
  MetricLoadingState,
} from "./overview/MetricSkeleton";
import {
  DataFreshnessIndicator,
  DashboardFreshnessIndicator,
  MetricFreshnessIndicator,
} from "./overview/DataFreshnessIndicator";
import { logger } from "@/lib/logger/production-logger";
import { sanitizeDisplayValue } from "@/utils/adminDataValidation";

interface AdminOverviewEliteProps {
  className?: string;
}

type TimeRange = "7d" | "30d" | "90d" | "1y";

export const AdminOverviewElite: React.FC<AdminOverviewEliteProps> = ({
  className = "",
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("30d");
  const [retryAttempts, setRetryAttempts] = useState<Record<string, number>>(
    {},
  );

  const {
    metrics,
    health,
    isLoading,
    isInitialLoad,
    loadingStates,
    errors,
    hasErrors,
    lastUpdated,
    refreshMetrics,
    loadConsolidatedMetrics,
    getPerformanceMetrics,
    clearCache,
    retryFailedMetrics,
  } = useEliteAdminDashboard(selectedTimeRange);

  // Handle time range changes
  const handleTimeRangeChange = useCallback(
    (newRange: TimeRange) => {
      logger.info("Time range changed", {
        from: selectedTimeRange,
        to: newRange,
        component: "AdminOverviewElite",
      });

      setSelectedTimeRange(newRange);
      // Clear cache to force fresh data for new time range
      clearCache();
      loadConsolidatedMetrics({ skipCache: true, priority: "high" });
    },
    [selectedTimeRange, clearCache, loadConsolidatedMetrics],
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    logger.info("Manual refresh initiated", {
      component: "AdminOverviewElite",
    });
    refreshMetrics();
  }, [refreshMetrics]);

  // Handle metric retry
  const handleMetricRetry = useCallback(
    (metricKey: string) => {
      const currentAttempts = retryAttempts[metricKey] || 0;
      setRetryAttempts((prev) => ({
        ...prev,
        [metricKey]: currentAttempts + 1,
      }));

      logger.info("Metric retry initiated", {
        metricKey,
        attempt: currentAttempts + 1,
        component: "AdminOverviewElite",
      });

      refreshMetrics([metricKey]);
    },
    [retryAttempts, refreshMetrics],
  );

  // Performance monitoring
  useEffect(() => {
    const performanceMetrics = getPerformanceMetrics();

    if (performanceMetrics.averageLoadTime > 1000) {
      logger.warn("Dashboard performance degraded", {
        averageLoadTime: performanceMetrics.averageLoadTime,
        cacheHitRate: performanceMetrics.cacheHitRate,
        component: "AdminOverviewElite",
      });
    }
  }, [metrics, getPerformanceMetrics]);

  const getTimeRangeLabel = (range: TimeRange): string => {
    const labels = {
      "7d": "Last 7 Days",
      "30d": "Last 30 Days",
      "90d": "Last 90 Days",
      "1y": "Last Year",
    };
    return labels[range];
  };

  // Show loading state during initial load
  if (isInitialLoad) {
    return (
      <div className={`space-y-8 ${className}`}>
        <MetricLoadingState
          message="Loading Elite Dashboard..."
          submessage="Initializing real-time metrics and performance monitoring"
          variant="detailed"
        />
      </div>
    );
  }

  // Get last updated time for main metrics
  const mainLastUpdated = lastUpdated.consolidated || new Date();

  return (
    <div id="admin-overview-elite" className={`space-y-8 ${className}`}>
      {/* Header with Performance Indicators */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Elite Dashboard
            </h1>
            <Badge variant="secondary" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Real-time
            </Badge>
            {health && (
              <Badge
                variant={
                  health.database_health.connection_status === "healthy"
                    ? "default"
                    : "destructive"
                }
                className="text-xs"
              >
                {health.database_health.connection_status === "healthy" ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                {health.database_health.connection_status}
              </Badge>
            )}
          </div>

          <p className="text-gray-600 mb-3">
            Netflix-grade performance monitoring with real-time insights
          </p>

          <DashboardFreshnessIndicator
            lastUpdated={mainLastUpdated}
            isLoading={isLoading}
            hasError={hasErrors}
            onRefresh={handleRefresh}
            showAutoRefresh={true}
          />
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={selectedTimeRange}
            onValueChange={handleTimeRangeChange}
            disabled={isLoading}
          >
            <SelectTrigger className="w-48">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
                <SelectItem key={range} value={range}>
                  {getTimeRangeLabel(range)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {hasErrors && (
            <Button
              onClick={retryFailedMetrics}
              variant="destructive"
              size="sm"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Retry Failed
            </Button>
          )}
        </div>
      </div>

      {/* Global Error Alert */}
      {hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some metrics failed to load. Data may be incomplete.{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-red-600 underline"
              onClick={retryFailedMetrics}
            >
              Click here to retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Inspection Counts */}
        <InspectionCountsErrorBoundary
          onRetry={() => handleMetricRetry("inspectionCounts")}
          fallbackData={metrics.inspection_counts}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Inspections
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sanitizeDisplayValue(
                  metrics.inspection_counts?.total,
                  "integer",
                )}
              </div>
              <div className="flex items-center text-xs text-gray-600 mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                {sanitizeDisplayValue(
                  metrics.inspection_counts?.completed,
                  "integer",
                )}{" "}
                completed
              </div>
              <MetricFreshnessIndicator
                lastUpdated={lastUpdated.inspectionCounts || mainLastUpdated}
                metricName="Inspections"
                isLoading={loadingStates.inspectionCounts}
                hasError={!!errors.inspectionCounts}
                onRefresh={() => handleMetricRetry("inspectionCounts")}
              />
            </CardContent>
          </Card>
        </InspectionCountsErrorBoundary>

        {/* Time Analytics */}
        <TimeAnalyticsErrorBoundary
          onRetry={() => handleMetricRetry("timeAnalytics")}
          fallbackData={metrics.time_analytics}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Inspection Time
              </CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sanitizeDisplayValue(
                  metrics.time_analytics?.avg_duration_minutes,
                  "integer",
                )}
                m
              </div>
              <div className="flex items-center text-xs text-gray-600 mt-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {sanitizeDisplayValue(
                  metrics.time_analytics?.total_with_times,
                  "integer",
                )}{" "}
                with timing data
              </div>
              <MetricFreshnessIndicator
                lastUpdated={lastUpdated.timeAnalytics || mainLastUpdated}
                metricName="Time Analytics"
                isLoading={loadingStates.timeAnalytics}
                hasError={!!errors.timeAnalytics}
                onRefresh={() => handleMetricRetry("timeAnalytics")}
              />
            </CardContent>
          </Card>
        </TimeAnalyticsErrorBoundary>

        {/* AI Metrics */}
        <AIMetricsErrorBoundary
          onRetry={() => handleMetricRetry("aiMetrics")}
          fallbackData={metrics.ai_metrics}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sanitizeDisplayValue(
                  metrics.ai_metrics?.accuracy_rate,
                  "percentage",
                )}
              </div>
              <div className="flex items-center text-xs text-gray-600 mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                {sanitizeDisplayValue(
                  metrics.ai_metrics?.total_predictions,
                  "integer",
                )}{" "}
                predictions
              </div>
              <MetricFreshnessIndicator
                lastUpdated={lastUpdated.aiMetrics || mainLastUpdated}
                metricName="AI Performance"
                isLoading={loadingStates.aiMetrics}
                hasError={!!errors.aiMetrics}
                onRefresh={() => handleMetricRetry("aiMetrics")}
              />
            </CardContent>
          </Card>
        </AIMetricsErrorBoundary>

        {/* Revenue Metrics */}
        <RevenueMetricsErrorBoundary
          onRetry={() => handleMetricRetry("revenueMetrics")}
          fallbackData={metrics.revenue_metrics}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {sanitizeDisplayValue(
                  metrics.revenue_metrics?.monthly_revenue,
                  "integer",
                )}
              </div>
              <div className="flex items-center text-xs text-gray-600 mt-2">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {sanitizeDisplayValue(
                  metrics.revenue_metrics?.completed_this_month,
                  "integer",
                )}{" "}
                completed
              </div>
              <MetricFreshnessIndicator
                lastUpdated={lastUpdated.revenueMetrics || mainLastUpdated}
                metricName="Revenue"
                isLoading={loadingStates.revenueMetrics}
                hasError={!!errors.revenueMetrics}
                onRefresh={() => handleMetricRetry("revenueMetrics")}
              />
            </CardContent>
          </Card>
        </RevenueMetricsErrorBoundary>
      </div>

      {/* Performance Metrics */}
      <MetricErrorBoundary
        metricName="Performance Monitoring"
        onRetry={() => {}}
        fallbackData={null}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              System Performance
            </CardTitle>
            <CardDescription>
              Real-time performance indicators and health metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getPerformanceMetrics().averageLoadTime.toFixed(0)}ms
                </div>
                <div className="text-sm text-gray-600">Avg Load Time</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {getPerformanceMetrics().cacheHitRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Cache Hit Rate</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {getPerformanceMetrics().totalQueries}
                </div>
                <div className="text-sm text-gray-600">Total Queries</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {health?.performance_indicators.concurrent_connections || 0}
                </div>
                <div className="text-sm text-gray-600">Active Connections</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </MetricErrorBoundary>

      {/* User Metrics */}
      <MetricErrorBoundary
        metricName="User Analytics"
        onRetry={() => handleMetricRetry("userMetrics")}
        fallbackData={metrics.user_metrics}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Active Users
            </CardTitle>
            <CardDescription>
              Current user base and activity metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sanitizeDisplayValue(
                    metrics.user_metrics?.active_inspectors,
                    "integer",
                  )}
                </div>
                <div className="text-sm text-gray-600">Active Inspectors</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sanitizeDisplayValue(
                    metrics.user_metrics?.auditors,
                    "integer",
                  )}
                </div>
                <div className="text-sm text-gray-600">Auditors</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {sanitizeDisplayValue(
                    metrics.user_metrics?.total_users,
                    "integer",
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </MetricErrorBoundary>
    </div>
  );
};

export default AdminOverviewElite;
