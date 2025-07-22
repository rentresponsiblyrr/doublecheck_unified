import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { logger } from '@/utils/logger';

interface PhotoCaptureProps {
  cameraStream: MediaStream;
  onPhotoTaken: (file: File) => void;
  onCaptureError: (error: Error) => void;
  quality?: number;
  isCapturing?: boolean;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  cameraStream,
  onPhotoTaken,
  onCaptureError,
  quality = 0.8,
  isCapturing = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const capturePhoto = useCallback(async () => {
    if (!cameraStream || !canvasRef.current) {
      onCaptureError(new Error('Camera stream or canvas not available'));
      return;
    }

    try {
      const videoElement = document.querySelector('#camera-video-stream') as HTMLVideoElement;
      
      if (!videoElement) {
        throw new Error('Video element not found');
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size to match video
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          quality
        );
      });
      
      // Create file from blob
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      logger.info('Photo captured successfully', {
        component: 'PhotoCapture',
        fileSize: file.size,
        fileName: file.name,
        action: 'photo_capture'
      });
      
      onPhotoTaken(file);
    } catch (error) {
      logger.error('Photo capture failed', {
        component: 'PhotoCapture',
        error: (error as Error).message,
        action: 'photo_capture'
      });
      
      onCaptureError(error as Error);
    }
  }, [cameraStream, onPhotoTaken, onCaptureError, quality]);

  return (
    <div id="photo-capture-controls">
      <canvas
        ref={canvasRef}
        className="hidden"
        id="photo-capture-canvas"
      />
      
      <Button
        onClick={capturePhoto}
        disabled={!cameraStream || isCapturing}
        size="lg"
        className="w-full"
        id="capture-photo-button"
      >
        <Camera className="w-5 h-5 mr-2" />
        {isCapturing ? 'Capturing...' : 'Take Photo'}
      </Button>
    </div>
  );
};