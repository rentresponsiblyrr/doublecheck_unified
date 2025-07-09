
// Mobile-optimized cache with performance monitoring
class MobileCacheManager {
  private cache = new Map<string, {
    data: unknown;
    timestamp: number;
    ttl: number;
    accessCount: number;
  }>();
  
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes for mobile
  private readonly MAX_CACHE_SIZE = 50; // Limit cache size for mobile memory

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // Clear old entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldEntries();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access count for LRU tracking
    entry.accessCount++;
    
    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictOldEntries(): void {
    // Remove expired entries first
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }

    // If still full, remove least recently used
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
      
      // Remove bottom 20%
      const toRemove = Math.floor(entries.length * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      entries: Array.from(this.cache.keys())
    };
  }
}

export const mobileCache = new MobileCacheManager();

// Cache key generators
export const MOBILE_CACHE_KEYS = {
  PROPERTIES: (userId?: string) => `mobile_properties_${userId || 'all'}`,
  INSPECTION: (inspectionId: string) => `mobile_inspection_${inspectionId}`,
  CHECKLIST_ITEMS: (inspectionId: string) => `mobile_checklist_${inspectionId}`,
  PROPERTY_STATUS: (propertyId: string) => `mobile_property_status_${propertyId}`,
  USER_ROLE: (userId: string) => `mobile_user_role_${userId}`,
} as const;
