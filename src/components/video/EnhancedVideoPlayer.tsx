// Enhanced Video Player for STR Certified Auditor Review
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Download,
  AlertTriangle,
  Loader2,
  Clock,
  Eye,
  RefreshCw
} from 'lucide-react';
import { logger } from '@/utils/logger';

interface VideoPlayerProps {
  src: string;
  title?: string;
  duration?: number;
  timestamp?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onSeek?: (seekTime: number) => void;
  onError?: (error: string) => void;
  autoplay?: boolean;
  showControls?: boolean;
  showTimestamps?: boolean;
  className?: string;
}

interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  isLoading: boolean;
  error: string | null;
}

export function EnhancedVideoPlayer({
  src,
  title,
  duration: propDuration,
  timestamp,
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onSeek,
  onError,
  autoplay = false,
  showControls = true,
  showTimestamps = true,
  className = ''
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [videoState, setVideoState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: propDuration || 0,
    buffered: 0,
    volume: 1,
    muted: false,
    isFullscreen: false,
    playbackRate: 1,
    isLoading: true,
    error: null
  });

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPlaybackRateMenu, setShowPlaybackRateMenu] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Format time for display
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Handle video events
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoState(prev => ({
        ...prev,
        duration: videoRef.current!.duration,
        isLoading: false,
        error: null
      }));
      
      logger.info('Video metadata loaded', {
        duration: videoRef.current.duration,
        src: src.substring(0, 100) + '...'
      }, 'VIDEO_PLAYER');
    }
  }, [src]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const buffered = videoRef.current.buffered.length > 0 ? 
        videoRef.current.buffered.end(0) : 0;
      
      setVideoState(prev => ({
        ...prev,
        currentTime,
        buffered
      }));
      
      onTimeUpdate?.(currentTime);
    }
  }, [onTimeUpdate]);

  const handlePlay = useCallback(() => {
    setVideoState(prev => ({ ...prev, isPlaying: true }));
    onPlay?.();
    logger.info('Video play started', { currentTime: videoState.currentTime }, 'VIDEO_PLAYER');
  }, [onPlay, videoState.currentTime]);

  const handlePause = useCallback(() => {
    setVideoState(prev => ({ ...prev, isPlaying: false }));
    onPause?.();
    logger.info('Video paused', { currentTime: videoState.currentTime }, 'VIDEO_PLAYER');
  }, [onPause, videoState.currentTime]);

  const handleEnded = useCallback(() => {
    setVideoState(prev => ({ ...prev, isPlaying: false }));
    onEnded?.();
    logger.info('Video playback ended', { duration: videoState.duration }, 'VIDEO_PLAYER');
  }, [onEnded, videoState.duration]);

  const handleError = useCallback((error: Event) => {
    const videoError = (error.target as HTMLVideoElement).error;
    const errorMessage = videoError ? 
      `Video error: ${videoError.message} (Code: ${videoError.code})` : 
      'Unknown video error';
    
    logger.error('Video playback error', { error: errorMessage, src }, 'VIDEO_PLAYER');
    
    setVideoState(prev => ({
      ...prev,
      isLoading: false,
      error: errorMessage
    }));
    
    onError?.(errorMessage);
  }, [onError, src]);

  const handleLoadStart = useCallback(() => {
    setVideoState(prev => ({ ...prev, isLoading: true, error: null }));
  }, []);

  const handleCanPlay = useCallback(() => {
    setVideoState(prev => ({ ...prev, isLoading: false }));
  }, []);

  // Control functions
  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoState.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          logger.error('Failed to play video', error, 'VIDEO_PLAYER');
          handleError(error);
        });
      }
    }
  }, [videoState.isPlaying, handleError]);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onSeek?.(time);
      logger.info('Video seek', { seekTime: time }, 'VIDEO_PLAYER');
    }
  }, [onSeek]);

  const skipForward = useCallback(() => {
    seekTo(Math.min(videoState.currentTime + 10, videoState.duration));
  }, [seekTo, videoState.currentTime, videoState.duration]);

  const skipBackward = useCallback(() => {
    seekTo(Math.max(videoState.currentTime - 10, 0));
  }, [seekTo, videoState.currentTime]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoState.muted;
      videoRef.current.muted = newMuted;
      setVideoState(prev => ({ ...prev, muted: newMuted }));
    }
  }, [videoState.muted]);

  const setVolume = useCallback((volume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      setVideoState(prev => ({ ...prev, volume }));
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setVideoState(prev => ({ ...prev, playbackRate: rate }));
      setShowPlaybackRateMenu(false);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!videoState.isFullscreen) {
        containerRef.current.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }
  }, [videoState.isFullscreen]);

  const retryVideo = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      setRetryCount(prev => prev + 1);
      setVideoState(prev => ({ ...prev, error: null, isLoading: true }));
      
      if (videoRef.current) {
        videoRef.current.load();
      }
      
      logger.info('Retrying video load', { retryCount: retryCount + 1 }, 'VIDEO_PLAYER');
    }
  }, [retryCount]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setVideoState(prev => ({ ...prev, isFullscreen: !!document.fullscreenElement }));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target === videoRef.current || containerRef.current?.contains(e.target as Node)) {
        switch (e.key) {
          case ' ':
            e.preventDefault();
            togglePlayPause();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            skipBackward();
            break;
          case 'ArrowRight':
            e.preventDefault();
            skipForward();
            break;
          case 'ArrowUp':
            e.preventDefault();
            setVolume(Math.min(videoState.volume + 0.1, 1));
            break;
          case 'ArrowDown':
            e.preventDefault();
            setVolume(Math.max(videoState.volume - 0.1, 0));
            break;
          case 'f':
            e.preventDefault();
            toggleFullscreen();
            break;
          case 'm':
            e.preventDefault();
            toggleMute();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, skipBackward, skipForward, setVolume, toggleFullscreen, toggleMute, videoState.volume]);

  const progressPercentage = videoState.duration > 0 ? (videoState.currentTime / videoState.duration) * 100 : 0;
  const bufferedPercentage = videoState.duration > 0 ? (videoState.buffered / videoState.duration) * 100 : 0;

  return (
    <div ref={containerRef} className={`video-player-container ${className}`}>
      <Card className="w-full">
        {title && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5" />
              {title}
              {timestamp && (
                <Badge variant="outline" className="ml-auto">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(timestamp).toLocaleString()}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        )}
        
        <CardContent className="space-y-4">
          {/* Video Element */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            {videoState.isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Loading video...</p>
                </div>
              </div>
            )}
            
            {videoState.error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <Alert variant="destructive" className="max-w-md">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {videoState.error}
                    {retryCount < MAX_RETRIES && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryVideo}
                        className="mt-2 ml-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry ({retryCount + 1}/{MAX_RETRIES})
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <video
              ref={videoRef}
              className="w-full h-auto max-h-96"
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              onError={handleError}
              onLoadStart={handleLoadStart}
              onCanPlay={handleCanPlay}
              autoPlay={autoplay}
              playsInline
              preload="metadata"
            >
              <source src={src} type="video/mp4" />
              <source src={src} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Controls */}
          {showControls && (
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="relative">
                  <Progress value={bufferedPercentage} className="absolute h-1 bg-gray-200" />
                  <Progress value={progressPercentage} className="h-1" />
                  <div 
                    className="absolute top-0 left-0 h-1 w-full cursor-pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const seekTime = (clickX / rect.width) * videoState.duration;
                      seekTo(seekTime);
                    }}
                  />
                </div>
                
                {showTimestamps && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatTime(videoState.currentTime)}</span>
                    <span>{formatTime(videoState.duration)}</span>
                  </div>
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlayPause}
                    disabled={videoState.isLoading || !!videoState.error}
                  >
                    {videoState.isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipBackward}
                    disabled={videoState.isLoading || !!videoState.error}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipForward}
                    disabled={videoState.isLoading || !!videoState.error}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  {/* Volume Control */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                    >
                      {videoState.muted || videoState.volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {showVolumeSlider && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg p-3 shadow-lg">
                        <div className="w-20">
                          <Slider
                            value={[videoState.volume]}
                            onValueChange={([value]) => setVolume(value)}
                            min={0}
                            max={1}
                            step={0.1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Playback Rate */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPlaybackRateMenu(!showPlaybackRateMenu)}
                    >
                      {videoState.playbackRate}x
                    </Button>
                    
                    {showPlaybackRateMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-white border rounded-lg shadow-lg">
                        {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                          <button
                            key={rate}
                            onClick={() => setPlaybackRate(rate)}
                            className={`block w-full text-left px-3 py-1 hover:bg-gray-100 ${
                              videoState.playbackRate === rate ? 'bg-blue-100' : ''
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                  >
                    {videoState.isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = src;
                      link.download = title || 'video.mp4';
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedVideoPlayer;