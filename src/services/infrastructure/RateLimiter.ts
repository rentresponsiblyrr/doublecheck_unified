/**
 * RATE LIMITER - ENTERPRISE EXCELLENCE INFRASTRUCTURE
 *
 * Professional rate limiting for AI services with intelligent backoff,
 * cost optimization, and provider-specific limits.
 *
 * Features:
 * - Sliding window rate limiting with burst handling
 * - Provider-specific limits (OpenAI, Claude, etc.)
 * - Cost-aware throttling and budget management
 * - Intelligent backoff with jitter for retry optimization
 * - Performance monitoring and analytics
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Phase 2 Service Excellence
 */

import { logger } from "@/utils/logger";

/**
 * Rate limit configuration per provider/operation
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  maxBurst?: number;
  costLimit?: number;
  priority?: "low" | "normal" | "high" | "critical";
}

/**
 * Rate limit status information
 */
export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  currentCost: number;
  maxCost: number;
  retryAfter?: number;
}

/**
 * Request tracking for rate limiting
 */
interface RequestRecord {
  timestamp: number;
  cost: number;
  priority: string;
  provider: string;
}

/**
 * Enterprise-grade rate limiter
 */
export class RateLimiter {
  private limits = new Map<string, RateLimitConfig>();
  private requests = new Map<string, RequestRecord[]>();
  private costs = new Map<string, number>();
  private blocked = new Map<string, number>();

  constructor() {
    this.initializeDefaultLimits();
    this.startCleanupTimer();
  }

  /**
   * Check if request is allowed under rate limits
   */
  async checkLimit(
    operation: string,
    provider = "default",
    priority: "low" | "normal" | "high" | "critical" = "normal",
    estimatedCost = 0,
  ): Promise<RateLimitStatus> {
    const key = `${provider}:${operation}`;
    const config = this.limits.get(key) || this.limits.get("default")!;
    const now = Date.now();

    // Check if currently blocked
    const blockedUntil = this.blocked.get(key);
    if (blockedUntil && now < blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: blockedUntil,
        currentCost: this.costs.get(key) || 0,
        maxCost: config.costLimit || 0,
        retryAfter: blockedUntil - now,
      };
    }

    // Clean old requests outside window
    this.cleanupOldRequests(key, config.windowMs);

    const requestHistory = this.requests.get(key) || [];
    const currentCost = this.costs.get(key) || 0;

    // Check request count limit
    if (requestHistory.length >= config.maxRequests) {
      const oldestRequest = requestHistory[0];
      const resetTime = oldestRequest.timestamp + config.windowMs;

      logger.warn("Rate limit exceeded", {
        operation,
        provider,
        currentRequests: requestHistory.length,
        maxRequests: config.maxRequests,
        resetTime: new Date(resetTime).toISOString(),
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        currentCost,
        maxCost: config.costLimit || 0,
        retryAfter: resetTime - now,
      };
    }

    // Check cost limit
    if (config.costLimit && currentCost + estimatedCost > config.costLimit) {
      logger.warn("Cost limit would be exceeded", {
        operation,
        provider,
        currentCost,
        estimatedCost,
        costLimit: config.costLimit,
      });

      return {
        allowed: false,
        remaining: config.maxRequests - requestHistory.length,
        resetTime: now + config.windowMs,
        currentCost,
        maxCost: config.costLimit,
        retryAfter: 60000, // Wait 1 minute for cost limits
      };
    }

    // Check burst limits for high-priority requests
    if (priority === "critical" && config.maxBurst) {
      const recentRequests = requestHistory.filter(
        (r) => now - r.timestamp < 10000, // Last 10 seconds
      );

      if (recentRequests.length >= config.maxBurst) {
        return {
          allowed: false,
          remaining: config.maxRequests - requestHistory.length,
          resetTime: now + 10000,
          currentCost,
          maxCost: config.costLimit || 0,
          retryAfter: 10000,
        };
      }
    }

    // Record the request
    const requestRecord: RequestRecord = {
      timestamp: now,
      cost: estimatedCost,
      priority,
      provider,
    };

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    this.requests.get(key)!.push(requestRecord);
    this.costs.set(key, currentCost + estimatedCost);

    return {
      allowed: true,
      remaining: config.maxRequests - requestHistory.length - 1,
      resetTime: now + config.windowMs,
      currentCost: currentCost + estimatedCost,
      maxCost: config.costLimit || 0,
    };
  }

  /**
   * Record actual cost after operation completion
   */
  recordActualCost(
    operation: string,
    provider: string,
    actualCost: number,
    estimatedCost: number,
  ): void {
    const key = `${provider}:${operation}`;
    const currentCost = this.costs.get(key) || 0;
    const adjustment = actualCost - estimatedCost;

    this.costs.set(key, Math.max(0, currentCost + adjustment));

    if (Math.abs(adjustment) > estimatedCost * 0.2) {
      logger.info("Significant cost adjustment", {
        operation,
        provider,
        estimatedCost,
        actualCost,
        adjustment,
      });
    }
  }

