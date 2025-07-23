/**
 * Screenshot Capture Component - Production Implementation
 * Elite-grade screenshot capture with multiple capture methods and error handling
 */

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  RotateCcw,
  Trash2,
  Download,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { screenshotCaptureService } from "@/utils/screenshotCapture";
import { logger } from "@/utils/logger";

export interface ScreenshotCaptureProps {
  onScreenshotCapture?: (screenshot: File | null) => void;
  isCapturing?: boolean;
  maxFileSizeKB?: number;
  acceptedFormats?: ("jpeg" | "png" | "webp")[];
  className?: string;
}

interface CaptureState {
  isCapturing: boolean;
  screenshot: string | null;
  screenshotFile: File | null;
  error: string | null;
  captureMethod: "screen" | "page" | null;
}

export const ScreenshotCapture: React.FC<ScreenshotCaptureProps> = ({
  onScreenshotCapture,
  isCapturing: externalCapturing = false,
  maxFileSizeKB = 500,
  acceptedFormats = ["jpeg", "png"],
  className = "",
}) => {
  const [state, setState] = useState<CaptureState>({
    isCapturing: false,
    screenshot: null,
    screenshotFile: null,
    error: null,
    captureMethod: null,
  });

  const resetState = useCallback(() => {
    setState((prev) => ({
      ...prev,
      screenshot: null,
      screenshotFile: null,
      error: null,
      captureMethod: null,
    }));
    onScreenshotCapture?.(null);
  }, [onScreenshotCapture]);

  const handleScreenshotSuccess = useCallback(
    (
      result: { dataUrl: string; blob: Blob; timestamp: string },
      method: "screen" | "page",
    ) => {
      // Convert blob to File
      const file = new File(
        [result.blob],
        `screenshot-${result.timestamp}.jpg`,
        {
          type: result.blob.type,
          lastModified: Date.now(),
        },
      );

      setState((prev) => ({
        ...prev,
        isCapturing: false,
        screenshot: result.dataUrl,
        screenshotFile: file,
        error: null,
        captureMethod: method,
      }));

      onScreenshotCapture?.(file);

      logger.info("Screenshot captured successfully", {
        component: "ScreenshotCapture",
        method,
        fileSize: result.blob.size,
        timestamp: result.timestamp,
      });
    },
    [onScreenshotCapture],
  );

  const handleError = useCallback((error: Error, method: string) => {
    setState((prev) => ({
      ...prev,
      isCapturing: false,
      error: error.message,
    }));

    logger.error("Screenshot capture failed", {
      component: "ScreenshotCapture",
      method,
      error: error.message,
    });
  }, []);

  const captureScreen = useCallback(async () => {
    setState((prev) => ({ ...prev, isCapturing: true, error: null }));

    try {
      const result = await screenshotCaptureService.captureScreenUsingAPI({
        quality: 0.8,
        format: "jpeg",
        maxWidth: 1920,
        maxHeight: 1080,
      });

      handleScreenshotSuccess(result, "screen");
    } catch (error) {
      handleError(error as Error, "screen");
    }
  }, [handleScreenshotSuccess, handleError]);

  const capturePage = useCallback(async () => {
    setState((prev) => ({ ...prev, isCapturing: true, error: null }));

    try {
      const result = await screenshotCaptureService.capturePageUsingHTML2Canvas(
        {
          quality: 0.8,
          format: "jpeg",
          maxWidth: 1920,
          maxHeight: 1080,
        },
      );

      handleScreenshotSuccess(result, "page");
    } catch (error) {
      handleError(error as Error, "page");
    }
  }, [handleScreenshotSuccess, handleError]);

  const downloadScreenshot = useCallback(() => {
    if (!state.screenshot || !state.screenshotFile) return;

    const link = document.createElement("a");
    link.href = state.screenshot;
    link.download = state.screenshotFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info("Screenshot downloaded", {
      component: "ScreenshotCapture",
      filename: state.screenshotFile.name,
    });
  }, [state.screenshot, state.screenshotFile]);

  const isCurrentlyCapturing = state.isCapturing || externalCapturing;

  return (
    <div className={`space-y-4 ${className}`} id="screenshot-capture-container">
      {/* Capture Controls */}
      {!state.screenshot && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={captureScreen}
            disabled={isCurrentlyCapturing}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            id="capture-screen-button"
          >
            {isCurrentlyCapturing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 mr-2" />
            )}
            Capture Screen
          </Button>

          <Button
            onClick={capturePage}
            disabled={isCurrentlyCapturing}
            variant="outline"
            className="flex-1"
            id="capture-page-button"
          >
            {isCurrentlyCapturing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 mr-2" />
            )}
            Capture Page
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isCurrentlyCapturing && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="text-blue-700">
            Capturing screenshot... Please wait.
          </AlertDescription>
        </Alert>
      )}

      {/* Error State */}
      {state.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-700">
            {state.error}
          </AlertDescription>
        </Alert>
      )}

      {/* Screenshot Preview */}
      {state.screenshot && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Success Message */}
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-700">
                  Screenshot captured successfully using{" "}
                  {state.captureMethod === "screen"
                    ? "Screen Capture API"
                    : "Page Capture"}
                </AlertDescription>
              </Alert>

              {/* Preview Image */}
              <div className="border rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={state.screenshot}
                  alt="Screenshot preview"
                  className="w-full h-auto max-h-64 object-contain"
                  id="screenshot-preview-image"
                />
              </div>

              {/* File Info */}
              {state.screenshotFile && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    Size: {Math.round(state.screenshotFile.size / 1024)} KB
                  </div>
                  <div>Type: {state.screenshotFile.type}</div>
                  <div>Name: {state.screenshotFile.name}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={captureScreen}
                  variant="outline"
                  size="sm"
                  id="retake-screenshot-button"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>

                <Button
                  onClick={downloadScreenshot}
                  variant="outline"
                  size="sm"
                  id="download-screenshot-button"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>

                <Button
                  onClick={resetState}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  id="remove-screenshot-button"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Helpful Instructions */}
      {!state.screenshot && !isCurrentlyCapturing && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="mb-2">
            <strong>Screenshot Options:</strong>
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <strong>Capture Screen:</strong> Select a specific window or
              entire screen
            </li>
            <li>
              <strong>Capture Page:</strong> Take a full-page screenshot of this
              browser tab
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
