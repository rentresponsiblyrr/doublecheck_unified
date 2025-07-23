/**
 * User System Diagnostic Component
 * Displays authentication and user table health status
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Lock,
  AlertCircle,
} from "lucide-react";
import { SystemDiagnostic } from "./types";

interface UserSystemDiagnosticProps {
  diagnostic: SystemDiagnostic;
  isRefreshing: boolean;
  onRefresh: () => Promise<void>;
}

export const UserSystemDiagnostic: React.FC<UserSystemDiagnosticProps> = ({
  diagnostic,
  isRefreshing,
  onRefresh,
}) => {
  const getHealthStatus = () => {
    const allHealthy =
      diagnostic.usersTableExists &&
      diagnostic.authEnabled &&
      diagnostic.hasPermissions;
    return allHealthy ? "healthy" : "warning";
  };

  const healthStatus = getHealthStatus();

  return (
    <Card
      className={`mb-6 ${healthStatus === "warning" ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm">
            <Database className="h-4 w-4 mr-2" />
            User System Diagnostic
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* System Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex flex-col">
              <span className="text-xs text-gray-600">Users Table</span>
              <div className="flex items-center space-x-2 mt-1">
                {diagnostic.usersTableExists ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs font-medium">
                  {diagnostic.usersTableExists ? "Available" : "Missing"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex flex-col">
              <span className="text-xs text-gray-600">Authentication</span>
              <div className="flex items-center space-x-2 mt-1">
                {diagnostic.authEnabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs font-medium">
                  {diagnostic.authEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex flex-col">
              <span className="text-xs text-gray-600">Row Level Security</span>
              <div className="flex items-center space-x-2 mt-1">
                {diagnostic.rlsEnabled ? (
                  <Shield className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-xs font-medium">
                  {diagnostic.rlsEnabled ? "Active" : "Warning"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex flex-col">
              <span className="text-xs text-gray-600">Permissions</span>
              <div className="flex items-center space-x-2 mt-1">
                {diagnostic.hasPermissions ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Lock className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs font-medium">
                  {diagnostic.hasPermissions ? "Valid" : "Limited"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
          <div className="flex items-center space-x-3">
            {healthStatus === "healthy" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            <div>
              <div className="font-medium text-sm">
                {healthStatus === "healthy"
                  ? "All Systems Operational"
                  : "System Warnings Detected"}
              </div>
              <div className="text-xs text-gray-600">
                Last checked: {diagnostic.lastChecked.toLocaleTimeString()}
              </div>
            </div>
          </div>

          <Badge
            variant={healthStatus === "healthy" ? "default" : "secondary"}
            className={
              healthStatus === "healthy"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }
          >
            {healthStatus === "healthy" ? "Healthy" : "Warnings"}
          </Badge>
        </div>

        {/* Error Details */}
        {diagnostic.errorDetails && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-800">
                  System Error
                </div>
                <div className="text-xs text-red-600 mt-1 font-mono">
                  {diagnostic.errorDetails}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {healthStatus === "warning" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-800">
                  Recommendations
                </div>
                <ul className="text-xs text-blue-600 mt-1 space-y-1">
                  {!diagnostic.usersTableExists && (
                    <li>
                      • Ensure the users table exists and is properly configured
                    </li>
                  )}
                  {!diagnostic.authEnabled && (
                    <li>
                      • Enable Supabase authentication for user management
                    </li>
                  )}
                  {!diagnostic.rlsEnabled && (
                    <li>• Enable Row Level Security for data protection</li>
                  )}
                  {!diagnostic.hasPermissions && (
                    <li>• Check database permissions for user operations</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
