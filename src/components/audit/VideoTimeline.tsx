// Video Timeline Component for STR Certified Auditor Interface

import React, { useRef, useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { VideoTimestamp, SceneType } from '@/types/video';
import {
  Home,
  Camera,
  ZoomIn,
  Zap,
  Flag,
  MapPin,
  Bookmark,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface VideoTimelineProps {
  duration: number;
  currentTime: number;
  timestamps: VideoTimestamp[];
  bookmarks?: VideoTimestamp[];
  buffered?: number;
  onSeek: (time: number) => void;
  onTimestampClick?: (timestamp: VideoTimestamp) => void;
  showLabels?: boolean;
  className?: string;
}

interface TimelineSegment {
  startTime: number;
  endTime: number;
  type: SceneType;
  roomType?: string;
  hasIssues: boolean;
  confidence: number;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  duration,
  currentTime,
  timestamps,
  bookmarks = [],
  buffered = 0,
  onSeek,
  onTimestampClick,
  showLabels = false,
  className
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Generate timeline segments from timestamps
  const segments = React.useMemo(() => {
    const segs: TimelineSegment[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const current = timestamps[i];
      const next = timestamps[i + 1];
      
      segs.push({
        startTime: current.time,
        endTime: next ? next.time : duration,
        type: current.sceneType,
        roomType: current.roomDetected,
        hasIssues: current.sceneType === 'issue_documentation' || 
                   current.features.includes('issue') ||
                   current.features.includes('damage'),
        confidence: current.confidence
      });
    }
    
    return segs;
  }, [timestamps, duration]);

  // Get color for scene type
  const getSceneColor = (type: SceneType, hasIssues: boolean = false): string => {
    if (hasIssues) return 'bg-red-500';
    
    switch (type) {
      case 'room_entry':
        return 'bg-blue-500';
      case 'room_overview':
        return 'bg-green-500';
      case 'detail_shot':
        return 'bg-purple-500';
      case 'amenity_focus':
        return 'bg-yellow-500';
      case 'transition':
        return 'bg-gray-400';
      case 'exterior':
        return 'bg-cyan-500';
      case 'issue_documentation':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get icon for scene type
  const getSceneIcon = (type: SceneType) => {
    switch (type) {
      case 'room_entry':
        return Home;
      case 'room_overview':
        return Camera;
      case 'detail_shot':
        return ZoomIn;
      case 'amenity_focus':
        return Zap;
      case 'issue_documentation':
        return Flag;
      default:
        return MapPin;
    }
  };

  // Handle mouse move on timeline
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    
    setHoverTime(time);
    setHoverPosition(x);
  };

  // Handle timeline click
  const handleClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    
    onSeek(time);
  };

  // Handle drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleClick(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!timelineRef.current) return;
        
        const rect = timelineRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const percentage = x / rect.width;
        const time = percentage * duration;
        
        onSeek(time);
      };

      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, duration, onSeek]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Find nearest timestamp to hover position
  const nearestTimestamp = React.useMemo(() => {
    if (hoverTime === null) return null;
    
    let nearest = timestamps[0];
    let minDiff = Math.abs(timestamps[0].time - hoverTime);
    
    for (const ts of timestamps) {
      const diff = Math.abs(ts.time - hoverTime);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = ts;
      }
    }
    
    return minDiff < 5 ? nearest : null; // Within 5 seconds
  }, [hoverTime, timestamps]);

  return (
    <TooltipProvider>
      <div className={cn('relative', className)}>
        {/* Main Timeline */}
        <div
          ref={timelineRef}
          className="relative h-12 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
        >
          {/* Buffered Progress */}
          <div
            className="absolute inset-y-0 left-0 bg-gray-300 dark:bg-gray-700"
            style={{ width: `${(buffered / duration) * 100}%` }}
          />

          {/* Timeline Segments */}
          {segments.map((segment, index) => {
            const startPercent = (segment.startTime / duration) * 100;
            const widthPercent = ((segment.endTime - segment.startTime) / duration) * 100;
            
            return (
              <div
                key={index}
                className={cn(
                  'absolute inset-y-0 opacity-60 hover:opacity-80 transition-opacity',
                  getSceneColor(segment.type, segment.hasIssues)
                )}
                style={{
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`
                }}
              />
            );
          })}

          {/* Timestamp Markers */}
          {timestamps.map((timestamp) => {
            const position = (timestamp.time / duration) * 100;
            const Icon = getSceneIcon(timestamp.sceneType);
            const isKeyFrame = timestamp.isKeyFrame;
            const hasIssue = timestamp.sceneType === 'issue_documentation';
            
            return (
              <Tooltip key={timestamp.id}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
                      'w-6 h-6 rounded-full flex items-center justify-center',
                      'transition-all hover:scale-125 hover:z-10',
                      hasIssue ? 'bg-red-600 text-white' : 'bg-white dark:bg-gray-900',
                      isKeyFrame && 'ring-2 ring-yellow-400'
                    )}
                    style={{ left: `${position}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTimestampClick?.(timestamp);
                    }}
                  >
                    <Icon className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-medium">{timestamp.description}</p>
                    {timestamp.roomDetected && (
                      <p className="text-xs text-muted-foreground">
                        {timestamp.roomDetected} • {formatTime(timestamp.time)}
                      </p>
                    )}
                    {timestamp.confidence && (
                      <p className="text-xs text-muted-foreground">
                        {timestamp.confidence}% confidence
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Bookmarks */}
          {bookmarks.map((bookmark) => {
            const position = (bookmark.time / duration) * 100;
            
            return (
              <Tooltip key={bookmark.id}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute top-0 w-0.5 h-3 bg-yellow-500"
                    style={{ left: `${position}%` }}
                  >
                    <Bookmark className="h-3 w-3 text-yellow-500 absolute -top-1 -left-1.5" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Bookmark: {formatTime(bookmark.time)}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}

          {/* Current Time Indicator */}
          <div
            className="absolute inset-y-0 w-0.5 bg-white shadow-lg transition-all"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
          </div>

          {/* Hover Time Indicator */}
          {hoverTime !== null && (
            <div
              className="absolute inset-y-0 w-px bg-white/50 pointer-events-none"
              style={{ left: `${hoverPosition}px` }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {formatTime(hoverTime)}
                {nearestTimestamp && (
                  <span className="block text-yellow-400 mt-0.5">
                    {nearestTimestamp.description}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Scene Labels (optional) */}
        {showLabels && (
          <div className="relative mt-2">
            {segments.map((segment, index) => {
              const startPercent = (segment.startTime / duration) * 100;
              const widthPercent = ((segment.endTime - segment.startTime) / duration) * 100;
              
              if (widthPercent < 5) return null; // Too small to show label
              
              return (
                <div
                  key={index}
                  className="absolute text-xs text-muted-foreground truncate"
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`
                  }}
                >
                  {segment.roomType || segment.type}
                </div>
              );
            })}
          </div>
        )}

        {/* Timeline Legend */}
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatTime(0)}</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Room Entry</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Overview</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>Issue</span>
            </div>
            <div className="flex items-center space-x-1">
              <Bookmark className="h-3 w-3 text-yellow-500" />
              <span>Bookmark</span>
            </div>
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Mini timeline for compact view
export const MiniVideoTimeline: React.FC<{
  duration: number;
  currentTime: number;
  timestamps: VideoTimestamp[];
  onSeek: (time: number) => void;
  className?: string;
}> = ({ duration, currentTime, timestamps, onSeek, className }) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    
    onSeek(time);
  };

  return (
    <div
      ref={timelineRef}
      className={cn(
        'relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden cursor-pointer',
        className
      )}
      onClick={handleClick}
    >
      {/* Progress */}
      <div
        className="absolute inset-y-0 left-0 bg-primary"
        style={{ width: `${(currentTime / duration) * 100}%` }}
      />

      {/* Issue Markers */}
      {timestamps
        .filter(ts => ts.sceneType === 'issue_documentation')
        .map((ts) => {
          const position = (ts.time / duration) * 100;
          return (
            <div
              key={ts.id}
              className="absolute top-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full"
              style={{ left: `${position}%` }}
            />
          );
        })}
    </div>
  );
};