// Video Recording Hook for STR Certified

import { useState, useCallback, useRef, useEffect, MutableRefObject } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createVideoProcessor } from '@/lib/video/video-processor';
import type {
  VideoRecording,
  VideoStatus,
  VideoRecordingConfig,
  VideoRecordingStats,
  VideoTimestamp
} from '@/types/video';

export interface UseVideoRecordingOptions {
  videoRef?: MutableRefObject<HTMLVideoElement | null>;
  maxDuration?: number;
  audioEnabled?: boolean;
  onStats?: (stats: VideoRecordingStats) => void;
  onStatusChange?: (status: VideoStatus) => void;
  autoSave?: boolean;
  compressionEnabled?: boolean;
}

export interface UseVideoRecordingReturn {
  // State
  status: VideoStatus;
  stream: MediaStream | null;
  recording: VideoRecording | null;
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  error: Error | null;
  
  // Controls
  startRecording: (propertyId: string, inspectorId: string) => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<VideoRecording | null>;
  cancelRecording: () => void;
  
  // Permissions
  hasPermission: boolean;
  requestPermission: () => Promise<void>;
  
  // Processing
  isProcessing: boolean;
  processingProgress: number;
  timestamps: VideoTimestamp[];
}

export const useVideoRecording = (
  options: UseVideoRecordingOptions = {}
): UseVideoRecordingReturn => {
  const {
    videoRef,
    maxDuration = 600, // 10 minutes default
    audioEnabled = true,
    onStats,
    onStatusChange,
    autoSave = true,
    compressionEnabled = true
  } = options;

  // State
  const [status, setStatus] = useState<VideoStatus>('stopped');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState<VideoRecording | null>(null);
  const [duration, setDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [timestamps, setTimestamps] = useState<VideoTimestamp[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const videoProcessorRef = useRef(createVideoProcessor());
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const lastPauseTimeRef = useRef<number>(0);
  const currentPropertyIdRef = useRef<string>('');
  const currentInspectorIdRef = useRef<string>('');

  // Derived state
  const isRecording = status === 'recording';
  const isPaused = status === 'paused';
  const isProcessing = status === 'processing' || status === 'analyzing';

  // Update status and notify
  const updateStatus = useCallback((newStatus: VideoStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  // Check camera permission
  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check if we already have a stream
      if (stream) {
        setHasPermission(true);
        return true;
      }

      // Try to check permission without triggering prompt
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          const granted = result.state === 'granted';
          setHasPermission(granted);
          return granted;
        } catch {
          // Permissions API not supported
        }
      }

      return false;
    } catch {
      return false;
    }
  }, [stream]);

  // Request camera permission
  const requestPermission = useCallback(async (): Promise<void> => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'environment'
        },
        audio: audioEnabled
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setHasPermission(true);
      setError(null);

      // Attach to video element if provided
      if (videoRef?.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      setHasPermission(false);
      throw error;
    }
  }, [audioEnabled, videoRef]);

  // Start recording
  const startRecording = useCallback(async (
    propertyId: string,
    inspectorId: string
  ): Promise<void> => {
    try {
      setError(null);
      
      // Ensure we have permission
      if (!hasPermission) {
        await requestPermission();
      }

      if (!stream) {
        throw new Error('No media stream available');
      }

      // Store IDs
      currentPropertyIdRef.current = propertyId;
      currentInspectorIdRef.current = inspectorId;

      // Reset timing
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      setDuration(0);

      // Start duration tracking
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current - pausedDurationRef.current;
        const seconds = Math.floor(elapsed / 1000);
        setDuration(seconds);

        // Auto-stop at max duration
        if (seconds >= maxDuration) {
          stopRecording();
        }
      }, 100);

      // Configure recording
      const recordingConfig: VideoRecordingConfig = {
        maxDuration,
        targetResolution: { width: 1920, height: 1080, aspectRatio: '16:9' },
        targetBitrate: 2500,
        audioEnabled,
        stabilizationEnabled: true,
        autoFocusEnabled: true,
        lowLightEnhancement: true
      };

      // Start recording
      updateStatus('recording');
      
      const processor = videoProcessorRef.current;
      const videoRecording = await processor.recordWalkthrough(
        stream,
        recordingConfig,
        onStats
      );

      // Update with property and inspector IDs
      videoRecording.propertyId = propertyId;
      videoRecording.inspectorId = inspectorId;
      
      setRecording(videoRecording);
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      updateStatus('failed');
      throw error;
    }
  }, [hasPermission, stream, maxDuration, audioEnabled, onStats, requestPermission, updateStatus]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (status === 'recording') {
      lastPauseTimeRef.current = Date.now();
      videoProcessorRef.current.pauseRecording();
      updateStatus('paused');
    }
  }, [status, updateStatus]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (status === 'paused') {
      pausedDurationRef.current += Date.now() - lastPauseTimeRef.current;
      videoProcessorRef.current.resumeRecording();
      updateStatus('recording');
    }
  }, [status, updateStatus]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<VideoRecording | null> => {
    try {
      // Clear duration interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop recording
      videoProcessorRef.current.stopRecording();
      updateStatus('processing');

      if (!recording) {
        throw new Error('No recording available');
      }

      // Process video frames
      setProcessingProgress(20);
      const extractedTimestamps = await videoProcessorRef.current.processVideoFrames(
        recording.file
      );
      
      setProcessingProgress(60);
      
      // Analyze video content
      const analysis = await videoProcessorRef.current.analyzeVideoContent(
        recording.file,
        extractedTimestamps
      );
      
      setProcessingProgress(80);
      
      // Generate navigation timestamps
      const navigationTimestamps = videoProcessorRef.current.generateTimestamps(analysis);
      
      // Update recording with analysis
      const finalRecording: VideoRecording = {
        ...recording,
        timestamps: navigationTimestamps,
        status: 'completed',
        processedAt: new Date()
      };
      
      setRecording(finalRecording);
      setTimestamps(navigationTimestamps);
      setProcessingProgress(100);
      
      // Save if auto-save enabled
      if (autoSave) {
        await saveRecording(finalRecording);
      }
      
      updateStatus('completed');
      return finalRecording;
      
    } catch (err) {
      const error = err as Error;
      setError(error);
      updateStatus('failed');
      return null;
    } finally {
      setProcessingProgress(0);
    }
  }, [recording, autoSave, updateStatus]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Stop processor
    videoProcessorRef.current.stopRecording();
    
    // Reset state
    setRecording(null);
    setDuration(0);
    setTimestamps([]);
    updateStatus('stopped');
  }, [updateStatus]);

  // Save recording to storage
  const saveRecording = async (recording: VideoRecording): Promise<void> => {
    try {
      // In production, this would upload to cloud storage
      // For now, we'll save to IndexedDB or localStorage
      const savedRecordings = JSON.parse(
        localStorage.getItem('video_recordings') || '[]'
      );
      
      // Save metadata only (not the actual file)
      const metadata = {
        id: recording.id,
        propertyId: recording.propertyId,
        inspectorId: recording.inspectorId,
        duration: recording.duration,
        size: recording.size,
        createdAt: recording.createdAt,
        timestamps: recording.timestamps.length
      };
      
      savedRecordings.push(metadata);
      localStorage.setItem('video_recordings', JSON.stringify(savedRecordings));
      
    } catch (error) {
      console.error('Failed to save recording:', error);
    }
  };

  // Initialize permission check
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear intervals
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      
      // Stop any active recording
      if (status === 'recording' || status === 'paused') {
        videoProcessorRef.current.stopRecording();
      }
      
      // Stop media stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [status, stream]);

  return {
    // State
    status,
    stream,
    recording,
    isRecording,
    isPaused,
    duration,
    error,
    
    // Controls
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    
    // Permissions
    hasPermission,
    requestPermission,
    
    // Processing
    isProcessing,
    processingProgress,
    timestamps
  };
};

// Hook for managing multiple video recordings
export const useVideoRecordingManager = () => {
  const [recordings, setRecordings] = useState<VideoRecording[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved recordings
  useEffect(() => {
    const loadRecordings = async () => {
      try {
        const saved = localStorage.getItem('video_recordings');
        if (saved) {
          setRecordings(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load recordings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecordings();
  }, []);

  // Delete recording
  const deleteRecording = useCallback((id: string) => {
    setRecordings(prev => {
      const updated = prev.filter(r => r.id !== id);
      localStorage.setItem('video_recordings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get recordings for property
  const getPropertyRecordings = useCallback((propertyId: string) => {
    return recordings.filter(r => r.propertyId === propertyId);
  }, [recordings]);

  return {
    recordings,
    isLoading,
    deleteRecording,
    getPropertyRecordings
  };
};