/**
 * Security Metrics Overview Component
 * Displays high-level security metrics and compliance status
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
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface ComplianceStatus {
  status: "compliant" | "partial" | "non-compliant";
  score: number;
  lastAudit: string;
  nextAudit: string;
}

interface SecurityMetrics {
  overallScore: number;
  complianceStatus: {
    soc2: ComplianceStatus;
    gdpr: ComplianceStatus;
    hipaa: ComplianceStatus;
    pciDss: ComplianceStatus;
  };
  threatDetection: {
    activeThreats: number;
    criticalThreats: number;
    resolvedThreats: number;
    lastUpdate: string;
  };
}

interface SecurityMetricsOverviewProps {
  metrics: SecurityMetrics;
  isLoading?: boolean;
}

export const SecurityMetricsOverview: React.FC<
  SecurityMetricsOverviewProps
> = ({ metrics, isLoading = false }) => {
  const getComplianceIcon = (status: ComplianceStatus) => {
    switch (status.status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "partial":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "non-compliant":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getComplianceBadgeVariant = (status: ComplianceStatus) => {
    switch (status.status) {
      case "compliant":
        return "default";
      case "partial":
        return "secondary";
      case "non-compliant":
        return "destructive";
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Security Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Overall Security Score
          </CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.overallScore}/100</div>
          <Progress value={metrics.overallScore} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Security posture based on all compliance and threat metrics
          </p>
        </CardContent>
      </Card>

      {/* Compliance Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(metrics.complianceStatus).map(([standard, status]) => (
          <Card key={standard}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {standard.toUpperCase()}
              </CardTitle>
              {getComplianceIcon(status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.score}%</div>
              <Badge
                variant={getComplianceBadgeVariant(status)}
                className="mt-2"
              >
                {status.status.replace("-", " ")}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                Last audit: {new Date(status.lastAudit).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Threat Detection Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.threatDetection.activeThreats}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.threatDetection.criticalThreats}
            </div>
            <p className="text-xs text-muted-foreground">
              High priority incidents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resolved Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.threatDetection.resolvedThreats}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully mitigated
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
