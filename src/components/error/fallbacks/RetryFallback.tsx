/**
 * Retry Error Fallback Component
 * Comprehensive error fallback with retry functionality and detailed error display
 */

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, ArrowLeft, Bug } from "lucide-react";
import { sanitizeErrorMessage } from "@/utils/sanitization";

interface RetryFallbackProps {
  error: Error | null;
  errorId: string;
  componentName?: string;
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
  showErrorDetails?: boolean;
  allowReportBug?: boolean;
  onRetry: () => void;
  onNavigateBack: () => void;
  onReportBug: () => void;
}

export const RetryFallback: React.FC<RetryFallbackProps> = ({
  error,
  errorId,
  componentName,
  retryCount,
  maxRetries,
  isRetrying,
  showErrorDetails,
  allowReportBug,
  onRetry,
  onNavigateBack,
  onReportBug,
}) => {
  const canRetry = retryCount < maxRetries;
  const errorMessage = error
    ? sanitizeErrorMessage(error)
    : "An unexpected error occurred";

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-red-900 dark:text-red-100">
            Something went wrong
          </CardTitle>
          <CardDescription>
            {componentName && `Error in ${componentName}`}
            {retryCount > 0 && ` (Attempt ${retryCount + 1})`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              {errorMessage}
            </AlertDescription>
          </Alert>

          {showErrorDetails && error && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium mb-2">
                Technical Details (ID: {errorId.slice(-8)})
              </summary>
              <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2">
            {canRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                className="w-full"
                aria-label={`Retry operation. ${maxRetries - retryCount} attempts remaining.`}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({maxRetries - retryCount} left)
                  </>
                )}
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onNavigateBack}
                className="flex-1"
                aria-label="Navigate back to previous page"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>

              {allowReportBug && (
                <Button
                  variant="outline"
                  onClick={onReportBug}
                  className="flex-1"
                  aria-label="Report this bug to support"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report Bug
                </Button>
              )}
            </div>
          </div>

          {!canRetry && retryCount >= maxRetries && (
            <Alert>
              <AlertDescription className="text-sm">
                Maximum retry attempts exceeded. Please contact support if the
                problem persists.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
