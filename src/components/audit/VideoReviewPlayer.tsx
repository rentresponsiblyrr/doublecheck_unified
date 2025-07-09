// Video Review Player Component for STR Certified Auditor Interface

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Bookmark,
  Flag,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  MapPin,
  Camera,
  Home,
  Zap
} from 'lucide-react';
import { VideoTimeline } from './VideoTimeline';
import { useVideoReview } from '@/hooks/useVideoReview';
import { cn } from '@/lib/utils';
import type { VideoRecording, VideoTimestamp, SceneType } from '@/types/video';

interface VideoReviewPlayerProps {
  video: VideoRecording;
  onTimestampClick?: (timestamp: VideoTimestamp) => void;
  onAnnotation?: (timestamp: number, annotation: any) => void;
  showSceneInfo?: boolean;
  className?: string;
}

export const VideoReviewPlayer: React.FC<VideoReviewPlayerProps> = ({
  video,
  onTimestampClick,
  onAnnotation,
  showSceneInfo = true,
  className
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom hook for video management
  const {
    isPlaying,
    currentTime,
    duration,
    buffered,
    currentScene,
    nearestTimestamp,
    play,
    pause,
    seek,
    jumpToTimestamp,
    jumpToNextScene,
    jumpToPreviousScene,
    addBookmark,
    removeBookmark,
    bookmarks,
    isBookmarked
  } = useVideoReview(video, videoRef);

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get scene icon
  const getSceneIcon = (sceneType: SceneType) => {
    switch (sceneType) {
      case 'room_entry':
        return <Home className="h-4 w-4" />;
      case 'room_overview':
        return <Camera className="h-4 w-4" />;
      case 'detail_shot':
        return <ZoomIn className="h-4 w-4" />;
      case 'amenity_focus':
        return <Zap className="h-4 w-4" />;
      case 'issue_documentation':
        return <Flag className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  // Get scene color
  const getSceneColor = (sceneType: SceneType) => {
    switch (sceneType) {
      case 'room_entry':
        return 'bg-blue-500';
      case 'room_overview':
        return 'bg-green-500';
      case 'detail_shot':
        return 'bg-purple-500';
      case 'amenity_focus':
        return 'bg-yellow-500';
      case 'issue_documentation':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Handle play/pause toggle
  const togglePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (rate: string) => {
    const newRate = parseFloat(rate);
    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'b':
          if (nearestTimestamp) {
            addBookmark(currentTime, nearestTimestamp.description);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, volume, isPlaying, nearestTimestamp, addBookmark, handleVolumeChange, seek, toggleFullscreen, toggleMute, togglePlayPause]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isPlaying]);

  // Handle timeline click
  const handleTimelineClick = (timestamp: VideoTimestamp) => {
    jumpToTimestamp(timestamp);
    onTimestampClick?.(timestamp);
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    if (isBookmarked(currentTime)) {
      const bookmark = bookmarks.find(b => Math.abs(b.time - currentTime) < 1);
      if (bookmark) {
        removeBookmark(bookmark.id);
      }
    } else {
      const description = nearestTimestamp?.description || `Bookmark at ${formatTime(currentTime)}`;
      addBookmark(currentTime, description);
    }
  };

  return (
    <Card className={cn('w-full overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>Video Review</span>
            <Badge variant="secondary">
              {video.duration}s • {video.resolution.width}x{video.resolution.height}
            </Badge>
          </CardTitle>
          {showSceneInfo && currentScene && (
            <div className="flex items-center space-x-2">
              <div className={cn('p-1 rounded', getSceneColor(currentScene.sceneType), 'bg-opacity-20')}>
                {getSceneIcon(currentScene.sceneType)}
              </div>
              <div className="text-sm">
                <p className="font-medium">{currentScene.roomDetected || 'Unknown Room'}</p>
                <p className="text-xs text-muted-foreground">{currentScene.description}</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          ref={containerRef}
          className={cn(
            'relative bg-black',
            isFullscreen && 'fixed inset-0 z-50'
          )}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src={URL.createObjectURL(video.file)}
            className="w-full h-full"
            onClick={togglePlayPause}
          />

          {/* Video Controls Overlay */}
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300',
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            {/* Timeline */}
            <div className="px-4 pb-2">
              <VideoTimeline
                duration={duration}
                currentTime={currentTime}
                timestamps={video.timestamps}
                bookmarks={bookmarks}
                buffered={buffered}
                onSeek={seek}
                onTimestampClick={handleTimelineClick}
                className="mb-4"
              />
            </div>

            {/* Control Buttons */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                {/* Left Controls */}
                <div className="flex items-center space-x-2">
                  {/* Play/Pause */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>

                  {/* Previous/Next Scene */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={jumpToPreviousScene}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={jumpToNextScene}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <div className="w-24">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        onValueChange={handleVolumeChange}
                        min={0}
                        max={1}
                        step={0.1}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="text-white text-sm font-mono ml-4">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center space-x-2">
                  {/* Bookmark */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBookmarkToggle}
                    className={cn(
                      'text-white hover:bg-white/20',
                      isBookmarked(currentTime) && 'text-yellow-400'
                    )}
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>

                  {/* Settings */}
                  <Popover open={showSettings} onOpenChange={setShowSettings}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48" align="end">
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium">Playback Speed</label>
                          <Select
                            value={playbackRate.toString()}
                            onValueChange={handlePlaybackRateChange}
                          >
                            <SelectTrigger className="w-full mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.5">0.5x</SelectItem>
                              <SelectItem value="0.75">0.75x</SelectItem>
                              <SelectItem value="1">1x (Normal)</SelectItem>
                              <SelectItem value="1.25">1.25x</SelectItem>
                              <SelectItem value="1.5">1.5x</SelectItem>
                              <SelectItem value="2">2x</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Fullscreen */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Scene Info Overlay */}
          {showSceneInfo && currentScene && !isFullscreen && (
            <div className="absolute top-4 left-4 right-4">
              <Card className="bg-black/70 backdrop-blur-sm text-white">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn('p-2 rounded', getSceneColor(currentScene.sceneType))}>
                        {getSceneIcon(currentScene.sceneType)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {currentScene.roomDetected || 'Scene'} - {currentScene.sceneType.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm opacity-80">{currentScene.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-white/20">
                      {currentScene.confidence}% confidence
                    </Badge>
                  </div>
                  {currentScene.features.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {currentScene.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-white/20 text-white">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Quick navigation component
export const VideoQuickNav: React.FC<{
  timestamps: VideoTimestamp[];
  currentTime: number;
  onJump: (timestamp: VideoTimestamp) => void;
  className?: string;
}> = ({ timestamps, currentTime, onJump, className }) => {
  // Group timestamps by room
  const roomGroups = timestamps.reduce((acc, ts) => {
    const room = ts.roomDetected || 'Other';
    if (!acc[room]) acc[room] = [];
    acc[room].push(ts);
    return acc;
  }, {} as Record<string, VideoTimestamp[]>);

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium text-muted-foreground">Quick Navigation</h3>
      {Object.entries(roomGroups).map(([room, roomTimestamps]) => (
        <div key={room} className="space-y-1">
          <p className="text-sm font-medium">{room}</p>
          <div className="flex flex-wrap gap-1">
            {roomTimestamps.map((ts) => {
              const isActive = Math.abs(ts.time - currentTime) < 5;
              return (
                <Button
                  key={ts.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onJump(ts)}
                  className="text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(ts.time)}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper function
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}