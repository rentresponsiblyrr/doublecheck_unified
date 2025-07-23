import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AlertTriangle, FileVideo } from "lucide-react";

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  recordedVideoUrl?: string;
  isLoading: boolean;
  error?: string;
  hasPermission: boolean;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoRef,
  recordedVideoUrl,
  isLoading,
  error,
  hasPermission,
}) => {
  if (error) {
    return (
      <div
        id="video-error-state"
        className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center"
      >
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        id="video-loading-state"
        className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center"
      >
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Initializing camera...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div
        id="video-permission-state"
        className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center"
      >
        <div className="text-center text-gray-600">
          <FileVideo className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm">Camera permission required</p>
          <p className="text-xs mt-1">
            Please allow camera access to record video
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="video-preview-container" className="relative">
      <video
        ref={videoRef}
        className="w-full aspect-video bg-black rounded-lg"
        autoPlay
        muted
        playsInline
      />

      {recordedVideoUrl && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="text-white text-center">
            <FileVideo className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Video recorded successfully</p>
          </div>
        </div>
      )}

      {/* Recording indicator */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          LIVE
        </div>
      </div>
    </div>
  );
};
