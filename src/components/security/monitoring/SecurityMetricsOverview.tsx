import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Lock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface SecurityMetrics {
  overallScore: number;
  threatsDetected: number;
  threatsBlocked: number;
  vulnerabilities: number;
  lastUpdated: Date;
  criticalAlerts: number;
  systemHealth: "healthy" | "warning" | "critical";
}

interface SecurityMetricsOverviewProps {
  metrics: SecurityMetrics;
  isLoading: boolean;
}

export const SecurityMetricsOverview: React.FC<
  SecurityMetricsOverviewProps
> = ({ metrics, isLoading }) => {
  const getHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "critical":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div
        id="security-metrics-loading"
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const blockRate =
    metrics.threatsDetected > 0
      ? (metrics.threatsBlocked / metrics.threatsDetected) * 100
      : 100;

  return (
    <div id="security-metrics-overview" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card id="security-score-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Security Score
            </CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overallScore}/100</div>
            <Progress value={metrics.overallScore} className="mt-2" />
            <div className="flex items-center mt-2">
              {getHealthIcon(metrics.systemHealth)}
              <span
                className={`text-sm ml-1 ${getHealthColor(metrics.systemHealth)}`}
              >
                {metrics.systemHealth.charAt(0).toUpperCase() +
                  metrics.systemHealth.slice(1)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card id="threats-detected-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Threats Detected
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.threatsDetected}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-orange-500 mr-1" />
              <span className="text-xs text-muted-foreground">
                Active monitoring
              </span>
            </div>
          </CardContent>
        </Card>

        <Card id="threats-blocked-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Threats Blocked
            </CardTitle>
            <Lock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.threatsBlocked}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Block rate: {blockRate.toFixed(1)}%
              </p>
              <Badge variant="secondary">
                {blockRate >= 95 ? "Excellent" : "Good"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card id="vulnerabilities-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Vulnerabilities
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.vulnerabilities}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Critical: {metrics.criticalAlerts}
              </p>
              {metrics.vulnerabilities === 0 ? (
                <Badge variant="secondary">Secure</Badge>
              ) : (
                <Badge variant="destructive">Action Required</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card id="security-status-summary">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Security Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {getHealthIcon(metrics.systemHealth)}
              <div>
                <p className="font-medium">
                  System{" "}
                  {metrics.systemHealth === "healthy"
                    ? "Secure"
                    : metrics.systemHealth === "warning"
                      ? "Monitoring"
                      : "Alert"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last updated: {metrics.lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">Protection Level</p>
              <p className="font-medium">
                {metrics.overallScore >= 90
                  ? "Maximum"
                  : metrics.overallScore >= 70
                    ? "High"
                    : metrics.overallScore >= 50
                      ? "Medium"
                      : "Low"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
