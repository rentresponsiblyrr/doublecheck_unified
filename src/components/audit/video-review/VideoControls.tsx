import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  Settings 
} from 'lucide-react';
import { VideoPlayerState } from './types';

interface VideoControlsProps {
  state: VideoPlayerState;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onPlaybackRateChange: (rate: number) => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  state,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onPlaybackRateChange
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="video-controls" className="bg-black bg-opacity-80 text-white p-4 space-y-3">
      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-mono min-w-[45px]">
          {formatTime(state.currentTime)}
        </span>
        <Slider
          value={[state.currentTime]}
          max={state.duration || 100}
          step={0.1}
          onValueChange={(value) => onSeek(value[0])}
          className="flex-1"
        />
        <span className="text-sm font-mono min-w-[45px]">
          {formatTime(state.duration)}
        </span>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="sm"
            onClick={state.isPlaying ? onPause : onPlay}
            disabled={state.isLoading}
          >
            {state.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>

          {/* Skip Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSeek(Math.max(0, state.currentTime - 10))}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSeek(Math.min(state.duration, state.currentTime + 10))}
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          {/* Volume Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMute}
            >
              {state.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <Slider
              value={[state.isMuted ? 0 : state.volume]}
              max={1}
              step={0.1}
              onValueChange={(value) => onVolumeChange(value[0])}
              className="w-20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Playback Speed */}
          <Select
            value={state.playbackRate.toString()}
            onValueChange={(value) => onPlaybackRateChange(parseFloat(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.25">1.25x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
          >
            {state.isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};