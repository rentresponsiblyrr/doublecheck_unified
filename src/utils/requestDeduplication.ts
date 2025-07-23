/**
 * Request Deduplication Utilities for STR Certified
 * Prevents duplicate API calls and provides caching for expensive operations
 */

import { logger } from "@/utils/logger";

// Types for request deduplication context and parameters
type RequestContext = Record<string, unknown>;
type RequestParameters = Record<string, unknown>;

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  abortController: AbortController;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<unknown>>();
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxCacheSize = 1000;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Generates a cache key for a file and context
   */
  private generateFileHash(
    file: File,
    context: RequestContext,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          // Include context in the key for uniqueness
          const contextString = JSON.stringify(
            context,
            Object.keys(context).sort(),
          );
          const contextHash = btoa(contextString).replace(/[^a-zA-Z0-9]/g, "");

          resolve(`file_${hashHex}_ctx_${contextHash}`);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Generates a simple hash for non-file requests
   */
  private generateRequestKey(
    operation: string,
    params: RequestParameters,
  ): string {
    const paramsString = JSON.stringify(params, Object.keys(params).sort());
    const hash = btoa(paramsString).replace(/[^a-zA-Z0-9]/g, "");
    return `${operation}_${hash}`;
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach((key) => this.cache.delete(key));

    // If cache is still too large, remove oldest entries
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp,
      );

      const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Deduplicates photo analysis requests
   */
  async deduplicatePhotoAnalysis<T>(
    file: File,
    context: RequestContext,
    analysisFunction: (signal: AbortSignal) => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    try {
      const key = await this.generateFileHash(file, context);
      return this.deduplicateRequest(key, analysisFunction, ttl);
    } catch (error) {
      logger.error(
        "Failed to generate file hash, proceeding without deduplication",
        error,
        "REQUEST_DEDUP",
      );
      const abortController = new AbortController();
      return analysisFunction(abortController.signal);
    }
  }

  /**
   * Deduplicates general requests
   */
  async deduplicateRequest<T>(
    key: string,
    requestFunction: (signal: AbortSignal) => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    // Clean up expired entries periodically
    if (Math.random() < 0.1) {
      // 10% chance
      this.cleanupCache();
    }

    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      logger.debug("Returning cached result", { key }, "REQUEST_DEDUP");
      return cached.data;
    }

    // Check if request is already pending
    const pending = this.pendingRequests.get(key);
    if (pending) {
      logger.debug("Returning pending request", { key }, "REQUEST_DEDUP");
      return pending.promise;
    }

    // Create new request
    const abortController = new AbortController();
    const promise = this.executeRequest(
      key,
      requestFunction,
      abortController,
      ttl,
    );

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
      abortController,
    });

    return promise;
  }

  /**
   * Executes the request and handles cleanup
   */
  private async executeRequest<T>(
    key: string,
    requestFunction: (signal: AbortSignal) => Promise<T>,
    abortController: AbortController,
    ttl: number,
  ): Promise<T> {
    try {
      logger.debug("Executing new request", { key }, "REQUEST_DEDUP");
      const result = await requestFunction(abortController.signal);

      // Cache the result
      this.cache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl,
      });

      logger.debug("Request completed and cached", { key }, "REQUEST_DEDUP");
      return result;
    } catch (error) {
      logger.error("Request failed", { key, error }, "REQUEST_DEDUP");
      throw error;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Cancels all pending requests for a specific pattern
   */
  cancelRequestsMatching(pattern: string): void {
    const toCancel: string[] = [];

    for (const [key, request] of this.pendingRequests) {
      if (key.includes(pattern)) {
        request.abortController.abort();
        toCancel.push(key);
      }
    }

    toCancel.forEach((key) => this.pendingRequests.delete(key));

    if (toCancel.length > 0) {
      logger.info(
        "Cancelled requests matching pattern",
        { pattern, count: toCancel.length },
        "REQUEST_DEDUP",
      );
    }
  }

  /**
   * Cancels all pending requests
   */
  cancelAllRequests(): void {
    for (const [key, request] of this.pendingRequests) {
      request.abortController.abort();
    }

    const count = this.pendingRequests.size;
    this.pendingRequests.clear();

    if (count > 0) {
      logger.info("Cancelled all pending requests", { count }, "REQUEST_DEDUP");
    }
  }

  /**
   * Invalidates cache entries matching a pattern
   */
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      logger.info("Cleared entire cache", {}, "REQUEST_DEDUP");
      return;
    }

    const toRemove: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        toRemove.push(key);
      }
    }

    toRemove.forEach((key) => this.cache.delete(key));

    if (toRemove.length > 0) {
      logger.info(
        "Invalidated cache entries",
        { pattern, count: toRemove.length },
        "REQUEST_DEDUP",
      );
    }
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): {
    size: number;
    pendingRequests: number;
    hitRate: number;
    oldestEntry: number | null;
  } {
    const now = Date.now();
    let oldestTimestamp: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      hitRate: 0, // Would need to track hits/misses to calculate this
      oldestEntry: oldestTimestamp ? now - oldestTimestamp : null,
    };
  }

  /**
   * Preemptively cache a result
   */
  preCache<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Hook for using request deduplication in React components
 */
export const useRequestDeduplication = () => {
  const React = require("react");

  const deduplicatePhotoAnalysis = React.useCallback(
    <T>(
      file: File,
      context: RequestContext,
      analysisFunction: (signal: AbortSignal) => Promise<T>,
      ttl?: number,
    ) => {
      return requestDeduplicator.deduplicatePhotoAnalysis(
        file,
        context,
        analysisFunction,
        ttl,
      );
    },
    [],
  );

  const deduplicateRequest = React.useCallback(
    <T>(
      key: string,
      requestFunction: (signal: AbortSignal) => Promise<T>,
      ttl?: number,
    ) => {
      return requestDeduplicator.deduplicateRequest(key, requestFunction, ttl);
    },
    [],
  );

  const cancelRequestsMatching = React.useCallback((pattern: string) => {
    requestDeduplicator.cancelRequestsMatching(pattern);
  }, []);

  const invalidateCache = React.useCallback((pattern?: string) => {
    requestDeduplicator.invalidateCache(pattern);
  }, []);

  const getCacheStats = React.useCallback(() => {
    return requestDeduplicator.getCacheStats();
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      requestDeduplicator.cancelAllRequests();
    };
  }, []);

  return {
    deduplicatePhotoAnalysis,
    deduplicateRequest,
    cancelRequestsMatching,
    invalidateCache,
    getCacheStats,
  };
};

export default RequestDeduplicator;
