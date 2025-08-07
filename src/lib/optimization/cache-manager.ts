// Cache Manager for STR Certified AI Response Optimization
// Reduces redundant API calls and improves mobile performance

import { debugLogger } from '@/utils/debugLogger';

// Type definitions for compression
interface CompressionData {
  _compressed: true;
  dict: Record<string, string>;
  data: (number | string)[];
}

// Core cache interfaces
interface CachedItem<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
  compressed: boolean;
  tags: string[];
  priority: CachePriority;
  metadata: Record<string, unknown>;
}

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  priority?: CachePriority;
  forceRefresh?: boolean;
}

interface SetCacheOptions extends CacheOptions {
  metadata?: Record<string, unknown>;
  strategy?: CacheStrategyType;
}

type CachePriority = "low" | "medium" | "high" | "critical";
type CacheStrategyType = "memory-only" | "persistent-only" | "hybrid" | "auto";

interface CacheStrategy {
  name: string;
  ttl: number;
  priority: CachePriority;
  useMemory: boolean;
  usePersistent: boolean;
}

interface CacheConfig {
  memoryLimit: number;
  persistentLimit: number;
  ttl: number;
  compressionThreshold: number;
}

interface InvalidationRule {
  pattern: string;
  tags: string[];
  condition: (key: string, item: CachedItem<unknown>) => boolean;
}

interface CacheMetricsData {
  hits: number;
  misses: number;
  totalTime: number;
  averageTime: number;
}

interface CompressionResult<T> {
  compressed: boolean;
  data: T;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

export class CacheManager {
  private memoryCache: MemoryCache;
  private persistentCache: PersistentCache;
  private cacheMetrics: CacheMetrics;
  private invalidationRules: InvalidationRule[];
  private compressionEngine: CompressionEngine;

  constructor(config: CacheConfig = defaultCacheConfig) {
    this.memoryCache = new MemoryCache(config.memoryLimit);
    this.persistentCache = new PersistentCache(config.persistentLimit);
    this.cacheMetrics = new CacheMetrics();
    this.invalidationRules = this.initializeInvalidationRules();
    this.compressionEngine = new CompressionEngine();

    // Start background cleanup
    this.startBackgroundTasks();
  }

  /**
   * Gets cached AI response if available
   */
  async get<T>(
    key: string,
    options: CacheOptions = {},
  ): Promise<CachedItem<T> | null> {
    const startTime = performance.now();

    // Check memory cache first
    let item = await this.memoryCache.get<T>(key);
    if (item && !this.isExpired(item, options)) {
      this.cacheMetrics.recordHit("memory", performance.now() - startTime);
      return item;
    }

    // Check persistent cache
    item = await this.persistentCache.get<T>(key);
    if (item && !this.isExpired(item, options)) {
      // Promote to memory cache
      await this.memoryCache.set(key, item.value, {
        ttl: item.ttl,
        tags: item.tags,
        priority: item.priority,
      });

      this.cacheMetrics.recordHit("persistent", performance.now() - startTime);
      return item;
    }

    this.cacheMetrics.recordMiss(performance.now() - startTime);
    return null;
  }

  /**
   * Caches AI response with intelligent TTL and compression
   */
  async set<T>(
    key: string,
    value: T,
    options: SetCacheOptions = {},
  ): Promise<void> {
    const startTime = performance.now();

    // Determine cache strategy
    const strategy = this.determineCacheStrategy(key, value, options);

    // Compress if beneficial
    const shouldCompress = await this.shouldCompress(value, strategy);
    const processedValue = shouldCompress
      ? await this.compressionEngine.compress(value)
      : value;

    // Create cache item
    const item: CachedItem<T> = {
      key,
      value: processedValue as T,
      timestamp: Date.now(),
      ttl: strategy.ttl,
      hits: 0,
      size: this.calculateSize(processedValue),
      compressed: shouldCompress,
      tags: options.tags || [],
      priority: strategy.priority,
      metadata: {
        ...options.metadata,
        strategy: strategy.name,
        compressionRatio: shouldCompress
          ? this.calculateSize(value) / this.calculateSize(processedValue)
          : 1,
      },
    };

    // Store in appropriate cache(s)
    if (strategy.useMemory) {
      await this.memoryCache.set(key, item.value, {
        ttl: item.ttl,
        tags: item.tags,
        priority: item.priority,
      });
    }

    if (strategy.usePersistent) {
      await this.persistentCache.set(key, item.value, {
        ttl: item.ttl,
        tags: item.tags,
        priority: item.priority,
      });
    }

    this.cacheMetrics.recordSet(performance.now() - startTime, item.size);
  }

