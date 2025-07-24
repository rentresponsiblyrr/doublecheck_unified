/**
 * INTELLIGENT CACHE SERVICE - ENTERPRISE EXCELLENCE
 *
 * High-performance caching with intelligent invalidation patterns:
 * - Memory-efficient LRU cache with TTL support
 * - Pattern-based cache invalidation
 * - Performance metrics and monitoring
 * - Configurable cache strategies per data type
 * - Automatic memory pressure handling
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Service Layer Excellence
 */

import { logger } from "@/utils/logger";

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
}

// Cache configuration
interface CacheConfig {
  maxMemoryMB: number;
  defaultTTL: number;
  cleanupInterval: number;
  maxEntries: number;
}

// Cache metrics
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  entryCount: number;
  oldestEntry: number;
  cleanupRuns: number;
  evictions: number;
}

/**
 * Intelligent Cache Service with LRU and TTL support
 */
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder = new Map<string, number>(); // For LRU tracking
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private accessCounter = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxMemoryMB: 50, // 50MB default
      defaultTTL: 300, // 5 minutes
      cleanupInterval: 60000, // 1 minute
      maxEntries: 10000,
      ...config,
    };

    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      memoryUsage: 0,
      entryCount: 0,
      oldestEntry: Date.now(),
      cleanupRuns: 0,
      evictions: 0,
    };

    this.startCleanupTimer();
    logger.debug("CacheService initialized", { config: this.config });
  }

  /**
   * Get cached value with LRU tracking
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.accessOrder.set(key, ++this.accessCounter);

    this.metrics.hits++;
    this.updateHitRate();

    logger.debug("Cache hit", { key, accessCount: entry.accessCount });
    return entry.data;
  }

  /**
   * Set cached value with TTL and memory management
   */
  async set<T>(key: string, data: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || this.config.defaultTTL;
    const expiresAt = Date.now() + ttl * 1000;
    const size = this.estimateSize(data);

    // Check memory pressure before adding
    await this.enforceMemoryLimits();

    const entry: CacheEntry<T> = {
      data,
      expiresAt,
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, ++this.accessCounter);

    this.updateMetrics();
    logger.debug("Cache set", { key, ttl, size });
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);

    if (deleted) {
      this.updateMetrics();
      logger.debug("Cache invalidated", { key });
    }

    return deleted;
  }

  /**
   * Invalidate all keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace("*", ".*"));
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    this.updateMetrics();
    logger.debug("Pattern invalidation", {
      pattern,
      deletedCount: keysToDelete.length,
    });

    return keysToDelete.length;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const entryCount = this.cache.size;
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;

    this.updateMetrics();
    logger.debug("Cache cleared", { clearedEntries: entryCount });
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Force cleanup of expired entries
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    this.metrics.cleanupRuns++;
    this.updateMetrics();

    if (expiredKeys.length > 0) {
      logger.debug("Cache cleanup completed", {
        expiredCount: expiredKeys.length,
      });
    }

    return expiredKeys.length;
  }

  /**
   * Shutdown cache service
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    await this.clear();
    logger.info("CacheService shutdown completed");
  }

  // Private methods

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch((error) => {
        logger.error("Cache cleanup failed", error);
      });
    }, this.config.cleanupInterval);
  }

  private async enforceMemoryLimits(): Promise<void> {
    // Check entry count limit
    if (this.cache.size >= this.config.maxEntries) {
      await this.evictLRU(Math.floor(this.config.maxEntries * 0.1)); // Remove 10%
    }

    // Check memory usage
    const memoryUsage = this.calculateMemoryUsage();
    const maxMemoryBytes = this.config.maxMemoryMB * 1024 * 1024;

    if (memoryUsage > maxMemoryBytes) {
      const targetReduction = memoryUsage - maxMemoryBytes * 0.8; // Target 80% of max
      await this.evictBySize(targetReduction);
    }
  }

  private async evictLRU(count: number): Promise<void> {
    // Sort by access order (oldest first)
    const sortedEntries = Array.from(this.accessOrder.entries())
      .sort(([, a], [, b]) => a - b)
      .slice(0, count);

    for (const [key] of sortedEntries) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.metrics.evictions++;
    }

    logger.debug("LRU eviction completed", { evictedCount: count });
  }

  private async evictBySize(targetBytes: number): Promise<void> {
    let evictedBytes = 0;
    let evictedCount = 0;

    // Sort by access order and evict until target is reached
    const sortedEntries = Array.from(this.accessOrder.entries()).sort(
      ([, a], [, b]) => a - b,
    );

    for (const [key] of sortedEntries) {
      const entry = this.cache.get(key);
      if (entry) {
        evictedBytes += entry.size;
        evictedCount++;
        this.cache.delete(key);
        this.accessOrder.delete(key);
        this.metrics.evictions++;

        if (evictedBytes >= targetBytes) {
          break;
        }
      }
    }

    logger.debug("Size-based eviction completed", {
      evictedCount,
      evictedBytes: `${(evictedBytes / 1024).toFixed(1)}KB`,
    });
  }

  private estimateSize(data: unknown): number {
    if (data === null || data === undefined) return 8;
    if (typeof data === "boolean") return 4;
    if (typeof data === "number") return 8;
    if (typeof data === "string") return data.length * 2; // UTF-16

    try {
      return JSON.stringify(data).length * 2; // Rough estimate
    } catch {
      return 1024; // Default fallback
    }
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private updateMetrics(): void {
    this.metrics.entryCount = this.cache.size;
    this.metrics.memoryUsage = this.calculateMemoryUsage();

    // Find oldest entry
    let oldest = Date.now();
    for (const entry of this.cache.values()) {
      if (entry.lastAccessed < oldest) {
        oldest = entry.lastAccessed;
      }
    }
    this.metrics.oldestEntry = oldest;
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? this.metrics.hits / total : 0;
  }
}

// Export singleton instance with default configuration
export const cacheService = new CacheService();
