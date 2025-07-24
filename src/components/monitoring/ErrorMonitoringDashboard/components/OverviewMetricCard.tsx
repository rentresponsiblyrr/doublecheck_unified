/**
 * OVERVIEW METRIC CARD COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional metric card for error monitoring overview.
 * Clean separation from ErrorMonitoringDashboard for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface OverviewMetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  status: "good" | "warning" | "critical";
}

export const OverviewMetricCard: React.FC<OverviewMetricCardProps> = ({
  icon,
  title,
  value,
  status,
}) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <Card className={`${getStatusStyles(status)} border`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="text-lg font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};
