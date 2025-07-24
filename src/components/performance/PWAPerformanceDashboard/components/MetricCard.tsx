/**
 * METRIC CARD COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional metric display card for PWA performance metrics.
 * Clean separation from PWAPerformanceDashboard for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  target?: number;
  status: "excellent" | "good" | "warning" | "critical";
  trend?: "up" | "down" | "stable";
  icon: React.ReactNode;
  description?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = "",
  target,
  status,
  trend,
  icon,
  description,
}) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card id={`metric-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={getStatusColor(status)}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-2xl font-bold ${getStatusColor(status)}`}>
              {typeof value === "number" ? value.toLocaleString() : value}
              {unit && (
                <span className="text-sm text-gray-600 ml-1">{unit}</span>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getTrendIcon(trend)}
          </div>
        </div>

        {target && typeof value === "number" && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress to target</span>
              <span>{target}</span>
            </div>
            <Progress
              value={Math.min((value / target) * 100, 100)}
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
