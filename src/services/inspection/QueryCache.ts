/**
 * QUERY CACHE - PHASE 2 INTELLIGENT CACHING SYSTEM
 * 
 * Enterprise-grade caching layer designed to achieve 70% query reduction
 * with Netflix/Meta-level performance standards. Implements intelligent
 * cache invalidation, LRU eviction, and performance monitoring.
 * 
 * PERFORMANCE TARGETS:
 * - >60% cache hit rate for repeated requests
 * - <10ms cache lookup time (95th percentile)  
 * - <10MB memory footprint at steady state
 * - Smart invalidation on data mutations
 * 
 * @author STR Certified Engineering Team
 * @phase Phase 2 - Query Standardization & Architectural Excellence
 */

import { logger } from '@/utils/logger';

// ========================================
// CACHE CONFIGURATION
// ========================================

/**
 * Cache duration configurations based on data volatility
 * Optimized for inspection workflow patterns
 */
const CACHE_DURATIONS = {
  // Frequently changing data - short cache
  activeInspections: 30 * 1000,        // 30 seconds
  inspectionProgress: 15 * 1000,       // 15 seconds  
  userSession: 60 * 1000,              // 1 minute

  // Moderately changing data - medium cache
  inspectionDetails: 2 * 60 * 1000,    // 2 minutes
  propertyDetails: 5 * 60 * 1000,      // 5 minutes
  userProfile: 60 * 1000,              // 1 minute

  // Rarely changing data - long cache
  staticSafetyItems: 10 * 60 * 1000,   // 10 minutes
  userPermissions: 5 * 60 * 1000,      // 5 minutes
  systemConfig: 15 * 60 * 1000,        // 15 minutes

  // Very stable data - very long cache
  propertyMetadata: 30 * 60 * 1000,    // 30 minutes
  inspectorCertifications: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Cache size limits to prevent memory leaks
 */
const CACHE_LIMITS = {
  maxEntries: 10000,           // Maximum cache entries
  maxMemoryMB: 10,             // Maximum memory usage in MB
  cleanupInterval: 5 * 60 * 1000,  // Cleanup every 5 minutes
  maxKeyLength: 200,           // Maximum cache key length
} as const;

// ========================================
// CACHE ENTRY TYPES
// ========================================

/**
 * Individual cache entry with metadata
 */
interface CacheEntry<T = any> {
  data: T;
  expires: number;             // Unix timestamp
  created: number;             // Unix timestamp  
  hits: number;                // Access count
  lastAccess: number;          // Last access timestamp
  size: number;                // Estimated memory size in bytes
  tags: string[];              // Invalidation tags
  priority: CachePriority;     // Eviction priority
}

/**
 * Cache priority levels for intelligent eviction
 */
type CachePriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Cache statistics for monitoring and optimization
 */
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;             // Percentage
  evictions: number;
  memoryUsage: number;         // Bytes
  entryCount: number;
  avgLookupTime: number;       // Milliseconds
  lastCleanup: Date;
}

/**
 * Cache operation metadata
 */
interface CacheOperation {
  key: string;
  operation: 'get' | 'set' | 'delete' | 'invalidate' | 'cleanup';
  timestamp: Date;
  duration: number;            // Milliseconds
  hit: boolean;
  size?: number;
}

// ========================================
// MAIN QUERY CACHE CLASS  
// ========================================

/**
 * Intelligent Query Cache with LRU eviction and smart invalidation
 * 
 * Features:
 * - Automatic expiration based on data type
 * - LRU eviction when memory limits reached  
 * - Tag-based invalidation for related data
 * - Performance monitoring and metrics
 * - Memory usage optimization
 * - Background cleanup process
 */
