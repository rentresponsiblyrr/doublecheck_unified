/**
 * Photo Preview Card - Focused Component
 * 
 * Displays captured photo preview with confirm/retake actions
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoPreviewCardProps {
  capturedPhoto: string;
  onRetake: () => void;
  onConfirm: () => void;
  className?: string;
}

export const PhotoPreviewCard: React.FC<PhotoPreviewCardProps> = ({
  capturedPhoto,
  onRetake,
  onConfirm,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)} id="photo-preview-card">
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
          onClick={onRetake}
          className="w-full"
          aria-label="Retake photo"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retake
        </Button>
        <Button
          onClick={onConfirm}
          className="w-full"
          aria-label="Use captured photo"
        >
          <Check className="w-4 h-4 mr-2" />
          Use Photo
        </Button>
      </div>
    </div>
  );
};
