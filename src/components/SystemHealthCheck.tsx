/**
 * System Health Check Component
 * Validates system integrity and provides recovery options
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Wifi,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { schemaValidationService } from "@/services/schemaValidationService";
import { supabase } from "@/integrations/supabase/client";

interface HealthStatus {
  overall: "healthy" | "warning" | "error";
  database: "healthy" | "warning" | "error";
  authentication: "healthy" | "warning" | "error";
  network: "healthy" | "warning" | "error";
  details: string[];
  suggestions: string[];
}

export const SystemHealthCheck: React.FC<{
  onHealthy?: () => void;
  onError?: (status: HealthStatus) => void;
  autoRun?: boolean;
}> = ({ onHealthy, onError, autoRun = true }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const runHealthCheck = async (): Promise<HealthStatus> => {
    const status: HealthStatus = {
      overall: "healthy",
      database: "healthy",
      authentication: "healthy",
      network: "healthy",
      details: [],
      suggestions: [],
    };

    try {
      // Check database access
      const dbValidation = await schemaValidationService.validateTableAccess();

      if (!dbValidation.isValid) {
        status.database = "error";
        status.details.push("Database access issues detected");
        status.details.push(...dbValidation.errors);
        status.suggestions.push(...dbValidation.suggestions);
      } else if (dbValidation.warnings.length > 0) {
        status.database = "warning";
        status.details.push("Database warnings detected");
        status.details.push(...dbValidation.warnings);
      } else {
        status.details.push("Database access: OK");
      }

      // Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        status.authentication = "error";
        status.details.push("Authentication failed");
        if (authError) status.details.push(authError.message);
        status.suggestions.push("Please log in again");
      } else {
        status.details.push("Authentication: OK");

        // Check user role using RPC function (avoids 503 table access errors)
        const { data: userRole, error: roleError } = await supabase.rpc(
          "get_user_role_simple",
          {
            _user_id: user.id,
          },
        );

        if (roleError) {
          status.authentication = "warning";
          status.details.push("User role access warning");
          status.details.push(roleError.message);
        } else if (!userRole) {
          status.authentication = "warning";
          status.details.push("User role not found");
          status.suggestions.push("Complete user profile setup");
        } else {
          status.details.push(`User role: ${userRole}`);
        }
      }

      // Check network connectivity
      try {
        const networkStart = Date.now();
        const { error: networkError } = await supabase
          .from("properties")
          .select("id")
          .limit(1)
          .maybeSingle();

        const networkTime = Date.now() - networkStart;

        if (networkError) {
          status.network = "error";
          status.details.push("Network connectivity issues");
          status.details.push(networkError.message);
          status.suggestions.push("Check your internet connection");
        } else if (networkTime > 5000) {
          status.network = "warning";
          status.details.push(`Slow network response: ${networkTime}ms`);
          status.suggestions.push(
            "Network performance may affect user experience",
          );
        } else {
          status.details.push(`Network response: ${networkTime}ms`);
        }
      } catch (networkError) {
        status.network = "error";
        status.details.push("Network test failed");
        status.details.push(
          networkError instanceof Error
            ? networkError.message
            : "Unknown network error",
        );
        status.suggestions.push("Check your internet connection");
      }

      // Determine overall status
      if (
        status.database === "error" ||
        status.authentication === "error" ||
        status.network === "error"
      ) {
        status.overall = "error";
      } else if (
        status.database === "warning" ||
        status.authentication === "warning" ||
        status.network === "warning"
      ) {
        status.overall = "warning";
      }

      status.details.push(
        `Health check completed at ${new Date().toLocaleTimeString()}`,
      );
    } catch (error) {
      status.overall = "error";
      status.database = "error";
      status.authentication = "error";
      status.network = "error";
      status.details.push("Health check failed completely");
      status.details.push(
        error instanceof Error ? error.message : "Unknown error",
      );
      status.suggestions.push("Try refreshing the page");
      status.suggestions.push("Check your internet connection");
    }

    return status;
  };

  const performHealthCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const status = await runHealthCheck();
      setHealthStatus(status);

      if (status.overall === "healthy") {
        onHealthy?.();
      } else {
        onError?.(status);
      }
    } catch (error) {
      const errorStatus: HealthStatus = {
        overall: "error",
        database: "error",
        authentication: "error",
        network: "error",
        details: [
          "Health check system error",
          error instanceof Error ? error.message : "Unknown error",
        ],
        suggestions: ["Refresh the page", "Contact support if issue persists"],
      };
      setHealthStatus(errorStatus);
      onError?.(errorStatus);
    } finally {
      setIsChecking(false);
    }
  }, [onHealthy, onError]);

  useEffect(() => {
    if (autoRun) {
      performHealthCheck();
    }
  }, [autoRun, performHealthCheck]);

  const getStatusIcon = (status: "healthy" | "warning" | "error") => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: "healthy" | "warning" | "error") => {
    switch (status) {
      case "healthy":
        return "text-green-700 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "error":
        return "text-red-700 bg-red-50 border-red-200";
    }
  };

  if (!healthStatus && !isChecking) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={performHealthCheck} className="w-full">
            <Shield className="w-4 h-4 mr-2" />
            Run Health Check
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isChecking) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Checking System Health...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="text-sm">Checking database access...</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Verifying authentication...</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              <span className="text-sm">Testing network connectivity...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthStatus) return null;

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>System Health</span>
          {getStatusIcon(healthStatus.overall)}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Status */}
        <Alert className={getStatusColor(healthStatus.overall)}>
          <AlertDescription>
            System Status: <strong>{healthStatus.overall.toUpperCase()}</strong>
            {healthStatus.overall !== "healthy" && (
              <span className="block mt-1 text-xs">
                Issues detected that may affect functionality
              </span>
            )}
          </AlertDescription>
        </Alert>

        {/* Component Status */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            {getStatusIcon(healthStatus.database)}
            <span>Database</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {getStatusIcon(healthStatus.authentication)}
            <span>Auth</span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            {getStatusIcon(healthStatus.network)}
            <span>Network</span>
          </div>
        </div>

        {/* Suggestions */}
        {healthStatus.suggestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              💡 Recommendations:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              {healthStatus.suggestions.map((suggestion, index) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={performHealthCheck}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Recheck
          </Button>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            size="sm"
          >
            {showDetails ? "Hide" : "Show"} Details
          </Button>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-800 mb-2">
              Diagnostic Details:
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              {healthStatus.details.map((detail, index) => (
                <div key={index}>• {detail}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
