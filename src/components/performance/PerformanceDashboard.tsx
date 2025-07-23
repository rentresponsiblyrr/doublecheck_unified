/**
 * PERFORMANCE DASHBOARD - ELITE CORE WEB VITALS MONITORING
 *
 * Real-time performance dashboard displaying Core Web Vitals metrics
 * with Netflix/Meta performance standards and construction site optimization.
 * Provides comprehensive performance insights, alerts, and optimization suggestions.
 *
 * FEATURES:
 * - Live Core Web Vitals metrics (LCP, FID, CLS, FCP, TTFB)
 * - Performance budget monitoring and violation alerts
 * - Device-specific performance optimization
 * - Construction site friendly interface (large touch targets)
 * - Performance trend analysis and regression detection
 * - Automated optimization suggestions
 * - Performance data export capabilities
 *
 * COMPLIANCE TARGETS:
 * - LCP: <2.5s (Good), <4.0s (Needs Improvement)
 * - FID: <100ms (Good), <300ms (Needs Improvement)
 * - CLS: <0.1 (Good), <0.25 (Needs Improvement)
 *
 * @author STR Certified Engineering Team
 */

import React, { useState, useCallback } from "react";
import {
  useCoreWebVitalsMonitoring,
  useCoreWebVitals,
  usePerformanceBudgets,
} from "@/hooks/useCoreWebVitalsMonitoring";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Gauge,
  Monitor,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Wifi,
} from "lucide-react";

