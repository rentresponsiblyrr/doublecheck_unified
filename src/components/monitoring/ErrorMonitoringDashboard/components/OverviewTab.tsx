/**
 * OVERVIEW TAB COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional overview tab for error monitoring dashboard.
 * Clean separation from ErrorMonitoringDashboard for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, Activity, AlertTriangle, Zap, Wifi } from "lucide-react";
import { OverviewMetricCard } from "./OverviewMetricCard";

interface ErrorStats {
  recoveryRate: number;
  totalErrors: number;
}

interface SystemHealth {
  criticalErrorsCount: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkStatus: string;
}

interface OverviewTabProps {
  overallHealthScore: number;
  errorStats: ErrorStats;
  systemHealth: SystemHealth;
  getNetworkStatusColor: (status: string) => string;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  overallHealthScore,
  errorStats,
  systemHealth,
  getNetworkStatusColor,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <OverviewMetricCard
          icon={<Shield className="w-4 h-4" />}
          title="Overall Health"
          value={`${overallHealthScore}%`}
          status={
            overallHealthScore >= 90
              ? "good"
              : overallHealthScore >= 75
                ? "warning"
                : "critical"
          }
        />

        <OverviewMetricCard
          icon={<Activity className="w-4 h-4" />}
          title="Recovery Rate"
          value={`${errorStats.recoveryRate.toFixed(1)}%`}
          status={
            errorStats.recoveryRate >= 95
              ? "good"
              : errorStats.recoveryRate >= 85
                ? "warning"
                : "critical"
          }
        />

        <OverviewMetricCard
          icon={<AlertTriangle className="w-4 h-4" />}
          title="Total Errors"
          value={errorStats.totalErrors.toString()}
          status={
            errorStats.totalErrors < 10
              ? "good"
              : errorStats.totalErrors < 50
                ? "warning"
                : "critical"
          }
        />

        <OverviewMetricCard
          icon={<Zap className="w-4 h-4" />}
          title="Critical Issues"
          value={systemHealth.criticalErrorsCount.toString()}
          status={
            systemHealth.criticalErrorsCount === 0
              ? "good"
              : systemHealth.criticalErrorsCount < 3
                ? "warning"
                : "critical"
          }
        />
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>{systemHealth.memoryUsage.toFixed(1)} MB</span>
              </div>
              <Progress
                value={Math.min((systemHealth.memoryUsage / 500) * 100, 100)}
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Cache Hit Rate</span>
                <span>{systemHealth.cacheHitRate.toFixed(1)}%</span>
              </div>
              <Progress value={systemHealth.cacheHitRate} className="h-2" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi
                className={`w-4 h-4 ${getNetworkStatusColor(systemHealth.networkStatus)}`}
              />
              <span className="text-sm capitalize">
                {systemHealth.networkStatus}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
