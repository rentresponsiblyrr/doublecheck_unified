/**
 * CORE WEB VITALS GRID COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional Core Web Vitals metrics display with performance ratings.
 * Clean separation from PerformanceDashboard for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import { Clock, Activity, Monitor } from "lucide-react";

interface WebVitalMetric {
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

interface CoreWebVitalsData {
  lcp?: WebVitalMetric;
  fid?: WebVitalMetric;
  cls?: WebVitalMetric;
}

interface CoreWebVitalsGridProps {
  metrics: CoreWebVitalsData;
  formatMetricValue: (value: number, unit: string) => string;
  getRatingColor: (rating: string) => string;
}

export const CoreWebVitalsGrid: React.FC<CoreWebVitalsGridProps> = ({
  metrics,
  formatMetricValue,
  getRatingColor,
}) => {
  return (
    <div
      id="core-web-vitals-grid"
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
    >
      {/* LCP */}
      <div
        className={`border rounded-lg p-4 ${
          metrics.lcp ? getRatingColor(metrics.lcp.rating) : "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Largest Contentful Paint</span>
          <Clock className="h-4 w-4" />
        </div>
        <div className="text-2xl font-bold">
          {metrics.lcp ? formatMetricValue(metrics.lcp.value, "ms") : "N/A"}
        </div>
        <div className="text-xs mt-1">
          Target: &lt;2.5s | {metrics.lcp?.rating || "N/A"}
        </div>
      </div>

      {/* FID */}
      <div
        className={`border rounded-lg p-4 ${
          metrics.fid ? getRatingColor(metrics.fid.rating) : "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">First Input Delay</span>
          <Activity className="h-4 w-4" />
        </div>
        <div className="text-2xl font-bold">
          {metrics.fid ? formatMetricValue(metrics.fid.value, "ms") : "N/A"}
        </div>
        <div className="text-xs mt-1">
          Target: &lt;100ms | {metrics.fid?.rating || "N/A"}
        </div>
      </div>

      {/* CLS */}
      <div
        className={`border rounded-lg p-4 ${
          metrics.cls ? getRatingColor(metrics.cls.rating) : "border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Cumulative Layout Shift</span>
          <Monitor className="h-4 w-4" />
        </div>
        <div className="text-2xl font-bold">
          {metrics.cls ? formatMetricValue(metrics.cls.value, "") : "N/A"}
        </div>
        <div className="text-xs mt-1">
          Target: &lt;0.1 | {metrics.cls?.rating || "N/A"}
        </div>
      </div>
    </div>
  );
};