export class QueryCache {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    evictions: 0,
    memoryUsage: 0,
    entryCount: 0,
    avgLookupTime: 0,
    lastCleanup: new Date(),
  };
  private operations: CacheOperation[] = [];
  private cleanupInterval: number | null = null;
  private performanceHistory: number[] = [];

  constructor() {
    this.startBackgroundCleanup();
    this.setupPerformanceMonitoring();
  }

  /**
   * Retrieve data from cache if available and not expired
   * 
   * @param key - Unique cache key
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string): T | null {
    const startTime = performance.now();
    
    try {
      // Validate key
      if (!this.isValidKey(key)) {
        logger.warn('Invalid cache key provided', { key });
        return null;
      }

      const entry = this.cache.get(key);
      const duration = performance.now() - startTime;

      // Record miss if not found
      if (!entry) {
        this.recordOperation(key, 'get', duration, false);
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      // Check if expired
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.recordOperation(key, 'get', duration, false);
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      // Update access metadata
      entry.hits++;
      entry.lastAccess = Date.now();

      // Record hit
      this.recordOperation(key, 'get', duration, true);
      this.stats.hits++;
      this.updateHitRate();

      logger.debug('Cache hit', { key, hits: entry.hits, age: Date.now() - entry.created });
      return entry.data as T;

    } catch (error) {
      logger.error('Cache get operation failed', { error, key });
      return null;
    }
  }

  /**
   * Store data in cache with automatic expiration and metadata
   * 
   * @param key - Unique cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (optional)
   * @param tags - Invalidation tags (optional)
   * @param priority - Cache priority for eviction (optional)
   */
  set<T>(
    key: string, 
    data: T, 
    ttl?: number, 
    tags: string[] = [],
    priority: CachePriority = 'medium'
  ): void {
    const startTime = performance.now();

    try {
      // Validate inputs
      if (!this.isValidKey(key)) {
        logger.warn('Invalid cache key, skipping set', { key });
        return;
      }

      if (data === null || data === undefined) {
        logger.warn('Null data provided to cache, skipping', { key });
        return;
      }

      // Determine TTL
      const duration = ttl || this.inferCacheDuration(key);
      const now = Date.now();
      const size = this.estimateSize(data);

      // Check memory limits before adding
      if (this.wouldExceedMemoryLimit(size)) {
        this.evictLRU();
      }

      // Create cache entry
      const entry: CacheEntry<T> = {
        data,
        expires: now + duration,
        created: now,
        hits: 0,
        lastAccess: now,
        size,
        tags: [...tags, this.extractTagsFromKey(key)].filter(Boolean),
        priority,
      };

      // Store in cache
      this.cache.set(key, entry);
      this.updateMemoryUsage();

      const operationDuration = performance.now() - startTime;
      this.recordOperation(key, 'set', operationDuration, false, size);

      logger.debug('Cache set', { 
        key, 
        ttl: duration, 
        size, 
        tags: entry.tags,
        priority,
        expires: new Date(entry.expires).toISOString()
      });

    } catch (error) {
      logger.error('Cache set operation failed', { error, key, dataType: typeof data });
    }
  }

  /**
   * Remove specific key from cache
   * 
   * @param key - Cache key to remove
   */
  delete(key: string): boolean {
    const startTime = performance.now();
    
    try {
      const existed = this.cache.delete(key);
      this.updateMemoryUsage();
      
      const duration = performance.now() - startTime;
      this.recordOperation(key, 'delete', duration, false);
      
      if (existed) {
        logger.debug('Cache key deleted', { key });
      }
      
      return existed;
    } catch (error) {
      logger.error('Cache delete operation failed', { error, key });
      return false;
    }
  }

  /**
   * Invalidate cache entries by tag pattern
   * Critical for maintaining data consistency after mutations
   * 
   * @param pattern - Tag pattern to match (supports wildcards)
   */
  invalidatePattern(pattern: string): number {
    const startTime = performance.now();
    let invalidated = 0;

    try {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      const keysToDelete: string[] = [];

      // Find matching entries
      for (const [key, entry] of this.cache.entries()) {
        if (entry.tags.some(tag => regex.test(tag))) {
          keysToDelete.push(key);
        }
      }

      // Delete matching entries
      keysToDelete.forEach(key => {
        if (this.cache.delete(key)) {
          invalidated++;
        }
      });

      this.updateMemoryUsage();
      
      const duration = performance.now() - startTime;
      this.recordOperation(pattern, 'invalidate', duration, false);
      
      logger.info('Cache invalidation completed', { 
        pattern, 
        invalidated, 
        duration: duration.toFixed(2) + 'ms' 
      });

    } catch (error) {
      logger.error('Cache invalidation failed', { error, pattern });
    }

    return invalidated;
  }

  /**
   * Invalidate cache entries related to specific inspection
   * 
   * @param inspectionId - Inspection ID
   */
  invalidateInspection(inspectionId: string): void {
    this.invalidatePattern(`inspection:${inspectionId}*`);
    this.invalidatePattern(`progress:${inspectionId}*`);
    this.invalidatePattern(`checklist:${inspectionId}*`);
  }

  /**
   * Invalidate cache entries related to specific property
   * 
   * @param propertyId - Property ID  
   */
  invalidateProperty(propertyId: string): void {
    this.invalidatePattern(`property:${propertyId}*`);
    this.invalidatePattern(`*property_id:${propertyId}*`);
  }

  /**
   * Invalidate cache entries for specific user
   * 
   * @param userId - User ID
   */
  invalidateUser(userId: string): void {
    this.invalidatePattern(`user:${userId}*`);
    this.invalidatePattern(`*inspector:${userId}*`);
  }

  /**
   * Clear entire cache
   * Use sparingly, only for major system updates
   */
  clear(): void {
    const startTime = performance.now();
    const count = this.cache.size;
    
    this.cache.clear();
    this.stats.memoryUsage = 0;
    this.stats.entryCount = 0;
    
    const duration = performance.now() - startTime;
    
    logger.info('Cache cleared', { 
      entriesCleared: count, 
      duration: duration.toFixed(2) + 'ms' 
    });
  }

  /**
   * Get current cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit rate percentage
   */
  getHitRate(): number {
    return this.stats.hitRate;
  }

  /**
   * Get detailed performance report
   */
  getPerformanceReport(): {
    stats: CacheStats;
    recentOperations: CacheOperation[];
    memoryBreakdown: Record<string, number>;
    recommendations: string[];
  } {
    const memoryBreakdown = this.calculateMemoryBreakdown();
    const recommendations = this.generateRecommendations();
    
    return {
      stats: this.getStats(),
      recentOperations: this.operations.slice(-100), // Last 100 operations
      memoryBreakdown,
      recommendations,
    };
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Check if cache entry has expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expires;
  }

  /**
   * Validate cache key format and length
   */
  private isValidKey(key: string): boolean {
    return (
      typeof key === 'string' &&
      key.length > 0 &&
      key.length <= CACHE_LIMITS.maxKeyLength &&
      !key.includes('\n') &&
      !key.includes('\r')
    );
  }

  /**
   * Infer cache duration based on key patterns
   */
  private inferCacheDuration(key: string): number {
    // Match key patterns to appropriate durations
    if (key.includes('active_inspection')) return CACHE_DURATIONS.activeInspections;
    if (key.includes('progress')) return CACHE_DURATIONS.inspectionProgress;
    if (key.includes('inspection_detail')) return CACHE_DURATIONS.inspectionDetails;
    if (key.includes('property_detail')) return CACHE_DURATIONS.propertyDetails;
    if (key.includes('safety_item')) return CACHE_DURATIONS.staticSafetyItems;
    if (key.includes('user_profile')) return CACHE_DURATIONS.userProfile;
    if (key.includes('user_permissions')) return CACHE_DURATIONS.userPermissions;
    if (key.includes('config')) return CACHE_DURATIONS.systemConfig;
    
    // Default to medium duration
    return CACHE_DURATIONS.inspectionDetails;
  }

  /**
   * Extract invalidation tags from cache key
   */
  private extractTagsFromKey(key: string): string {
    const parts = key.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return parts[0];
  }

  /**
   * Estimate memory size of data (rough approximation)
   */
  private estimateSize(data: any): number {
    if (typeof data === 'string') {
      return data.length * 2; // Unicode characters
    }
    if (typeof data === 'number') {
      return 8; // 64-bit number
    }
    if (typeof data === 'boolean') {
      return 4;
    }
    if (data === null || data === undefined) {
      return 0;
    }
    
    try {
      // JSON size estimation
      return JSON.stringify(data).length * 2;
    } catch {
      return 1000; // Fallback estimate
    }
  }

  /**
   * Check if adding entry would exceed memory limits
   */
  private wouldExceedMemoryLimit(size: number): boolean {
    const maxBytes = CACHE_LIMITS.maxMemoryMB * 1024 * 1024;
    return (this.stats.memoryUsage + size) > maxBytes;
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => {
        // Sort by priority first, then by last access
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[a.entry.priority] - priorityOrder[b.entry.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return a.entry.lastAccess - b.entry.lastAccess;
      });

    // Remove lowest priority, least recently used entries
    const toEvict = Math.max(1, Math.floor(entries.length * 0.1)); // Evict 10%
    
    for (let i = 0; i < toEvict && entries.length > 0; i++) {
      const { key } = entries[i];
      this.cache.delete(key);
      this.stats.evictions++;
    }

    this.updateMemoryUsage();
    logger.info('LRU eviction completed', { evicted: toEvict, remaining: this.cache.size });
  }

  /**
   * Update memory usage statistics
   */
  private updateMemoryUsage(): void {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    this.stats.memoryUsage = totalSize;
    this.stats.entryCount = this.cache.size;
  }

  /**
   * Update hit rate percentage
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Record cache operation for monitoring
   */
  private recordOperation(
    key: string,
    operation: CacheOperation['operation'],
    duration: number,
    hit: boolean,
    size?: number
  ): void {
    // Keep last 1000 operations
    if (this.operations.length >= 1000) {
      this.operations = this.operations.slice(-500);
    }

    this.operations.push({
      key,
      operation,
      timestamp: new Date(),
      duration,
      hit,
      size,
    });

    // Update average lookup time
    this.performanceHistory.push(duration);
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100);
    }
    
    this.stats.avgLookupTime = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
  }

  /**
   * Background cleanup of expired entries
   */
  private startBackgroundCleanup(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupExpired();
    }, CACHE_LIMITS.cleanupInterval);
  }

  /**
   * Remove expired entries
   */
  private cleanupExpired(): void {
    const startTime = performance.now();
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.updateMemoryUsage();
    this.stats.lastCleanup = new Date();

    const duration = performance.now() - startTime;
    
    if (cleaned > 0) {
      logger.info('Cache cleanup completed', { 
        cleaned, 
        remaining: this.cache.size,
        duration: duration.toFixed(2) + 'ms'
      });
    }
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Monitor memory usage every minute
    setInterval(() => {
      if (this.stats.memoryUsage > CACHE_LIMITS.maxMemoryMB * 1024 * 1024 * 0.8) {
        logger.warn('Cache memory usage approaching limit', {
          current: Math.round(this.stats.memoryUsage / 1024 / 1024),
          limit: CACHE_LIMITS.maxMemoryMB,
        });
      }
    }, 60000);
  }

  /**
   * Calculate memory breakdown by cache key patterns
   */
  private calculateMemoryBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    for (const [key, entry] of this.cache.entries()) {
      const category = key.split(':')[0] || 'other';
      breakdown[category] = (breakdown[category] || 0) + entry.size;
    }
    
    return breakdown;
  }

  /**
   * Generate performance optimization recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.stats.hitRate < 50) {
      recommendations.push('Cache hit rate is low. Consider increasing TTL for frequently accessed data.');
    }
    
    if (this.stats.avgLookupTime > 5) {
      recommendations.push('Cache lookup time is high. Consider reducing cache size or optimizing key structure.');
    }
    
    if (this.stats.evictions > this.stats.hits * 0.1) {
      recommendations.push('High eviction rate detected. Consider increasing memory limit or optimizing data size.');
    }
    
    const memoryUsageMB = this.stats.memoryUsage / 1024 / 1024;
    if (memoryUsageMB > CACHE_LIMITS.maxMemoryMB * 0.8) {
      recommendations.push('Memory usage is high. Consider reducing TTL or implementing more aggressive cleanup.');
    }
    
    return recommendations;
  }

  /**
   * Cleanup resources when cache is destroyed
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clear();
    this.operations = [];
    this.performanceHistory = [];
    
    logger.info('Cache destroyed and resources cleaned up');
  }
}

// ========================================
// SINGLETON EXPORT
// ========================================

/**
 * Global query cache instance
 * Singleton pattern ensures consistent caching across the application
 */
export const queryCache = new QueryCache();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    queryCache.destroy();
  });
}