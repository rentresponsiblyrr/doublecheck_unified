import React from "react";
import { ErrorBoundary } from "@/lib/error/error-boundary";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface InspectionErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorId?: string;
}

function InspectionErrorFallback({
  error,
  resetError,
  errorId,
}: InspectionErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <div className="space-y-2">
              <p className="font-semibold">Inspection Error</p>
              <p className="text-sm">{error.message}</p>
              {errorId && (
                <p className="text-xs opacity-75">Error ID: {errorId}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button onClick={resetError} className="w-full" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Inspection
          </Button>

          <Button
            onClick={() => (window.location.href = "/")}
            className="w-full"
            variant="secondary"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

interface InspectionErrorBoundaryProps {
  children: React.ReactNode;
}

export function InspectionErrorBoundary({
  children,
}: InspectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      level="component"
      fallback={({ error, resetError, errorId }) => (
        <InspectionErrorFallback
          error={error}
          resetError={resetError}
          errorId={errorId}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
