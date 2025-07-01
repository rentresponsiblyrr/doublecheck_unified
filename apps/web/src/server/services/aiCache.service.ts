import { TRPCError } from "@trpc/server";

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class AICacheService {
  private cache: Map<string, CacheEntry>;
  private rateLimits: Map<string, RateLimitEntry>;
  private readonly DEFAULT_TTL = 3600000; // 1 hour
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly RATE_LIMIT_MAX = 60; // 60 requests per minute

  constructor() {
    this.cache = new Map();
    this.rateLimits = new Map();
    this.startCleanupInterval();
  }

  private startCleanupInterval() {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 300000); // Cleanup every 5 minutes
  }

  private cleanupExpiredEntries() {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }

    for (const [key, limit] of this.rateLimits.entries()) {
      if (now > limit.resetTime) {
        this.rateLimits.delete(key);
      }
    }
  }

  generateCacheKey(
    operation: string,
    params: Record<string, any>
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    return `${operation}:${JSON.stringify(sortedParams)}`;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(
    key: string,
    data: any,
    ttl: number = this.DEFAULT_TTL
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  checkRateLimit(userId: string): void {
    const now = Date.now();
    const limit = this.rateLimits.get(userId);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(userId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
      });
      return;
    }

    if (limit.count >= this.RATE_LIMIT_MAX) {
      const waitTime = Math.ceil((limit.resetTime - now) / 1000);
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Please wait ${waitTime} seconds.`,
      });
    }

    limit.count++;
  }

  async withCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached as T;
    }

    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }

  async withRateLimit<T>(
    userId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.checkRateLimit(userId);
    return fn();
  }

  async withCacheAndRateLimit<T>(
    userId: string,
    cacheKey: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    this.checkRateLimit(userId);
    return this.withCache(cacheKey, fn, ttl);
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  getCacheStats(): {
    size: number;
    rateLimitedUsers: number;
    oldestEntry?: number;
  } {
    let oldestTimestamp = Date.now();
    
    for (const entry of this.cache.values()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      rateLimitedUsers: this.rateLimits.size,
      oldestEntry: this.cache.size > 0 ? oldestTimestamp : undefined,
    };
  }
}

export const aiCacheService = new AICacheService();

export function cacheKey(
  operation: string,
  ...params: any[]
): string {
  return aiCacheService.generateCacheKey(operation, { params });
}