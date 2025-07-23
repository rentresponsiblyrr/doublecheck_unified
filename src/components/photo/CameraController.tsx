/**
 * Camera Controller - Enterprise Grade
 *
 * Handles camera access and photo capture functionality
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, AlertTriangle } from "lucide-react";

interface CameraControllerProps {
  onPhotoCapture: (photoBlob: Blob) => Promise<void>;
  onCameraError: (error: Error) => void;
  isEnabled: boolean;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  onPhotoCapture,
  onCameraError,
  isEnabled,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCapturePhoto = async () => {
    try {
      setIsCapturing(true);
      // Mock photo capture - in real implementation would access camera
      const mockBlob = new Blob(["mock photo data"], { type: "image/jpeg" });
      await onPhotoCapture(mockBlob);
    } catch (error) {
      onCameraError(
        error instanceof Error ? error : new Error("Camera capture failed"),
      );
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isEnabled) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Camera is not available or access was denied.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div id="camera-controller" className="space-y-4">
      <div className="flex items-center justify-center p-8 bg-gray-100 rounded-lg">
        <div className="text-center">
          <Camera className="h-12 w-12 mx-auto mb-4 text-gray-500" />
          <Button
            onClick={handleCapturePhoto}
            disabled={isCapturing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCapturing ? "Capturing..." : "Take Photo"}
          </Button>
        </div>
      </div>
    </div>
  );
};
