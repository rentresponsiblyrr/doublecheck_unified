/**
 * Performance Overview Component
 * High-level performance metrics, alerts, and health indicators
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Gauge,
  Globe,
  Smartphone,
} from "lucide-react";

interface CoreWebVitals {
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  status: "good" | "needs-improvement" | "poor";
}

interface RegressionAlert {
  metric: string;
  severity: "warning" | "critical" | "emergency";
  degradation: number;
  confidence: number;
}

interface UserJourneys {
  totalJourneys: number;
  completionRate: number;
  averageDuration: number;
  abandonmentPoints: string[];
}

interface DeviceMetrics {
  mobile: number;
  tablet: number;
  desktop: number;
  networkTypes: Record<string, number>;
}

interface PerformanceOverviewProps {
  coreWebVitals: CoreWebVitals;
  regressionAlerts: RegressionAlert[];
  userJourneys: UserJourneys;
  deviceMetrics: DeviceMetrics;
  isLoading?: boolean;
}

export const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({
  coreWebVitals,
  regressionAlerts,
  userJourneys,
  deviceMetrics,
  isLoading = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600 bg-green-100";
      case "needs-improvement":
        return "text-yellow-600 bg-yellow-100";
      case "poor":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "emergency":
        return "destructive";
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Performance Alerts */}
      {regressionAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{regressionAlerts.length} performance regression(s)</strong>{" "}
            detected.
            {regressionAlerts.filter((a) => a.severity === "emergency").length >
              0 && " Emergency-level issues require immediate attention."}
          </AlertDescription>
        </Alert>
      )}

      {/* Core Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Status
            </CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(coreWebVitals.status)}>
                {coreWebVitals.status.replace("-", " ")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Core Web Vitals assessment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Journeys</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userJourneys.completionRate.toFixed(1)}%
            </div>
            <div className="flex items-center mt-2">
              {userJourneys.completionRate >= 90 ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className="text-xs text-muted-foreground">
                {userJourneys.totalJourneys.toLocaleString()} total journeys
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(userJourneys.averageDuration / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Journey completion time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Usage</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deviceMetrics.mobile.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Mobile traffic share
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Regression Alerts */}
      {regressionAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Performance Regressions
            </CardTitle>
            <CardDescription>
              Detected performance degradations requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {regressionAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <div>
                      <div className="font-medium">{alert.metric}</div>
                      <div className="text-sm text-muted-foreground">
                        {alert.degradation.toFixed(1)}% degradation •{" "}
                        {alert.confidence.toFixed(0)}% confidence
                      </div>
                    </div>
                  </div>
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device & Network Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Device Distribution
            </CardTitle>
            <CardDescription>Traffic breakdown by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mobile</span>
                <span className="text-sm font-bold">
                  {deviceMetrics.mobile.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Desktop</span>
                <span className="text-sm font-bold">
                  {deviceMetrics.desktop.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tablet</span>
                <span className="text-sm font-bold">
                  {deviceMetrics.tablet.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Network Types
            </CardTitle>
            <CardDescription>Connection type distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(deviceMetrics.networkTypes).map(
                ([type, percentage]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{type}</span>
                    <span className="text-sm font-bold">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Journey Issues */}
      {userJourneys.abandonmentPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Journey Abandonment Points</CardTitle>
            <CardDescription>
              Common points where users abandon their journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {userJourneys.abandonmentPoints.map((point, index) => (
                <div
                  key={index}
                  className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"
                >
                  {point}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
