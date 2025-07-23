/**
 * @fileoverview Screenshot Capture Utility
 * Handles screen capture for bug reporting using modern browser APIs
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { logger } from "@/utils/logger";

export interface ScreenshotOptions {
  quality?: number; // 0.1 to 1.0
  format?: "jpeg" | "png" | "webp";
  maxWidth?: number;
  maxHeight?: number;
  includeCurrentElement?: boolean;
}

export interface ScreenshotResult {
  dataUrl: string;
  blob: Blob;
  timestamp: string;
  dimensions: {
    width: number;
    height: number;
  };
}

class ScreenshotCaptureService {
  /**
   * Capture screenshot using Screen Capture API (preferred method)
   */
  async captureScreenUsingAPI(
    options: ScreenshotOptions = {},
  ): Promise<ScreenshotResult> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen Capture API not supported");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: "screen",
          width: { ideal: options.maxWidth || 1920 },
          height: { ideal: options.maxHeight || 1080 },
        },
        audio: false,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;

      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play();

          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.drawImage(video, 0, 0);

          // Stop the stream
          stream.getTracks().forEach((track) => track.stop());

          // Convert to desired format
          const quality = options.quality || 0.8;
          const format = options.format || "png";
          const mimeType = `image/${format}`;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create blob"));
                return;
              }

              const dataUrl = canvas.toDataURL(mimeType, quality);

              resolve({
                dataUrl,
                blob,
                timestamp: new Date().toISOString(),
                dimensions: {
                  width: canvas.width,
                  height: canvas.height,
                },
              });
            },
            mimeType,
            quality,
          );
        };

        video.onerror = () => {
          stream.getTracks().forEach((track) => track.stop());
          reject(new Error("Video loading failed"));
        };
      });
    } catch (error) {
      logger.error("Screen capture failed", error, "SCREENSHOT_CAPTURE");
      throw error;
    }
  }

  /**
   * Capture current viewport using html2canvas (fallback method)
   */
  async captureViewportUsingHTML2Canvas(
    options: ScreenshotOptions = {},
  ): Promise<ScreenshotResult> {
    try {
      // Dynamic import to reduce bundle size
      const html2canvas = await import("html2canvas");

      const canvas = await html2canvas.default(document.body, {
        allowTaint: true,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        width: options.maxWidth || window.innerWidth,
        height: options.maxHeight || window.innerHeight,
        scale: 1,
      });

      const quality = options.quality || 0.8;
      const format = options.format || "png";
      const mimeType = `image/${format}`;

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            const dataUrl = canvas.toDataURL(mimeType, quality);

            resolve({
              dataUrl,
              blob,
              timestamp: new Date().toISOString(),
              dimensions: {
                width: canvas.width,
                height: canvas.height,
              },
            });
          },
          mimeType,
          quality,
        );
      });
    } catch (error) {
      logger.error("HTML2Canvas capture failed", error, "SCREENSHOT_CAPTURE");
      throw error;
    }
  }

  /**
   * Highlight current element for better context in screenshots
   */
  private highlightCurrentElement(): () => void {
    const activeElement = document.activeElement as HTMLElement;
    const hoveredElement = document.querySelector(":hover") as HTMLElement;
    const targetElement = activeElement || hoveredElement;

    if (!targetElement) {
      return () => {}; // No cleanup needed
    }

    // Create highlight overlay
    const highlight = document.createElement("div");
    highlight.style.position = "absolute";
    highlight.style.border = "3px solid #ff4444";
    highlight.style.backgroundColor = "rgba(255, 68, 68, 0.1)";
    highlight.style.pointerEvents = "none";
    highlight.style.zIndex = "99999";
    highlight.style.borderRadius = "4px";

    const rect = targetElement.getBoundingClientRect();
    highlight.style.left = `${rect.left + window.scrollX}px`;
    highlight.style.top = `${rect.top + window.scrollY}px`;
    highlight.style.width = `${rect.width}px`;
    highlight.style.height = `${rect.height}px`;

    document.body.appendChild(highlight);

    // Return cleanup function
    return () => {
      if (highlight.parentNode) {
        highlight.parentNode.removeChild(highlight);
      }
    };
  }

  /**
   * Main screenshot capture method with fallback strategy
   */
  async captureScreenshot(
    options: ScreenshotOptions = {},
  ): Promise<ScreenshotResult> {
    let cleanup: (() => void) | null = null;

    try {
      // Highlight current element if requested
      if (options.includeCurrentElement) {
        cleanup = this.highlightCurrentElement();
        // Give time for highlight to render
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Try Screen Capture API first (best quality, includes other windows)
      try {
        const result = await this.captureScreenUsingAPI(options);
        logger.info(
          "Screenshot captured using Screen Capture API",
          {
            dimensions: result.dimensions,
          },
          "SCREENSHOT_CAPTURE",
        );
        return result;
      } catch (screenApiError) {
        logger.warn(
          "Screen Capture API failed, falling back to HTML2Canvas",
          screenApiError,
          "SCREENSHOT_CAPTURE",
        );

        // Fallback to HTML2Canvas (viewport only)
        const result = await this.captureViewportUsingHTML2Canvas(options);
        logger.info(
          "Screenshot captured using HTML2Canvas fallback",
          {
            dimensions: result.dimensions,
          },
          "SCREENSHOT_CAPTURE",
        );
        return result;
      }
    } catch (error) {
      logger.error(
        "All screenshot methods failed",
        error,
        "SCREENSHOT_CAPTURE",
      );
      throw new Error(`Screenshot capture failed: ${error.message}`);
    } finally {
      // Clean up highlight if it was added
      if (cleanup) {
        cleanup();
      }
    }
  }

  /**
   * Check if screenshot capture is supported
   */
  isSupported(): boolean {
    return !!(
      (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) ||
      (typeof window !== "undefined" && window.document)
    );
  }

  /**
   * Compress screenshot for upload
   */
  async compressScreenshot(
    screenshot: ScreenshotResult,
    maxSizeKB: number = 500,
  ): Promise<ScreenshotResult> {
    if (screenshot.blob.size <= maxSizeKB * 1024) {
      return screenshot; // Already small enough
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Calculate new dimensions to reduce file size
        const maxDimension = 1200;
        const scale = Math.min(
          1,
          maxDimension / Math.max(img.width, img.height),
        );

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Try different quality levels to meet size requirement
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create compressed blob"));
                return;
              }

              if (blob.size <= maxSizeKB * 1024 || quality <= 0.1) {
                resolve({
                  dataUrl: canvas.toDataURL("image/jpeg", quality),
                  blob,
                  timestamp: screenshot.timestamp,
                  dimensions: {
                    width: canvas.width,
                    height: canvas.height,
                  },
                });
              } else {
                quality -= 0.1;
                setTimeout(tryCompress, 10);
              }
            },
            "image/jpeg",
            quality,
          );
        };

        tryCompress();
      };

      img.onerror = () =>
        reject(new Error("Failed to load image for compression"));
      img.src = screenshot.dataUrl;
    });
  }
}

// Create singleton instance
export const screenshotCaptureService = new ScreenshotCaptureService();
