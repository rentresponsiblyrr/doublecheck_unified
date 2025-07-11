// Enhanced Video Recording Hook with Camera & Audio Permissions
// Specifically designed for video walkthrough recording

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/utils/logger';

export interface VideoRecordingOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
  autoStart?: boolean;
  facingMode?: 'user' | 'environment';
  recordingOptions?: {
    mimeType?: string;
    videoBitsPerSecond?: number;
    audioBitsPerSecond?: number;
  };
}

export interface PermissionStatus {
  camera: 'unknown' | 'granted' | 'denied' | 'requesting';
  microphone: 'unknown' | 'granted' | 'denied' | 'requesting';
}

export interface RecordingState {
  isRecording: boolean;
  duration: number; // in seconds
  isAvailable: boolean;
  isPaused: boolean;
}

export interface VideoRecordingState {
  stream: MediaStream | null;
  isReady: boolean;
  error: string | null;
  permissions: PermissionStatus;
  recording: RecordingState;
  recordedBlob: Blob | null;
  availableDevices: MediaDeviceInfo[];
  currentDeviceId: string | null;
}

export interface UseVideoRecordingReturn extends VideoRecordingState {
  // Permission methods
  requestPermissions: () => Promise<void>;
  checkPermissions: () => Promise<void>;
  
  // Camera methods
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  
  // Recording methods
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  
  // Utility methods
  getAvailableDevices: () => Promise<void>;
  resetRecording: () => void;
  downloadRecording: (filename?: string) => void;
}

