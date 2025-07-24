/**
 * METRICS GRID COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional metrics display component showing system health indicators.
 * Clean separation from SystemStatusPanel for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import {
  Database,
  Shield,
  Users,
  TrendingUp,
  Clock,
  Activity,
  AlertTriangle,
} from "lucide-react";

interface MetricsData {
  totalProperties: number;
  totalInspections: number;
  activeInspectors: number;
  performanceScore?: number;
  completionRate?: number;
  uptime?: number;
  responseTime?: number;
  healthColorClass?: string;
}

interface VariantConfig {
  maxMetricsColumns: number;
  showPerformanceScore: boolean;
}

interface MetricsGridProps {
  metrics: MetricsData;
  variantConfig: VariantConfig;
  formatMetricValue: (value: number, type: string) => string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  metrics,
  variantConfig,
  formatMetricValue,
}) => {
  return (
    <>
      {/* Main System Metrics */}
      <div
        id="system-metrics-grid"
        className={`grid gap-4 mb-6 ${
          variantConfig.maxMetricsColumns === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {/* Properties Metric */}
        <div
          id="properties-metric-card"
          className="text-center p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100"
        >
          <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
          <div
            className="text-2xl font-bold text-gray-900"
            aria-label={`${metrics.totalProperties} total properties`}
          >
            {formatMetricValue(metrics.totalProperties, "count")}
          </div>
          <div className="text-sm text-gray-600 font-medium">Properties</div>
        </div>

        {/* Inspections Metric */}
        <div
          id="inspections-metric-card"
          className="text-center p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-green-100"
        >
          <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
          <div
            className="text-2xl font-bold text-gray-900"
            aria-label={`${metrics.totalInspections} total inspections`}
          >
            {formatMetricValue(metrics.totalInspections, "count")}
          </div>
          <div className="text-sm text-gray-600 font-medium">Inspections</div>
        </div>

        {/* Active Inspectors Metric */}
        <div
          id="inspectors-metric-card"
          className="text-center p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100"
        >
          <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
          <div
            className="text-2xl font-bold text-gray-900"
            aria-label={`${metrics.activeInspectors} active inspectors`}
          >
            {formatMetricValue(metrics.activeInspectors, "count")}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            Active Inspectors
          </div>
        </div>

        {/* System Performance Score (if enabled) */}
        {variantConfig.showPerformanceScore && (
          <div
            id="performance-metric-card"
            className="text-center p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100"
          >
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-amber-600" />
            <div
              className={`text-2xl font-bold ${metrics.healthColorClass || "text-gray-900"}`}
              aria-label={`Performance score: ${metrics.performanceScore || 0}%`}
            >
              {formatMetricValue(metrics.performanceScore || 0, "percentage")}
            </div>
            <div className="text-sm text-gray-600 font-medium">Performance</div>
          </div>
        )}
      </div>

      {/* Secondary Metrics Row */}
      <div
        id="secondary-metrics-row"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
      >
        {/* Completion Rate */}
        <div
          id="completion-rate-metric"
          className="text-center p-4 border border-gray-200 rounded-lg"
        >
          <Activity className="h-6 w-6 mx-auto mb-2 text-green-600" />
          <div className="text-lg font-semibold text-gray-900">
            {formatMetricValue(metrics.completionRate || 0, "percentage")}
          </div>
          <div className="text-xs text-gray-600">Completion Rate</div>
        </div>

        {/* System Uptime */}
        <div
          id="uptime-metric"
          className="text-center p-4 border border-gray-200 rounded-lg"
        >
          <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
          <div className="text-lg font-semibold text-gray-900">
            {formatMetricValue(metrics.uptime || 0, "percentage")}
          </div>
          <div className="text-xs text-gray-600">System Uptime</div>
        </div>

        {/* Response Time */}
        <div
          id="response-time-metric"
          className="text-center p-4 border border-gray-200 rounded-lg"
        >
          <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
          <div className="text-lg font-semibold text-gray-900">
            {formatMetricValue(metrics.responseTime || 0, "milliseconds")}ms
          </div>
          <div className="text-xs text-gray-600">Avg Response</div>
        </div>
      </div>
    </>
  );
};