  /**
   * Implements intelligent cache invalidation
   */
  async invalidate(options: InvalidationOptions): Promise<number> {
    let invalidatedCount = 0;

    if (options.key) {
      // Invalidate specific key
      const memoryResult = await this.memoryCache.delete(options.key);
      const persistentResult = await this.persistentCache.delete(options.key);
      invalidatedCount = (memoryResult ? 1 : 0) + (persistentResult ? 1 : 0);
    } else if (options.pattern) {
      // Invalidate by pattern
      const keys = await this.findKeysByPattern(options.pattern);
      for (const key of keys) {
        await this.memoryCache.delete(key);
        await this.persistentCache.delete(key);
        invalidatedCount++;
      }
    } else if (options.tags) {
      // Invalidate by tags
      invalidatedCount += await this.memoryCache.deleteByTags(options.tags);
      invalidatedCount += await this.persistentCache.deleteByTags(options.tags);
    } else if (options.olderThan) {
      // Invalidate old entries
      invalidatedCount += await this.memoryCache.deleteOlderThan(
        options.olderThan,
      );
      invalidatedCount += await this.persistentCache.deleteOlderThan(
        options.olderThan,
      );
    }

    // Apply custom invalidation rules
    if (options.applyRules) {
      invalidatedCount += await this.applyInvalidationRules();
    }

    this.cacheMetrics.recordInvalidation(invalidatedCount);
    return invalidatedCount;
  }

  /**
   * Optimizes cache for mobile performance
   */
  async optimizeForMobile(): Promise<OptimizationResult> {
    const startTime = performance.now();
    const result: OptimizationResult = {
      freedSpace: 0,
      removedItems: 0,
      compressedItems: 0,
      duration: 0,
    };

    // 1. Remove low-priority items
    const lowPriorityItems = await this.findLowPriorityItems();
    for (const item of lowPriorityItems) {
      await this.memoryCache.delete(item.key);
      result.freedSpace += item.size;
      result.removedItems++;
    }

    // 2. Compress uncompressed items
    const uncompressedItems = await this.findUncompressedItems();
    for (const item of uncompressedItems) {
      if (await this.compressItem(item)) {
        result.compressedItems++;
      }
    }

    // 3. Move large items to persistent storage
    const largeItems = await this.memoryCache.findLargeItems(1024 * 1024); // > 1MB
    for (const item of largeItems) {
      await this.persistentCache.set(item.key, item.value, {
        ttl: item.ttl,
        tags: item.tags,
        priority: item.priority,
      });
      await this.memoryCache.delete(item.key);
      result.freedSpace += item.size;
    }

    // 4. Implement aggressive TTL for mobile
    await this.applyMobileTTLPolicy();

    result.duration = performance.now() - startTime;
    return result;
  }

  /**
   * Reduces redundant API calls through intelligent caching
   */
  async createCacheKey(
    endpoint: string,
    params: Record<string, unknown>,
    options: KeyOptions = {},
  ): Promise<string> {
    // Normalize parameters
    const normalizedParams = this.normalizeParams(params);

    // Create base key
    let key = `${endpoint}:${JSON.stringify(normalizedParams)}`;

    // Add context if provided
    if (options.context) {
      key += `:${options.context}`;
    }

    // Add user-specific suffix if needed
    if (options.userSpecific && options.userId) {
      key += `:user_${options.userId}`;
    }

    // Add device-specific suffix for mobile
    if (options.deviceSpecific && options.deviceId) {
      key += `:device_${options.deviceId}`;
    }

    // Hash if too long
    if (key.length > 250) {
      const hash = await this.hashKey(key);
      key = `${endpoint}:${hash}`;
    }

    return key;
  }

