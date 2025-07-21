/**
 * Camera Permission Card Component
 * Extracted from VideoRecorder.tsx
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Camera } from 'lucide-react';

interface CameraPermissionCardProps {
  className?: string;
  onRequestPermission: () => Promise<void>;
}

export const CameraPermissionCard: React.FC<CameraPermissionCardProps> = ({
  className,
  onRequestPermission
}) => {
  return (
    <Card id="camera-permission-card" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Camera Permission Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Camera Access Needed</AlertTitle>
          <AlertDescription>
            We need access to your camera to record the property walkthrough.
          </AlertDescription>
        </Alert>
        <Button onClick={onRequestPermission} className="w-full">
          <Camera className="h-4 w-4 mr-2" />
          Enable Camera
        </Button>
      </CardContent>
    </Card>
  );
};