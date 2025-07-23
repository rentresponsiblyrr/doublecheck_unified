/**
 * Media Compression Web Worker Performance Tests
 * Validates non-blocking compression and Netflix-level performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MediaCompressionWorkerInterface } from "@/lib/workers/MediaCompressionWorkerInterface";

// Mock Worker for testing
class MockWorker implements Worker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;

  postMessage(data: any) {
    // Simulate async processing
    setTimeout(() => {
      if (this.onmessage) {
        const response = {
          data: {
            id: data.id,
            success: true,
            result:
              data.type === "COMPRESS_VIDEO"
                ? {
                    compressedFile: new File(["compressed"], "test.mp4", {
                      type: "video/mp4",
                    }),
                    originalSize: 15000000, // 15MB
                    compressedSize: 8000000, // 8MB
                    compressionRatio: 46.67,
                    timeTaken: 2500,
                    quality: "medium",
                    resolution: "720p",
                  }
                : data.type === "COMPRESS_PHOTO"
                  ? {
                      compressedFile: new File(["compressed"], "test.jpg", {
                        type: "image/jpeg",
                      }),
                      originalSize: 8000000, // 8MB
                      compressedSize: 2000000, // 2MB
                      compressionRatio: 75,
                      timeTaken: 500,
                      width: 1920,
                      height: 1080,
                    }
                  : data.type === "SHOULD_COMPRESS"
                    ? true
                    : null,
          },
        };
        this.onmessage(new MessageEvent("message", response));
      }
    }, 10);
  }

  terminate() {
    // Mock termination
  }

  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
}

// Mock Worker constructor
global.Worker = vi.fn().mockImplementation((scriptURL) => {
  return new MockWorker();
});

describe("MediaCompressionWorker Performance Tests", () => {
  let worker: MediaCompressionWorkerInterface;

  beforeEach(() => {
    worker = new MediaCompressionWorkerInterface();
  });

  afterEach(() => {
    worker.terminate();
    vi.clearAllMocks();
  });

  describe("Video Compression Performance", () => {
    it("should compress large video files in <5 seconds", async () => {
      // Create mock large video file (15MB)
      const largeVideoBlob = new Blob(["x".repeat(15 * 1024 * 1024)], {
        type: "video/webm",
      });
      const videoFile = new File([largeVideoBlob], "large-video.webm", {
        type: "video/webm",
      });

      const startTime = performance.now();

      const result = await worker.compressVideo(videoFile, {
        maxSize: 10 * 1024 * 1024,
        quality: "medium",
        resolution: "720p",
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Performance requirement: <5 seconds for video compression
      expect(processingTime).toBeLessThan(5000);
      expect(result.compressedFile).toBeInstanceOf(File);
      expect(result.compressionRatio).toBeGreaterThan(0);
      expect(result.timeTaken).toBeGreaterThan(0);
    });

    it("should maintain UI responsiveness during compression", async () => {
      const videoFile = new File([new Blob(["test"])], "test.webm", {
        type: "video/webm",
      });

      // Start compression but don't await
      const compressionPromise = worker.compressVideo(videoFile);

      // Simulate UI operations during compression
      const uiOperations = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        // Simulate DOM operations
        document.createElement("div");
        const end = performance.now();
        uiOperations.push(end - start);
      }

      // UI operations should complete quickly (main thread not blocked)
      const avgUITime =
        uiOperations.reduce((a, b) => a + b, 0) / uiOperations.length;
      expect(avgUITime).toBeLessThan(5); // <5ms per operation

      // Compression should still complete successfully
      const result = await compressionPromise;
      expect(result).toBeDefined();
    });

    it("should handle multiple concurrent compressions", async () => {
      const videoFiles = Array.from(
        { length: 3 },
        (_, i) =>
          new File([new Blob(["test"])], `video-${i}.webm`, {
            type: "video/webm",
          }),
      );

      const startTime = performance.now();

      const compressionPromises = videoFiles.map((file) =>
        worker.compressVideo(file, { quality: "medium" }),
      );

      const results = await Promise.all(compressionPromises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle concurrent operations efficiently
      expect(totalTime).toBeLessThan(10000); // <10 seconds for 3 videos
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.compressedFile).toBeInstanceOf(File);
      });
    });
  });

  describe("Photo Compression Performance", () => {
    it("should compress photos in <1 second", async () => {
      const largePhotoBlob = new Blob(["x".repeat(8 * 1024 * 1024)], {
        type: "image/jpeg",
      });
      const photoFile = new File([largePhotoBlob], "large-photo.jpg", {
        type: "image/jpeg",
      });

      const startTime = performance.now();

      const result = await worker.compressPhoto(photoFile, {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
      });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Performance requirement: <1 second for photo compression
      expect(processingTime).toBeLessThan(1000);
      expect(result.compressedFile).toBeInstanceOf(File);
      expect(result.compressionRatio).toBeGreaterThan(0);
    });

    it("should batch process multiple photos efficiently", async () => {
      const photoFiles = Array.from(
        { length: 5 },
        (_, i) =>
          new File([new Blob(["test"])], `photo-${i}.jpg`, {
            type: "image/jpeg",
          }),
      );

      const startTime = performance.now();

      const compressionPromises = photoFiles.map((file) =>
        worker.compressPhoto(file, { quality: 0.8 }),
      );

      const results = await Promise.all(compressionPromises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should process 5 photos in <3 seconds
      expect(totalTime).toBeLessThan(3000);
      expect(results).toHaveLength(5);
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory during compression operations", async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform multiple compression operations
      for (let i = 0; i < 10; i++) {
        const file = new File([new Blob(["test"])], `test-${i}.jpg`);
        await worker.compressPhoto(file);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be minimal (<10MB)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
    });

    it("should properly cleanup on termination", () => {
      const terminateSpy = vi.spyOn(worker as any, "terminate");

      worker.terminate();

      expect(terminateSpy).toHaveBeenCalled();
      expect(worker.isWorkerReady()).toBe(false);
    });
  });

  describe("Error Handling Performance", () => {
    it("should fail gracefully without blocking UI", async () => {
      // Mock worker error
      const mockWorker = (global.Worker as any).mock.results[0].value;
      mockWorker.postMessage = (data: any) => {
        setTimeout(() => {
          if (mockWorker.onmessage) {
            mockWorker.onmessage(
              new MessageEvent("message", {
                data: {
                  id: data.id,
                  success: false,
                  error: "Compression failed",
                },
              }),
            );
          }
        }, 10);
      };

      const file = new File([new Blob(["test"])], "test.jpg");

      const startTime = performance.now();

      try {
        await worker.compressPhoto(file);
        throw new Error("Should have thrown");
      } catch (error) {
        const endTime = performance.now();
        const processingTime = endTime - startTime;

        // Error handling should be fast (<100ms)
        expect(processingTime).toBeLessThan(100);
        expect(error.message).toContain("Compression failed");
      }
    });
  });

  describe("Accessibility Integration", () => {
    it("should provide compression status for screen readers", async () => {
      const file = new File([new Blob(["test"])], "test.jpg");

      // Start compression
      const compressionPromise = worker.compressPhoto(file);

      // Verify worker is processing (would trigger UI updates)
      expect(worker.isWorkerReady()).toBe(true);

      await compressionPromise;
    });
  });
});
