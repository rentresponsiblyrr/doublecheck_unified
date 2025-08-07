// Camera Hook for STR Certified Mobile Photo Capture

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  MutableRefObject,
} from "react";
import { debugLogger } from "@/utils/debugLogger";

export interface CameraOptions {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  facingMode?: "user" | "environment";
  resolution?: {
    width: number;
    height: number;
  };
  autoStart?: boolean;
}

export interface CameraState {
  stream: MediaStream | null;
  isReady: boolean;
  error: string | null;
  hasPermission: boolean;
  isLoading: boolean;
  currentDeviceId: string | null;
  availableDevices: MediaDeviceInfo[];
}

export interface UseCameraReturn extends CameraState {
  requestPermission: () => Promise<void>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  switchCamera: () => Promise<void>;
  takePhoto: () => Promise<Blob | null>;
  getCurrentCamera: () => MediaDeviceInfo | null;
  getCameraCapabilities: () => MediaTrackCapabilities | null;
}

export const useCamera = (options: CameraOptions): UseCameraReturn => {
  const {
    videoRef,
    facingMode = "environment",
    resolution = { width: 1920, height: 1080 },
    autoStart = true,
  } = options;

  // State
  const [state, setState] = useState<CameraState>({
    stream: null,
    isReady: false,
    error: null,
    hasPermission: false,
    isLoading: true,
    currentDeviceId: null,
    availableDevices: [],
  });

  // Refs
  const streamRef = useRef<MediaStream | null>(null);
  const permissionCheckRef = useRef<boolean>(false);

  // Check if media devices are supported
  const isSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  // Get available camera devices
  const getAvailableDevices = useCallback(async (): Promise<
    MediaDeviceInfo[]
  > => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === "videoinput");
    } catch (error) {
      return [];
    }
  }, []);

  // Check camera permission
  const checkPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) {
      setState((prev) => ({
        ...prev,
        error: "Camera not supported on this device",
        hasPermission: false,
        isLoading: false,
      }));
      return false;
    }

    try {
      // Check if we already have permission by looking at device labels
      const devices = await getAvailableDevices();
      const hasLabels = devices.some((device) => device.label !== "");

      if (hasLabels) {
        setState((prev) => ({
          ...prev,
          hasPermission: true,
          availableDevices: devices,
        }));
        return true;
      }

      // Try to check permission state if available (Chrome 64+)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          const granted = result.state === "granted";
          setState((prev) => ({
            ...prev,
            hasPermission: granted,
          }));
          return granted;
        } catch (e) {
          // Permissions API not fully supported
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }, [isSupported, getAvailableDevices]);

  // Request camera permission
  const requestPermission = useCallback(async (): Promise<void> => {
    if (!isSupported()) {
      setState((prev) => ({
        ...prev,
        error: "Camera not supported on this device",
        hasPermission: false,
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Request a temporary stream to trigger permission prompt
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // Stop the temporary stream
      tempStream.getTracks().forEach((track) => track.stop());

      // Update available devices
      const devices = await getAvailableDevices();

      setState((prev) => ({
        ...prev,
        hasPermission: true,
        availableDevices: devices,
        isLoading: false,
      }));

      // Note: Auto-start is handled in separate useEffect to avoid circular dependency
    } catch (error: unknown) {
      let errorMessage = "Failed to access camera";

      if (
        error instanceof Error &&
        (error.name === "NotAllowedError" ||
          error.name === "PermissionDeniedError")
      ) {
        errorMessage = "Camera permission denied";
      } else if (
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError"
      ) {
        errorMessage = "No camera found on this device";
      } else if (
        error.name === "NotReadableError" ||
        error.name === "TrackStartError"
      ) {
        errorMessage = "Camera is already in use by another application";
      } else if (
        error.name === "OverconstrainedError" ||
        error.name === "ConstraintNotSatisfiedError"
      ) {
        errorMessage = "Camera does not support the requested resolution";
      }

      setState((prev) => ({
        ...prev,
        error: errorMessage,
        hasPermission: false,
        isLoading: false,
      }));
    }
  }, [isSupported, getAvailableDevices, autoStart]);

  // Start camera with specified constraints
  const startCamera = useCallback(async (): Promise<void> => {
    if (!state.hasPermission) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Build constraints
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: state.currentDeviceId ? undefined : facingMode,
          deviceId: state.currentDeviceId
            ? { exact: state.currentDeviceId }
            : undefined,
          width: { ideal: resolution.width },
          height: { ideal: resolution.height },
        },
      };

      // Get stream
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              resolve();
            };
          }
        });
      }

      // Get current device ID
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      setState((prev) => ({
        ...prev,
        stream,
        isReady: true,
        isLoading: false,
        currentDeviceId: settings.deviceId || null,
      }));
    } catch (error: unknown) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to start camera",
        isReady: false,
        isLoading: false,
      }));
    }
  }, [
    state.hasPermission,
    state.currentDeviceId,
    facingMode,
    resolution,
    videoRef,
  ]);

  // Stop camera
  const stopCamera = useCallback((): void => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState((prev) => ({
      ...prev,
      stream: null,
      isReady: false,
    }));
  }, [videoRef]);

  // Switch between front and back camera
  const switchCamera = useCallback(async (): Promise<void> => {
    if (state.availableDevices.length < 2) {
      setState((prev) => ({
        ...prev,
        error: "Only one camera available",
      }));
      return;
    }

    // Find next device
    const currentIndex = state.availableDevices.findIndex(
      (device) => device.deviceId === state.currentDeviceId,
    );
    const nextIndex = (currentIndex + 1) % state.availableDevices.length;
    const nextDevice = state.availableDevices[nextIndex];

    setState((prev) => ({
      ...prev,
      currentDeviceId: nextDevice.deviceId,
    }));

    // Restart camera with new device
    await startCamera();
  }, [state.availableDevices, state.currentDeviceId, startCamera]);

  // Take a photo
  const takePhoto = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current || !state.isReady) {
      return null;
    }

    try {
      // Create canvas
      const canvas = document.createElement("canvas");
      const video = videoRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Draw video frame
      ctx.drawImage(video, 0, 0);

      // Convert to blob
      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (blob) => {
            // Clean up canvas context
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            resolve(blob);
          },
          "image/jpeg",
          0.95,
        );
      });
    } catch (error) {
      return null;
    }
  }, [videoRef, state.isReady]);

  // Get current camera info
  const getCurrentCamera = useCallback((): MediaDeviceInfo | null => {
    if (!state.currentDeviceId) return null;
    return (
      state.availableDevices.find(
        (device) => device.deviceId === state.currentDeviceId,
      ) || null
    );
  }, [state.currentDeviceId, state.availableDevices]);

  // Get camera capabilities
  const getCameraCapabilities =
    useCallback((): MediaTrackCapabilities | null => {
      if (!state.stream) return null;

      try {
        const videoTrack = state.stream.getVideoTracks()[0];
        if (videoTrack && "getCapabilities" in videoTrack) {
          return videoTrack.getCapabilities();
        }
      } catch (error) {
        debugLogger.error('useCamera', 'Failed to get video track capabilities', { error });
      }

      return null;
    }, [state.stream]);

  // Initial permission check
  useEffect(() => {
    if (!permissionCheckRef.current) {
      permissionCheckRef.current = true;
      checkPermission().then((hasPermission) => {
        setState((prev) => ({ ...prev, isLoading: false }));
        if (hasPermission && autoStart) {
          startCamera();
        }
      });
    }
  }, [checkPermission]);

  // Handle auto-start when permission is granted
  useEffect(() => {
    if (
      autoStart &&
      state.hasPermission &&
      !state.isReady &&
      !state.isLoading
    ) {
      startCamera();
    }
  }, [
    autoStart,
    state.hasPermission,
    state.isReady,
    state.isLoading,
    startCamera,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    ...state,
    requestPermission,
    startCamera,
    stopCamera,
    switchCamera,
    takePhoto,
    getCurrentCamera,
    getCameraCapabilities,
  };
};

// Utility hook for checking camera support
export const useCameraSupport = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [checkedSupport, setCheckedSupport] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      );
      setIsSupported(supported);
      setCheckedSupport(true);
    };

    checkSupport();
  }, []);

  return { isSupported, checkedSupport };
};
