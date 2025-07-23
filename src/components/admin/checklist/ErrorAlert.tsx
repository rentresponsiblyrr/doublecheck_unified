/**
 * Error Alert Component
 * Extracted from FunctionalChecklistManagement.tsx
 */

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ErrorAlertProps {
  error: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error }) => {
  return (
    <Alert id="checklist-error-alert" className="border-red-200 bg-red-50">
      <AlertTriangle className="w-4 h-4" />
      <AlertDescription className="text-red-600">{error}</AlertDescription>
    </Alert>
  );
};
