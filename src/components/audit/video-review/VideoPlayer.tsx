import React, { forwardRef } from 'react';
import { VideoPlayerState } from './types';

interface VideoPlayerProps {
  videoUrl: string;
  state: VideoPlayerState;
  onTimeUpdate: (currentTime: number) => void;
  onDurationChange: (duration: number) => void;
  onLoadStart: () => void;
  onCanPlay: () => void;
  onEnded: () => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({
  videoUrl,
  state,
  onTimeUpdate,
  onDurationChange,
  onLoadStart,
  onCanPlay,
  onEnded
}, ref) => (
  <video
    ref={ref}
    src={videoUrl}
    className="w-full h-full bg-black rounded-lg"
    onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
    onDurationChange={(e) => onDurationChange(e.currentTarget.duration)}
    onLoadStart={onLoadStart}
    onCanPlay={onCanPlay}
    onEnded={onEnded}
    muted={state.isMuted}
    style={{ 
      volume: state.volume,
      playbackRate: state.playbackRate 
    }}
  />
));