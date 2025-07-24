/**
 * ERROR FALLBACK UI COMPONENT - EXTRACTED FROM GOD COMPONENT
 *
 * Professional error fallback interface with recovery options.
 * Clean separation from GlobalErrorBoundary for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RefreshCw, Home, MessageCircle } from "lucide-react";

export interface ErrorInfo extends Error {
  componentStack?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

interface ErrorFallbackUIProps {
  error: ErrorInfo | null;
  retryCount: number;
  maxRetries: number;
  isRecovering: boolean;
  userReported: boolean;
  canRetry: boolean;
  onRetry: () => void;
  onNavigateHome: () => void;
  onReportError: () => void;
}

export const ErrorFallbackUI: React.FC<ErrorFallbackUIProps> = ({
  error,
  retryCount,
  maxRetries,
  isRecovering,
  userReported,
  canRetry,
  onRetry,
  onNavigateHome,
  onReportError,
}) => {
  return (
    <div
      id="error-boundary-fallback"
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
    >
      <div className="max-w-2xl w-full space-y-6">
        {/* Error Status Card */}
        <Card id="error-status-card" className="border-red-200">
          <CardHeader id="error-header" className="text-center">
            <div id="error-icon-container" className="flex justify-center mb-4">
              <div
                id="error-icon-background"
                className="bg-red-100 p-3 rounded-full"
              >
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <CardTitle id="error-title" className="text-2xl text-gray-900">
              {error?.severity === "critical"
                ? "Critical System Error"
                : error?.severity === "high"
                  ? "Application Error"
                  : "Something went wrong"}
            </CardTitle>

            <div
              id="error-badges-container"
              className="flex justify-center gap-2 mt-2"
            >
              <Badge
                variant={
                  error?.severity === "critical" ? "destructive" : "secondary"
                }
                className="text-xs"
              >
                {error?.severity?.toUpperCase() || "ERROR"}
              </Badge>

              {retryCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  Retry {retryCount}/{maxRetries}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent id="error-content" className="text-center space-y-4">
            <p className="text-gray-600">
              {error?.severity === "critical"
                ? "A critical error has occurred that prevents the application from functioning properly."
                : "We encountered an unexpected error. Don't worry - your data is safe and we're working to resolve this."}
            </p>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === "development" && error && (
              <details
                id="error-details"
                className="text-left bg-gray-100 p-4 rounded"
              >
                <summary className="cursor-pointer font-medium text-gray-800">
                  Technical Details (Development)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card id="error-actions-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canRetry && (
                <Button
                  id="retry-button"
                  onClick={onRetry}
                  disabled={isRecovering}
                  className="flex items-center gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRecovering ? "animate-spin" : ""}`}
                  />
                  {isRecovering ? "Recovering..." : "Try Again"}
                </Button>
              )}

              <Button
                id="home-button"
                onClick={onNavigateHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Return Home
              </Button>

              <Button
                id="report-button"
                onClick={onReportError}
                variant="outline"
                disabled={userReported}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {userReported ? "Report Sent" : "Report Issue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
