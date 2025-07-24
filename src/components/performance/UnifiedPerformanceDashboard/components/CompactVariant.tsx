/**
 * COMPACT VARIANT COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional compact performance dashboard showing key metrics.
 * Clean separation from UnifiedPerformanceDashboard for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import { Gauge, Smartphone } from "lucide-react";

interface PWAState {
  cacheHitRate?: number;
  networkQuality: string;
}

interface CWVMetrics {
  lcp?: { value: number };
  fid?: { value: number };
}

interface CWVState {
  metrics?: CWVMetrics;
}

interface CompactVariantProps {
  id?: string;
  className?: string;
  healthStatus: string;
  pwaState: PWAState;
  cwvState: CWVState;
  getHealthStatusStyles: (status: string) => string;
}

export const CompactVariant: React.FC<CompactVariantProps> = ({
  id,
  className,
  healthStatus,
  pwaState,
  cwvState,
  getHealthStatusStyles,
}) => {
  return (
    <div
      id={id}
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-blue-600" />
          <h3 className="font-semibold text-gray-900">System Performance</h3>
        </div>
        <div
          className={`px-2 py-1 rounded-md text-xs font-medium border ${getHealthStatusStyles(healthStatus)}`}
        >
          {healthStatus.replace("-", " ")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* PWA Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">PWA</span>
          </div>
          <div className="text-xs text-gray-600">
            Cache: {Math.round(pwaState.cacheHitRate || 0)}%
          </div>
          <div className="text-xs text-gray-600">
            Network: {pwaState.networkQuality}
          </div>
        </div>

        {/* Performance Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Performance</span>
          </div>
          <div className="text-xs text-gray-600">
            LCP:{" "}
            {cwvState.metrics?.lcp?.value
              ? `${Math.round(cwvState.metrics.lcp.value)}ms`
              : "N/A"}
          </div>
          <div className="text-xs text-gray-600">
            FID:{" "}
            {cwvState.metrics?.fid?.value
              ? `${Math.round(cwvState.metrics.fid.value)}ms`
              : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};
