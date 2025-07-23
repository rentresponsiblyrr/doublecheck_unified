import React from "react";
import { PerformanceContainer } from "./PerformanceContainer";

interface PerformanceMonitoringDashboardProps {
  refreshIntervalMs?: number;
  showAdvancedMetrics?: boolean;
}

export const PerformanceMonitoringDashboard: React.FC<
  PerformanceMonitoringDashboardProps
> = ({ refreshIntervalMs = 5000, showAdvancedMetrics = false }) => {
  return (
    <PerformanceContainer
      refreshIntervalMs={refreshIntervalMs}
      showAdvancedMetrics={showAdvancedMetrics}
    />
  );
};
