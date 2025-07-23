/**
 * Property Error Handler - Enterprise Grade
 *
 * Professional error display with retry functionality
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface PropertyErrorHandlerProps {
  error: Error;
  onRetry: () => void;
  isRetrying: boolean;
  className?: string;
}

export const PropertyErrorHandler: React.FC<PropertyErrorHandlerProps> = ({
  error,
  onRetry,
  isRetrying,
  className = "",
}) => {
  return (
    <Card id="property-error-handler" className={className}>
      <CardContent className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to Load Properties</AlertTitle>
          <AlertDescription className="mt-2">
            {error.message ||
              "An unexpected error occurred while loading properties."}
          </AlertDescription>
          <Button
            variant="outline"
            onClick={onRetry}
            className="mt-4"
            disabled={isRetrying}
            aria-label="Retry loading properties"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRetrying ? "animate-spin" : ""}`}
            />
            {isRetrying ? "Retrying..." : "Try Again"}
          </Button>
        </Alert>
      </CardContent>
    </Card>
  );
};