  /**
   * Gets cache statistics for monitoring
   */
  async getStatistics(): Promise<CacheStatistics> {
    const memoryStats = await this.memoryCache.getStats();
    const persistentStats = await this.persistentCache.getStats();
    const metrics = this.cacheMetrics.getMetrics();

    return {
      memory: memoryStats,
      persistent: persistentStats,
      performance: {
        hitRate: (metrics.hits / (metrics.hits + metrics.misses)) * 100,
        avgHitTime: metrics.totalHitTime / metrics.hits,
        avgMissTime: metrics.totalMissTime / metrics.misses,
        compressionRatio: metrics.totalUncompressed / metrics.totalCompressed,
      },
      savings: {
        apiCallsSaved: metrics.hits,
        estimatedCostSaved: this.estimateCostSavings(metrics.hits),
        dataSaved: metrics.totalCompressed - metrics.totalUncompressed,
        timeSaved: metrics.hits * 1000, // Assume 1s per API call
      },
    };
  }

  /**
   * Preloads cache with predicted content
   */
  async preload(predictions: CachePrediction[]): Promise<void> {
    for (const prediction of predictions) {
      if (prediction.probability > 0.7) {
        // Check if already cached
        const existing = await this.get(prediction.key);
        if (!existing) {
          // Fetch and cache with lower priority
          const value = await prediction.fetcher();
          await this.set(prediction.key, value, {
            priority: "low",
            ttl: prediction.ttl || 3600000, // 1 hour default
            tags: ["preloaded", ...(prediction.tags || [])],
          });
        }
      }
    }
  }

  /**
   * Implements cache warming strategy
   */
  async warmCache(strategy: WarmingStrategy): Promise<void> {
    switch (strategy.type) {
      case "popular":
        await this.warmPopularItems(strategy.count || 50);
        break;
      case "predicted":
        await this.warmPredictedItems(strategy.predictions || []);
        break;
      case "critical":
        await this.warmCriticalPaths(strategy.paths || []);
        break;
    }
  }

  // Private helper methods

  private determineCacheStrategy<T>(
    key: string,
    value: T,
    options: SetCacheOptions,
  ): CacheStrategy {
    // Check if it's an AI response
    const isAIResponse =
      key.includes("openai") || key.includes("gpt") || key.includes("vision");

    // Check value characteristics
    const size = this.calculateSize(value);
    const isLarge = size > 500 * 1024; // 500KB
    const isFrequentlyAccessed = this.cacheMetrics.getAccessFrequency(key) > 10;

    // Determine strategy
    if (options.strategy) {
      return this.strategies[options.strategy];
    }

    if (isAIResponse && !isLarge) {
      return this.strategies.aggressive;
    } else if (isFrequentlyAccessed) {
      return this.strategies.frequent;
    } else if (isLarge) {
      return this.strategies.large;
    } else {
      return this.strategies.default;
    }
  }

  private strategies: Record<string, CacheStrategy> = {
    aggressive: {
      name: "aggressive",
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      useMemory: true,
      usePersistent: true,
      priority: "high",
    },
    frequent: {
      name: "frequent",
      ttl: 4 * 60 * 60 * 1000, // 4 hours
      useMemory: true,
      usePersistent: false,
      priority: "high",
    },
    large: {
      name: "large",
      ttl: 12 * 60 * 60 * 1000, // 12 hours
      useMemory: false,
      usePersistent: true,
      priority: "medium",
    },
    default: {
      name: "default",
      ttl: 60 * 60 * 1000, // 1 hour
      useMemory: true,
      usePersistent: false,
      priority: "medium",
    },
  };

  private async shouldCompress<T>(
    value: T,
    strategy: CacheStrategy,
  ): Promise<boolean> {
    const size = this.calculateSize(value);

    // Don't compress small values
    if (size < 1024) return false; // < 1KB

    // Always compress large values
    if (size > 100 * 1024) return true; // > 100KB

    // Compress if going to persistent storage
    return strategy.usePersistent;
  }

  private calculateSize<T>(value: T): number {
    if (typeof value === "string") {
      return value.length * 2; // UTF-16
    }
    return JSON.stringify(value).length * 2;
  }

  private isExpired<T>(item: CachedItem<T>, options: CacheOptions): boolean {
    if (options.force) return true;

    const now = Date.now();
    const age = now - item.timestamp;

    // Check TTL
    if (item.ttl && age > item.ttl) {
      return true;
    }

    // Check custom expiration
    if (options.maxAge && age > options.maxAge) {
      return true;
    }

    return false;
  }

