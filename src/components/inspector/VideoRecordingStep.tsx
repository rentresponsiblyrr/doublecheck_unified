import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video } from 'lucide-react';
import { VideoPreview } from './video/VideoPreview';
import { VideoControls } from './video/VideoControls';
import { useVideoRecording } from './video/useVideoRecording';
import { VideoRecordingStepProps } from './video/types';

export const VideoRecordingStep: React.FC<VideoRecordingStepProps> = ({
  onVideoRecorded,
  recordedVideo,
  onStepComplete,
  className = ''
}) => {
  const {
    videoRef,
    recordingState,
    cameraState,
    startRecording,
    pauseResumeRecording,
    stopRecording,
    resetRecording
  } = useVideoRecording(onVideoRecorded);

  const hasRecordedVideo = !!recordedVideo || !!recordingState.recordedVideoUrl;

  return (
    <Card id="video-recording-step" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Property Walkthrough Video
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <VideoPreview
          videoRef={videoRef}
          recordedVideoUrl={recordingState.recordedVideoUrl}
          isLoading={cameraState.isLoading}
          error={cameraState.error}
          hasPermission={cameraState.hasPermission}
        />

        <VideoControls
          isRecording={recordingState.isRecording}
          isPaused={recordingState.isPaused}
          duration={recordingState.duration}
          hasRecordedVideo={hasRecordedVideo}
          onStart={startRecording}
          onStop={stopRecording}
          onPause={pauseResumeRecording}
          onReset={resetRecording}
          onComplete={onStepComplete}
          disabled={!cameraState.hasPermission || cameraState.isLoading}
        />

        {/* Progress indicator */}
        {recordingState.duration > 0 && (
          <div className="text-center">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-600 h-1 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((recordingState.duration / 300) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recommended: 3-5 minutes ({Math.floor(recordingState.duration / 60)}:{(recordingState.duration % 60).toString().padStart(2, '0')})
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoRecordingStep;