/**
 * Health Check Results - Display Component
 * Extracted from ProductionHealthCheck.tsx
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Database,
  Users,
  Activity,
} from "lucide-react";
import type {
  HealthCheckReport,
  HealthCheckResult,
} from "../../../types/health-check";

interface HealthCheckResultsProps {
  report: HealthCheckReport;
}

export const HealthCheckResults: React.FC<HealthCheckResultsProps> = ({
  report,
}) => {
  const getStatusIcon = (status: HealthCheckResult["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "fail":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: HealthCheckResult["status"]) => {
    const variants = {
      pass: "default",
      fail: "destructive",
      warning: "secondary",
      running: "outline",
    } as const;

    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "database":
        return <Database className="w-5 h-5" />;
      case "auth":
        return <Shield className="w-5 h-5" />;
      case "users":
        return <Users className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div id="health-check-results" className="space-y-6">
      {/* Overall Status */}
      <Alert
        className={`
        ${report.overall === "healthy" ? "border-green-200 bg-green-50" : ""}
        ${report.overall === "degraded" ? "border-yellow-200 bg-yellow-50" : ""}
        ${report.overall === "critical" ? "border-red-200 bg-red-50" : ""}
      `}
      >
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(report.overall === "healthy" ? "pass" : "fail")}
            <span className="font-medium">
              System Status: {report.overall.toUpperCase()}
            </span>
          </div>
          <Badge
            variant={report.overall === "healthy" ? "default" : "destructive"}
          >
            {report.passedChecks}/{report.totalChecks} Checks Passed
          </Badge>
        </AlertDescription>
      </Alert>

      {/* Detailed Results */}
      <div id="detailed-results" className="grid gap-4 md:grid-cols-2">
        {Object.entries(report.categories).map(([category, results]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {getCategoryIcon(category)}
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.name}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-gray-600">{result.message}</p>
                      {result.details && (
                        <p className="text-xs text-gray-500 mt-1">
                          {result.details}
                        </p>
                      )}
                      {result.error && (
                        <p className="text-xs text-red-600 mt-1 font-mono">
                          {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
