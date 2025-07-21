import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import { VideoPlayer } from '../audit/video-review/VideoPlayer';
import { VideoControls } from '../audit/video-review/VideoControls';
import { useVideoPlayer } from '../audit/video-review/useVideoPlayer';

interface EnhancedVideoPlayerProps {
  videoUrl: string;
  title?: string;
  showControls?: boolean;
  showTimestamps?: boolean;
  autoPlay?: boolean;
  className?: string;
  onVideoError?: (error: string) => void;
}

export const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  videoUrl,
  title = 'Video Player',
  showControls = true,
  showTimestamps = true,
  autoPlay = false,
  className = '',
  onVideoError
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const MAX_RETRIES = 3;

  const {
    videoRef,
    state,
    controls,
    handleTimeUpdate,
    handleDurationChange,
    handleLoadStart,
    handleCanPlay,
    handleEnded
  } = useVideoPlayer(videoUrl);

  const handleVideoError = (error: string) => {
    setVideoError(error);
    onVideoError?.(error);
    
    // Auto-retry logic
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setVideoError(null);
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 2000);
    }
  };

  const handleManualRetry = () => {
    setRetryCount(0);
    setVideoError(null);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  if (videoError && retryCount >= MAX_RETRIES) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load video after {MAX_RETRIES} attempts</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualRetry}
                className="ml-2"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="enhanced-video-player" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          {title}
          {retryCount > 0 && (
            <span className="text-sm text-yellow-600">
              (Retry {retryCount}/{MAX_RETRIES})
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <VideoPlayer
            ref={videoRef}
            videoUrl={videoUrl}
            state={state}
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onLoadStart={handleLoadStart}
            onCanPlay={handleCanPlay}
            onEnded={handleEnded}
          />

          {showControls && (
            <div className="absolute bottom-0 left-0 right-0">
              <VideoControls
                state={state}
                onPlay={controls.play}
                onPause={controls.pause}
                onSeek={controls.seek}
                onVolumeChange={controls.setVolume}
                onToggleMute={controls.toggleMute}
                onToggleFullscreen={controls.toggleFullscreen}
                onPlaybackRateChange={controls.setPlaybackRate}
              />
            </div>
          )}

          {videoError && retryCount < MAX_RETRIES && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-center text-white">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Retrying video load... ({retryCount + 1}/{MAX_RETRIES})</p>
              </div>
            </div>
          )}
        </div>

        {showTimestamps && (
          <div className="p-2 bg-gray-50 text-xs text-gray-600 flex justify-between">
            <span>Duration: {Math.floor(state.duration / 60)}:{(state.duration % 60).toFixed(0).padStart(2, '0')}</span>
            <span>Current: {Math.floor(state.currentTime / 60)}:{(state.currentTime % 60).toFixed(0).padStart(2, '0')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function EnhancedVideoPlayer(props: EnhancedVideoPlayerProps) {
  return <EnhancedVideoPlayer {...props} />;
}