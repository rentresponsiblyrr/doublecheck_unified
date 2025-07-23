export interface VideoReviewPlayerProps {
  videoUrl: string;
  timestamps?: VideoTimestamp[];
  onTimestampClick?: (timestamp: VideoTimestamp) => void;
  onBookmarkAdd?: (time: number, description: string) => void;
  className?: string;
}

export interface VideoTimestamp {
  time: number;
  description: string;
  category: "issue" | "note" | "highlight";
  inspector?: string;
}

export interface VideoBookmark {
  id: string;
  time: number;
  description: string;
  createdAt: Date;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
  isLoading: boolean;
}

export interface VideoControls {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  setPlaybackRate: (rate: number) => void;
}