  private initializeInvalidationRules(): InvalidationRule[] {
    return [
      {
        name: "stale-predictions",
        condition: (item) => {
          return (
            item.key.includes("prediction") &&
            Date.now() - item.timestamp > 6 * 60 * 60 * 1000
          ); // 6 hours
        },
        action: "delete",
      },
      {
        name: "low-hit-rate",
        condition: (item) => {
          const hitRate =
            item.hits / ((Date.now() - item.timestamp) / (60 * 60 * 1000));
          return hitRate < 0.1; // Less than 0.1 hits per hour
        },
        action: "delete",
      },
      {
        name: "outdated-analysis",
        condition: (item) => {
          return (
            item.key.includes("analysis") && item.metadata?.version !== "latest"
          );
        },
        action: "invalidate",
      },
    ];
  }

  private async applyInvalidationRules(): Promise<number> {
    let invalidated = 0;

    const allItems = [
      ...(await this.memoryCache.getAllItems()),
      ...(await this.persistentCache.getAllItems()),
    ];

    for (const item of allItems) {
      for (const rule of this.invalidationRules) {
        if (rule.condition(item)) {
          if (rule.action === "delete") {
            await this.invalidate({ key: item.key });
            invalidated++;
          } else if (rule.action === "invalidate") {
            item.ttl = 0; // Mark as expired
            invalidated++;
          }
        }
      }
    }

    return invalidated;
  }

  private async findKeysByPattern(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern);
    const memoryKeys = await this.memoryCache.getKeys();
    const persistentKeys = await this.persistentCache.getKeys();

    const allKeys = [...new Set([...memoryKeys, ...persistentKeys])];
    return allKeys.filter((key) => regex.test(key));
  }

