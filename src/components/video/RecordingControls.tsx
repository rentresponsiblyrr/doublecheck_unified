/**
 * Recording Controls Component
 * Extracted from VideoRecorder.tsx
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Circle, Pause, Play, Square } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isReady: boolean;
  onStart: () => Promise<void>;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isPaused,
  isReady,
  onStart,
  onStop,
  onPause,
  onResume
}) => {
  return (
    <div id="recording-controls" className="space-y-4">
      {!isRecording && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={onStart}
            disabled={!isReady}
            className="h-16 px-8 text-lg min-w-[200px] touch-manipulation"
          >
            <Circle className="h-6 w-6 mr-3" />
            Start Recording
          </Button>
        </div>
      )}

      {isRecording && !isPaused && (
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={onPause}
            className="h-14 px-6 text-lg min-w-[120px] touch-manipulation"
          >
            <Pause className="h-5 w-5 mr-2" />
            Pause
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={onStop}
            className="h-14 px-6 text-lg min-w-[120px] touch-manipulation"
          >
            <Square className="h-5 w-5 mr-2" />
            Stop
          </Button>
        </div>
      )}

      {isPaused && (
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button
            size="lg"
            onClick={onResume}
            className="h-14 px-6 text-lg min-w-[120px] touch-manipulation"
          >
            <Play className="h-5 w-5 mr-2" />
            Resume
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={onStop}
            className="h-14 px-6 text-lg min-w-[120px] touch-manipulation"
          >
            <Square className="h-5 w-5 mr-2" />
            Stop
          </Button>
        </div>
      )}
    </div>
  );
};