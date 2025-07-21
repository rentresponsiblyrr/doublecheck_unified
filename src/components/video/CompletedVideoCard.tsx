/**
 * Completed Video Card Component
 * Extracted from VideoRecorder.tsx
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video } from 'lucide-react';

interface CompletedVideoCardProps {
  recordedVideo: Blob | null;
  isRecording: boolean;
  duration: number;
  formatDuration: (seconds: number) => string;
}

export const CompletedVideoCard: React.FC<CompletedVideoCardProps> = ({
  recordedVideo,
  isRecording,
  duration,
  formatDuration
}) => {
  if (!recordedVideo || isRecording) {
    return null;
  }

  return (
    <Card id="completed-video-card" className="border-green-200 bg-green-50 dark:bg-green-900/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 text-green-800 dark:text-green-200">
          <Video className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-base">Video Recorded Successfully</span>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your property walkthrough video has been recorded and is ready for upload.
            </p>
          </div>
          <Badge className="bg-green-100 text-green-800 shrink-0 text-sm py-1">
            {formatDuration(duration)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};