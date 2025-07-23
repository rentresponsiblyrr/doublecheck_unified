/**
 * System Health Monitor for Checklist Management
 * Displays database connectivity and system status
 */

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { SystemHealth } from "./types";

interface ChecklistSystemHealthProps {
  health: SystemHealth;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
}

export const ChecklistSystemHealth: React.FC<ChecklistSystemHealthProps> = ({
  health,
  isRefreshing,
  onRefresh,
}) => {
  const isHealthy =
    health.tableExists &&
    health.hasData &&
    health.hasPermissions &&
    health.canConnect;
  const hasWarnings = !health.hasData || !health.hasPermissions;

  const getStatusIcon = () => {
    if (isHealthy) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (hasWarnings) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusVariant = () => {
    if (isHealthy) return "default";
    if (hasWarnings) return "secondary";
    return "destructive";
  };

  const getStatusMessage = () => {
    if (isHealthy) return "All systems operational";
    if (!health.canConnect) return "Database connection failed";
    if (!health.tableExists) return "Checklist table not found";
    if (!health.hasPermissions) return "Insufficient database permissions";
    if (!health.hasData) return "No checklist data found";
    return "System status unknown";
  };

  return (
    <Alert variant={getStatusVariant()} className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <AlertTitle className="text-sm font-medium">System Health</AlertTitle>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Refresh system health"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <AlertDescription className="mt-2">
        <div className="flex flex-col space-y-2">
          <span>{getStatusMessage()}</span>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant={health.canConnect ? "default" : "destructive"}
              className="text-xs"
            >
              <Wifi className="h-3 w-3 mr-1" />
              Connection
            </Badge>

            <Badge
              variant={health.tableExists ? "default" : "destructive"}
              className="text-xs"
            >
              <HardDrive className="h-3 w-3 mr-1" />
              Table
            </Badge>

            <Badge
              variant={health.hasPermissions ? "default" : "secondary"}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Permissions
            </Badge>

            <Badge
              variant={health.hasData ? "default" : "secondary"}
              className="text-xs"
            >
              <HardDrive className="h-3 w-3 mr-1" />
              Data
            </Badge>
          </div>

          {health.errorDetails && (
            <div className="text-xs text-red-600 mt-2 font-mono bg-red-50 p-2 rounded">
              {health.errorDetails}
            </div>
          )}

          <div className="text-xs text-gray-500">
            Last checked: {health.lastChecked.toLocaleTimeString()}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
