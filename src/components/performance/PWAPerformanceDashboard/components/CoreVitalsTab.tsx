/**
 * CORE VITALS TAB COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional Core Web Vitals metrics display tab.
 * Clean separation from PWAPerformanceDashboard for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import { Clock, Zap, Target } from "lucide-react";
import { MetricCard } from "./MetricCard";

interface CoreWebVitals {
  lcp?: number;
  fid?: number;
  cls?: number;
}

interface CoreWebVitalsStatus {
  lcp?: { status: string };
  fid?: { status: string };
  cls?: { status: string };
}

interface CoreVitalsTabProps {
  coreWebVitals: CoreWebVitals;
  coreWebVitalsStatus: CoreWebVitalsStatus;
}

export const CoreVitalsTab: React.FC<CoreVitalsTabProps> = ({
  coreWebVitals,
  coreWebVitalsStatus,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCard
        title="Largest Contentful Paint"
        value={coreWebVitals?.lcp || 2200}
        unit="ms"
        target={2500}
        status={
          coreWebVitalsStatus?.lcp?.status === "pass" ? "excellent" : "warning"
        }
        trend="up"
        icon={<Clock className="h-5 w-5" />}
        description="Loading performance of main content"
      />

      <MetricCard
        title="First Input Delay"
        value={coreWebVitals?.fid || 65}
        unit="ms"
        target={100}
        status={
          coreWebVitalsStatus?.fid?.status === "pass" ? "excellent" : "warning"
        }
        trend="stable"
        icon={<Zap className="h-5 w-5" />}
        description="Responsiveness to user input"
      />

      <MetricCard
        title="Cumulative Layout Shift"
        value={coreWebVitals?.cls || 0.08}
        target={0.1}
        status={
          coreWebVitalsStatus?.cls?.status === "pass" ? "excellent" : "warning"
        }
        trend="down"
        icon={<Target className="h-5 w-5" />}
        description="Visual stability during load"
      />
    </div>
  );
};