  private normalizeParams(
    params: Record<string, unknown>,
  ): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};

    // Sort keys for consistent ordering
    const sortedKeys = Object.keys(params).sort();

    for (const key of sortedKeys) {
      const value = params[key];

      // Skip null/undefined values
      if (value === null || value === undefined) continue;

      // Normalize arrays
      if (Array.isArray(value)) {
        normalized[key] = [...value].sort();
      } else if (typeof value === "object") {
        normalized[key] = this.normalizeParams(value);
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  private async hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private estimateCostSavings(apiCallsSaved: number): number {
    // Rough estimates based on typical API costs
    const avgCostPerCall = 0.02; // $0.02 average
    return apiCallsSaved * avgCostPerCall;
  }

  private async findLowPriorityItems(): Promise<CachedItem<unknown>[]> {
    const allItems = await this.memoryCache.getAllItems();
    return allItems
      .filter((item) => item.priority === "low")
      .sort((a, b) => a.hits - b.hits)
      .slice(0, 20);
  }

  private async findUncompressedItems(): Promise<CachedItem<unknown>[]> {
    const allItems = [
      ...(await this.memoryCache.getAllItems()),
      ...(await this.persistentCache.getAllItems()),
    ];

    return allItems.filter(
      (item) => !item.compressed && item.size > 10 * 1024, // > 10KB
    );
  }

  private async compressItem<T>(item: CachedItem<T>): Promise<boolean> {
    try {
      const compressed = await this.compressionEngine.compress(item.value);
      const newSize = this.calculateSize(compressed);

      if (newSize < item.size * 0.7) {
        // At least 30% reduction
        item.value = compressed;
        item.size = newSize;
        item.compressed = true;

        // Update in cache
        await this.set(item.key, item.value, {
          ttl: item.ttl,
          tags: item.tags,
          priority: item.priority,
        });

        return true;
      }
    } catch (error) {
      debugLogger.error('CacheManager', 'Failed to export cache item', { error });
    }

    return false;
  }

  private async applyMobileTTLPolicy(): Promise<void> {
    // Reduce TTL for mobile devices to save space
    const factor = 0.5; // 50% of original TTL

    const items = await this.memoryCache.getAllItems();
    for (const item of items) {
      if (item.ttl) {
        item.ttl = Math.floor(item.ttl * factor);
      }
    }
  }

  private async warmPopularItems(count: number): Promise<void> {
    // Get most accessed keys from metrics
    const popularKeys = this.cacheMetrics.getMostAccessedKeys(count);

    for (const key of popularKeys) {
      const exists = await this.get(key);
      if (!exists) {
        // In production, would fetch from source
      }
    }
  }

  private async warmPredictedItems(
    predictions: CachePrediction[],
  ): Promise<void> {
    // Implement prediction-based warming
    for (const prediction of predictions) {
      await this.preload([prediction]);
    }
  }

  private async warmCriticalPaths(paths: string[]): Promise<void> {
    // Warm cache for critical application paths
    for (const path of paths) {
      // In production, would pre-fetch data for these paths
    }
  }

  private startBackgroundTasks(): void {
    // Cleanup task
    setInterval(
      async () => {
        await this.memoryCache.cleanup();
        await this.persistentCache.cleanup();
        await this.applyInvalidationRules();
      },
      5 * 60 * 1000,
    ); // Every 5 minutes

    // Metrics collection
    setInterval(() => {
      this.cacheMetrics.collect();
    }, 60 * 1000); // Every minute
  }
}

// Supporting classes

class MemoryCache {
  private cache: Map<string, CachedItem<unknown>> = new Map();
  private sizeLimit: number;
  private currentSize: number = 0;

  constructor(sizeLimit: number) {
    this.sizeLimit = sizeLimit;
  }

  async get<T>(key: string): Promise<CachedItem<T> | null> {
    const item = this.cache.get(key);
    if (item) {
      item.hits++;
      return item as CachedItem<T>;
    }
    return null;
  }

  async set<T>(key: string, value: T, options: CacheOptions): Promise<void> {
    const size = this.calculateSize(value);

    // Evict if necessary
    while (this.currentSize + size > this.sizeLimit && this.cache.size > 0) {
      await this.evictLRU();
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl: options.ttl,
      hits: 0,
      size,
      compressed: false,
      tags: options.tags || [],
      priority: options.priority || "medium",
      metadata: {},
    });

    this.currentSize += size;
  }

  async delete(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (item) {
      this.currentSize -= item.size;
      return this.cache.delete(key);
    }
    return false;
  }

  async deleteByTags(tags: string[]): Promise<number> {
    let deleted = 0;
    for (const [key, item] of this.cache) {
      if (tags.some((tag) => item.tags.includes(tag))) {
        if (await this.delete(key)) {
          deleted++;
        }
      }
    }
    return deleted;
  }

  async deleteOlderThan(timestamp: number): Promise<number> {
    let deleted = 0;
    for (const [key, item] of this.cache) {
      if (item.timestamp < timestamp) {
        if (await this.delete(key)) {
          deleted++;
        }
      }
    }
    return deleted;
  }

  async getAllItems(): Promise<CachedItem<unknown>[]> {
    return Array.from(this.cache.values());
  }

  async getKeys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async findLargeItems(threshold: number): Promise<CachedItem<unknown>[]> {
    return Array.from(this.cache.values()).filter(
      (item) => item.size > threshold,
    );
  }

  async getStats(): Promise<{
    items: number;
    size: number;
    sizeLimit: number;
    utilization: number;
  }> {
    return {
      items: this.cache.size,
      size: this.currentSize,
      sizeLimit: this.sizeLimit,
      utilization: (this.currentSize / this.sizeLimit) * 100,
    };
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (item.ttl && now - item.timestamp > item.ttl) {
        await this.delete(key);
      }
    }
  }

  private async evictLRU(): Promise<void> {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, item] of this.cache) {
      const lastAccess = item.timestamp + item.hits * 1000; // Boost by hits
      if (lastAccess < lruTime && item.priority !== "high") {
        lruTime = lastAccess;
        lruKey = key;
      }
    }

    if (lruKey) {
      await this.delete(lruKey);
    }
  }

  private calculateSize<T>(value: T): number {
    return JSON.stringify(value).length * 2;
  }
}

class PersistentCache {
  private dbName = "str_certified_cache";
  private storeName = "ai_responses";
  private sizeLimit: number;
  private db: IDBDatabase | null = null;

  constructor(sizeLimit: number) {
    this.sizeLimit = sizeLimit;
    this.initDB();
  }

