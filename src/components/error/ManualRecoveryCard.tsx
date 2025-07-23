/**
 * Manual Recovery Card Component
 * Extracted from MobileErrorRecovery.tsx
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw,
  Wifi,
  Database,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RecoveryAction } from "@/hooks/useMobileErrorRecovery";

interface ManualRecoveryCardProps {
  recoveryActions?: RecoveryAction[];
}

export const ManualRecoveryCard: React.FC<ManualRecoveryCardProps> = ({
  recoveryActions = [], // Provide default empty array to prevent map errors
}) => {
  // Don't render if no recovery actions available
  if (!recoveryActions || recoveryActions.length === 0) {
    return null;
  }
  const getIcon = (actionId: string) => {
    switch (actionId) {
      case "refresh-page":
        return <RefreshCw className="w-4 h-4" />;
      case "check-connection":
        return <Wifi className="w-4 h-4" />;
      case "clear-cache":
        return <Database className="w-4 h-4" />;
      case "restart-camera":
        return <Camera className="w-4 h-4" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: RecoveryAction["status"]) => {
    switch (status) {
      case "loading":
        return <LoadingSpinner className="w-4 h-4" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-sm">Manual Recovery Steps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recoveryActions.map((action, index) => (
          <div key={action.id}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0">{getIcon(action.id)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{action.title}</div>
                  <div className="text-xs text-gray-500">
                    {action.description}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(action.status)}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={action.action}
                  disabled={action.status === "loading"}
                >
                  {action.status === "loading" ? "Running..." : "Try"}
                </Button>
              </div>
            </div>
            {index < recoveryActions.length - 1 && (
              <Separator className="mt-3" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
