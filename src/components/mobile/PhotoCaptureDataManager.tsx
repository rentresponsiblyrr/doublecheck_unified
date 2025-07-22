/**
 * Photo Capture Data Manager - Focused Component
 * 
 * Handles all photo capture state management and canvas operations with render props pattern
 */

import React, { useState, useRef, useCallback } from 'react';
import type { PhotoGuidance, ChecklistItem } from '@/types/photo';

export interface PhotoCaptureMetadata {
  checklistItemId: string;
  roomName: string;
  captureTime: Date;
  deviceInfo: {
    userAgent: string;
    screenResolution: string;
    cameraCapabilities: MediaTrackCapabilities | null;
  };
  qualityScore: number;
  guidanceFollowed: boolean;
}

interface PhotoCaptureDataManagerProps {
  checklistItem: ChecklistItem;
  videoStream?: MediaStream;
  currentQuality: PhotoGuidance | null;
  onPhotoCapture: (photo: File, metadata: PhotoCaptureMetadata) => void;
  children: (data: {
    capturedPhoto: string | null;
    isProcessing: boolean;
    canCapture: boolean;
    hasQualityIssues: boolean;
    qualityScore: number;
    onCapture: () => void;
    onRetake: () => void;
    onConfirm: () => void;
  }) => React.ReactNode;
}

export const PhotoCaptureDataManager: React.FC<PhotoCaptureDataManagerProps> = ({
  checklistItem,
  videoStream,
  currentQuality,
  onPhotoCapture,
  children
}) => {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const calculateQualityScore = useCallback((guidance: PhotoGuidance): number => {
    const maxScore = 100;
    const errorCount = guidance.messages.filter(m => m.type === 'error').length;
    const warningCount = guidance.messages.filter(m => m.type === 'warning').length;
    
    return Math.max(0, maxScore - (errorCount * 30) - (warningCount * 10));
  }, []);

  const handleCapture = useCallback(async () => {
    if (!videoStream || !currentQuality) return;

    // Check for quality issues
    const qualityIssues = currentQuality.messages
      .filter(m => m.type === 'error')
      .map(m => m.message);

    if (qualityIssues.length > 0) {
      console.warn('Quality issues detected:', qualityIssues);
    }

    setIsProcessing(true);

    try {
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = videoStream;
      video.play();

      // Wait for video to be ready
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas and capture frame
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Flip horizontally for mirror effect
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0);
      
      // Convert to blob
      const photoBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create photo blob'));
          }
        }, 'image/jpeg', 0.9);
      });

      // Create file from blob
      const photoFile = new File([photoBlob], `inspection-${checklistItem.id}-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Create capture metadata
      const metadata: PhotoCaptureMetadata = {
        checklistItemId: checklistItem.id,
        roomName: checklistItem.roomName || 'Unknown',
        captureTime: new Date(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          cameraCapabilities: videoStream.getVideoTracks()[0]?.getCapabilities() || null
        },
        qualityScore: currentQuality ? calculateQualityScore(currentQuality) : 0,
        guidanceFollowed: qualityIssues.length === 0
      };

      // Create preview URL
      const previewUrl = URL.createObjectURL(photoBlob);
      setCapturedPhoto(previewUrl);

      // Call the onPhotoCapture callback
      onPhotoCapture(photoFile, metadata);

    } catch (error) {
      console.error('Photo capture failed:', error);
      alert('Failed to capture photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [videoStream, currentQuality, checklistItem, onPhotoCapture, calculateQualityScore]);

  const handleRetake = useCallback(() => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto);
      setCapturedPhoto(null);
    }
  }, [capturedPhoto]);

  const handleConfirm = useCallback(() => {
    // Photo already captured and processed
    // This would typically close the interface
  }, []);

  const canCapture = videoStream && currentQuality && !isProcessing;
  const hasQualityIssues = currentQuality?.messages.some(m => m.type === 'error') || false;
  const qualityScore = currentQuality ? calculateQualityScore(currentQuality) : 0;

  return (
    <>
      {children({
        capturedPhoto,
        isProcessing,
        canCapture: Boolean(canCapture),
        hasQualityIssues,
        qualityScore,
        onCapture: handleCapture,
        onRetake: handleRetake,
        onConfirm: handleConfirm
      })}
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
};
