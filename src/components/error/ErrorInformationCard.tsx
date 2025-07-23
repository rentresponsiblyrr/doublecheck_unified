/**
 * Error Information Card Component
 * Extracted from MobileErrorRecovery.tsx
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Wifi, WifiOff } from "lucide-react";

interface ErrorInformationCardProps {
  error?: Error | null;
  errorInfo?: string;
  connectionStatus: "online" | "offline";
}

export const ErrorInformationCard: React.FC<ErrorInformationCardProps> = ({
  error,
  errorInfo,
  connectionStatus,
}) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          Something went wrong
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong>{" "}
              {error.message || "An unexpected error occurred"}
            </AlertDescription>
          </Alert>
        )}

        {errorInfo && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <strong>Additional Information:</strong>
            <pre className="mt-2 whitespace-pre-wrap text-xs">{errorInfo}</pre>
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {connectionStatus === "online" ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm font-medium">Connection Status</span>
          </div>
          <Badge
            variant={connectionStatus === "online" ? "default" : "destructive"}
          >
            {connectionStatus}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
