/**
 * Rate Limiter Implementation
 * Prevents abuse and ensures fair resource usage
 */

export interface RateLimitConfig {
  windowSizeMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (context?: any) => string; // Custom key generation
  skipSuccessfulRequests?: boolean; // Only count failed requests
  skipFailedRequests?: boolean; // Only count successful requests
  errorMessage?: string; // Custom error message
  onLimitReached?: (key: string, attempts: number) => void; // Callback when limit reached
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  totalAttempts: number;
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public remainingRequests: number,
    public resetTime: number,
    public totalAttempts: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

interface RateLimitEntry {
  attempts: number;
  windowStart: number;
  lastAttempt: number;
}

export class RateLimiter {
  private records = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private config: RateLimitConfig) {
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async checkLimit(key?: string, context?: any): Promise<RateLimitResult> {
    const rateLimitKey = key || this.generateKey(context);
    const now = Date.now();
    const windowStart = now - this.config.windowSizeMs;

    let entry = this.records.get(rateLimitKey);
    
    if (!entry || entry.windowStart < windowStart) {
      // Create new window or reset expired window
      entry = {
        attempts: 0,
        windowStart: now,
        lastAttempt: now,
      };
    }

    const allowed = entry.attempts < this.config.maxRequests;
    const remainingRequests = Math.max(0, this.config.maxRequests - entry.attempts - 1);
    const resetTime = entry.windowStart + this.config.windowSizeMs;

    if (allowed) {
      entry.attempts++;
      entry.lastAttempt = now;
      this.records.set(rateLimitKey, entry);
    } else {
      // Rate limit exceeded
      if (this.config.onLimitReached) {
        this.config.onLimitReached(rateLimitKey, entry.attempts);
      }
    }

    return {
      allowed,
      remainingRequests,
      resetTime,
      totalAttempts: entry.attempts,
    };
  }

  async attemptRequest<T>(
    operation: () => Promise<T>,
    key?: string,
    context?: any
  ): Promise<T> {
    const result = await this.checkLimit(key, context);
    
    if (!result.allowed) {
      const message = this.config.errorMessage || 
        `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`;
      
      throw new RateLimitError(
        message,
        result.remainingRequests,
        result.resetTime,
        result.totalAttempts
      );
    }

    try {
      const operationResult = await operation();
      
      // Optionally skip counting successful requests
      if (this.config.skipSuccessfulRequests) {
        this.decrementCount(key || this.generateKey(context));
      }
      
      return operationResult;
    } catch (error) {
      // Optionally skip counting failed requests
      if (this.config.skipFailedRequests) {
        this.decrementCount(key || this.generateKey(context));
      }
      
      throw error;
    }
  }

  private generateKey(context?: any): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(context);
    }
    
    // Default key generation based on context
    if (context?.userId) {
      return `user:${context.userId}`;
    }
    
    if (context?.ip) {
      return `ip:${context.ip}`;
    }
    
    if (typeof window !== 'undefined') {
      return `browser:${window.location.origin}`;
    }
    
    return 'global';
  }

  private decrementCount(key: string): void {
    const entry = this.records.get(key);
    if (entry && entry.attempts > 0) {
      entry.attempts--;
      this.records.set(key, entry);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.records.forEach((entry, key) => {
      if (entry.windowStart + this.config.windowSizeMs < now) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => {
      this.records.delete(key);
    });
  }

  public reset(key?: string): void {
    if (key) {
      this.records.delete(key);
    } else {
      this.records.clear();
    }
  }

  public getStats(): {
    totalKeys: number;
    totalAttempts: number;
    activeWindows: number;
  } {
    const now = Date.now();
    let totalAttempts = 0;
    let activeWindows = 0;
    
    this.records.forEach(entry => {
      totalAttempts += entry.attempts;
      if (entry.windowStart + this.config.windowSizeMs > now) {
        activeWindows++;
      }
    });
    
    return {
      totalKeys: this.records.size,
      totalAttempts,
      activeWindows,
    };
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.records.clear();
  }
}

// Rate limiter registry for managing multiple limiters
export class RateLimiterRegistry {
  private static instance: RateLimiterRegistry;
  private limiters = new Map<string, RateLimiter>();

  private constructor() {}

  static getInstance(): RateLimiterRegistry {
    if (!RateLimiterRegistry.instance) {
      RateLimiterRegistry.instance = new RateLimiterRegistry();
    }
    return RateLimiterRegistry.instance;
  }

  createRateLimiter(name: string, config: RateLimitConfig): RateLimiter {
    if (this.limiters.has(name)) {
      throw new Error(`Rate limiter '${name}' already exists`);
    }

    const limiter = new RateLimiter(config);
    this.limiters.set(name, limiter);
    return limiter;
  }

  getRateLimiter(name: string): RateLimiter | undefined {
    return this.limiters.get(name);
  }

  getAllLimiters(): RateLimiter[] {
    return Array.from(this.limiters.values());
  }

  resetAll(): void {
    this.limiters.forEach(limiter => limiter.reset());
  }

  removeRateLimiter(name: string): boolean {
    const limiter = this.limiters.get(name);
    if (limiter) {
      limiter.destroy();
      return this.limiters.delete(name);
    }
    return false;
  }

  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.limiters.forEach((limiter, name) => {
      stats[name] = limiter.getStats();
    });
    return stats;
  }
}

