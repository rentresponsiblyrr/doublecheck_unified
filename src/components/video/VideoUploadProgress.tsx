/**
 * Video Upload Progress Component
 * Extracted from VideoRecorder.tsx
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';

interface VideoUploadProgressProps {
  isRecording: boolean;
  duration: number;
  maxDuration: number;
  formatDuration: (seconds: number) => string;
}

export const VideoUploadProgress: React.FC<VideoUploadProgressProps> = ({
  isRecording,
  duration,
  maxDuration,
  formatDuration
}) => {
  if (!isRecording) {
    return null;
  }

  return (
    <div id="video-upload-progress" className="space-y-3">
      <div className="flex items-center justify-between text-lg font-medium">
        <span>{formatDuration(duration)}</span>
        <span className="text-gray-600">{formatDuration(maxDuration)}</span>
      </div>
      <Progress
        value={(duration / maxDuration) * 100}
        className="h-3"
      />
    </div>
  );
};