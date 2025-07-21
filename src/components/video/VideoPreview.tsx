/**
 * Video Preview Component
 * Extracted from VideoRecorder.tsx
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Circle, Settings } from 'lucide-react';

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  cameraLoading: boolean;
  isRecording: boolean;
  duration: number;
  formatDuration: (seconds: number) => string;
  showSettings: boolean;
  onToggleSettings: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoRef,
  cameraLoading,
  isRecording,
  duration,
  formatDuration,
  showSettings,
  onToggleSettings
}) => {
  return (
    <div id="video-preview-container" className="relative bg-black rounded-lg overflow-hidden aspect-video min-h-[300px] sm:min-h-[400px]">
      {cameraLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-lg">Loading camera...</div>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
      )}
      
      {/* Recording Indicator - Mobile Optimized */}
      {isRecording && (
        <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 text-lg font-medium">
          <Circle className="h-4 w-4 fill-current animate-pulse" />
          <span className="font-mono">{formatDuration(duration)}</span>
        </div>
      )}

      {/* Settings Button - Mobile Optimized */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute bottom-4 right-4 h-12 w-12 touch-manipulation"
        onClick={onToggleSettings}
        disabled={isRecording}
      >
        <Settings className="h-6 w-6" />
      </Button>
    </div>
  );
};