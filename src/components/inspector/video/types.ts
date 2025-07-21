export interface VideoRecordingStepProps {
  onVideoRecorded: (video: File) => void;
  recordedVideo?: File | null;
  onStepComplete: () => void;
  className?: string;
}

export interface VideoRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedVideoUrl?: string;
  error?: string;
}

export interface CameraState {
  stream?: MediaStream;
  hasPermission: boolean;
  isLoading: boolean;
  error?: string;
}