// Pre-configured rate limiters for common use cases
export const createDefaultRateLimiters = () => {
  const registry = RateLimiterRegistry.getInstance();

  // Login attempts - per user
  registry.createRateLimiter('login', {
    windowSizeMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyGenerator: (context) => `login:${context?.email || context?.ip || 'unknown'}`,
    errorMessage: 'Too many login attempts. Please try again in 15 minutes.',
    onLimitReached: (key, attempts) => {
      console.warn(`Rate limit reached for login: ${key}, attempts: ${attempts}`);
    },
  });

  // AI API calls - per user
  registry.createRateLimiter('ai-api', {
    windowSizeMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (context) => `ai:${context?.userId || 'anonymous'}`,
    errorMessage: 'AI service rate limit exceeded. Please wait before making more requests.',
    skipFailedRequests: true, // Don't count failed AI requests against limit
  });

  // File uploads - per user
  registry.createRateLimiter('file-upload', {
    windowSizeMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20,
    keyGenerator: (context) => `upload:${context?.userId || context?.ip || 'unknown'}`,
    errorMessage: 'File upload rate limit exceeded. Please wait before uploading more files.',
  });

  // Database operations - per user
  registry.createRateLimiter('database', {
    windowSizeMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (context) => `db:${context?.userId || 'anonymous'}`,
    errorMessage: 'Database operation rate limit exceeded. Please slow down your requests.',
    skipSuccessfulRequests: false,
  });

  // Password reset - per email/IP
  registry.createRateLimiter('password-reset', {
    windowSizeMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyGenerator: (context) => `reset:${context?.email || context?.ip || 'unknown'}`,
    errorMessage: 'Password reset rate limit exceeded. Please try again in 1 hour.',
  });

  // Global API rate limit
  registry.createRateLimiter('global-api', {
    windowSizeMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
    keyGenerator: () => 'global',
    errorMessage: 'Global rate limit exceeded. Please try again later.',
  });

  return registry;
};

// Utility function to wrap any async function with rate limiting
export function withRateLimit<T extends any[], R>(
  limiterName: string,
  fn: (...args: T) => Promise<R>,
  keyExtractor?: (args: T) => string,
  contextExtractor?: (args: T) => any
): (...args: T) => Promise<R> {
  const registry = RateLimiterRegistry.getInstance();
  const limiter = registry.getRateLimiter(limiterName);
  
  if (!limiter) {
    throw new Error(`Rate limiter '${limiterName}' not found`);
  }

  return async (...args: T): Promise<R> => {
    const key = keyExtractor ? keyExtractor(args) : undefined;
    const context = contextExtractor ? contextExtractor(args) : undefined;
    
    return limiter.attemptRequest(() => fn(...args), key, context);
  };
}

// Hook for React components
export function useRateLimit(limiterName: string) {
  const registry = RateLimiterRegistry.getInstance();
  const limiter = registry.getRateLimiter(limiterName);
  
  if (!limiter) {
    throw new Error(`Rate limiter '${limiterName}' not found`);
  }

  return {
    checkLimit: (key?: string, context?: any) => limiter.checkLimit(key, context),
    attemptRequest: <T>(operation: () => Promise<T>, key?: string, context?: any) => 
      limiter.attemptRequest(operation, key, context),
    reset: (key?: string) => limiter.reset(key),
    getStats: () => limiter.getStats(),
  };
}

// Export registry instance
export const rateLimiterRegistry = RateLimiterRegistry.getInstance();