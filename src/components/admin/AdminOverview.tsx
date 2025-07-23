import React, { useState } from "react";
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
import { Calendar, RefreshCw } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { KPICards } from "./overview/KPICards";
import { TrendCharts } from "./overview/TrendCharts";
import { QuickActions } from "./overview/QuickActions";
import { useAdminDashboard } from "./overview/useAdminDashboard";
import { TimeRange } from "./overview/types";

export const AdminOverview: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("30d");
  const { kpis, trends, regions, isLoading, reload } =
    useAdminDashboard(selectedTimeRange);

  const handleRefresh = () => {
    reload();
  };

  const getTimeRangeLabel = (range: TimeRange): string => {
    const labels = {
      "7d": "Last 7 Days",
      "30d": "Last 30 Days",
      "90d": "Last 90 Days",
      "1y": "Last Year",
    };
    return labels[range];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div id="admin-overview" className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-gray-600">
            Monitor your inspection business performance and metrics
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={selectedTimeRange}
            onValueChange={(value: TimeRange) => setSelectedTimeRange(value)}
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

          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KPICards kpis={kpis} />

      {/* Charts and Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <TrendCharts trendData={trends} regionalData={regions} />
        </div>

        <div className="xl:col-span-1">
          <QuickActions kpis={kpis} />
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Current system performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {kpis.aiAccuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">AI Accuracy</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {kpis.avgInspectionTime}min
              </div>
              <div className="text-sm text-gray-600">Avg Processing Time</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {kpis.avgPhotosPerInspection}
              </div>
              <div className="text-sm text-gray-600">Photos per Inspection</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
