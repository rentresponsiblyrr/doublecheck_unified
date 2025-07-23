/**
 * Screenshot Capture Component - Temporary Stub
 * TODO: Implement full screenshot capture functionality
 */

import React from "react";

export interface ScreenshotCaptureProps {
  onScreenshotCapture?: (screenshot: File | null) => void;
  isCapturing?: boolean;
}

export const ScreenshotCapture: React.FC<ScreenshotCaptureProps> = ({
  onScreenshotCapture,
  isCapturing = false,
}) => {
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <p className="text-sm text-gray-600">
        Screenshot capture functionality will be implemented here.
      </p>
      {isCapturing && (
        <p className="text-sm text-blue-600 mt-2">Capturing screenshot...</p>
      )}
    </div>
  );
};