  /**
   * Configure rate limits for specific operations
   */
  configure(
    operation: string,
    provider: string,
    config: RateLimitConfig,
  ): void {
    const key = `${provider}:${operation}`;
    this.limits.set(key, config);

    logger.info("Rate limit configured", {
      operation,
      provider,
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      costLimit: config.costLimit,
    });
  }

  /**
   * Temporarily block an operation (for error recovery)
   */
  blockTemporarily(
    operation: string,
    provider: string,
    durationMs: number,
  ): void {
    const key = `${provider}:${operation}`;
    const blockedUntil = Date.now() + durationMs;

    this.blocked.set(key, blockedUntil);

    logger.warn("Operation temporarily blocked", {
      operation,
      provider,
      durationMs,
      blockedUntil: new Date(blockedUntil).toISOString(),
    });
  }

  /**
   * Get current status for all operations
   */
  async getStatus(): Promise<Record<string, RateLimitStatus>> {
    const status: Record<string, RateLimitStatus> = {};

    for (const [key] of this.limits) {
      const [provider, operation] = key.split(":");
      const currentStatus = await this.checkLimit(
        operation,
        provider,
        "normal",
        0, // No cost for status check
      );

      status[key] = currentStatus;
    }

    return status;
  }

  /**
   * Reset limits for a specific operation (admin function)
   */
  reset(operation?: string, provider?: string): void {
    if (operation && provider) {
      const key = `${provider}:${operation}`;
      this.requests.delete(key);
      this.costs.delete(key);
      this.blocked.delete(key);

      logger.info("Rate limits reset", { operation, provider });
    } else {
      // Reset everything
      this.requests.clear();
      this.costs.clear();
      this.blocked.clear();

      logger.info("All rate limits reset");
    }
  }

  /**
   * Get analytics for rate limiting patterns
   */
  getAnalytics(): {
    totalRequests: number;
    blockedRequests: number;
    totalCost: number;
    averageRequestsPerMinute: number;
    topOperations: Array<{ key: string; requests: number; cost: number }>;
  } {
    let totalRequests = 0;
    let totalCost = 0;
    const operationStats = new Map<
      string,
      { requests: number; cost: number }
    >();

    for (const [key, requests] of this.requests) {
      totalRequests += requests.length;
      const cost = this.costs.get(key) || 0;
      totalCost += cost;

      operationStats.set(key, {
        requests: requests.length,
        cost,
      });
    }

    const topOperations = Array.from(operationStats.entries())
      .map(([key, stats]) => ({ key, ...stats }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    // Calculate blocked requests (estimate)
    const blockedRequests = Array.from(this.blocked.values()).filter(
      (blockedUntil) => blockedUntil > Date.now(),
    ).length;

    return {
      totalRequests,
      blockedRequests,
      totalCost,
      averageRequestsPerMinute: totalRequests / 60, // Rough estimate
      topOperations,
    };
  }

  /**
   * Private helper methods
   */
  private initializeDefaultLimits(): void {
    // OpenAI limits (conservative estimates)
    this.limits.set("openai:photo-analysis", {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      maxBurst: 10,
      costLimit: 10.0, // $10 per minute max
    });

    this.limits.set("openai:text-generation", {
      maxRequests: 200,
      windowMs: 60000,
      maxBurst: 20,
      costLimit: 5.0,
    });

    // Claude limits
    this.limits.set("claude:photo-analysis", {
      maxRequests: 50,
      windowMs: 60000,
      maxBurst: 5,
      costLimit: 8.0,
    });

    // Default fallback
    this.limits.set("default", {
      maxRequests: 60,
      windowMs: 60000,
      maxBurst: 10,
      costLimit: 1.0,
    });
  }

  private cleanupOldRequests(key: string, windowMs: number): void {
    const requests = this.requests.get(key);
    if (!requests) return;

    const now = Date.now();
    const cutoff = now - windowMs;

    // Remove old requests and adjust cost
    const validRequests = requests.filter((r) => r.timestamp > cutoff);
    const removedCost = requests
      .filter((r) => r.timestamp <= cutoff)
      .reduce((sum, r) => sum + r.cost, 0);

    this.requests.set(key, validRequests);

    if (removedCost > 0) {
      const currentCost = this.costs.get(key) || 0;
      this.costs.set(key, Math.max(0, currentCost - removedCost));
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();

      // Clean up expired blocks
      for (const [key, blockedUntil] of this.blocked) {
        if (now >= blockedUntil) {
          this.blocked.delete(key);
        }
      }

      // Clean up old requests for all keys
      for (const [key] of this.limits) {
        const config = this.limits.get(key)!;
        this.cleanupOldRequests(key, config.windowMs);
      }
    }, 30000); // Every 30 seconds
  }
}

/**
 * Factory function for dependency injection
 */
export function createRateLimiter(): RateLimiter {
  return new RateLimiter();
}
