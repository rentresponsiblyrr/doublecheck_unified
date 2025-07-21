import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera } from 'lucide-react';
import { VideoPlayer } from './video-review/VideoPlayer';
import { VideoControls } from './video-review/VideoControls';
import { VideoTimestamps } from './video-review/VideoTimestamps';
import { VideoBookmarks } from './video-review/VideoBookmarks';
import { useVideoPlayer } from './video-review/useVideoPlayer';
import { VideoReviewPlayerProps } from './video-review/types';

export const VideoReviewPlayer: React.FC<VideoReviewPlayerProps> = ({
  videoUrl,
  timestamps = [],
  onTimestampClick,
  onBookmarkAdd,
  className = ''
}) => {
  const {
    videoRef,
    state,
    controls,
    bookmarks,
    addBookmark,
    deleteBookmark,
    seekToBookmark,
    handleTimeUpdate,
    handleDurationChange,
    handleLoadStart,
    handleCanPlay,
    handleEnded
  } = useVideoPlayer(videoUrl);

  const handleTimestampClick = (timestamp: any) => {
    controls.seek(timestamp.time);
    onTimestampClick?.(timestamp);
  };

  const handleBookmarkAdd = (time: number, description: string) => {
    addBookmark(time, description);
    onBookmarkAdd?.(time, description);
  };

  return (
    <div id="video-review-player" className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${className}`}>
      {/* Main Video Player */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Inspection Video Review
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side Panel */}
      <div className="lg:col-span-1 space-y-6">
        {/* Timestamps */}
        <Card>
          <CardContent className="p-4">
            <VideoTimestamps
              timestamps={timestamps}
              currentTime={state.currentTime}
              onTimestampClick={handleTimestampClick}
            />
          </CardContent>
        </Card>

        {/* Bookmarks */}
        <Card>
          <CardContent className="p-4">
            <VideoBookmarks
              bookmarks={bookmarks}
              currentTime={state.currentTime}
              onAddBookmark={handleBookmarkAdd}
              onDeleteBookmark={deleteBookmark}
              onSeekToBookmark={seekToBookmark}
            />
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="lg:col-span-4 text-xs text-gray-500 text-center space-x-4">
        <span>⏯️ Space: Play/Pause</span>
        <span>⬅️➡️ Arrow Keys: Seek ±10s</span>
        <span>⬆️⬇️ Arrow Keys: Volume ±10%</span>
        <span>🔇 M: Mute</span>
        <span>🔖 B: Bookmark</span>
        <span>📺 F: Fullscreen</span>
      </div>
    </div>
  );
};

export default VideoReviewPlayer;