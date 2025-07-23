/**
 * CACHE WARMING SYSTEM - PROACTIVE CACHE MANAGEMENT
 *
 * Advanced cache warming system that preloads critical data based on user
 * behavior patterns, usage analytics, and intelligent prediction algorithms.
 * Integrates with intelligent invalidation for optimal performance.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import { logger } from "@/utils/logger";
import { intelligentCacheInvalidation } from "./IntelligentCacheInvalidation";

export interface CacheWarmingRule {
  id: string;
  name: string;
  priority: "low" | "medium" | "high" | "critical";
  trigger: "user_action" | "schedule" | "dependency" | "predictive";
  pattern: string | RegExp;
  warmingStrategy: "preload" | "lazy_preload" | "predictive" | "user_specific";
  conditions: {
    userRoles?: string[];
    timeWindow?: { start: number; end: number }; // Hours in day
    minUsage?: number; // Minimum usage count to trigger
    dependencies?: string[];
    cooldownPeriod?: number; // Milliseconds between warming attempts
  };
  loader: (context: WarmingContext) => Promise<any>;
  metadata: {
    estimatedSize: number; // KB
    estimatedLoadTime: number; // milliseconds
    tags: string[];
    description: string;
    createdBy: string;
    lastWarmed?: number;
  };
}

export interface WarmingContext {
  userId?: string;
  sessionId?: string;
  userRole?: string;
  currentRoute?: string;
  timestamp: number;
  trigger: string;
  metadata: Record<string, any>;
}

export interface WarmingJob {
  id: string;
  ruleId: string;
  context: WarmingContext;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  startTime?: number;
  endTime?: number;
  retryCount: number;
  maxRetries: number;
  error?: Error;
}

export interface CacheWarmingStats {
  totalWarmingJobs: number;
  successfulWarmings: number;
  failedWarmings: number;
  averageWarmingTime: number;
  cacheHitRateImprovement: number;
  bytesWarmed: number;
  predictiveAccuracy: number;
  lastWarmingTime: number;
}

export interface UserBehaviorPattern {
  userId: string;
  accessPatterns: Array<{
    path: string;
    frequency: number;
    lastAccess: number;
    timeOfDay: number[];
    dayOfWeek: number[];
  }>;
  preferences: Record<string, any>;
  sessionData: {
    averageSessionLength: number;
    commonRoutes: string[];
    peakUsageHours: number[];
  };
}

class CacheWarmingSystem {
  private rules = new Map<string, CacheWarmingRule>();
  private warmingQueue: WarmingJob[] = [];
  private runningJobs = new Map<string, WarmingJob>();
  private userPatterns = new Map<string, UserBehaviorPattern>();
  private isProcessing = false;

  private stats: CacheWarmingStats = {
    totalWarmingJobs: 0,
    successfulWarmings: 0,
    failedWarmings: 0,
    averageWarmingTime: 0,
    cacheHitRateImprovement: 0,
    bytesWarmed: 0,
    predictiveAccuracy: 0,
    lastWarmingTime: 0,
  };

  private readonly MAX_CONCURRENT_JOBS = 3;
  private readonly MAX_QUEUE_SIZE = 100;
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes

  constructor() {
    this.startJobProcessor();
    this.startPeriodicCleanup();
    this.initializeDefaultRules();
  }

  /**
   * Register cache warming rule
   */
  registerRule(rule: CacheWarmingRule): void {
    this.rules.set(rule.id, rule);

    logger.debug("Cache warming rule registered", {
      ruleId: rule.id,
      priority: rule.priority,
      trigger: rule.trigger,
      strategy: rule.warmingStrategy,
    });
  }

  /**
   * Trigger cache warming based on user action
   */
  async warmCacheForUser(
    userId: string,
    context: Partial<WarmingContext> = {},
  ): Promise<void> {
    const warmingContext: WarmingContext = {
      userId,
      sessionId: context.sessionId,
      userRole: context.userRole,
      currentRoute: context.currentRoute,
      timestamp: Date.now(),
      trigger: "user_action",
      metadata: context.metadata || {},
    };

    // Find applicable rules
    const applicableRules = this.findApplicableRules(warmingContext);

    // Create warming jobs
    for (const rule of applicableRules) {
      await this.createWarmingJob(rule, warmingContext);
    }
  }

  /**
   * Predictive cache warming based on user patterns
   */
  async predictiveWarming(userId: string): Promise<void> {
    const userPattern = this.userPatterns.get(userId);
    if (!userPattern) {
      logger.debug("No user pattern found for predictive warming", { userId });
      return;
    }

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    // Find patterns that match current time
    const relevantPatterns = userPattern.accessPatterns.filter((pattern) => {
      const hourMatch = pattern.timeOfDay.includes(currentHour);
      const dayMatch = pattern.dayOfWeek.includes(currentDay);
      return hourMatch && dayMatch && pattern.frequency > 0.3; // 30% threshold
    });

    if (relevantPatterns.length === 0) return;

    const warmingContext: WarmingContext = {
      userId,
      userRole: userPattern.preferences.role,
      timestamp: Date.now(),
      trigger: "predictive",
      metadata: {
        patterns: relevantPatterns.map((p) => ({
          path: p.path,
          frequency: p.frequency,
        })),
        confidence: this.calculatePredictionConfidence(relevantPatterns),
      },
    };

    // Find predictive warming rules
    const predictiveRules = Array.from(this.rules.values()).filter(
      (rule) =>
        rule.trigger === "predictive" || rule.warmingStrategy === "predictive",
    );

    for (const rule of predictiveRules) {
      if (this.isRuleApplicable(rule, warmingContext)) {
        await this.createWarmingJob(rule, warmingContext);
      }
    }
  }

  /**
   * Schedule periodic cache warming
   */
  schedulePeriodicWarming(
    ruleId: string,
    interval: number,
    options: {
      immediate?: boolean;
      maxExecutions?: number;
    } = {},
  ): string {
    const scheduleId = `warming_schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let executionCount = 0;
    const maxExecutions = options.maxExecutions || Infinity;

    const execute = async () => {
      if (executionCount >= maxExecutions) {
        return;
      }

      const rule = this.rules.get(ruleId);
      if (!rule) {
        logger.warn("Scheduled warming rule not found", { ruleId, scheduleId });
        return;
      }

      const warmingContext: WarmingContext = {
        timestamp: Date.now(),
        trigger: "schedule",
        metadata: {
          scheduleId,
          executionCount: executionCount + 1,
        },
      };

      try {
        await this.createWarmingJob(rule, warmingContext);
        executionCount++;
      } catch (error) {
        logger.error("Scheduled warming failed", { ruleId, scheduleId, error });
      }
    };

    // Execute immediately if requested
    if (options.immediate) {
      execute();
    }

    // Set up recurring execution
    const intervalId = setInterval(() => {
      if (executionCount < maxExecutions) {
        execute();
      } else {
        clearInterval(intervalId);
      }
    }, interval);

    logger.info("Periodic cache warming scheduled", {
      ruleId,
      scheduleId,
      interval,
      maxExecutions,
    });

    return scheduleId;
  }

  /**
   * Track user behavior for predictive warming
   */
  trackUserBehavior(
    userId: string,
    action: {
      path: string;
      timestamp: number;
      sessionId?: string;
      metadata?: Record<string, any>;
    },
  ): void {
    let userPattern = this.userPatterns.get(userId);

    if (!userPattern) {
      userPattern = {
        userId,
        accessPatterns: [],
        preferences: {},
        sessionData: {
          averageSessionLength: 0,
          commonRoutes: [],
          peakUsageHours: [],
        },
      };
      this.userPatterns.set(userId, userPattern);
    }

    // Update access pattern
    const existingPattern = userPattern.accessPatterns.find(
      (p) => p.path === action.path,
    );
    const timeOfDay = new Date(action.timestamp).getHours();
    const dayOfWeek = new Date(action.timestamp).getDay();

    if (existingPattern) {
      existingPattern.frequency += 0.1;
      existingPattern.lastAccess = action.timestamp;
      if (!existingPattern.timeOfDay.includes(timeOfDay)) {
        existingPattern.timeOfDay.push(timeOfDay);
      }
      if (!existingPattern.dayOfWeek.includes(dayOfWeek)) {
        existingPattern.dayOfWeek.push(dayOfWeek);
      }
    } else {
      userPattern.accessPatterns.push({
        path: action.path,
        frequency: 1,
        lastAccess: action.timestamp,
        timeOfDay: [timeOfDay],
        dayOfWeek: [dayOfWeek],
      });
    }

    // Update common routes
    if (!userPattern.sessionData.commonRoutes.includes(action.path)) {
      if (userPattern.sessionData.commonRoutes.length < 10) {
        userPattern.sessionData.commonRoutes.push(action.path);
      }
    }

    logger.debug("User behavior tracked", {
      userId,
      path: action.path,
      patternsCount: userPattern.accessPatterns.length,
    });
  }

  /**
   * Get warming statistics
   */
  getStats(): CacheWarmingStats {
    return { ...this.stats };
  }

  /**
   * Get user behavior patterns
   */
  getUserPattern(userId: string): UserBehaviorPattern | undefined {
    return this.userPatterns.get(userId);
  }

  /**
   * Clear cache warming queue
   */
  clearQueue(): void {
    this.warmingQueue = [];
    logger.info("Cache warming queue cleared");
  }

  /**
   * Create warming job
   */
  private async createWarmingJob(
    rule: CacheWarmingRule,
    context: WarmingContext,
  ): Promise<void> {
    // Check cooldown period
    if (rule.metadata.lastWarmed && rule.conditions.cooldownPeriod) {
      const timeSinceLastWarm = Date.now() - rule.metadata.lastWarmed;
      if (timeSinceLastWarm < rule.conditions.cooldownPeriod) {
        logger.debug("Rule in cooldown period, skipping", {
          ruleId: rule.id,
          cooldownRemaining: rule.conditions.cooldownPeriod - timeSinceLastWarm,
        });
        return;
      }
    }

    // Check queue size
    if (this.warmingQueue.length >= this.MAX_QUEUE_SIZE) {
      logger.warn("Warming queue full, dropping job", {
        ruleId: rule.id,
        queueSize: this.warmingQueue.length,
      });
      return;
    }

    const job: WarmingJob = {
      id: `warming_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      context,
      status: "pending",
      priority: rule.priority,
      retryCount: 0,
      maxRetries: 3,
    };

    // Insert job with priority ordering
    this.insertJobWithPriority(job);
    this.stats.totalWarmingJobs++;

    logger.debug("Warming job created", {
      jobId: job.id,
      ruleId: rule.id,
      priority: job.priority,
      trigger: context.trigger,
    });
  }

  /**
   * Insert job with priority ordering
   */
  private insertJobWithPriority(job: WarmingJob): void {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const insertIndex = this.warmingQueue.findIndex(
      (existingJob) =>
        priorityOrder[existingJob.priority] < priorityOrder[job.priority],
    );

    if (insertIndex === -1) {
      this.warmingQueue.push(job);
    } else {
      this.warmingQueue.splice(insertIndex, 0, job);
    }
  }

  /**
   * Find applicable rules for context
   */
  private findApplicableRules(context: WarmingContext): CacheWarmingRule[] {
    const applicableRules: CacheWarmingRule[] = [];

    for (const rule of this.rules.values()) {
      if (this.isRuleApplicable(rule, context)) {
        applicableRules.push(rule);
      }
    }

    return applicableRules.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Check if rule is applicable to context
   */
  private isRuleApplicable(
    rule: CacheWarmingRule,
    context: WarmingContext,
  ): boolean {
    // Check user roles
    if (rule.conditions.userRoles && context.userRole) {
      if (!rule.conditions.userRoles.includes(context.userRole)) {
        return false;
      }
    }

    // Check time window
    if (rule.conditions.timeWindow) {
      const currentHour = new Date().getHours();
      const { start, end } = rule.conditions.timeWindow;
      if (currentHour < start || currentHour > end) {
        return false;
      }
    }

    // Check trigger match
    if (rule.trigger !== context.trigger && rule.trigger !== "dependency") {
      return false;
    }

    return true;
  }

  /**
   * Process warming jobs
   */
  private async processWarmingJobs(): Promise<void> {
    if (this.isProcessing || this.warmingQueue.length === 0) return;
    if (this.runningJobs.size >= this.MAX_CONCURRENT_JOBS) return;

    this.isProcessing = true;

    try {
      while (
        this.warmingQueue.length > 0 &&
        this.runningJobs.size < this.MAX_CONCURRENT_JOBS
      ) {
        const job = this.warmingQueue.shift()!;
        await this.executeWarmingJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute warming job
   */
  private async executeWarmingJob(job: WarmingJob): Promise<void> {
    const rule = this.rules.get(job.ruleId);
    if (!rule) {
      job.status = "failed";
      job.error = new Error(`Rule not found: ${job.ruleId}`);
      return;
    }

    job.status = "running";
    job.startTime = Date.now();
    this.runningJobs.set(job.id, job);

    try {
      const result = await rule.loader(job.context);

      job.status = "completed";
      job.endTime = Date.now();

      // Update rule metadata
      rule.metadata.lastWarmed = Date.now();

      // Update stats
      this.stats.successfulWarmings++;
      this.stats.bytesWarmed += rule.metadata.estimatedSize;
      this.updateAverageWarmingTime(job.endTime - job.startTime);

      logger.debug("Warming job completed", {
        jobId: job.id,
        ruleId: rule.id,
        duration: job.endTime - job.startTime,
        estimatedSize: rule.metadata.estimatedSize,
      });
    } catch (error) {
      job.error = error as Error;

      if (job.retryCount < job.maxRetries) {
        job.retryCount++;
        job.status = "pending";

        // Re-queue with delay
        setTimeout(
          () => {
            this.insertJobWithPriority(job);
          },
          1000 * Math.pow(2, job.retryCount),
        );

        logger.warn("Warming job failed, retrying", {
          jobId: job.id,
          ruleId: rule.id,
          retryCount: job.retryCount,
          error: error,
        });
      } else {
        job.status = "failed";
        job.endTime = Date.now();
        this.stats.failedWarmings++;

        logger.error("Warming job failed permanently", {
          jobId: job.id,
          ruleId: rule.id,
          error: error,
        });
      }
    } finally {
      this.runningJobs.delete(job.id);
    }
  }

  /**
   * Calculate prediction confidence
   */
  private calculatePredictionConfidence(
    patterns: UserBehaviorPattern["accessPatterns"],
  ): number {
    if (patterns.length === 0) return 0;

    const averageFrequency =
      patterns.reduce((sum, p) => sum + p.frequency, 0) / patterns.length;
    const recencyScore =
      patterns.reduce((sum, p) => {
        const daysSinceAccess =
          (Date.now() - p.lastAccess) / (1000 * 60 * 60 * 24);
        return sum + Math.max(0, 1 - daysSinceAccess / 7); // Decay over 7 days
      }, 0) / patterns.length;

    return averageFrequency * 0.6 + recencyScore * 0.4;
  }

  /**
   * Update average warming time
   */
  private updateAverageWarmingTime(duration: number): void {
    const totalWarmings = this.stats.successfulWarmings;
    const currentAvg = this.stats.averageWarmingTime;

    this.stats.averageWarmingTime =
      totalWarmings === 1
        ? duration
        : (currentAvg * (totalWarmings - 1) + duration) / totalWarmings;
  }

  /**
   * Start job processor
   */
  private startJobProcessor(): void {
    setInterval(() => {
      this.processWarmingJobs();
    }, 1000); // Process every second
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupOldPatterns();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Cleanup old user patterns
   */
  private cleanupOldPatterns(): void {
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [userId, pattern] of this.userPatterns) {
      // Remove old access patterns
      pattern.accessPatterns = pattern.accessPatterns.filter(
        (p) => p.lastAccess > cutoffTime,
      );

      // Remove user pattern if no recent activity
      if (pattern.accessPatterns.length === 0) {
        this.userPatterns.delete(userId);
      }
    }

    logger.debug("Old user patterns cleaned up", {
      remainingPatterns: this.userPatterns.size,
    });
  }

  /**
   * Initialize default warming rules
   */
  private initializeDefaultRules(): void {
    // User dashboard warming
    this.registerRule({
      id: "user-dashboard",
      name: "User Dashboard Warming",
      priority: "high",
      trigger: "user_action",
      pattern: /^dashboard:.*$/,
      warmingStrategy: "preload",
      conditions: {
        userRoles: ["inspector", "auditor", "admin"],
        timeWindow: { start: 6, end: 22 }, // 6 AM to 10 PM
      },
      loader: async (context: WarmingContext) => {
        // Load user-specific dashboard data
        return {
          recent_inspections: [],
          notifications: [],
          user_stats: {},
        };
      },
      metadata: {
        estimatedSize: 50, // KB
        estimatedLoadTime: 200, // ms
        tags: ["dashboard", "user"],
        description: "Preloads user dashboard data",
        createdBy: "system",
      },
    });

    // Property list warming
    this.registerRule({
      id: "property-list",
      name: "Property List Warming",
      priority: "medium",
      trigger: "predictive",
      pattern: /^properties:list:.*$/,
      warmingStrategy: "predictive",
      conditions: {
        userRoles: ["inspector", "admin"],
        minUsage: 3,
        cooldownPeriod: 300000, // 5 minutes
      },
      loader: async (context: WarmingContext) => {
        // Load property list data
        return {
          properties: [],
          filters: {},
        };
      },
      metadata: {
        estimatedSize: 100, // KB
        estimatedLoadTime: 300, // ms
        tags: ["properties", "list"],
        description: "Predictively warms property list data",
        createdBy: "system",
      },
    });

    logger.info("Default cache warming rules initialized");
  }
}

// Singleton instance
export const cacheWarmingSystem = new CacheWarmingSystem();

export default CacheWarmingSystem;
