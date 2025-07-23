/**
 * TypeScript interface for Media Compression Web Worker
 * Provides type-safe communication with worker for video/photo compression
 */

// Type definitions for worker interface
type ResolverFunction<T> = (value: T | PromiseLike<T>) => void;
type RejectorFunction = (reason?: unknown) => void;
type WorkerOptions =
  | CompressionOptions
  | PhotoCompressionOptions
  | { maxSize: number };
type VideoCompressionOptions = CompressionOptions & {
  quality?: "low" | "medium" | "high" | number;
  resolution?: "480p" | "720p" | "1080p";
  maxDuration?: number;
};
type PhotoCompressionFallbackOptions = PhotoCompressionOptions & {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  outputFormat?: "jpeg" | "png" | "webp";
};

export interface CompressionOptions {
  maxSize?: number;
  quality?: "low" | "medium" | "high" | number;
  resolution?: "480p" | "720p" | "1080p";
  maxDuration?: number;
}

export interface PhotoCompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  outputFormat?: "jpeg" | "png" | "webp";
  stripMetadata?: boolean;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  timeTaken: number;
  quality?: string;
  resolution?: string;
  width?: number;
  height?: number;
}

export interface WorkerMessage {
  id: string;
  type: "COMPRESS_VIDEO" | "COMPRESS_PHOTO" | "SHOULD_COMPRESS";
  file: File;
  options: CompressionOptions | PhotoCompressionOptions | { maxSize: number };
}

export interface WorkerResponse {
  id: string;
  success: boolean;
  result?: CompressionResult | boolean;
  error?: string;
}

/**
 * Media Compression Worker wrapper class for main thread
 * Provides Promise-based API for Web Worker communication
 */
export class MediaCompressionWorkerInterface {
  private worker: Worker | null = null;
  private pendingPromises: Map<
    string,
    { resolve: ResolverFunction<unknown>; reject: RejectorFunction }
  > = new Map();
  private isReady: boolean = false;
  private workerSupported: boolean = false;

  constructor() {
    // PROFESSIONAL: Check Web Worker availability before creating
    this.workerSupported =
      typeof Worker !== "undefined" && typeof window !== "undefined";

    if (this.workerSupported) {
      try {
        this.worker = new Worker("/workers/mediaCompression.worker.js");
        this.worker.onmessage = this.handleWorkerMessage.bind(this);
        this.worker.onerror = this.handleWorkerError.bind(this);
        this.isReady = true;
        console.log(
          "MediaCompressionWorker: Web Worker initialized successfully",
        );
      } catch (error) {
        console.warn(
          "MediaCompressionWorker: Failed to initialize Web Worker, falling back to main thread:",
          error,
        );
        this.worker = null;
        this.isReady = false;
        this.workerSupported = false;
      }
    } else {
      console.log(
        "MediaCompressionWorker: Web Workers not supported, using fallback processing",
      );
      this.isReady = false;
    }
  }

