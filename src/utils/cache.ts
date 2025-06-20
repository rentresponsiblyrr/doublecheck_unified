
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    this.cache.set(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;

    this.cache.forEach((item) => {
      if (now - item.timestamp > item.ttl) {
        expiredItems++;
      } else {
        validItems++;
      }
    });

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      cacheHitRate: validItems / (validItems + expiredItems) || 0
    };
  }

  // Clean up expired items
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    });

    return cleanedCount;
  }

  // Create a cached version of a function
  memoize<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    keyFn?: (...args: TArgs) => string,
    ttl?: number
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);
      
      // Check cache first
      const cached = this.get<TReturn>(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = await fn(...args);
      this.set(key, result, ttl);
      
      return result;
    };
  }
}

// Create singleton instance
export const cache = new CacheManager();

// Predefined cache keys for consistency
export const CACHE_KEYS = {
  PROPERTIES: 'properties',
  INSPECTIONS: 'inspections',
  USER_ROLE: (userId: string) => `user_role_${userId}`,
  PROPERTY_DETAILS: (propertyId: string) => `property_${propertyId}`,
  INSPECTION_DETAILS: (inspectionId: string) => `inspection_${inspectionId}`,
  CHECKLIST_ITEMS: (inspectionId: string) => `checklist_${inspectionId}`,
  MEDIA_ITEMS: (checklistItemId: string) => `media_${checklistItemId}`
} as const;

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 30 * 60 * 1000,      // 30 minutes
  VERY_LONG: 60 * 60 * 1000  // 1 hour
} as const;

// Utility functions for common caching patterns
export const withCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return fetcher().then(result => {
    cache.set(key, result, ttl);
    return result;
  });
};

// Clear cache for specific patterns
export const clearCachePattern = (pattern: string): number => {
  let cleared = 0;
  
  cache['cache'].forEach((_, key) => {
    if (key.includes(pattern)) {
      cache.delete(key);
      cleared++;
    }
  });
  
  return cleared;
};

// Auto cleanup expired items every 5 minutes
setInterval(() => {
  const cleaned = cache.cleanup();
  if (cleaned > 0) {
    console.log(`🧹 Cache cleanup: removed ${cleaned} expired items`);
  }
}, 5 * 60 * 1000);
