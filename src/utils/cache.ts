
export const CACHE_KEYS = {
  CHECKLIST_ITEMS: (inspectionId: string) => `checklist-items-${inspectionId}`,
  INSPECTION: (inspectionId: string) => `inspection-${inspectionId}`,
  PROPERTIES: 'properties-list',
  USER_PROFILE: (userId: string) => `user-profile-${userId}`
} as const;

export const CACHE_TTL = {
  SHORT: 60000,    // 1 minute
  MEDIUM: 300000,  // 5 minutes
  LONG: 900000     // 15 minutes
} as const;

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = CACHE_TTL.MEDIUM): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    const isExpired = (now - item.timestamp) > item.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const cache = new SimpleCache();
