import React from 'react';

interface VideoPlayerProps {
  src?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, onPlay, onPause, onEnded }) => {
  return (
    <div className="video-player">
      <video
        controls
        width="100%"
        height="auto"
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        src={src}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;