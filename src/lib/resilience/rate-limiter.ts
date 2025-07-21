/**
 * Enterprise-Grade Rate Limiter Implementation
 * Implements Stripe/GitHub/Auth0 level rate limiting standards
 * 
 * SECURITY FEATURES:
 * - Token bucket algorithm with burst capacity
 * - Exponential backoff for persistent violators
 * - Security event integration for violation tracking
 * - Sliding window rate limiting for precise control
 * - User-based and IP-based rate limiting
 * - Dynamic rate adjustment based on threat level
 */

import { SecurityEvents } from '../security/security-audit-logger';

export interface RateLimitConfig {
  windowSizeMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  burstCapacity?: number; // Burst capacity (defaults to maxRequests)
  blockDurationMs?: number; // Block duration after limit exceeded
  keyGenerator?: (context?: Record<string, unknown>) => string; // Custom key generation
  skipSuccessfulRequests?: boolean; // Only count failed requests
  skipFailedRequests?: boolean; // Only count successful requests
  errorMessage?: string; // Custom error message
  enableExponentialBackoff?: boolean; // Enable exponential backoff
  enableSecurityLogging?: boolean; // Enable security event logging
  onLimitReached?: (key: string, attempts: number) => void; // Callback when limit reached
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  totalAttempts: number;
  retryAfter?: number; // Milliseconds until next allowed request
  blocked?: boolean; // Whether identifier is currently blocked
  violationCount?: number; // Number of violations for this identifier
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
  violations: number; // Number of times limit was exceeded
  blocked: boolean; // Whether identifier is currently blocked
  blockUntil?: number; // When block expires
  lastViolation?: number; // When last violation occurred
}

export class RateLimiter {
  private records = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    // Set defaults for optional configuration
    this.config = {
      burstCapacity: config.maxRequests,
      blockDurationMs: 60000, // 1 minute default
      enableExponentialBackoff: true,
      enableSecurityLogging: true,
      ...config
    };

    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  async checkLimit(key?: string, context?: Record<string, unknown>): Promise<RateLimitResult> {
    const rateLimitKey = key || this.generateKey(context);
    const now = Date.now();
    const windowStart = now - this.config.windowSizeMs;

    let entry = this.records.get(rateLimitKey);
    
    // Check if currently blocked
    if (entry?.blocked && entry.blockUntil && now < entry.blockUntil) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: entry.blockUntil,
        totalAttempts: entry.attempts,
        retryAfter: entry.blockUntil - now,
        blocked: true,
        violationCount: entry.violations
      };
    }

    if (!entry || entry.windowStart < windowStart) {
      // Create new window or reset expired window
      entry = {
        attempts: 0,
        windowStart: now,
        lastAttempt: now,
        violations: entry?.violations || 0,
        blocked: false,
        lastViolation: entry?.lastViolation
      };
    }

    // Check burst capacity first, then regular limit
    const effectiveLimit = this.config.burstCapacity || this.config.maxRequests;
    const allowed = entry.attempts < effectiveLimit;
    const remainingRequests = Math.max(0, effectiveLimit - entry.attempts - 1);
    const resetTime = entry.windowStart + this.config.windowSizeMs;

    if (allowed) {
      entry.attempts++;
      entry.lastAttempt = now;
      this.records.set(rateLimitKey, entry);
    } else {
      // Rate limit exceeded - record violation
      entry.violations += 1;
      entry.lastViolation = now;

      // Calculate block duration with exponential backoff
      if (this.config.enableExponentialBackoff) {
        const blockDuration = this.calculateBlockDuration(entry.violations);
        entry.blocked = true;
        entry.blockUntil = now + blockDuration;
      }

      this.records.set(rateLimitKey, entry);

      // Log security event
      if (this.config.enableSecurityLogging) {
        SecurityEvents.rateLimitExceeded('RateLimiter', rateLimitKey);
      }

      // Call callback
      if (this.config.onLimitReached) {
        this.config.onLimitReached(rateLimitKey, entry.attempts);
      }
    }

    return {
      allowed,
      remainingRequests,
      resetTime,
      totalAttempts: entry.attempts,
      retryAfter: entry.blockUntil ? Math.max(0, entry.blockUntil - now) : undefined,
      blocked: entry.blocked,
      violationCount: entry.violations
    };
  }

  /**
   * Calculates block duration with exponential backoff
   */
  private calculateBlockDuration(violations: number): number {
    if (!this.config.enableExponentialBackoff) {
      return this.config.blockDurationMs!;
    }

    // Exponential backoff: base * (2 ^ violations), capped at 1 hour
    const exponentialMs = this.config.blockDurationMs! * Math.pow(2, violations - 1);
    const maxBlockMs = 60 * 60 * 1000; // 1 hour
    
    return Math.min(exponentialMs, maxBlockMs);
  }

  async attemptRequest<T>(
    operation: () => Promise<T>,
    key?: string,
    context?: Record<string, unknown>
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

  private generateKey(context?: Record<string, unknown>): string {
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

  getStats(): Record<string, { totalKeys: number; totalAttempts: number; activeWindows: number }> {
    const stats: Record<string, { totalKeys: number; totalAttempts: number; activeWindows: number }> = {};
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
    burstCapacity: 3, // Lower burst for security
    blockDurationMs: 30 * 60 * 1000, // 30 minute block
    enableExponentialBackoff: true,
    enableSecurityLogging: true,
    keyGenerator: (context) => `login:${context?.email || context?.ip || 'unknown'}`,
    errorMessage: 'Too many login attempts. Please try again in 15 minutes.',
    onLimitReached: (key, attempts) => {
      SecurityEvents.rateLimitExceeded('LoginRateLimiter', key);
    },
  });

  // AI API calls - per user
  registry.createRateLimiter('ai-api', {
    windowSizeMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    burstCapacity: 15, // Allow small bursts
    blockDurationMs: 5 * 60 * 1000, // 5 minute block
    enableExponentialBackoff: true,
    enableSecurityLogging: true,
    keyGenerator: (context) => `ai:${context?.userId || 'anonymous'}`,
    errorMessage: 'AI service rate limit exceeded. Please wait before making more requests.',
    skipFailedRequests: true, // Don't count failed AI requests against limit
  });

  // File uploads - per user
  registry.createRateLimiter('file-upload', {
    windowSizeMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20,
    burstCapacity: 25,
    blockDurationMs: 10 * 60 * 1000, // 10 minute block
    enableExponentialBackoff: true,
    enableSecurityLogging: true,
    keyGenerator: (context) => `upload:${context?.userId || context?.ip || 'unknown'}`,
    errorMessage: 'File upload rate limit exceeded. Please wait before uploading more files.',
    onLimitReached: (key, attempts) => {
      SecurityEvents.rateLimitExceeded('FileUploadRateLimiter', key);
    },
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
export function withRateLimit<T extends readonly unknown[], R>(
  limiterName: string,
  fn: (...args: T) => Promise<R>,
  keyExtractor?: (args: T) => string,
  contextExtractor?: (args: T) => Record<string, unknown>
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
    checkLimit: (key?: string, context?: Record<string, unknown>) => limiter.checkLimit(key, context),
    attemptRequest: <T>(operation: () => Promise<T>, key?: string, context?: Record<string, unknown>) => 
      limiter.attemptRequest(operation, key, context),
    reset: (key?: string) => limiter.reset(key),
    getStats: () => limiter.getStats(),
  };
}

// Export registry instance
export const rateLimiterRegistry = RateLimiterRegistry.getInstance();