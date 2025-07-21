/**
 * Photo Capture Controls Component
 * Capture controls, reference overlay management, and photo actions
 */

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera,
  Check,
  X,
  RefreshCw,
  FlipHorizontal,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Download,
  Settings,
  Loader2
} from 'lucide-react';
import { ReferencePhotoOverlay } from '@/components/photo/ReferencePhotoOverlay';
import { PhotoGuidanceOverlay } from '@/components/photo/PhotoGuidanceOverlay';
import { cn } from '@/lib/utils';
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

interface PhotoCaptureControlsProps {
  checklistItem: ChecklistItem;
  referencePhotoUrl?: string;
  videoStream?: MediaStream;
  currentQuality: PhotoGuidance | null;
  onPhotoCapture: (photo: File, metadata: PhotoCaptureMetadata) => void;
  onCancel?: () => void;
  showReference: boolean;
  onToggleReference: (show: boolean) => void;
  referenceOpacity: number;
  onReferenceOpacityChange: (opacity: number) => void;
  expandedView: boolean;
  onToggleExpanded: (expanded: boolean) => void;
  className?: string;
}

export const PhotoCaptureControls: React.FC<PhotoCaptureControlsProps> = ({
  checklistItem,
  referencePhotoUrl,
  videoStream,
  currentQuality,
  onPhotoCapture,
  onCancel,
  showReference,
  onToggleReference,
  referenceOpacity,
  onReferenceOpacityChange,
  expandedView,
  onToggleExpanded,
  className
}) => {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCapture = async () => {
    if (!videoStream || !currentQuality) return;

    // Check for quality issues
    const qualityIssues = currentQuality.messages
      .filter(m => m.type === 'error')
      .map(m => m.message);

    if (qualityIssues.length > 0) {
      // Could show confirmation dialog for poor quality
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
  };

  const calculateQualityScore = (guidance: PhotoGuidance): number => {
    const maxScore = 100;
    const errorCount = guidance.messages.filter(m => m.type === 'error').length;
    const warningCount = guidance.messages.filter(m => m.type === 'warning').length;
    
    return Math.max(0, maxScore - (errorCount * 30) - (warningCount * 10));
  };

  const handleRetake = () => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto);
      setCapturedPhoto(null);
    }
  };

  const canCapture = videoStream && currentQuality && !isProcessing;
  const hasQualityIssues = currentQuality?.messages.some(m => m.type === 'error');

  if (capturedPhoto) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Photo Preview */}
        <Card className="p-4">
          <img
            src={capturedPhoto}
            alt="Captured photo"
            className="w-full h-64 object-cover rounded-lg"
          />
        </Card>

        {/* Confirm/Retake Controls */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleRetake}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake
          </Button>
          <Button
            onClick={() => {
              // Photo already captured in handleCapture
              // This would close the interface
              onCancel?.();
            }}
            className="w-full"
          >
            <Check className="w-4 h-4 mr-2" />
            Use Photo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Reference Photo Controls */}
      {referencePhotoUrl && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Reference Photo</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleReference(!showReference)}
              >
                {showReference ? 'Hide' : 'Show'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleExpanded(!expandedView)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {showReference && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Overlay Opacity</span>
                <span>{referenceOpacity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReferenceOpacityChange(Math.max(0, referenceOpacity - 10))}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <div className="flex-1 bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${referenceOpacity}%` }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReferenceOpacityChange(Math.min(100, referenceOpacity + 10))}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Quality Warning */}
      {hasQualityIssues && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-800">
            Photo quality issues detected. Consider following the guidance above before capturing.
          </AlertDescription>
        </Alert>
      )}

      {/* Capture Controls */}
      <div className="grid grid-cols-3 gap-3">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
        
        <Button
          variant="ghost"
          className="w-full"
          disabled={!videoStream}
        >
          <FlipHorizontal className="w-4 h-4 mr-2" />
          Flip
        </Button>
        
        <Button
          onClick={handleCapture}
          disabled={!canCapture}
          className={cn(
            "w-full",
            hasQualityIssues ? "bg-yellow-500 hover:bg-yellow-600" : ""
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          {isProcessing ? 'Processing...' : 'Capture'}
        </Button>
      </div>

      {/* Additional Controls */}
      <div className="flex justify-center gap-4 text-sm text-gray-600">
        <button className="flex items-center gap-1 hover:text-gray-800">
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button className="flex items-center gap-1 hover:text-gray-800">
          <Download className="w-4 h-4" />
          Save
        </button>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};