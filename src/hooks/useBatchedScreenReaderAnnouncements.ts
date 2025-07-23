/**
 * Batched Screen Reader Announcements Hook
 * Optimizes accessibility by batching rapid announcements to prevent performance issues
 * Maintains WCAG 2.1 AA compliance while improving performance
 */

import { useCallback, useRef, useEffect } from "react";

interface AnnouncementBatch {
  message: string;
  priority: "polite" | "assertive";
  timestamp: number;
}

interface BatchedAnnouncementsOptions {
  batchDelay?: number; // Delay between batches in ms (default: 500ms)
  maxBatchSize?: number; // Max announcements per batch (default: 3)
  deduplicationWindow?: number; // Time window for deduplication in ms (default: 1000ms)
  enableBatching?: boolean; // Enable/disable batching (default: true)
}

/**
 * Custom hook for batched screen reader announcements
 * Optimizes performance by batching rapid announcements while maintaining accessibility
 */
export const useBatchedScreenReaderAnnouncements = (
  options: BatchedAnnouncementsOptions = {},
) => {
  const {
    batchDelay = 500,
    maxBatchSize = 3,
    deduplicationWindow = 1000,
    enableBatching = true,
  } = options;

  const pendingAnnouncements = useRef<AnnouncementBatch[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnnouncementRef = useRef<{
    message: string;
    timestamp: number;
  } | null>(null);
  const currentAnnouncementElements = useRef<HTMLElement[]>([]);

  /**
   * Clean up announcement elements after screen readers process them
   */
  const cleanupAnnouncementElements = useCallback(() => {
    currentAnnouncementElements.current.forEach((element) => {
      if (document.body.contains(element)) {
        document.body.removeChild(element);
      }
    });
    currentAnnouncementElements.current = [];
  }, []);

  /**
   * Process a batch of announcements
   * Groups by priority and creates optimized announcement elements
   */
  const processBatch = useCallback(() => {
    if (pendingAnnouncements.current.length === 0) return;

    const batch = pendingAnnouncements.current.splice(0, maxBatchSize);

    // Group announcements by priority
    const assertiveMessages = batch
      .filter((item) => item.priority === "assertive")
      .map((item) => item.message);

    const politeMessages = batch
      .filter((item) => item.priority === "polite")
      .map((item) => item.message);

    // Create announcement elements for each priority level
    if (assertiveMessages.length > 0) {
      const assertiveElement = document.createElement("div");
      assertiveElement.setAttribute("aria-live", "assertive");
      assertiveElement.setAttribute("aria-atomic", "true");
      assertiveElement.className = "sr-only";

      // Combine messages intelligently
      if (assertiveMessages.length === 1) {
        assertiveElement.textContent = assertiveMessages[0];
      } else {
        assertiveElement.textContent = `${assertiveMessages.length} updates: ${assertiveMessages.join(". ")}.`;
      }

      document.body.appendChild(assertiveElement);
      currentAnnouncementElements.current.push(assertiveElement);
    }

    if (politeMessages.length > 0) {
      const politeElement = document.createElement("div");
      politeElement.setAttribute("aria-live", "polite");
      politeElement.setAttribute("aria-atomic", "true");
      politeElement.className = "sr-only";

      // Combine messages intelligently
      if (politeMessages.length === 1) {
        politeElement.textContent = politeMessages[0];
      } else {
        politeElement.textContent = `${politeMessages.length} status updates: ${politeMessages.join(". ")}.`;
      }

      document.body.appendChild(politeElement);
      currentAnnouncementElements.current.push(politeElement);
    }

    // Schedule cleanup after screen readers have processed
    setTimeout(cleanupAnnouncementElements, 3000);

    // Schedule next batch if there are more announcements
    if (pendingAnnouncements.current.length > 0) {
      batchTimeoutRef.current = setTimeout(processBatch, batchDelay);
    }
  }, [maxBatchSize, batchDelay, cleanupAnnouncementElements]);

  /**
   * Check if message should be deduplicated
   */
  const shouldDeduplicate = useCallback(
    (message: string): boolean => {
      if (!lastAnnouncementRef.current) return false;

      const timeSinceLastAnnouncement =
        Date.now() - lastAnnouncementRef.current.timestamp;
      const isSameMessage = lastAnnouncementRef.current.message === message;

      return isSameMessage && timeSinceLastAnnouncement < deduplicationWindow;
    },
    [deduplicationWindow],
  );

  /**
   * Announce message to screen readers with batching optimization
   */
  const announceToScreenReader = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      // Skip empty messages
      if (!message.trim()) return;

      // Skip if this is a duplicate recent message
      if (shouldDeduplicate(message)) return;

      // Update last announcement tracking
      lastAnnouncementRef.current = {
        message,
        timestamp: Date.now(),
      };

      // If batching is disabled, announce immediately
      if (!enableBatching) {
        const element = document.createElement("div");
        element.setAttribute("aria-live", priority);
        element.setAttribute("aria-atomic", "true");
        element.className = "sr-only";
        element.textContent = message;
        document.body.appendChild(element);

        setTimeout(() => {
          if (document.body.contains(element)) {
            document.body.removeChild(element);
          }
        }, 2000);
        return;
      }

      // Add to batch
      pendingAnnouncements.current.push({
        message,
        priority,
        timestamp: Date.now(),
      });

      // Start batch processing if not already running
      if (!batchTimeoutRef.current) {
        batchTimeoutRef.current = setTimeout(processBatch, batchDelay);
      }
    },
    [shouldDeduplicate, enableBatching, processBatch, batchDelay],
  );

  /**
   * Force immediate processing of pending announcements
   */
  const flushAnnouncements = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    processBatch();
  }, [processBatch]);

  /**
   * Clear all pending announcements
   */
  const clearPendingAnnouncements = useCallback(() => {
    pendingAnnouncements.current = [];
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
  }, []);

  /**
   * Get current batch statistics for debugging/monitoring
   */
  const getBatchStats = useCallback(
    () => ({
      pendingCount: pendingAnnouncements.current.length,
      isProcessing: batchTimeoutRef.current !== null,
      activeElements: currentAnnouncementElements.current.length,
    }),
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingAnnouncements();
      cleanupAnnouncementElements();
    };
  }, [clearPendingAnnouncements, cleanupAnnouncementElements]);

  return {
    announceToScreenReader,
    flushAnnouncements,
    clearPendingAnnouncements,
    getBatchStats,
  };
};

/**
 * Performance optimized screen reader announcements for high-frequency updates
 * Automatically batches rapid announcements to prevent UI blocking
 */
export const useOptimizedScreenReaderAnnouncements = () => {
  return useBatchedScreenReaderAnnouncements({
    batchDelay: 300, // Faster batching for high-frequency scenarios
    maxBatchSize: 5,
    deduplicationWindow: 2000,
    enableBatching: true,
  });
};

/**
 * High-priority announcements with minimal batching
 * For critical accessibility updates that need immediate delivery
 */
export const useImmediateScreenReaderAnnouncements = () => {
  return useBatchedScreenReaderAnnouncements({
    batchDelay: 100, // Very fast batching
    maxBatchSize: 1, // No batching for critical announcements
    deduplicationWindow: 500,
    enableBatching: false,
  });
};
