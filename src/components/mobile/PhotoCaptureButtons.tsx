/**
 * Photo Capture Buttons - Focused Component
 * 
 * Primary capture controls with accessibility and visual feedback
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Camera,
  X,
  FlipHorizontal,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoCaptureButtonsProps {
  canCapture: boolean;
  isProcessing: boolean;
  hasQualityIssues: boolean;
  onCapture: () => void;
  onCancel?: () => void;
  onFlip?: () => void;
  className?: string;
}

export const PhotoCaptureButtons: React.FC<PhotoCaptureButtonsProps> = ({
  canCapture,
  isProcessing,
  hasQualityIssues,
  onCapture,
  onCancel,
  onFlip,
  className
}) => {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)} id="photo-capture-buttons">
      {onCancel && (
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full"
          aria-label="Cancel photo capture"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      )}
      
      <Button
        variant="ghost"
        className="w-full"
        disabled={isProcessing}
        onClick={onFlip}
        aria-label="Flip camera"
      >
        <FlipHorizontal className="w-4 h-4 mr-2" />
        Flip
      </Button>
      
      <Button
        onClick={onCapture}
        disabled={!canCapture}
        className={cn(
          "w-full",
          hasQualityIssues ? "bg-yellow-500 hover:bg-yellow-600" : ""
        )}
        aria-label={isProcessing ? 'Processing photo' : 'Capture photo'}
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Camera className="w-4 h-4 mr-2" />
        )}
        {isProcessing ? 'Processing...' : 'Capture'}
      </Button>
    </div>
  );
};
