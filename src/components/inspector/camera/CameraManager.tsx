import React, { useEffect, useRef, useState } from 'react';
import { logger } from '@/utils/logger';

interface CameraError {
  message: string;
  code?: string;
}

interface CameraManagerProps {
  onCameraReady: (stream: MediaStream) => void;
  onCameraError: (error: CameraError) => void;
  constraints?: MediaStreamConstraints;
}

export const CameraManager: React.FC<CameraManagerProps> = ({
  onCameraReady,
  onCameraError,
  constraints = {
    video: {
      facingMode: 'environment',
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    }
  }
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializeCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      onCameraReady(mediaStream);
      
      logger.info('Camera initialized successfully', {
        component: 'CameraManager',
        action: 'camera_initialization'
      });
    } catch (error) {
      const cameraError: CameraError = {
        message: 'Failed to access camera. Please check permissions.',
        code: (error as DOMException)?.name
      };
      
      logger.error('Camera initialization failed', {
        component: 'CameraManager',
        error: (error as Error).message,
        code: cameraError.code,
        action: 'camera_initialization'
      });
      
      onCameraError(cameraError);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      
      logger.info('Camera stopped', {
        component: 'CameraManager',
        action: 'camera_cleanup'
      });
    }
  };

  const retryInitialization = () => {
    stopCamera();
    initializeCamera();
  };

  return (
    <div id="camera-manager-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        id="camera-video-stream"
      />
    </div>
  );
};