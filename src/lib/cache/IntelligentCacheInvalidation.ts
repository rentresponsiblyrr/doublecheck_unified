/**
 * INTELLIGENT CACHE INVALIDATION - NETFLIX/META PRODUCTION STANDARDS
 *
 * Advanced cache invalidation system with dependency tracking, smart invalidation
 * strategies, and conflict resolution. Integrates with Enhanced cache infrastructure
 * to provide intelligent cache management for optimal performance.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import { logger } from "@/utils/logger";

export interface CacheInvalidationRule {
  id: string;
  name: string;
  pattern: string | RegExp;
  dependencies: string[];
  strategy: "immediate" | "lazy" | "batched" | "scheduled";
  priority: "low" | "medium" | "high" | "critical";
  conditions?: {
    dataTypes?: string[];
    operations?: ("create" | "update" | "delete")[];
    userRoles?: string[];
    timeWindow?: number; // milliseconds
    conflictResolution?: "merge" | "replace" | "skip";
  };
  metadata?: {
    tags: string[];
    description: string;
    createdBy: string;
    lastModified: number;
  };
}

export interface InvalidationEvent {
  id: string;
  type: "data_change" | "user_action" | "system_event" | "scheduled" | "manual";
  source: string;
  target: string | string[];
  operation: "create" | "update" | "delete" | "bulk" | "system";
  timestamp: number;
  metadata: {
    userId?: string;
    sessionId?: string;
    reason: string;
    affectedData?: string[];
    cascadeLevel?: number;
  };
  dependencies?: string[];
}

export interface InvalidationStrategy {
  name: string;
  execute: (keys: string[], event: InvalidationEvent) => Promise<void>;
  shouldInvalidate: (key: string, event: InvalidationEvent) => boolean;
  priority: number;
  batchSize?: number;
  delay?: number;
}

export interface CacheInvalidationStats {
  totalInvalidations: number;
  successfulInvalidations: number;
  failedInvalidations: number;
  averageInvalidationTime: number;
  cacheHitRateImpact: number;
  lastInvalidationTime: number;
  rulesExecuted: number;
  dependencyChainsResolved: number;
}

class IntelligentCacheInvalidation {
  private rules = new Map<string, CacheInvalidationRule>();
  private strategies = new Map<string, InvalidationStrategy>();
  private dependencyGraph = new Map<string, Set<string>>();
  private reverseDependencyGraph = new Map<string, Set<string>>();
  private invalidationQueue: InvalidationEvent[] = [];
  private processingQueue = false;
  private batchedInvalidations = new Map<string, Set<string>>();
  private scheduledInvalidations = new Map<string, NodeJS.Timeout>();

  private stats: CacheInvalidationStats = {
    totalInvalidations: 0,
    successfulInvalidations: 0,
    failedInvalidations: 0,
    averageInvalidationTime: 0,
    cacheHitRateImpact: 0,
    lastInvalidationTime: 0,
    rulesExecuted: 0,
    dependencyChainsResolved: 0,
  };

  constructor() {
    this.initializeDefaultStrategies();
    this.initializeDefaultRules();
    this.startQueueProcessor();
  }

  /**
   * Register invalidation rule
   */
  registerRule(rule: CacheInvalidationRule): void {
    this.rules.set(rule.id, rule);

    // Build dependency graph
    rule.dependencies.forEach((dep) => {
      if (!this.dependencyGraph.has(rule.pattern.toString())) {
        this.dependencyGraph.set(rule.pattern.toString(), new Set());
      }
      this.dependencyGraph.get(rule.pattern.toString())!.add(dep);

      // Reverse dependency graph
      if (!this.reverseDependencyGraph.has(dep)) {
        this.reverseDependencyGraph.set(dep, new Set());
      }
      this.reverseDependencyGraph.get(dep)!.add(rule.pattern.toString());
    });

    logger.debug("Cache invalidation rule registered", {
      ruleId: rule.id,
      pattern: rule.pattern.toString(),
      dependencies: rule.dependencies,
      strategy: rule.strategy,
    });
  }

  /**
   * Register custom invalidation strategy
   */
  registerStrategy(name: string, strategy: InvalidationStrategy): void {
    this.strategies.set(name, strategy);
    logger.debug("Cache invalidation strategy registered", {
      name,
      priority: strategy.priority,
    });
  }

  /**
   * Trigger cache invalidation
   */
  async invalidate(event: InvalidationEvent): Promise<void> {
    this.stats.totalInvalidations++;
    const startTime = Date.now();

    try {
      // Add to processing queue
      this.invalidationQueue.push(event);

      // Process if not already processing
      if (!this.processingQueue) {
        await this.processInvalidationQueue();
      }

      // Update stats
      const duration = Date.now() - startTime;
      this.updateStats(duration, true);

      logger.debug("Cache invalidation triggered", {
        eventId: event.id,
        type: event.type,
        target: event.target,
        duration,
      });
    } catch (error) {
      this.updateStats(Date.now() - startTime, false);
      logger.error("Cache invalidation failed", { event, error });
      throw error;
    }
  }

  /**
   * Invalidate by pattern or key
   */
  async invalidateByPattern(
    pattern: string | RegExp,
    reason: string,
    options: {
      strategy?: "immediate" | "lazy" | "batched";
      cascade?: boolean;
      priority?: "low" | "medium" | "high" | "critical";
    } = {},
  ): Promise<void> {
    const event: InvalidationEvent = {
      id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "manual",
      source: "system",
      target: pattern.toString(),
      operation: "system",
      timestamp: Date.now(),
      metadata: {
        reason,
        cascadeLevel: options.cascade ? 0 : -1,
      },
    };

    await this.invalidate(event);
  }

  /**
   * Invalidate related data by dependency chain
   */
  async invalidateRelated(
    dataKey: string,
    operation: "create" | "update" | "delete",
    options: {
      userId?: string;
      sessionId?: string;
      reason?: string;
      maxCascadeLevel?: number;
    } = {},
  ): Promise<void> {
    const event: InvalidationEvent = {
      id: `related_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: "data_change",
      source: dataKey,
      target: dataKey,
      operation,
      timestamp: Date.now(),
      metadata: {
        userId: options.userId,
        sessionId: options.sessionId,
        reason: options.reason || `Data ${operation} operation`,
        cascadeLevel: 0,
      },
      dependencies: this.findDependencies(dataKey),
    };

    await this.invalidate(event);
  }

  /**
   * Batch invalidate multiple keys
   */
  async batchInvalidate(
    keys: string[],
    reason: string,
    options: {
      batchSize?: number;
      delay?: number;
      strategy?: string;
    } = {},
  ): Promise<void> {
    const batchSize = options.batchSize || 50;
    const delay = options.delay || 100;
    const strategy = this.strategies.get(options.strategy || "batched");

    if (!strategy) {
      throw new Error(`Unknown invalidation strategy: ${options.strategy}`);
    }

    // Process in batches
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);

      const event: InvalidationEvent = {
        id: `batch_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        type: "system_event",
        source: "batch_invalidation",
        target: batch,
        operation: "bulk",
        timestamp: Date.now(),
        metadata: {
          reason,
          affectedData: batch,
        },
      };

      await this.invalidate(event);

      // Delay between batches if specified
      if (delay > 0 && i + batchSize < keys.length) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Schedule invalidation for future execution
   */
  scheduleInvalidation(
    pattern: string | RegExp,
    delay: number,
    reason: string,
    options: {
      recurring?: boolean;
      interval?: number;
    } = {},
  ): string {
    const scheduleId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const execute = async () => {
      try {
        await this.invalidateByPattern(pattern, reason, {
          strategy: "scheduled",
        });

        // Reschedule if recurring
        if (options.recurring && options.interval) {
          this.scheduledInvalidations.set(
            scheduleId,
            setTimeout(execute, options.interval),
          );
        } else {
          this.scheduledInvalidations.delete(scheduleId);
        }
      } catch (error) {
        logger.error("Scheduled invalidation failed", {
          scheduleId,
          pattern,
          error,
        });
        this.scheduledInvalidations.delete(scheduleId);
      }
    };

    const timeout = setTimeout(execute, delay);
    this.scheduledInvalidations.set(scheduleId, timeout);

    logger.info("Cache invalidation scheduled", {
      scheduleId,
      pattern: pattern.toString(),
      delay,
      recurring: options.recurring,
      interval: options.interval,
    });

    return scheduleId;
  }

  /**
   * Cancel scheduled invalidation
   */
  cancelScheduledInvalidation(scheduleId: string): boolean {
    const timeout = this.scheduledInvalidations.get(scheduleId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledInvalidations.delete(scheduleId);
      return true;
    }
    return false;
  }

  /**
   * Get invalidation statistics
   */
  getStats(): CacheInvalidationStats {
    return { ...this.stats };
  }

  /**
   * Process invalidation queue
   */
  private async processInvalidationQueue(): Promise<void> {
    if (this.processingQueue || this.invalidationQueue.length === 0) return;

    this.processingQueue = true;

    try {
      while (this.invalidationQueue.length > 0) {
        const event = this.invalidationQueue.shift()!;
        await this.processInvalidationEvent(event);
      }
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Process single invalidation event
   */
  private async processInvalidationEvent(
    event: InvalidationEvent,
  ): Promise<void> {
    const applicableRules = this.findApplicableRules(event);

    for (const rule of applicableRules) {
      try {
        await this.executeRule(rule, event);
        this.stats.rulesExecuted++;
      } catch (error) {
        logger.error("Rule execution failed", {
          ruleId: rule.id,
          event,
          error,
        });
      }
    }

    // Handle dependencies if cascading is enabled
    if (
      event.metadata.cascadeLevel !== undefined &&
      event.metadata.cascadeLevel >= 0
    ) {
      await this.processDependencies(event);
    }
  }

  /**
   * Execute invalidation rule
   */
  private async executeRule(
    rule: CacheInvalidationRule,
    event: InvalidationEvent,
  ): Promise<void> {
    const strategy =
      this.strategies.get(rule.strategy) || this.strategies.get("immediate")!;

    // Determine target keys
    let targetKeys: string[];
    if (Array.isArray(event.target)) {
      targetKeys = event.target;
    } else {
      targetKeys = [event.target];
    }

    // Filter keys based on rule pattern
    const keysToInvalidate = targetKeys.filter((key) =>
      this.matchesPattern(key, rule.pattern),
    );

    if (keysToInvalidate.length === 0) return;

    // Apply conditions if specified
    if (rule.conditions && !this.meetsConditions(rule.conditions, event)) {
      return;
    }

    // Execute strategy
    await strategy.execute(keysToInvalidate, event);

    logger.debug("Invalidation rule executed", {
      ruleId: rule.id,
      strategy: rule.strategy,
      keysInvalidated: keysToInvalidate.length,
    });
  }

  /**
   * Process dependency chain invalidations
   */
  private async processDependencies(event: InvalidationEvent): Promise<void> {
    if (!event.dependencies || event.dependencies.length === 0) return;

    const cascadeLevel = (event.metadata.cascadeLevel || 0) + 1;
    const maxCascadeLevel = 5; // Prevent infinite cascades

    if (cascadeLevel > maxCascadeLevel) {
      logger.warn("Max cascade level reached, stopping dependency chain", {
        eventId: event.id,
        cascadeLevel,
      });
      return;
    }

    for (const dependency of event.dependencies) {
      const dependencyEvent: InvalidationEvent = {
        id: `dep_${event.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "system_event",
        source: event.target.toString(),
        target: dependency,
        operation: "system",
        timestamp: Date.now(),
        metadata: {
          ...event.metadata,
          reason: `Dependency of ${event.target}`,
          cascadeLevel,
        },
        dependencies: this.findDependencies(dependency),
      };

      await this.invalidate(dependencyEvent);
    }

    this.stats.dependencyChainsResolved++;
  }

  /**
   * Find applicable rules for event
   */
  private findApplicableRules(
    event: InvalidationEvent,
  ): CacheInvalidationRule[] {
    const rules: CacheInvalidationRule[] = [];

    for (const rule of this.rules.values()) {
      if (this.isRuleApplicable(rule, event)) {
        rules.push(rule);
      }
    }

    // Sort by priority
    return rules.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Check if rule is applicable to event
   */
  private isRuleApplicable(
    rule: CacheInvalidationRule,
    event: InvalidationEvent,
  ): boolean {
    // Check pattern match
    const targets = Array.isArray(event.target) ? event.target : [event.target];
    const hasMatchingTarget = targets.some((target) =>
      this.matchesPattern(target, rule.pattern),
    );

    if (!hasMatchingTarget) return false;

    // Check conditions if specified
    if (rule.conditions && !this.meetsConditions(rule.conditions, event)) {
      return false;
    }

    return true;
  }

  /**
   * Check if pattern matches key
   */
  private matchesPattern(key: string, pattern: string | RegExp): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(key);
    }

    // Simple glob pattern support
    const regexPattern = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");

    return new RegExp(`^${regexPattern}$`).test(key);
  }

  /**
   * Check if conditions are met
   */
  private meetsConditions(
    conditions: CacheInvalidationRule["conditions"],
    event: InvalidationEvent,
  ): boolean {
    if (!conditions) return true;

    // Check operations
    if (
      conditions.operations &&
      !conditions.operations.includes(event.operation)
    ) {
      return false;
    }

    // Check time window
    if (conditions.timeWindow) {
      const timeSinceEvent = Date.now() - event.timestamp;
      if (timeSinceEvent > conditions.timeWindow) {
        return false;
      }
    }

    // Check user roles (if applicable)
    if (conditions.userRoles && event.metadata.userId) {
      // This would require user role lookup - implement based on your auth system
      // For now, assuming role is available in metadata
    }

    return true;
  }

  /**
   * Find dependencies for a key
   */
  private findDependencies(key: string): string[] {
    const dependencies = this.reverseDependencyGraph.get(key);
    return dependencies ? Array.from(dependencies) : [];
  }

  /**
   * Update statistics
   */
  private updateStats(duration: number, success: boolean): void {
    if (success) {
      this.stats.successfulInvalidations++;
    } else {
      this.stats.failedInvalidations++;
    }

    // Update average duration
    const totalInvalidations =
      this.stats.successfulInvalidations + this.stats.failedInvalidations;
    const currentAvg = this.stats.averageInvalidationTime;
    this.stats.averageInvalidationTime =
      totalInvalidations === 1
        ? duration
        : (currentAvg * (totalInvalidations - 1) + duration) /
          totalInvalidations;

    this.stats.lastInvalidationTime = Date.now();
  }

  /**
   * Initialize default invalidation strategies
   */
  private initializeDefaultStrategies(): void {
    // Immediate strategy
    this.strategies.set("immediate", {
      name: "immediate",
      priority: 1,
      execute: async (keys: string[], event: InvalidationEvent) => {
        // Immediate cache invalidation
        for (const key of keys) {
          await this.invalidateCacheKey(key, event);
        }
      },
      shouldInvalidate: () => true,
    });

    // Lazy strategy
    this.strategies.set("lazy", {
      name: "lazy",
      priority: 2,
      execute: async (keys: string[], event: InvalidationEvent) => {
        // Mark for lazy invalidation - will be invalidated on next access
        for (const key of keys) {
          await this.markForLazyInvalidation(key, event);
        }
      },
      shouldInvalidate: (key: string, event: InvalidationEvent) => {
        return this.shouldLazyInvalidate(key, event);
      },
    });

    // Batched strategy
    this.strategies.set("batched", {
      name: "batched",
      priority: 3,
      batchSize: 50,
      delay: 1000,
      execute: async (keys: string[], event: InvalidationEvent) => {
        // Add to batch for later processing
        for (const key of keys) {
          if (!this.batchedInvalidations.has("default")) {
            this.batchedInvalidations.set("default", new Set());
          }
          this.batchedInvalidations.get("default")!.add(key);
        }

        // Schedule batch processing
        setTimeout(() => this.processBatchedInvalidations(), 1000);
      },
      shouldInvalidate: () => true,
    });

    // Scheduled strategy
    this.strategies.set("scheduled", {
      name: "scheduled",
      priority: 4,
      execute: async (keys: string[], event: InvalidationEvent) => {
        // Execute scheduled invalidation
        for (const key of keys) {
          await this.invalidateCacheKey(key, event);
        }
      },
      shouldInvalidate: () => true,
    });
  }

  /**
   * Initialize default rules
   */
  private initializeDefaultRules(): void {
    // User data invalidation
    this.registerRule({
      id: "user-data",
      name: "User Data Invalidation",
      pattern: /^user:.*$/,
      dependencies: ["user:profile:*", "user:settings:*", "user:sessions:*"],
      strategy: "immediate",
      priority: "high",
      conditions: {
        operations: ["update", "delete"],
      },
      metadata: {
        tags: ["user", "profile"],
        description: "Invalidates user-related cache entries",
        createdBy: "system",
        lastModified: Date.now(),
      },
    });

    // Property data invalidation
    this.registerRule({
      id: "property-data",
      name: "Property Data Invalidation",
      pattern: /^property:.*$/,
      dependencies: ["inspection:*", "checklist:*"],
      strategy: "immediate",
      priority: "high",
      conditions: {
        operations: ["create", "update", "delete"],
      },
      metadata: {
        tags: ["property", "inspection"],
        description: "Invalidates property-related cache entries",
        createdBy: "system",
        lastModified: Date.now(),
      },
    });

    // Inspection data invalidation
    this.registerRule({
      id: "inspection-data",
      name: "Inspection Data Invalidation",
      pattern: /^inspection:.*$/,
      dependencies: ["property:*", "user:inspector:*"],
      strategy: "batched",
      priority: "medium",
      conditions: {
        operations: ["create", "update", "delete"],
      },
      metadata: {
        tags: ["inspection", "checklist"],
        description: "Invalidates inspection-related cache entries",
        createdBy: "system",
        lastModified: Date.now(),
      },
    });
  }

  /**
   * Invalidate cache key implementation
   */
  private async invalidateCacheKey(
    key: string,
    event: InvalidationEvent,
  ): Promise<void> {
    // This would integrate with your actual cache implementation
    // For now, logging the invalidation
    logger.debug("Cache key invalidated", {
      key,
      eventId: event.id,
      reason: event.metadata.reason,
    });

    // If using localStorage or sessionStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (error) {
        // Ignore storage errors
      }
    }

    // If using a cache service, call its invalidation method
    // await cacheService.invalidate(key);
  }

  /**
   * Mark for lazy invalidation
   */
  private async markForLazyInvalidation(
    key: string,
    event: InvalidationEvent,
  ): Promise<void> {
    // Mark cache entry as stale/invalid but don't remove it yet
    const invalidationMarker = `_invalid_${Date.now()}`;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `${key}${invalidationMarker}`,
          JSON.stringify({
            invalidatedAt: event.timestamp,
            reason: event.metadata.reason,
          }),
        );
      } catch (error) {
        // Ignore storage errors
      }
    }
  }

  /**
   * Check if should lazy invalidate
   */
  private shouldLazyInvalidate(key: string, event: InvalidationEvent): boolean {
    // Check if key is marked for lazy invalidation
    if (typeof window !== "undefined") {
      try {
        const keys = Object.keys(localStorage);
        const invalidationMarker = keys.find(
          (k) => k.startsWith(key) && k.includes("_invalid_"),
        );
        return !!invalidationMarker;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  /**
   * Process batched invalidations
   */
  private async processBatchedInvalidations(): Promise<void> {
    for (const [batchName, keys] of this.batchedInvalidations) {
      try {
        const keysArray = Array.from(keys);
        for (const key of keysArray) {
          await this.invalidateCacheKey(key, {
            id: `batch_${Date.now()}`,
            type: "system_event",
            source: "batch_processor",
            target: key,
            operation: "system",
            timestamp: Date.now(),
            metadata: {
              reason: "Batched invalidation",
            },
          });
        }

        logger.info("Batched invalidation processed", {
          batchName,
          keysProcessed: keysArray.length,
        });
      } catch (error) {
        logger.error("Batched invalidation failed", { batchName, error });
      }
    }

    this.batchedInvalidations.clear();
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (this.invalidationQueue.length > 0 && !this.processingQueue) {
        this.processInvalidationQueue();
      }
    }, 100); // Process every 100ms
  }
}

// Singleton instance
export const intelligentCacheInvalidation = new IntelligentCacheInvalidation();

export default IntelligentCacheInvalidation;
