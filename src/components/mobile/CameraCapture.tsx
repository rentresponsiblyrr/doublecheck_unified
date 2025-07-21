/**
 * Camera Capture Component
 * Core camera functionality, video stream management, and capture mechanics
 */

import React, { useRef, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, AlertTriangle, Loader2 } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onStreamReady: (stream: MediaStream) => void;
  onError: (error: string) => void;
  isActive: boolean;
  className?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onStreamReady,
  onError,
  isActive,
  className
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const {
    stream,
    isReady,
    error: cameraError,
    initializeCamera,
    switchCamera,
    stopCamera,
    permissions
  } = useCamera();

  // Initialize camera when component mounts
  useEffect(() => {
    if (isActive) {
      initializeCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, initializeCamera, stopCamera]);

  // Set up video stream
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
      onStreamReady(stream);
    }
  }, [stream, onStreamReady]);

  // Handle camera errors
  useEffect(() => {
    if (cameraError) {
      onError(cameraError);
    }
  }, [cameraError, onError]);

  if (permissions === 'denied') {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-gray-100 rounded-lg", className)}>
        <CameraOff className="w-16 h-16 text-gray-400 mb-4" />
        <div className="text-center">
          <h3 className="font-medium text-gray-900 mb-2">Camera Permission Required</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please enable camera access to capture inspection photos
          </p>
          <Alert className="max-w-sm">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-left">
              Go to Settings → Privacy → Camera and enable access for this app
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (permissions === 'prompt') {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-gray-100 rounded-lg", className)}>
        <Camera className="w-16 h-16 text-blue-500 mb-4" />
        <div className="text-center">
          <h3 className="font-medium text-gray-900 mb-2">Camera Access</h3>
          <p className="text-sm text-gray-600 mb-4">
            Requesting camera permission for photo capture
          </p>
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Waiting for permission...</span>
          </div>
        </div>
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-red-50 rounded-lg border border-red-200", className)}>
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <div className="text-center">
          <h3 className="font-medium text-red-900 mb-2">Camera Error</h3>
          <p className="text-sm text-red-700 mb-4">
            {cameraError}
          </p>
          <button
            onClick={() => initializeCamera()}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!isReady || !stream) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-gray-100 rounded-lg", className)}>
        <Camera className="w-16 h-16 text-gray-400 mb-4" />
        <div className="text-center">
          <h3 className="font-medium text-gray-900 mb-2">Initializing Camera</h3>
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Setting up camera...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-black", className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // Mirror for selfie effect
      />
      
      {/* Video overlay for debugging */}
      <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
        {stream?.getVideoTracks()[0]?.label || 'Camera'}
      </div>
    </div>
  );
};