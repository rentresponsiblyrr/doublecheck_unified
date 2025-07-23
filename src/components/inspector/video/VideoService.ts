import { logger } from "@/utils/logger";

export class VideoService {
  static async requestCameraPermission(): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "environment",
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      logger.logInfo("Camera permission granted", {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
      });

      return stream;
    } catch (error) {
      logger.logError("Camera permission denied", { error });
      throw new Error("Camera access is required for video recording");
    }
  }

  static stopStream(stream?: MediaStream): void {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        logger.logInfo("Media track stopped", {
          kind: track.kind,
          label: track.label,
        });
      });
    }
  }

  static createMediaRecorder(
    stream: MediaStream,
    onDataAvailable: (event: BlobEvent) => void,
    onStop: () => void,
  ): MediaRecorder {
    try {
      const options: MediaRecorderOptions = {
        mimeType: "video/webm;codecs=vp8,opus",
      };

      // Fallback for Safari/iOS
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/mp4";
      }

      const recorder = new MediaRecorder(stream, options);

      recorder.ondataavailable = onDataAvailable;
      recorder.onstop = onStop;

      recorder.onerror = (event) => {
        logger.logError("MediaRecorder error", { error: event });
      };

      logger.logInfo("MediaRecorder created", {
        mimeType: options.mimeType,
        state: recorder.state,
      });

      return recorder;
    } catch (error) {
      logger.logError("Failed to create MediaRecorder", { error });
      throw new Error("Video recording is not supported on this device");
    }
  }

  static createVideoFile(chunks: Blob[], filename?: string): File {
    const blob = new Blob(chunks, { type: "video/webm" });
    const file = new File(
      [blob],
      filename || `inspection-video-${Date.now()}.webm`,
      {
        type: "video/webm",
        lastModified: Date.now(),
      },
    );

    logger.logInfo("Video file created", {
      size: file.size,
      type: file.type,
      name: file.name,
    });

    return file;
  }

  static createVideoURL(file: File): string {
    const url = URL.createObjectURL(file);
    logger.logInfo("Video URL created", { filename: file.name, url });
    return url;
  }

  static revokeVideoURL(url: string): void {
    URL.revokeObjectURL(url);
    logger.logInfo("Video URL revoked", { url });
  }

  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  static validateVideoFile(file: File): boolean {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = ["video/webm", "video/mp4", "video/quicktime"];

    if (file.size > maxSize) {
      throw new Error(
        `Video file too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
      );
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported video format: ${file.type}`);
    }

    return true;
  }
}
