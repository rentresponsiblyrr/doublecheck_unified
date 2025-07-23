/**
 * Elite Admin Dashboard Cache Service
 * Netflix-grade performance optimization with intelligent caching
 */

import { logger } from "@/lib/logger/production-logger";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalQueries: number;
  averageLoadTime: number;
  cacheSize: number;
}

export class AdminDashboardCache {
  private cache = new Map<string, CacheEntry<any>>();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalQueries: 0,
    averageLoadTime: 0,
    cacheSize: 0,
  };
  private loadTimes: number[] = [];
  private maxCacheSize = 100; // Prevent memory bloat
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup stale entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000,
    );

    // Log cache performance every hour
    setInterval(
      () => {
        this.logPerformanceMetrics();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Get data from cache or fetch with intelligent caching
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = 5 * 60 * 1000, // 5 minutes default
  ): Promise<T> {
    const startTime = performance.now();
    this.metrics.totalQueries++;

    try {
      const cached = this.cache.get(key);
      const now = Date.now();

      // Cache hit - return cached data
      if (cached && now - cached.timestamp < cached.ttl) {
        cached.accessCount++;
        cached.lastAccessed = now;
        this.metrics.hits++;

        const loadTime = performance.now() - startTime;
        this.updateLoadTimeMetrics(loadTime);

        logger.debug("Cache hit", {
          key,
          age: now - cached.timestamp,
          accessCount: cached.accessCount,
          loadTime: `${loadTime.toFixed(2)}ms`,
        });

        return cached.data as T;
      }

      // Cache miss - fetch new data
      this.metrics.misses++;
      logger.debug("Cache miss", {
        key,
        reason: cached ? "expired" : "not_found",
      });

      const data = await fetcher();
      const fetchTime = performance.now() - startTime;

      // Store in cache
      this.set(key, data, ttl);

      this.updateLoadTimeMetrics(fetchTime);

      logger.info("Data fetched and cached", {
        key,
        fetchTime: `${fetchTime.toFixed(2)}ms`,
        ttl: `${ttl}ms`,
        cacheSize: this.cache.size,
      });

      return data;
    } catch (error) {
      const errorTime = performance.now() - startTime;
      this.updateLoadTimeMetrics(errorTime);

      logger.error("Cache fetch failed", {
        key,
        error: error instanceof Error ? error.message : String(error),
        fetchTime: `${errorTime.toFixed(2)}ms`,
      });

      // Try to return stale data if available
      const staleEntry = this.cache.get(key);
      if (staleEntry) {
        logger.warn("Returning stale data due to fetch failure", {
          key,
          age: Date.now() - staleEntry.timestamp,
        });
        return staleEntry.data as T;
      }

      throw error;
    }
  }

  /**
   * Manually set cache entry
   */
  set<T>(key: string, data: T, ttl = 5 * 60 * 1000): void {
    const now = Date.now();

    // Evict least recently used if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now,
    });

    this.metrics.cacheSize = this.cache.size;
  }

  /**
   * Invalidate cache entries by pattern or specific key
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      const size = this.cache.size;
      this.cache.clear();
      this.metrics.evictions += size;
      logger.info("Cache cleared completely", { evictedEntries: size });
      return;
    }

    let evictedCount = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        evictedCount++;
      }
    }

    this.metrics.evictions += evictedCount;
    this.metrics.cacheSize = this.cache.size;

    logger.info("Cache invalidated by pattern", {
      pattern,
      evictedEntries: evictedCount,
      remainingEntries: this.cache.size,
    });
  }

  /**
   * Get cache performance metrics
   */
  getMetrics(): CacheMetrics & { hitRate: number; averageAge: number } {
    const hitRate =
      this.metrics.totalQueries > 0
        ? (this.metrics.hits / this.metrics.totalQueries) * 100
        : 0;

    const now = Date.now();
    const ages = Array.from(this.cache.values()).map(
      (entry) => now - entry.timestamp,
    );
    const averageAge =
      ages.length > 0
        ? ages.reduce((sum, age) => sum + age, 0) / ages.length
        : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      averageAge: Math.round(averageAge),
    };
  }

  /**
   * Prefetch data for anticipated requests
   */
  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
  ): Promise<void> {
    try {
      if (!this.cache.has(key)) {
        await this.get(key, fetcher, ttl);
        logger.debug("Data prefetched", { key });
      }
    } catch (error) {
      logger.warn("Prefetch failed", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    this.metrics.cacheSize = this.cache.size;

    if (cleanedCount > 0) {
      logger.debug("Cache cleanup completed", {
        cleanedEntries: cleanedCount,
        remainingEntries: this.cache.size,
      });
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
      logger.debug("LRU eviction", { evictedKey: oldestKey });
    }
  }

  /**
   * Update load time metrics
   */
  private updateLoadTimeMetrics(loadTime: number): void {
    this.loadTimes.push(loadTime);

    // Keep only last 100 load times
    if (this.loadTimes.length > 100) {
      this.loadTimes = this.loadTimes.slice(-100);
    }

    this.metrics.averageLoadTime =
      this.loadTimes.reduce((sum, time) => sum + time, 0) /
      this.loadTimes.length;
  }

  /**
   * Log performance metrics
   */
  private logPerformanceMetrics(): void {
    const metrics = this.getMetrics();

    logger.info("Cache performance metrics", {
      hitRate: `${metrics.hitRate}%`,
      totalQueries: metrics.totalQueries,
      averageLoadTime: `${metrics.averageLoadTime.toFixed(2)}ms`,
      cacheSize: metrics.cacheSize,
      averageAge: `${(metrics.averageAge / 1000).toFixed(0)}s`,
    });
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton instance
export const dashboardCache = new AdminDashboardCache();

// Cache key generators for consistency
export const CacheKeys = {
  DASHBOARD_METRICS: "dashboard_metrics",
  DASHBOARD_METRICS_TIMERANGE: (start: string, end: string) =>
    `dashboard_metrics_${start}_${end}`,
  DASHBOARD_HEALTH: "dashboard_health",
  INSPECTION_COUNTS: "inspection_counts",
  TIME_ANALYTICS: "time_analytics",
  AI_METRICS: "ai_metrics",
  USER_METRICS: "user_metrics",
  REVENUE_METRICS: "revenue_metrics",
  PROPERTY_METRICS: "property_metrics",
} as const;

// Performance monitoring hooks
export const useCacheMetrics = () => {
  const getMetrics = () => dashboardCache.getMetrics();
  const invalidatePattern = (pattern: string) =>
    dashboardCache.invalidate(pattern);

  return { getMetrics, invalidatePattern };
};