export const useVideoRecording = (
  options: VideoRecordingOptions = {}
): UseVideoRecordingReturn => {
  const {
    video = true,
    audio = true,
    autoStart = false,
    facingMode = 'environment',
    recordingOptions = {}
  } = options;

  // State
  const [state, setState] = useState<VideoRecordingState>({
    stream: null,
    isReady: false,
    error: null,
    permissions: {
      camera: 'unknown',
      microphone: 'unknown'
    },
    recording: {
      isRecording: false,
      duration: 0,
      isAvailable: false,
      isPaused: false
    },
    recordedBlob: null,
    availableDevices: [],
    currentDeviceId: null
  });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Default recording options
  const defaultRecordingOptions = {
    mimeType: 'video/webm;codecs=vp9,opus',
    videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
    audioBitsPerSecond: 128000,  // 128 kbps for clear audio
    ...recordingOptions
  };

  /**
   * Check current browser permissions
   */
  const checkPermissions = useCallback(async () => {
    try {
      const [cameraPermission, microphonePermission] = await Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName })
      ]);

      setState(prev => ({
        ...prev,
        permissions: {
          camera: cameraPermission.state === 'granted' ? 'granted' : 
                  cameraPermission.state === 'denied' ? 'denied' : 'unknown',
          microphone: microphonePermission.state === 'granted' ? 'granted' : 
                     microphonePermission.state === 'denied' ? 'denied' : 'unknown'
        }
      }));

      logger.info('Permissions checked', {
        camera: cameraPermission.state,
        microphone: microphonePermission.state
      }, 'VIDEO_RECORDING');

    } catch (error) {
      logger.warn('Permission check not supported', { error }, 'VIDEO_RECORDING');
      // Permissions API not supported, permissions will be determined when requesting
    }
  }, []);

  /**
   * Request camera and microphone permissions
   */
  const requestPermissions = useCallback(async () => {
    setState(prev => ({
      ...prev,
      permissions: {
        camera: 'requesting',
        microphone: 'requesting'
      },
      error: null
    }));

    try {
      const constraints: MediaStreamConstraints = {
        video: video ? {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      setState(prev => ({
        ...prev,
        stream,
        isReady: true,
        permissions: {
          camera: stream.getVideoTracks().length > 0 ? 'granted' : 'denied',
          microphone: stream.getAudioTracks().length > 0 ? 'granted' : 'denied'
        },
        currentDeviceId: stream.getVideoTracks()[0]?.getSettings().deviceId || null
      }));

      logger.info('Permissions granted and stream started', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      }, 'VIDEO_RECORDING');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Permission request failed';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        permissions: {
          camera: 'denied',
          microphone: 'denied'
        },
        isReady: false
      }));

      logger.error('Permission request failed', { error }, 'VIDEO_RECORDING');
      throw error;
    }
  }, [video, audio, facingMode]);

  /**
   * Start camera (alias for requestPermissions for consistency)
   */
  const startCamera = useCallback(async () => {
    await requestPermissions();
  }, [requestPermissions]);

  /**
   * Stop camera and clean up stream
   */
  const stopCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach(track => {
        track.stop();
      });

      setState(prev => ({
        ...prev,
        stream: null,
        isReady: false,
        currentDeviceId: null
      }));

      logger.info('Camera stopped', {}, 'VIDEO_RECORDING');
    }
  }, [state.stream]);

  /**
   * Switch between front and back camera
   */
  const switchCamera = useCallback(async () => {
    if (!state.stream) return;

    const currentVideoTrack = state.stream.getVideoTracks()[0];
    const currentFacingMode = currentVideoTrack?.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    try {
      // Stop current stream
      stopCamera();

      // Request new stream with different facing mode
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: audio
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      setState(prev => ({
        ...prev,
        stream: newStream,
        isReady: true,
        currentDeviceId: newStream.getVideoTracks()[0]?.getSettings().deviceId || null
      }));

      logger.info('Camera switched', { newFacingMode }, 'VIDEO_RECORDING');

    } catch (error) {
      logger.error('Failed to switch camera', { error }, 'VIDEO_RECORDING');
      setState(prev => ({
        ...prev,
        error: 'Failed to switch camera'
      }));
    }
  }, [state.stream, audio, stopCamera]);

  /**
   * Get available video devices
   */
  const getAvailableDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      setState(prev => ({
        ...prev,
        availableDevices: videoDevices
      }));

      logger.info('Available devices enumerated', { count: videoDevices.length }, 'VIDEO_RECORDING');

    } catch (error) {
      logger.error('Failed to enumerate devices', { error }, 'VIDEO_RECORDING');
    }
  }, []);

  /**
   * Start video recording
   */
  const startRecording = useCallback(async () => {
    if (!state.stream) {
      throw new Error('Camera stream not available');
    }

    try {
      // Reset recording state
      recordedChunksRef.current = [];

      // Create MediaRecorder with optimized settings
      const mediaRecorder = new MediaRecorder(state.stream, defaultRecordingOptions);
      mediaRecorderRef.current = mediaRecorder;

      // Handle data availability
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: defaultRecordingOptions.mimeType || 'video/webm'
        });

        setState(prev => ({
          ...prev,
          recordedBlob: blob,
          recording: {
            ...prev.recording,
            isRecording: false,
            isAvailable: true
          }
        }));

        logger.info('Recording completed', {
          duration: state.recording.duration,
          size: blob.size
        }, 'VIDEO_RECORDING');
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second

      // Start timer
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          recording: {
            ...prev.recording,
            duration: prev.recording.duration + 1
          }
        }));
      }, 1000);

      setState(prev => ({
        ...prev,
        recording: {
          ...prev.recording,
          isRecording: true,
          duration: 0,
          isAvailable: false,
          isPaused: false
        },
        recordedBlob: null,
        error: null
      }));

      logger.info('Recording started', {}, 'VIDEO_RECORDING');

    } catch (error) {
      logger.error('Failed to start recording', { error }, 'VIDEO_RECORDING');
      setState(prev => ({
        ...prev,
        error: 'Failed to start recording'
      }));
      throw error;
    }
  }, [state.stream, state.recording.duration, defaultRecordingOptions]);

  /**
   * Stop video recording
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.recording.isRecording) {
      mediaRecorderRef.current.stop();

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      logger.info('Recording stopped', {}, 'VIDEO_RECORDING');
    }
  }, [state.recording.isRecording]);

  /**
   * Pause video recording
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.recording.isRecording && !state.recording.isPaused) {
      mediaRecorderRef.current.pause();

      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setState(prev => ({
        ...prev,
        recording: {
          ...prev.recording,
          isPaused: true
        }
      }));

      logger.info('Recording paused', {}, 'VIDEO_RECORDING');
    }
  }, [state.recording.isRecording, state.recording.isPaused]);

  /**
   * Resume video recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.recording.isRecording && state.recording.isPaused) {
      mediaRecorderRef.current.resume();

      // Resume timer
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          recording: {
            ...prev.recording,
            duration: prev.recording.duration + 1
          }
        }));
      }, 1000);

      setState(prev => ({
        ...prev,
        recording: {
          ...prev.recording,
          isPaused: false
        }
      }));

      logger.info('Recording resumed', {}, 'VIDEO_RECORDING');
    }
  }, [state.recording.isRecording, state.recording.isPaused]);

  /**
   * Reset recording state
   */
  const resetRecording = useCallback(() => {
    setState(prev => ({
      ...prev,
      recording: {
        isRecording: false,
        duration: 0,
        isAvailable: false,
        isPaused: false
      },
      recordedBlob: null,
      error: null
    }));

    recordedChunksRef.current = [];

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    logger.info('Recording reset', {}, 'VIDEO_RECORDING');
  }, []);

  /**
   * Download recorded video
   */
  const downloadRecording = useCallback((filename: string = 'walkthrough-video.webm') => {
    if (state.recordedBlob) {
      const url = URL.createObjectURL(state.recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.info('Recording downloaded', { filename }, 'VIDEO_RECORDING');
    }
  }, [state.recordedBlob]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      requestPermissions().catch(error => {
        logger.warn('Auto-start failed', { error }, 'VIDEO_RECORDING');
      });
    }
  }, [autoStart, requestPermissions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stopCamera]);

  return {
    ...state,
    requestPermissions,
    checkPermissions,
    startCamera,
    stopCamera,
    switchCamera,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    getAvailableDevices,
    resetRecording,
    downloadRecording
  };
};