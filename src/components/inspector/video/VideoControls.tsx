import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle 
} from 'lucide-react';

interface VideoControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  hasRecordedVideo: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onReset: () => void;
  onComplete: () => void;
  disabled?: boolean;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isRecording,
  isPaused,
  duration,
  hasRecordedVideo,
  onStart,
  onStop,
  onPause,
  onReset,
  onComplete,
  disabled = false
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingStatus = (): string => {
    if (isRecording && isPaused) return 'paused';
    if (isRecording) return 'recording';
    if (hasRecordedVideo) return 'completed';
    return 'ready';
  };

  const getStatusColor = (): string => {
    const status = getRecordingStatus();
    switch (status) {
      case 'recording': return 'bg-red-100 text-red-800 border-red-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div id="video-controls-panel" className="space-y-4">
      {/* Status Display */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={getStatusColor()}>
          {getRecordingStatus().toUpperCase()}
        </Badge>
        <div className="text-lg font-mono font-bold text-gray-700">
          {formatDuration(duration)}
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex gap-2 justify-center">
        {!isRecording ? (
          <Button
            onClick={onStart}
            disabled={disabled}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <Video className="w-4 h-4" />
            Start Recording
          </Button>
        ) : (
          <>
            <Button
              onClick={onPause}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            
            <Button
              onClick={onStop}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </Button>
          </>
        )}

        {hasRecordedVideo && !isRecording && (
          <>
            <Button
              onClick={onReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Re-record
            </Button>
            
            <Button
              onClick={onComplete}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              Complete
            </Button>
          </>
        )}
      </div>

      {/* Recording Guidelines */}
      {!hasRecordedVideo && (
        <div className="text-sm text-gray-600 text-center space-y-1">
          <p>• Walk through each room slowly and steadily</p>
          <p>• Point out key features and any issues</p>
          <p>• Recommended duration: 3-5 minutes</p>
        </div>
      )}
    </div>
  );
};