  private async initDB(): Promise<void> {
    const request = indexedDB.open(this.dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        const store = db.createObjectStore(this.storeName, { keyPath: "key" });
        store.createIndex("timestamp", "timestamp");
        store.createIndex("tags", "tags", { multiEntry: true });
      }
    };

    this.db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(key: string): Promise<CachedItem<T> | null> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          item.hits++;
          // Update hit count
          this.updateHits(key, item.hits);
        }
        resolve(item);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async set<T>(key: string, value: T, options: CacheOptions): Promise<void> {
    if (!this.db) await this.initDB();

    const item: CachedItem<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: options.ttl,
      hits: 0,
      size: this.calculateSize(value),
      compressed: false,
      tags: options.tags || [],
      priority: options.priority || "medium",
      metadata: {},
    };

    const transaction = this.db!.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<boolean> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteByTags(tags: string[]): Promise<number> {
    if (!this.db) await this.initDB();

    let deleted = 0;
    const items = await this.getAllItems();

    for (const item of items) {
      if (tags.some((tag) => item.tags.includes(tag))) {
        await this.delete(item.key);
        deleted++;
      }
    }

    return deleted;
  }

  async deleteOlderThan(timestamp: number): Promise<number> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);
    const index = store.index("timestamp");

    let deleted = 0;
    const range = IDBKeyRange.upperBound(timestamp);

    return new Promise((resolve, reject) => {
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          deleted++;
          cursor.continue();
        } else {
          resolve(deleted);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAllItems(): Promise<CachedItem<unknown>[]> {
    if (!this.db) await this.initDB();

    const transaction = this.db!.transaction([this.storeName], "readonly");
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getKeys(): Promise<string[]> {
    const items = await this.getAllItems();
    return items.map((item) => item.key);
  }

  async getStats(): Promise<{
    items: number;
    totalSize: number;
  }> {
    const items = await this.getAllItems();
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);

    return {
      items: items.length,
      size: totalSize,
      sizeLimit: this.sizeLimit,
      utilization: (totalSize / this.sizeLimit) * 100,
    };
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const items = await this.getAllItems();

    for (const item of items) {
      if (item.ttl && now - item.timestamp > item.ttl) {
        await this.delete(item.key);
      }
    }
  }

  private async updateHits(key: string, hits: number): Promise<void> {
    // Update hit count in background
    setTimeout(async () => {
      const item = await this.get(key);
      if (item) {
        item.hits = hits;
        await this.set(key, item.value, {
          ttl: item.ttl,
          tags: item.tags,
          priority: item.priority,
        });
      }
    }, 0);
  }

  private calculateSize<T>(value: T): number {
    return JSON.stringify(value).length * 2;
  }
}

class CompressionEngine {
  async compress<T>(value: T): Promise<T> {
    const json = JSON.stringify(value);
    const encoder = new TextEncoder();
    const data = encoder.encode(json);

    // Use CompressionStream if available
    if ("CompressionStream" in window) {
      const cs = new CompressionStream("gzip");
      const writer = cs.writable.getWriter();
      writer.write(data);
      writer.close();

      const compressed = await new Response(cs.readable).arrayBuffer();
      return {
        _compressed: true,
        data: Array.from(new Uint8Array(compressed)),
      };
    }

    // Fallback: simple compression for repeated strings
    return this.simpleCompress(json);
  }

  async decompress<T>(
    value: T & { _compressed?: boolean; data?: unknown },
  ): Promise<T> {
    if (value._compressed) {
      if ("DecompressionStream" in window) {
        const data = new Uint8Array(value.data);
        const ds = new DecompressionStream("gzip");
        const writer = ds.writable.getWriter();
        writer.write(data);
        writer.close();

        const decompressed = await new Response(ds.readable).text();
        return JSON.parse(decompressed);
      }

      return this.simpleDecompress(value.data as CompressionData);
    }

    return value;
  }

  private simpleCompress(str: string): CompressionData {
    // Simple dictionary-based compression
    const dict: Record<string, number> = {};
    const compressed: number[] = [];
    let dictIndex = 0;

    const words = str.split(/(\s+|[{}[\],":])/);

    for (const word of words) {
      if (word.length > 3) {
        if (!(word in dict)) {
          dict[word] = dictIndex++;
        }
        compressed.push(dict[word]);
      } else {
        compressed.push(word as unknown as number);
      }
    }

    return {
      _compressed: true,
      dict: Object.fromEntries(Object.entries(dict).map(([k, v]) => [v, k])),
      data: compressed,
    };
  }

  private simpleDecompress(compressed: CompressionData): string {
    const reverseDict = Object.fromEntries(
      Object.entries(compressed.dict).map(([key, value]) => [value, key]),
    );
    const decompressed = compressed.data
      .map((item: number | string) =>
        typeof item === "number" ? reverseDict[item] || item.toString() : item,
      )
      .join("");

    return JSON.parse(decompressed);
  }
}

class CacheMetrics {
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    totalHitTime: 0,
    totalMissTime: 0,
    totalSetTime: 0,
    totalCompressed: 0,
    totalUncompressed: 0,
    accessFrequency: new Map<string, number>(),
  };

  recordHit(type: "memory" | "persistent", duration: number): void {
    this.metrics.hits++;
    this.metrics.totalHitTime += duration;
  }

  recordMiss(duration: number): void {
    this.metrics.misses++;
    this.metrics.totalMissTime += duration;
  }

  recordSet(duration: number, size: number): void {
    this.metrics.sets++;
    this.metrics.totalSetTime += duration;
  }

  recordInvalidation(count: number): void {
    this.metrics.invalidations += count;
  }

  getMetrics(): CacheMetricsData {
    return { ...this.metrics };
  }

  getAccessFrequency(key: string): number {
    return this.metrics.accessFrequency.get(key) || 0;
  }

  getMostAccessedKeys(count: number): string[] {
    return Array.from(this.metrics.accessFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([key]) => key);
  }

  collect(): void {
    // Collect and aggregate metrics
    // In production, would send to monitoring service
  }
}

// Types

interface CacheConfig {
  memoryLimit: number;
  persistentLimit: number;
  ttl?: number;
  compressionThreshold?: number;
}

interface CachedItem<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl?: number;
  hits: number;
  size: number;
  compressed: boolean;
  tags: string[];
  priority: "low" | "medium" | "high";
  metadata: Record<string, unknown>;
}

interface CacheOptions {
  force?: boolean;
  maxAge?: number;
}

interface SetCacheOptions {
  ttl?: number;
  tags?: string[];
  priority?: "low" | "medium" | "high";
  metadata?: Record<string, unknown>;
  strategy?: string;
}

interface InvalidationOptions {
  key?: string;
  pattern?: string;
  tags?: string[];
  olderThan?: number;
  applyRules?: boolean;
}

interface CacheStrategy {
  name: string;
  ttl: number;
  useMemory: boolean;
  usePersistent: boolean;
  priority: "low" | "medium" | "high";
}

interface InvalidationRule {
  name: string;
  condition: (item: CachedItem<unknown>) => boolean;
  action: "delete" | "invalidate";
}

interface OptimizationResult {
  freedSpace: number;
  removedItems: number;
  compressedItems: number;
  duration: number;
}

interface KeyOptions {
  context?: string;
  userSpecific?: boolean;
  userId?: string;
  deviceSpecific?: boolean;
  deviceId?: string;
}

interface CacheStatistics {
  memory: CacheMetricsData;
  persistent: CacheMetricsData;
  performance: {
    hitRate: number;
    avgHitTime: number;
    avgMissTime: number;
    compressionRatio: number;
  };
  savings: {
    apiCallsSaved: number;
    estimatedCostSaved: number;
    dataSaved: number;
    timeSaved: number;
  };
}

interface CachePrediction {
  key: string;
  probability: number;
  fetcher: () => Promise<unknown>;
  ttl?: number;
  tags?: string[];
}

interface WarmingStrategy {
  type: "popular" | "predicted" | "critical";
  count?: number;
  predictions?: CachePrediction[];
  paths?: string[];
}

// Default configuration
const defaultCacheConfig: CacheConfig = {
  memoryLimit: 50 * 1024 * 1024, // 50MB
  persistentLimit: 200 * 1024 * 1024, // 200MB
  ttl: 60 * 60 * 1000, // 1 hour
  compressionThreshold: 10 * 1024, // 10KB
};

// Export factory function
export const createCacheManager = (
  config?: Partial<CacheConfig>,
): CacheManager => {
  return new CacheManager({ ...defaultCacheConfig, ...config });
};
