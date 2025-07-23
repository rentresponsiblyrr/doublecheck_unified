import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { VideoService } from "./VideoService";
import { VideoRecordingState, CameraState } from "./types";

export const useVideoRecording = (onVideoRecorded: (video: File) => void) => {
  const [recordingState, setRecordingState] = useState<VideoRecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
  });

  const [cameraState, setCameraState] = useState<CameraState>({
    hasPermission: false,
    isLoading: true,
  });

  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializeCamera = useCallback(async () => {
    try {
      setCameraState((prev) => ({
        ...prev,
        isLoading: true,
        error: undefined,
      }));

      const stream = await VideoService.requestCameraPermission();
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraState((prev) => ({
        ...prev,
        hasPermission: true,
        isLoading: false,
        stream,
      }));

      toast({
        title: "Camera Ready",
        description: "Camera initialized successfully",
        duration: 2000,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to access camera";
      setCameraState((prev) => ({
        ...prev,
        hasPermission: false,
        isLoading: false,
        error: errorMessage,
      }));

      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      await initializeCamera();
      return;
    }

    try {
      chunksRef.current = [];

      const mediaRecorder = VideoService.createMediaRecorder(
        streamRef.current,
        (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        },
        () => {
          const videoFile = VideoService.createVideoFile(chunksRef.current);
          const videoUrl = VideoService.createVideoURL(videoFile);

          setRecordingState((prev) => ({
            ...prev,
            recordedVideoUrl: videoUrl,
          }));

          onVideoRecorded(videoFile);

          toast({
            title: "Recording Complete",
            description: "Video has been recorded successfully",
          });
        },
      );

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second

      setRecordingState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
      }));

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Video recording has begun",
        duration: 2000,
      });
    } catch (error) {
      logger.logError("Failed to start recording", { error });
      toast({
        title: "Recording Failed",
        description: "Unable to start video recording",
        variant: "destructive",
      });
    }
  }, [initializeCamera, onVideoRecorded, toast]);

  const pauseResumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (recordingState.isPaused) {
      mediaRecorderRef.current.resume();
      setRecordingState((prev) => ({ ...prev, isPaused: false }));

      toast({
        title: "Recording Resumed",
        description: "Video recording has resumed",
        duration: 2000,
      });
    } else {
      mediaRecorderRef.current.pause();
      setRecordingState((prev) => ({ ...prev, isPaused: true }));

      toast({
        title: "Recording Paused",
        description: "Video recording has been paused",
        duration: 2000,
      });
    }
  }, [recordingState.isPaused, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState.isRecording) {
      mediaRecorderRef.current.stop();
      setRecordingState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [recordingState.isRecording]);

  const resetRecording = useCallback(() => {
    if (recordingState.recordedVideoUrl) {
      VideoService.revokeVideoURL(recordingState.recordedVideoUrl);
    }

    chunksRef.current = [];
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
    });

    toast({
      title: "Recording Reset",
      description: "Ready to record a new video",
      duration: 2000,
    });
  }, [recordingState.recordedVideoUrl, toast]);

  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    if (recordingState.recordedVideoUrl) {
      VideoService.revokeVideoURL(recordingState.recordedVideoUrl);
    }

    if (streamRef.current) {
      VideoService.stopStream(streamRef.current);
    }
  }, [recordingState.recordedVideoUrl]);

  useEffect(() => {
    initializeCamera();
    return cleanup;
  }, [initializeCamera, cleanup]);

  return {
    videoRef,
    recordingState,
    cameraState,
    startRecording,
    pauseResumeRecording,
    stopRecording,
    resetRecording,
    initializeCamera,
  };
};