interface PerformanceDashboardProps {
  id?: string;
  variant?: "compact" | "detailed" | "full";
  enableAlerts?: boolean;
  enableOptimizations?: boolean;
  className?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  id = "performance-dashboard",
  variant = "detailed",
  enableAlerts = true,
  enableOptimizations = true,
  className = "",
}) => {
  const [state, actions] = useCoreWebVitalsMonitoring({
    enableAlerts,
    enableOptimizationSuggestions: enableOptimizations,
  });

  const [showExportOptions, setShowExportOptions] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "metrics" | "budgets" | "trends" | "suggestions"
  >("metrics");

  // Get performance rating color
  const getRatingColor = (
    rating: "good" | "needs-improvement" | "poor" | null,
  ): string => {
    switch (rating) {
      case "good":
        return "text-green-600 bg-green-50 border-green-200";
      case "needs-improvement":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "poor":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Get performance score color
  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 50) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  // Format metric value
  const formatMetricValue = (value: number, unit: string): string => {
    if (unit === "ms") {
      return value < 1000
        ? `${Math.round(value)}ms`
        : `${(value / 1000).toFixed(2)}s`;
    }
    return `${value.toFixed(3)}${unit}`;
  };

  // Handle export
  const handleExport = useCallback(
    (format: "json" | "csv") => {
      try {
        const data = actions.exportData(format);
        const blob = new Blob([data], {
          type: format === "json" ? "application/json" : "text/csv",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `performance-data-${new Date().toISOString().split("T")[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowExportOptions(false);
      } catch (error) {
        console.error("Export failed:", error);
      }
    },
    [actions],
  );

  if (variant === "compact") {
    return (
      <div
        id={id}
        className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm ${className}`}
      >
        <div
          id="compact-performance-header"
          className="flex items-center justify-between mb-3"
        >
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900">
              Performance
            </span>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(state.metrics.performanceScore)}`}
          >
            {state.metrics.performanceScore}
          </div>
        </div>

        <div id="compact-core-metrics" className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-gray-500">LCP</div>
            <div
              className={`text-sm font-medium ${state.metrics.lcp ? getRatingColor(state.metrics.lcp.rating) : "text-gray-400"}`}
            >
              {state.metrics.lcp
                ? formatMetricValue(state.metrics.lcp.value, "ms")
                : "N/A"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">FID</div>
            <div
              className={`text-sm font-medium ${state.metrics.fid ? getRatingColor(state.metrics.fid.rating) : "text-gray-400"}`}
            >
              {state.metrics.fid
                ? formatMetricValue(state.metrics.fid.value, "ms")
                : "N/A"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">CLS</div>
            <div
              className={`text-sm font-medium ${state.metrics.cls ? getRatingColor(state.metrics.cls.rating) : "text-gray-400"}`}
            >
              {state.metrics.cls
                ? formatMetricValue(state.metrics.cls.value, "")
                : "N/A"}
            </div>
          </div>
        </div>

        {state.alerts.length > 0 && (
          <div
            id="compact-alerts"
            className="mt-3 pt-3 border-t border-gray-200"
          >
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              <span>{state.alerts.length} performance alerts</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div
        id={id}
        className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
      >
        <div
          id="detailed-performance-header"
          className="flex items-center justify-between p-4 border-b border-gray-200"
        >
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Core Web Vitals
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(state.metrics.performanceScore)}`}
            >
              Score: {state.metrics.performanceScore}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {state.isMonitoring ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              {state.isMonitoring ? "Monitoring" : "Stopped"}
            </div>
          </div>
        </div>

        <div id="detailed-performance-content" className="p-4">
          {/* Core Web Vitals Grid */}
          <div
            id="core-web-vitals-grid"
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
          >
            {/* LCP */}
            <div
              className={`border rounded-lg p-4 ${state.metrics.lcp ? getRatingColor(state.metrics.lcp.rating) : "border-gray-200"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Largest Contentful Paint
                </span>
                <Clock className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold">
                {state.metrics.lcp
                  ? formatMetricValue(state.metrics.lcp.value, "ms")
                  : "N/A"}
              </div>
              <div className="text-xs mt-1">
                Target: &lt;2.5s | {state.metrics.lcp?.rating || "N/A"}
              </div>
            </div>

            {/* FID */}
            <div
              className={`border rounded-lg p-4 ${state.metrics.fid ? getRatingColor(state.metrics.fid.rating) : "border-gray-200"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">First Input Delay</span>
                <Activity className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold">
                {state.metrics.fid
                  ? formatMetricValue(state.metrics.fid.value, "ms")
                  : "N/A"}
              </div>
              <div className="text-xs mt-1">
                Target: &lt;100ms | {state.metrics.fid?.rating || "N/A"}
              </div>
            </div>

            {/* CLS */}
            <div
              className={`border rounded-lg p-4 ${state.metrics.cls ? getRatingColor(state.metrics.cls.rating) : "border-gray-200"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Cumulative Layout Shift
                </span>
                <Monitor className="h-4 w-4" />
              </div>
              <div className="text-2xl font-bold">
                {state.metrics.cls
                  ? formatMetricValue(state.metrics.cls.value, "")
                  : "N/A"}
              </div>
              <div className="text-xs mt-1">
                Target: &lt;0.1 | {state.metrics.cls?.rating || "N/A"}
              </div>
            </div>
          </div>

          {/* Supporting Metrics */}
          <div
            id="supporting-metrics"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">FCP</div>
              <div className="text-lg font-semibold">
                {state.metrics.fcp
                  ? formatMetricValue(state.metrics.fcp.value, "ms")
                  : "N/A"}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">TTFB</div>
              <div className="text-lg font-semibold">
                {state.metrics.ttfb
                  ? formatMetricValue(state.metrics.ttfb.value, "ms")
                  : "N/A"}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">Device</div>
              <div className="text-lg font-semibold flex items-center gap-1">
                {state.deviceMetrics.deviceType === "mobile" ? (
                  <Smartphone className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
                {state.deviceMetrics.deviceType}
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">Connection</div>
              <div className="text-lg font-semibold flex items-center gap-1">
                <Wifi className="h-4 w-4" />
                {state.deviceMetrics.effectiveConnectionType}
              </div>
            </div>
          </div>

          {/* Performance Alerts */}
          {state.alerts.length > 0 && (
            <div id="performance-alerts" className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  Performance Alerts
                </h4>
                <button
                  onClick={actions.clearAlerts}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {state.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${
                      alert.severity === "critical"
                        ? "bg-red-50 border-red-200 text-red-800"
                        : alert.severity === "warning"
                          ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                          : "bg-blue-50 border-blue-200 text-blue-800"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {alert.message}
                        </div>
                        <div className="text-xs mt-1">
                          {alert.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div
            id="performance-actions"
            className="flex items-center justify-between pt-4 border-t border-gray-200"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={actions.refreshMetrics}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Metrics
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                {showExportOptions && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <button
                      onClick={() => handleExport("json")}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Export as CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {new Date(state.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full variant with tabs and comprehensive data
  return (
    <div
      id={id}
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      <div
        id="full-performance-header"
        className="flex items-center justify-between p-6 border-b border-gray-200"
      >
        <div className="flex items-center gap-3">
          <Gauge className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Performance Dashboard
            </h2>
            <p className="text-sm text-gray-600">
              Core Web Vitals monitoring and optimization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`px-4 py-2 rounded-full text-lg font-bold ${getScoreColor(state.metrics.performanceScore)}`}
          >
            {state.metrics.performanceScore}
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg ${state.isMonitoring ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            {state.isMonitoring ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {state.isMonitoring ? "Active Monitoring" : "Monitoring Stopped"}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div id="performance-tabs" className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: "metrics", label: "Core Metrics", icon: Gauge },
            {
              id: "budgets",
              label: "Performance Budgets",
              icon: AlertTriangle,
            },
            { id: "trends", label: "Trends", icon: TrendingUp },
            { id: "suggestions", label: "Optimizations", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div id="performance-tab-content" className="p-6">
        {activeTab === "metrics" && (
          <div id="metrics-tab" className="space-y-6">
            {/* Core Web Vitals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LCP Card */}
              <div
                className={`border-2 rounded-xl p-6 ${state.metrics.lcp ? getRatingColor(state.metrics.lcp.rating) : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Largest Contentful Paint
                  </h3>
                  <Clock className="h-6 w-6" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {state.metrics.lcp
                    ? formatMetricValue(state.metrics.lcp.value, "ms")
                    : "N/A"}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Target: &lt;2.5s</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${state.metrics.lcp ? getRatingColor(state.metrics.lcp.rating) : ""}`}
                  >
                    {state.metrics.lcp?.rating || "N/A"}
                  </span>
                </div>
                {state.metrics.lcp?.trend && (
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    {state.metrics.lcp.trend === "improving" ? (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    ) : state.metrics.lcp.trend === "degrading" ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="capitalize">
                      {state.metrics.lcp.trend}
                    </span>
                  </div>
                )}
              </div>

              {/* FID Card */}
              <div
                className={`border-2 rounded-xl p-6 ${state.metrics.fid ? getRatingColor(state.metrics.fid.rating) : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">First Input Delay</h3>
                  <Activity className="h-6 w-6" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {state.metrics.fid
                    ? formatMetricValue(state.metrics.fid.value, "ms")
                    : "N/A"}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Target: &lt;100ms</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${state.metrics.fid ? getRatingColor(state.metrics.fid.rating) : ""}`}
                  >
                    {state.metrics.fid?.rating || "N/A"}
                  </span>
                </div>
                {state.metrics.fid?.trend && (
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    {state.metrics.fid.trend === "improving" ? (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    ) : state.metrics.fid.trend === "degrading" ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="capitalize">
                      {state.metrics.fid.trend}
                    </span>
                  </div>
                )}
              </div>

              {/* CLS Card */}
              <div
                className={`border-2 rounded-xl p-6 ${state.metrics.cls ? getRatingColor(state.metrics.cls.rating) : "border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Cumulative Layout Shift
                  </h3>
                  <Monitor className="h-6 w-6" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {state.metrics.cls
                    ? formatMetricValue(state.metrics.cls.value, "")
                    : "N/A"}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Target: &lt;0.1</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${state.metrics.cls ? getRatingColor(state.metrics.cls.rating) : ""}`}
                  >
                    {state.metrics.cls?.rating || "N/A"}
                  </span>
                </div>
                {state.metrics.cls?.trend && (
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    {state.metrics.cls.trend === "improving" ? (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    ) : state.metrics.cls.trend === "degrading" ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : (
                      <Activity className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="capitalize">
                      {state.metrics.cls.trend}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Supporting Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  First Contentful Paint
                </div>
                <div className="text-2xl font-bold">
                  {state.metrics.fcp
                    ? formatMetricValue(state.metrics.fcp.value, "ms")
                    : "N/A"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Target: &lt;1.8s
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  Time to First Byte
                </div>
                <div className="text-2xl font-bold">
                  {state.metrics.ttfb
                    ? formatMetricValue(state.metrics.ttfb.value, "ms")
                    : "N/A"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Target: &lt;800ms
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Device Type</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {state.deviceMetrics.deviceType === "mobile" ? (
                    <Smartphone className="h-6 w-6" />
                  ) : (
                    <Monitor className="h-6 w-6" />
                  )}
                  <span className="capitalize">
                    {state.deviceMetrics.deviceType}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {state.deviceMetrics.isLowEndDevice
                    ? "Low-end device"
                    : "Standard device"}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Connection</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Wifi className="h-6 w-6" />
                  <span className="uppercase">
                    {state.deviceMetrics.effectiveConnectionType}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {state.deviceMetrics.connectionType}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "budgets" && (
          <div id="budgets-tab" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Budgets
              </h3>
              <span className="text-sm text-gray-500">
                {state.budgets.length} budgets configured
              </span>
            </div>

            <div className="space-y-4">
              {state.budgets.map((budget, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    budget.status === "exceeded"
                      ? "border-red-200 bg-red-50"
                      : budget.status === "warning"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-green-200 bg-green-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium uppercase">{budget.metric}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        budget.status === "exceeded"
                          ? "bg-red-200 text-red-800"
                          : budget.status === "warning"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-green-200 text-green-800"
                      }`}
                    >
                      {budget.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      Current: <strong>{Math.round(budget.current)}ms</strong>
                    </span>
                    <span>
                      Target: <strong>{Math.round(budget.target)}ms</strong>
                    </span>
                    <span>
                      Warning: <strong>{Math.round(budget.warning)}ms</strong>
                    </span>
                    <span>
                      Critical: <strong>{Math.round(budget.critical)}ms</strong>
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          budget.status === "exceeded"
                            ? "bg-red-600"
                            : budget.status === "warning"
                              ? "bg-yellow-600"
                              : "bg-green-600"
                        }`}
                        style={{
                          width: `${Math.min(100, (budget.current / budget.critical) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "trends" && (
          <div id="trends-tab" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Trends
              </h3>
              <span className="text-sm text-gray-500">24h period</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {state.trends.map((trend, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium uppercase">{trend.metric}</h4>
                    <div className="flex items-center gap-1">
                      {trend.trend === "improving" ? (
                        <TrendingDown className="h-4 w-4 text-green-600" />
                      ) : trend.trend === "degrading" ? (
                        <TrendingUp className="h-4 w-4 text-red-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-600" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          trend.trend === "improving"
                            ? "text-green-600"
                            : trend.trend === "degrading"
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {trend.trend}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Average:</span>
                      <span className="font-medium">
                        {Math.round(trend.average)}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>P75:</span>
                      <span className="font-medium">
                        {Math.round(trend.p75)}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>P95:</span>
                      <span className="font-medium">
                        {Math.round(trend.p95)}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Samples:</span>
                      <span className="font-medium">{trend.samples}</span>
                    </div>
                  </div>

                  {trend.regressionDetected && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                      Regression detected
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "suggestions" && (
          <div id="suggestions-tab" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Optimization Suggestions
              </h3>
              <span className="text-sm text-gray-500">
                {actions.getOptimizationSuggestions().length} recommendations
              </span>
            </div>

            <div className="space-y-4">
              {actions.getOptimizationSuggestions().map((suggestion, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    suggestion.type === "critical"
                      ? "border-red-200 bg-red-50"
                      : suggestion.type === "important"
                        ? "border-yellow-200 bg-yellow-50"
                        : suggestion.type === "moderate"
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{suggestion.suggestion}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {suggestion.issue}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          suggestion.type === "critical"
                            ? "bg-red-200 text-red-800"
                            : suggestion.type === "important"
                              ? "bg-yellow-200 text-yellow-800"
                              : suggestion.type === "moderate"
                                ? "bg-blue-200 text-blue-800"
                                : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {suggestion.type}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          suggestion.impact === "high"
                            ? "bg-green-200 text-green-800"
                            : suggestion.impact === "medium"
                              ? "bg-yellow-200 text-yellow-800"
                              : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {suggestion.impact} impact
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Metric: {suggestion.metric.toUpperCase()}</span>
                    <span>Effort: {suggestion.effort}</span>
                    <span>Priority: {suggestion.priority}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div
        id="performance-footer"
        className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={actions.refreshMetrics}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh All Metrics
          </button>
          {state.alerts.length > 0 && (
            <button
              onClick={actions.clearAlerts}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Clear {state.alerts.length} Alerts
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Data
            </button>
            {showExportOptions && (
              <div className="absolute bottom-full left-0 mb-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={() => handleExport("json")}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Export as JSON
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Export as CSV
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(state.lastUpdate).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