  private handleWorkerMessage(event: MessageEvent<WorkerResponse>) {
    const { id, success, result, error } = event.data;
    const promise = this.pendingPromises.get(id);

    if (!promise) {
      console.warn(`No pending promise found for worker response ID: ${id}`);
      return;
    }

    this.pendingPromises.delete(id);

    if (success) {
      promise.resolve(result);
    } else {
      promise.reject(new Error(error || "Unknown worker error"));
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    console.error("Media Compression Worker error:", error);
    // Reject all pending promises
    this.pendingPromises.forEach(({ reject }) => {
      reject(new Error(`Worker error: ${error.message}`));
    });
    this.pendingPromises.clear();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private postMessage<T>(
    type: WorkerMessage["type"],
    file: File,
    options: WorkerOptions,
  ): Promise<T> {
    // PROFESSIONAL: Graceful fallback when Worker is not available
    if (!this.workerSupported || !this.worker) {
      return this.fallbackProcessing<T>(type, file, options);
    }

    if (!this.isReady) {
      return Promise.reject(new Error("Worker not ready"));
    }

    return new Promise((resolve, reject) => {
      const id = this.generateId();

      this.pendingPromises.set(id, { resolve, reject });

      this.worker!.postMessage({
        id,
        type,
        file,
        options,
      });

      // Set timeout for worker operations (5 minutes max)
      setTimeout(() => {
        if (this.pendingPromises.has(id)) {
          this.pendingPromises.delete(id);
          reject(new Error("Worker operation timeout"));
        }
      }, 300000);
    });
  }

  /**
   * Fallback processing when Web Workers are not available
   * Performs basic compression on main thread
   */
  private async fallbackProcessing<T>(
    type: WorkerMessage["type"],
    file: File,
    options: WorkerOptions,
  ): Promise<T> {
    console.log(
      `MediaCompressionWorker: Using fallback processing for ${type}`,
    );

    switch (type) {
      case "COMPRESS_VIDEO":
        return this.fallbackVideoCompression(file, options) as Promise<T>;
      case "COMPRESS_PHOTO":
        return this.fallbackPhotoCompression(file, options) as Promise<T>;
      case "SHOULD_COMPRESS":
        return Promise.resolve(
          file.size > (options.maxSize || 10 * 1024 * 1024),
        ) as Promise<T>;
      default:
        throw new Error(`Unsupported compression type: ${type}`);
    }
  }

  /**
   * Fallback video compression (main thread)
   */
  private async fallbackVideoCompression(
    file: File,
    options: VideoCompressionOptions,
  ): Promise<CompressionResult> {
    // Simple fallback - just return original file with metadata
    return {
      compressedFile: file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 0,
      timeTaken: 0,
      quality: options.quality || "original",
      resolution: options.resolution || "original",
    };
  }

  /**
   * Fallback photo compression using Canvas API (main thread)
   */
  private async fallbackPhotoCompression(
    file: File,
    options: PhotoCompressionFallbackOptions,
  ): Promise<CompressionResult> {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      outputFormat = "jpeg",
    } = options;

    try {
      const startTime = performance.now();

      // Create image element
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas context not available");
      }

      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Calculate optimal dimensions
          const { width, height } = this.calculateOptimalDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight,
          );

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              const endTime = performance.now();
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, `.${outputFormat}`),
                {
                  type: `image/${outputFormat}`,
                  lastModified: Date.now(),
                },
              );

              resolve({
                compressedFile,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                compressionRatio:
                  ((file.size - compressedFile.size) / file.size) * 100,
                timeTaken: endTime - startTime,
                width,
                height,
              });
            },
            `image/${outputFormat}`,
            quality,
          );
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      // Ultimate fallback - return original file
      return {
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        timeTaken: 0,
        width: 0,
        height: 0,
      };
    }
  }

  /**
   * Calculate optimal dimensions maintaining aspect ratio
   */
  private calculateOptimalDimensions(
    origWidth: number,
    origHeight: number,
    maxWidth: number,
    maxHeight: number,
  ) {
    const aspectRatio = origWidth / origHeight;

    let width = origWidth;
    let height = origHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  /**
   * Compress video file using Web Worker
   */
  async compressVideo(
    file: File,
    options: CompressionOptions = {},
  ): Promise<CompressionResult> {
    return this.postMessage<CompressionResult>("COMPRESS_VIDEO", file, options);
  }

  /**
   * Compress photo file using Web Worker
   */
  async compressPhoto(
    file: File,
    options: PhotoCompressionOptions = {},
  ): Promise<CompressionResult> {
    return this.postMessage<CompressionResult>("COMPRESS_PHOTO", file, options);
  }

  /**
   * Check if file should be compressed based on size
   */
  async shouldCompress(
    file: File,
    maxSize: number = 10 * 1024 * 1024,
  ): Promise<boolean> {
    return this.postMessage<boolean>("SHOULD_COMPRESS", file, { maxSize });
  }

  /**
   * Get worker ready status
   */
  isWorkerReady(): boolean {
    return this.isReady || !this.workerSupported; // Ready if worker works OR fallback is available
  }

  /**
   * Check if Web Workers are supported
   */
  isWorkerSupported(): boolean {
    return this.workerSupported;
  }

  /**
   * Terminate the worker and cleanup resources
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isReady = false;

    // Reject all pending promises
    this.pendingPromises.forEach(({ reject }) => {
      reject(new Error("Worker terminated"));
    });
    this.pendingPromises.clear();
  }
}
