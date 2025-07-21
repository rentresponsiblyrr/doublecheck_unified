/**
 * Camera Error Alert Component
 * Extracted from VideoRecorder.tsx
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface CameraErrorAlertProps {
  error: string | null;
  cameraError: string | null;
  onRetry: () => void;
}

export const CameraErrorAlert: React.FC<CameraErrorAlertProps> = ({
  error,
  cameraError,
  onRetry
}) => {
  if (!cameraError && !error) {
    return null;
  }

  return (
    <Alert id="camera-error-alert" variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Camera Error</AlertTitle>
      <AlertDescription className="mt-2">
        {error || cameraError}
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 ml-2" 
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
};