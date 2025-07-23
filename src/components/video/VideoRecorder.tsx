/**
 * Video Recorder - Surgically Refactored
 * Decomposed from 436→<300 lines using component composition
 * Business logic extracted to useVideoRecorder hook
 */

import React, { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video } from "lucide-react";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";
import { CameraPermissionCard } from "@/components/video/CameraPermissionCard";
import { CameraErrorAlert } from "@/components/video/CameraErrorAlert";
import { VideoPreview } from "@/components/video/VideoPreview";
import { VideoQualitySettings } from "@/components/video/VideoQualitySettings";
import { VideoUploadProgress } from "@/components/video/VideoUploadProgress";
import { RecordingControls } from "@/components/video/RecordingControls";
import { RecordingTips } from "@/components/video/RecordingTips";
import { CompletedVideoCard } from "@/components/video/CompletedVideoCard";

interface VideoRecorderProps {
  propertyId?: string;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  maxDuration?: number;
  className?: string;
}

export function VideoRecorder({
  propertyId,
  isRecording: externalIsRecording,
  onStartRecording,
  onStopRecording,
  maxDuration = 600,
  className,
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    // Camera state
    isReady,
    hasPermission,
    cameraLoading,
    cameraError,
    availableDevices,

    // Recording state
    internalIsRecording,
    isPaused,
    duration,
    recordedVideo,
    audioEnabled,
    showSettings,
    error,

    // Actions
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    setAudioEnabled,
    setShowSettings,
    requestPermission,
    switchCamera,
    clearError,

    // Utility
    formatDuration,
  } = useVideoRecorder({
    videoRef,
    maxDuration,
    onStartRecording,
    onStopRecording,
    facingMode: "environment",
    resolution: { width: 1920, height: 1080 },
  });

  // Camera permission handling
  if (!hasPermission && !cameraLoading) {
    return (
      <CameraPermissionCard
        className={className}
        onRequestPermission={requestPermission}
      />
    );
  }

  if (cameraError || error) {
    return (
      <CameraErrorAlert
        error={error}
        cameraError={cameraError}
        onRetry={clearError}
      />
    );
  }

  const isCurrentlyRecording = internalIsRecording || externalIsRecording;

  return (
    <Card id="video-recorder-container" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Walkthrough
          {isCurrentlyRecording && (
            <Badge className="bg-red-100 text-red-800 animate-pulse">
              Recording
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-6">
        <VideoPreview
          videoRef={videoRef}
          cameraLoading={cameraLoading}
          isRecording={isCurrentlyRecording}
          duration={duration}
          formatDuration={formatDuration}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(!showSettings)}
        />

        <VideoQualitySettings
          showSettings={showSettings}
          audioEnabled={audioEnabled}
          availableDevices={availableDevices}
          isRecording={isCurrentlyRecording}
          onToggleAudio={() => setAudioEnabled(!audioEnabled)}
          onSwitchCamera={switchCamera}
        />

        <VideoUploadProgress
          isRecording={isCurrentlyRecording}
          duration={duration}
          maxDuration={maxDuration}
          formatDuration={formatDuration}
        />

        <RecordingControls
          isRecording={isCurrentlyRecording}
          isPaused={isPaused}
          isReady={isReady}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
          onPause={handlePauseRecording}
          onResume={handleResumeRecording}
        />

        <RecordingTips isRecording={isCurrentlyRecording} />

        <CompletedVideoCard
          recordedVideo={recordedVideo}
          isRecording={isCurrentlyRecording}
          duration={duration}
          formatDuration={formatDuration}
        />
      </CardContent>
    </Card>
  );
}
