/**
 * Offline Error Fallback Component
 * Displays when network connectivity issues are detected
 */

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export const OfflineFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          You appear to be offline. Please check your connection and try again.
        </AlertDescription>
      </Alert>
    </div>
  );
};
