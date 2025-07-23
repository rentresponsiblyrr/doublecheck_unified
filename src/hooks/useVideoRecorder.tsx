/**
 * Video Recorder Business Logic Hook
 * Extracted from VideoRecorder.tsx for surgical refactoring
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useCamera } from "@/hooks/useCamera";

export interface VideoRecorderError {
  message: string;
  code:
    | "PERMISSION_DENIED"
    | "DEVICE_NOT_FOUND"
    | "RECORDING_FAILED"
    | "STREAM_ERROR";
}

export interface UseVideoRecorderProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  maxDuration?: number;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  facingMode?: "user" | "environment";
  resolution?: { width: number; height: number };
}

export interface UseVideoRecorderReturn {
  // Camera state
  isReady: boolean;
  hasPermission: boolean;
  cameraLoading: boolean;
  cameraError: string | null;
  availableDevices: MediaDeviceInfo[];

  // Recording state
  internalIsRecording: boolean;
  isPaused: boolean;
  duration: number;
  recordedVideo: Blob | null;
  audioEnabled: boolean;
  showSettings: boolean;
  error: string | null;

  // Actions
  handleStartRecording: () => Promise<void>;
  handleStopRecording: () => void;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  setAudioEnabled: (enabled: boolean) => void;
  setShowSettings: (show: boolean) => void;
  requestPermission: () => Promise<void>;
  switchCamera: () => Promise<void>;
  clearError: () => void;

  // Utility
  formatDuration: (seconds: number) => string;
}

export const useVideoRecorder = ({
  videoRef,
  maxDuration = 600,
  onStartRecording,
  onStopRecording,
  facingMode = "environment",
  resolution = { width: 1920, height: 1080 },
}: UseVideoRecorderProps): UseVideoRecorderReturn => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [internalIsRecording, setInternalIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isReady,
    error: cameraError,
    hasPermission,
    isLoading: cameraLoading,
    stream,
    requestPermission,
    startCamera,
    stopCamera,
    switchCamera,
    availableDevices,
  } = useCamera({
    videoRef,
    facingMode,
    resolution,
    autoStart: true,
  });

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (internalIsRecording && !isPaused) {
      interval = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [internalIsRecording, isPaused, maxDuration]);

  // Setup MediaRecorder when stream is available
  useEffect(() => {
    if (stream && isReady) {
      try {
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9",
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          setRecordedVideo(blob);
          chunksRef.current = [];
          setInternalIsRecording(false);
          setIsPaused(false);
          onStopRecording?.();
        };

        mediaRecorderRef.current = mediaRecorder;
      } catch (err) {
        setError("Video recording not supported on this device");
      }
    }
  }, [stream, isReady, onStopRecording]);

  const handleStartRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !stream) {
      setError("Camera not ready for recording");
      return;
    }

    try {
      setError(null);
      chunksRef.current = [];
      setDuration(0);
      setRecordedVideo(null);

      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      setInternalIsRecording(true);
      setIsPaused(false);

      onStartRecording?.();
    } catch (err) {
      setError("Failed to start recording");
    }
  }, [stream, onStartRecording]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && internalIsRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [internalIsRecording]);

  const handlePauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && internalIsRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, [internalIsRecording]);

  const handleResumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Format duration utility
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
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
  };
};
