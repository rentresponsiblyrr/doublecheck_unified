/**
 * Workflow Error Boundary Component
 * Extracted from InspectionWorkflowContainer.tsx
 */

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Home } from "lucide-react";

interface WorkflowErrorBoundaryProps {
  error: Error;
  onClearError: () => void;
  onSafeReturn: () => void;
}

export const WorkflowErrorBoundary: React.FC<WorkflowErrorBoundaryProps> = ({
  error,
  onClearError,
  onSafeReturn,
}) => {
  return (
    <div
      id="workflow-error-boundary"
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
    >
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Workflow Error
          </CardTitle>
          <CardDescription>
            An error occurred during the inspection workflow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClearError} className="flex-1">
              Retry
            </Button>
            <Button onClick={onSafeReturn} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
