// Mobile-Optimized Photo Capture Interface for STR Certified

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  CameraOff,
  Check,
  RefreshCw,
  X,
  ZoomIn,
  FlipHorizontal,
  Maximize2,
  Eye,
  EyeOff,
  Settings,
  Download,
  ChevronUp,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { usePhotoGuidance } from '@/hooks/usePhotoGuidance';
import { usePhotoComparison } from '@/hooks/usePhotoComparison';
import { PhotoQualityIndicator } from './PhotoQualityIndicator';
import { ReferencePhotoOverlay } from '@/components/photo/ReferencePhotoOverlay';
import { PhotoGuidanceOverlay } from '@/components/photo/PhotoGuidanceOverlay';
import { cn } from '@/lib/utils';
import type { PhotoGuidance, ChecklistItem } from '@/types/photo';

interface PhotoCaptureInterfaceProps {
  checklistItem: ChecklistItem;
  referencePhotoUrl?: string;
  onPhotoCapture: (photo: File, metadata: PhotoCaptureMetadata) => void;
  onCancel?: () => void;
  className?: string;
}

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

export const PhotoCaptureInterface: React.FC<PhotoCaptureInterfaceProps> = ({
  checklistItem,
  referencePhotoUrl,
  onPhotoCapture,
  onCancel,
  className
}) => {
  // State management
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReference, setShowReference] = useState(true);
  const [referenceOpacity, setReferenceOpacity] = useState(30);
  const [showGuidance, setShowGuidance] = useState(true);
  const [expandedView, setExpandedView] = useState(false);
  const [currentQuality, setCurrentQuality] = useState<PhotoGuidance | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hooks
  const {
    stream,
    isReady,
    error: cameraError,
    hasPermission,
    isLoading: cameraLoading,
    requestPermission,
    switchCamera,
    getCurrentCamera,
    getCameraCapabilities,
    stopCamera
  } = useCamera({
    videoRef,
    facingMode: 'environment',
    resolution: { width: 1920, height: 1080 }
  });

  const {
    currentStep,
    guidance,
    isComplete,
    nextStep,
    previousStep,
    resetGuidance,
    getProgress
  } = usePhotoGuidance({
    checklistItem,
    referencePhoto: referencePhotoUrl
  });

  const {
    checkPhotoQuality,
    qualityGuidance,
    isCheckingQuality,
    startRealTimeFeedback,
    stopRealTimeFeedback,
    realTimeGuidance
  } = usePhotoComparison({
    enableHistory: false
  });

  // Start real-time feedback when camera is ready
  useEffect(() => {
    if (stream && isReady && showGuidance) {
      startRealTimeFeedback(stream);
      return () => {
        stopRealTimeFeedback();
      };
    }
  }, [stream, isReady, showGuidance, startRealTimeFeedback, stopRealTimeFeedback]);

  // Update current quality from real-time guidance
  useEffect(() => {
    if (realTimeGuidance) {
      setCurrentQuality(realTimeGuidance);
    }
  }, [realTimeGuidance]);

  // Handle photo capture
  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || !currentQuality) return;

    setIsProcessing(true);

    try {
      // Set canvas dimensions to match video
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.drawImage(video, 0, 0);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          0.95
        );
      });

      // Create File object
      const file = new File([blob], `inspection_${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      // Get device capabilities
      const capabilities = getCameraCapabilities();

      // Create metadata
      const metadata: PhotoCaptureMetadata = {
        checklistItemId: checklistItem.id,
        roomName: checklistItem.roomName || 'Unknown Room',
        captureTime: new Date(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          cameraCapabilities: capabilities
        },
        qualityScore: currentQuality.qualityScore,
        guidanceFollowed: guidance.stepsCompleted >= guidance.totalSteps * 0.8
      };

      // Set captured photo for preview
      setCapturedPhoto(URL.createObjectURL(blob));

      // Delay to show preview
      setTimeout(() => {
        onPhotoCapture(file, metadata);
      }, 1500);

    } catch (error) {
      console.error('Capture error:', error);
      setIsProcessing(false);
    }
  };

  // Handle retake
  const handleRetake = () => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto);
    }
    setCapturedPhoto(null);
    setIsProcessing(false);
    resetGuidance();
  };

  // Handle permission request
  const handlePermissionRequest = async () => {
    await requestPermission();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (capturedPhoto) {
        URL.revokeObjectURL(capturedPhoto);
      }
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
      stopCamera();
    };
  }, [capturedPhoto, stopCamera]);

  // Render permission screen
  if (!hasPermission) {
    return (
      <div className={cn(
        'fixed inset-0 bg-background flex flex-col items-center justify-center p-4',
        className
      )}>
        <Card className="w-full max-w-md p-6 space-y-4">
          <div className="text-center space-y-2">
            <CameraOff className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Camera Permission Required</h2>
            <p className="text-sm text-muted-foreground">
              STR Certified needs camera access to capture inspection photos
            </p>
          </div>
          
          <Button
            onClick={handlePermissionRequest}
            className="w-full"
            size="lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            Grant Camera Access
          </Button>
          
          {cameraError && (
            <Alert variant="destructive">
              <AlertDescription>{cameraError}</AlertDescription>
            </Alert>
          )}
          
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full"
            >
              Cancel
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // Render loading screen
  if (cameraLoading || !isReady) {
    return (
      <div className={cn(
        'fixed inset-0 bg-background flex items-center justify-center',
        className
      )}>
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Initializing camera...</p>
        </div>
      </div>
    );
  }

  // Main capture interface
  return (
    <div className={cn(
      'fixed inset-0 bg-black flex flex-col',
      expandedView && 'z-50',
      className
    )}>
      {/* Header */}
      <div className="relative z-20 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="text-white">
              <h3 className="font-medium">{checklistItem.title}</h3>
              <p className="text-xs opacity-80">{checklistItem.roomName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpandedView(!expandedView)}
              className="text-white hover:bg-white/20"
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={switchCamera}
              className="text-white hover:bg-white/20"
            >
              <FlipHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Guidance Progress */}
        {showGuidance && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-white text-xs">
              <span>Step {currentStep + 1} of {guidance.totalSteps}</span>
              <span>{Math.round(getProgress())}% Complete</span>
            </div>
            <Progress value={getProgress()} className="h-1 bg-white/20" />
          </div>
        )}
      </div>

      {/* Camera View */}
      <div className="relative flex-1 overflow-hidden">
        {/* Video Preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Reference Photo Overlay */}
        {referencePhotoUrl && showReference && (
          <ReferencePhotoOverlay
            photoUrl={referencePhotoUrl}
            opacity={referenceOpacity}
            onOpacityChange={setReferenceOpacity}
            onClose={() => setShowReference(false)}
          />
        )}

        {/* Quality Indicator */}
        {currentQuality && (
          <div className="absolute top-4 right-4 z-10">
            <PhotoQualityIndicator
              quality={currentQuality}
              compact={!expandedView}
            />
          </div>
        )}

        {/* Guidance Overlay */}
        {showGuidance && currentQuality && (
          <PhotoGuidanceOverlay
            guidance={currentQuality}
            referencePhotoUrl={referencePhotoUrl}
            onCapture={handleCapture}
            onRetake={handleRetake}
            isCapturing={isProcessing}
            showReferencePhoto={false}
            className="absolute inset-0"
          />
        )}

        {/* Captured Photo Preview */}
        {capturedPhoto && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-30">
            <div className="relative max-w-full max-h-full">
              <img
                src={capturedPhoto}
                alt="Captured photo"
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-green-500 text-white p-4 rounded-full animate-pulse">
                  <Check className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas for capture (hidden) */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Controls */}
      <div className="relative z-20 bg-gradient-to-t from-black/70 to-transparent p-4">
        {/* Quick Settings */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReference(!showReference)}
            className="text-white hover:bg-white/20"
            disabled={!referencePhotoUrl}
          >
            {showReference ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="ml-1 text-xs">Reference</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGuidance(!showGuidance)}
            className="text-white hover:bg-white/20"
          >
            <Settings className="h-4 w-4" />
            <span className="ml-1 text-xs">Guidance</span>
          </Button>
        </div>

        {/* Capture Controls */}
        <div className="flex items-center justify-center space-x-4">
          {/* Previous Step */}
          <Button
            variant="ghost"
            size="icon"
            onClick={previousStep}
            disabled={currentStep === 0 || isProcessing}
            className="text-white hover:bg-white/20"
          >
            <ChevronDown className="h-5 w-5" />
          </Button>

          {/* Capture Button */}
          <Button
            size="lg"
            onClick={handleCapture}
            disabled={isProcessing || !currentQuality?.isAcceptable}
            className={cn(
              'h-16 w-16 rounded-full shadow-xl transition-all',
              currentQuality?.isAcceptable
                ? 'bg-white hover:bg-gray-100'
                : 'bg-red-500 hover:bg-red-600'
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin text-black" />
            ) : (
              <Camera className="h-6 w-6 text-black" />
            )}
          </Button>

          {/* Next Step */}
          <Button
            variant="ghost"
            size="icon"
            onClick={nextStep}
            disabled={currentStep >= guidance.totalSteps - 1 || isProcessing}
            className="text-white hover:bg-white/20"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        </div>

        {/* Current Guidance Text */}
        {guidance.currentGuidance && (
          <div className="mt-4 text-center">
            <p className="text-white text-sm">
              {guidance.currentGuidance}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Simplified Mobile Capture for Quick Photos
export const QuickPhotoCapture: React.FC<{
  onCapture: (photo: File) => void;
  onCancel: () => void;
}> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { stream, isReady, hasPermission, requestPermission } = useCamera({
    videoRef,
    facingMode: 'environment'
  });

  const handleQuickCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `quick_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        onCapture(file);
      }
    }, 'image/jpeg', 0.9);
  };

  if (!hasPermission) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-4">
        <Button onClick={requestPermission} size="lg" variant="outline">
          <Camera className="h-5 w-5 mr-2" />
          Enable Camera
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute bottom-0 inset-x-0 p-6 flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onCancel}
          className="bg-white/10 backdrop-blur text-white border-white/20"
        >
          Cancel
        </Button>
        <Button
          size="lg"
          onClick={handleQuickCapture}
          disabled={!isReady}
          className="h-16 w-16 rounded-full bg-white shadow-xl"
        >
          <Camera className="h-6 w-6 text-black" />
        </Button>
      </div>
    </div>
  );
};