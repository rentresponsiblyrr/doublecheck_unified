import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart3, Activity } from "lucide-react";
import { PerformanceTrend } from "@/types/performance-monitoring";

interface ChartsContainerProps {
  cpuTrend: PerformanceTrend[];
  memoryTrend: PerformanceTrend[];
  responseTimeTrend: PerformanceTrend[];
  showAdvancedMetrics: boolean;
}

export const ChartsContainer: React.FC<ChartsContainerProps> = ({
  cpuTrend,
  memoryTrend,
  responseTimeTrend,
  showAdvancedMetrics,
}) => {
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  const renderSimpleChart = (
    data: PerformanceTrend[],
    title: string,
    unit: string,
  ) => {
    if (data.length === 0) return null;

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];

    return (
      <Card key={title} id={`chart-${title.toLowerCase().replace(" ", "-")}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent
          id={`chart-content-${title.toLowerCase().replace(" ", "-")}`}
        >
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {latest.value.toFixed(1)}
              {unit}
            </div>
            <div className="flex items-center space-x-2">
              {previous && getTrendIcon(latest.value, previous.value)}
              <span className="text-xs text-muted-foreground">
                vs previous:{" "}
                {previous ? (latest.value - previous.value).toFixed(1) : "N/A"}
                {unit}
              </span>
            </div>
            <div className="h-16 w-full bg-muted rounded flex items-end justify-end space-x-1 p-2">
              {data.slice(-8).map((point, index) => {
                const height = Math.max(
                  (point.value / Math.max(...data.map((d) => d.value))) * 100,
                  5,
                );
                return (
                  <div
                    key={index}
                    className="bg-primary rounded-sm flex-1"
                    style={{ height: `${height}%` }}
                    title={`${point.value.toFixed(1)}${unit} at ${new Date(point.timestamp).toLocaleTimeString()}`}
                  />
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div id="charts-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Performance Trends</h3>
        <Badge variant={showAdvancedMetrics ? "default" : "secondary"}>
          {showAdvancedMetrics ? "Advanced" : "Basic"} View
        </Badge>
      </div>

      <div id="charts-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {renderSimpleChart(cpuTrend, "CPU Usage", "%")}
        {renderSimpleChart(memoryTrend, "Memory Usage", "%")}
        {renderSimpleChart(responseTimeTrend, "Response Time", "ms")}
      </div>

      {showAdvancedMetrics && (
        <Card id="advanced-metrics-card" className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Advanced Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent id="advanced-metrics-content">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Peak CPU</p>
                <p className="font-medium">
                  {Math.max(...cpuTrend.map((d) => d.value)).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Memory</p>
                <p className="font-medium">
                  {(
                    memoryTrend.reduce((acc, d) => acc + d.value, 0) /
                    memoryTrend.length
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Min Response</p>
                <p className="font-medium">
                  {Math.min(...responseTimeTrend.map((d) => d.value)).toFixed(
                    0,
                  )}
                  ms
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Data Points</p>
                <p className="font-medium">{cpuTrend.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
