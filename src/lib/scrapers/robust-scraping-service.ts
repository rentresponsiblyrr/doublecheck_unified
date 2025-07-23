// Robust VRBO Scraping Service with Automatic Retries and Background Processing
// Takes full responsibility for making scraping work reliably

import { VRBOScraper } from "./vrbo-scraper";
import { SimpleVRBOScraper } from "./simple-vrbo-scraper";
import { VRBOURLValidator, URLValidationResult } from "./url-validator";
import { logger } from "../../utils/logger";
import { errorReporter } from "../monitoring/error-reporter";
import type { VRBOPropertyData, ScrapingResult, ScrapingError } from "./types";

export interface ScrapingJob {
  id: string;
  url: string;
  cleanedUrl: string;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "in_progress" | "completed" | "failed" | "retrying";
  createdAt: Date;
  lastAttemptAt?: Date;
  completedAt?: Date;
  result?: VRBOPropertyData;
  errors: ScrapingError[];
  priority: "high" | "medium" | "low";
  context?: {
    propertyId?: string;
    userId?: string;
    source:
      | "form_submission"
      | "inspection_start"
      | "manual_retry"
      | "background_sync";
  };
}

export interface ScrapingServiceConfig {
  maxRetries: number;
  initialRetryDelay: number;
  maxRetryDelay: number;
  backoffMultiplier: number;
  queueProcessingInterval: number;
  enableBackgroundProcessing: boolean;
  timeoutPerAttempt: number;
  userAgent: string;
}

export interface ScrapingServiceResult {
  success: boolean;
  data?: VRBOPropertyData;
  job?: ScrapingJob;
  urlValidation: URLValidationResult;
  message: string;
  canRetryLater: boolean;
}

export class RobustScrapingService {
  private static instance: RobustScrapingService;
  private config: ScrapingServiceConfig;
  private jobQueue: Map<string, ScrapingJob> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;
  private vrboScraper: VRBOScraper;
  private simpleScraper: SimpleVRBOScraper;

  private readonly DEFAULT_CONFIG: ScrapingServiceConfig = {
    maxRetries: 5,
    initialRetryDelay: 2000, // 2 seconds
    maxRetryDelay: 60000, // 1 minute
    backoffMultiplier: 2,
    queueProcessingInterval: 30000, // 30 seconds
    enableBackgroundProcessing: true,
    timeoutPerAttempt: 45000, // 45 seconds
    userAgent: "STR-Certified-Inspector/1.0 (Property Verification Bot)",
  };

  private constructor(config: Partial<ScrapingServiceConfig> = {}) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.vrboScraper = new VRBOScraper({
      timeout: this.config.timeoutPerAttempt,
      retries: 1, // We handle retries at service level
      userAgent: this.config.userAgent,
      respectRobotsTxt: true,
      rateLimit: 5, // Conservative rate limiting
      enableScreenshots: false,
    });

    this.simpleScraper = new SimpleVRBOScraper({
      timeout: this.config.timeoutPerAttempt,
      userAgent: this.config.userAgent,
      followRedirects: true,
      maxRetries: 1,
    });

    if (this.config.enableBackgroundProcessing) {
      this.startBackgroundProcessing();
    }
  }

  static getInstance(
    config?: Partial<ScrapingServiceConfig>,
  ): RobustScrapingService {
    if (!RobustScrapingService.instance) {
      RobustScrapingService.instance = new RobustScrapingService(config);
    }
    return RobustScrapingService.instance;
  }

  /**
   * Main entry point for scraping - handles everything automatically
   * @param url - Raw URL from user input
   * @param context - Context information for the scraping job
   * @returns Promise<ScrapingServiceResult>
   */
  async scrapeProperty(
    url: string,
    context: ScrapingJob["context"] = { source: "form_submission" },
  ): Promise<ScrapingServiceResult> {
    const jobId = this.generateJobId();

    try {
      // Step 1: Validate and clean URL
      const urlValidation = VRBOURLValidator.validateAndCleanURL(url);

      if (!urlValidation.isValid) {
        return {
          success: false,
          urlValidation,
          message: `Invalid VRBO URL: ${urlValidation.errors.join(", ")}`,
          canRetryLater: false,
        };
      }

      // Step 2: Check if we already have this property cached
      const existingJob = this.findExistingJob(urlValidation.cleanedUrl);
      if (
        existingJob &&
        existingJob.status === "completed" &&
        existingJob.result
      ) {
        logger.info(
          `Found cached scraping result for ${urlValidation.cleanedUrl}`,
          {},
          "ROBUST_SCRAPER",
        );
        return {
          success: true,
          data: existingJob.result,
          job: existingJob,
          urlValidation,
          message: "Retrieved from cache",
          canRetryLater: false,
        };
      }

      // Step 3: Create and queue scraping job
      const job: ScrapingJob = {
        id: jobId,
        url: url,
        cleanedUrl: urlValidation.cleanedUrl,
        attempts: 0,
        maxAttempts: this.config.maxRetries,
        status: "pending",
        createdAt: new Date(),
        errors: [],
        priority: context.source === "form_submission" ? "high" : "medium",
        context,
      };

      this.jobQueue.set(jobId, job);

      // Step 4: Attempt immediate scraping
      const immediateResult = await this.executeScrapingJob(job);

      if (immediateResult.success) {
        return {
          success: true,
          data: immediateResult.data!,
          job,
          urlValidation,
          message: "Successfully scraped property data",
          canRetryLater: false,
        };
      }

      // Step 5: If immediate scraping failed, queue for background processing
      if (job.attempts < job.maxAttempts) {
        job.status = "retrying";
        logger.info(
          `Queued job ${jobId} for background retry`,
          {
            attempts: job.attempts,
            maxAttempts: job.maxAttempts,
          },
          "ROBUST_SCRAPER",
        );

        return {
          success: false,
          job,
          urlValidation,
          message:
            "Initial scraping failed, will retry automatically in the background. You can continue creating the property.",
          canRetryLater: true,
        };
      }

      // Step 6: All attempts exhausted
      return {
        success: false,
        job,
        urlValidation,
        message: `Scraping failed after ${job.maxAttempts} attempts: ${job.errors.map((e) => e.message).join(", ")}`,
        canRetryLater: false,
      };
    } catch (error) {
      logger.error(
        `Scraping service error for job ${jobId}`,
        error,
        "ROBUST_SCRAPER",
      );
      return {
        success: false,
        urlValidation: {
          isValid: false,
          cleanedUrl: "",
          originalUrl: url,
          warnings: [],
          errors: [`System error: ${error}`],
          urlType: "invalid",
          extractedId: null,
        },
        message: `System error occurred. Please try again or contact support.`,
        canRetryLater: true,
      };
    }
  }

  /**
   * Execute a scraping job with proper error handling
   */
  private async executeScrapingJob(job: ScrapingJob): Promise<{
    success: boolean;
    data?: VRBOPropertyData;
    error?: ScrapingError;
  }> {
    job.attempts++;
    job.lastAttemptAt = new Date();
    job.status = "in_progress";

    logger.info(
      `Executing scraping job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`,
      {
        url: job.cleanedUrl,
        context: job.context,
      },
      "ROBUST_SCRAPER",
    );

    try {
      // Apply progressive timeout increases
      const timeoutForAttempt = Math.min(
        this.config.timeoutPerAttempt * job.attempts,
        this.config.maxRetryDelay,
      );

      let result: ScrapingResult<VRBOPropertyData>;
      let scrapeMethod = "comprehensive";

      // Strategy: Try comprehensive scraper first, then fallback to simple scraper
      if (job.attempts <= 2) {
        // First two attempts: use comprehensive scraper
        this.vrboScraper = new VRBOScraper({
          timeout: timeoutForAttempt,
          retries: 1,
          userAgent: this.config.userAgent,
          respectRobotsTxt: true,
          rateLimit: 5,
          enableScreenshots: false,
        });

        result = await this.vrboScraper.scrapePropertyDetails(job.cleanedUrl);
        scrapeMethod = "comprehensive";
      } else {
        // Later attempts: use simple scraper as fallback
        this.simpleScraper = new SimpleVRBOScraper({
          timeout: timeoutForAttempt,
          userAgent: this.config.userAgent,
          followRedirects: true,
          maxRetries: 1,
        });

        result = await this.simpleScraper.scrapePropertyDetails(job.cleanedUrl);
        scrapeMethod = "simple";
      }

      if (result.success && result.data) {
        job.status = "completed";
        job.completedAt = new Date();
        job.result = result.data;

        logger.info(
          `Successfully scraped property ${job.id} using ${scrapeMethod} scraper`,
          {
            url: job.cleanedUrl,
            attempts: job.attempts,
            method: scrapeMethod,
            title: result.data.title,
            completeness: result.metadata?.dataCompleteness || "unknown",
          },
          "ROBUST_SCRAPER",
        );

        return { success: true, data: result.data };
      } else {
        const error: ScrapingError = {
          code: "SCRAPING_FAILED",
          message: `${scrapeMethod} scraper failed: ${result.errors?.[0]?.message || "Scraping returned no data"}`,
          severity: "medium",
          recoverable: true,
          timestamp: new Date(),
          context: {
            attempt: job.attempts,
            url: job.cleanedUrl,
            method: scrapeMethod,
          },
        };

        job.errors.push(error);

        // If comprehensive scraper failed and we haven't tried simple scraper yet, mark as recoverable
        if (scrapeMethod === "comprehensive" && job.attempts < 3) {
          error.message += " (will try simple scraper next)";
        }

        return { success: false, error };
      }
    } catch (error) {
      const scrapingError: ScrapingError = {
        code: this.categorizeError(error),
        message: error instanceof Error ? error.message : "Unknown error",
        severity: this.getErrorSeverity(error),
        recoverable: this.isErrorRecoverable(error),
        timestamp: new Date(),
        context: {
          attempt: job.attempts,
          url: job.cleanedUrl,
          originalError: error,
        },
      };

      job.errors.push(scrapingError);

      logger.error(
        `Scraping attempt ${job.attempts} failed for job ${job.id}`,
        {
          error: scrapingError,
          url: job.cleanedUrl,
        },
        "ROBUST_SCRAPER",
      );

      return { success: false, error: scrapingError };
    }
  }

  /**
   * Background processing for retry queue
   */
  private startBackgroundProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processRetryQueue();
    }, this.config.queueProcessingInterval);

    logger.info(
      "Background scraping processing started",
      {
        interval: this.config.queueProcessingInterval,
      },
      "ROBUST_SCRAPER",
    );
  }

  /**
   * Process jobs in retry queue
   */
  private async processRetryQueue(): Promise<void> {
    const pendingJobs = Array.from(this.jobQueue.values())
      .filter(
        (job) => job.status === "retrying" && job.attempts < job.maxAttempts,
      )
      .sort((a, b) => {
        // Priority: high > medium > low, then by creation time
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    if (pendingJobs.length === 0) return;

    logger.info(
      `Processing ${pendingJobs.length} jobs in retry queue`,
      {},
      "ROBUST_SCRAPER",
    );

    // Process jobs one at a time to avoid overwhelming VRBO
    for (const job of pendingJobs.slice(0, 3)) {
      // Limit concurrent processing
      // Check if enough time has passed for retry
      const timeSinceLastAttempt = job.lastAttemptAt
        ? Date.now() - job.lastAttemptAt.getTime()
        : Date.now() - job.createdAt.getTime();

      const requiredDelay = this.calculateRetryDelay(job.attempts);

      if (timeSinceLastAttempt >= requiredDelay) {
        await this.executeScrapingJob(job);

        // If job failed and exhausted attempts, mark as failed
        if (job.attempts >= job.maxAttempts && job.status !== "completed") {
          job.status = "failed";
          logger.warn(
            `Job ${job.id} failed after ${job.maxAttempts} attempts`,
            {
              url: job.cleanedUrl,
              errors: job.errors.length,
            },
            "ROBUST_SCRAPER",
          );
        }

        // Add delay between jobs to be respectful
        await this.sleep(2000);
      }
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attempts: number): number {
    const delay =
      this.config.initialRetryDelay *
      Math.pow(this.config.backoffMultiplier, attempts - 1);
    return Math.min(delay, this.config.maxRetryDelay);
  }

  /**
   * Error categorization for better handling
   */
  private categorizeError(error: Error | unknown): string {
    if (error?.message?.includes("timeout")) return "TIMEOUT_ERROR";
    if (error?.message?.includes("rate limit")) return "RATE_LIMIT_ERROR";
    if (error?.message?.includes("403") || error?.message?.includes("blocked"))
      return "ACCESS_DENIED_ERROR";
    if (
      error?.message?.includes("404") ||
      error?.message?.includes("not found")
    )
      return "PROPERTY_NOT_FOUND_ERROR";
    if (
      error?.message?.includes("network") ||
      error?.message?.includes("connection")
    )
      return "NETWORK_ERROR";
    return "UNKNOWN_ERROR";
  }

  /**
   * Determine error severity
   */
  private getErrorSeverity(error: Error | unknown): "low" | "medium" | "high" {
    const errorCode = this.categorizeError(error);
    switch (errorCode) {
      case "PROPERTY_NOT_FOUND_ERROR":
        return "high"; // Don't retry
      case "ACCESS_DENIED_ERROR":
        return "high"; // May need different approach
      case "RATE_LIMIT_ERROR":
        return "medium"; // Retry with backoff
      case "TIMEOUT_ERROR":
        return "medium"; // Retry with longer timeout
      case "NETWORK_ERROR":
        return "low"; // Retry quickly
      default:
        return "medium";
    }
  }

  /**
   * Determine if error is recoverable
   */
  private isErrorRecoverable(error: Error | unknown): boolean {
    const errorCode = this.categorizeError(error);
    switch (errorCode) {
      case "PROPERTY_NOT_FOUND_ERROR":
        return false; // Invalid property ID
      case "ACCESS_DENIED_ERROR":
        return false; // May need different user agent/approach
      default:
        return true; // Most errors are worth retrying
    }
  }

  /**
   * Find existing job for URL
   */
  private findExistingJob(cleanedUrl: string): ScrapingJob | undefined {
    return Array.from(this.jobQueue.values()).find(
      (job) => job.cleanedUrl === cleanedUrl,
    );
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `scrape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): ScrapingJob | undefined {
    return this.jobQueue.get(jobId);
  }

  /**
   * Get all jobs for monitoring
   */
  getAllJobs(): ScrapingJob[] {
    return Array.from(this.jobQueue.values());
  }

  /**
   * Retry a failed job manually
   */
  async retryJob(jobId: string): Promise<ScrapingServiceResult> {
    const job = this.jobQueue.get(jobId);
    if (!job) {
      return {
        success: false,
        urlValidation: {
          isValid: false,
          cleanedUrl: "",
          originalUrl: "",
          warnings: [],
          errors: ["Job not found"],
          urlType: "invalid",
          extractedId: null,
        },
        message: "Job not found",
        canRetryLater: false,
      };
    }

    // Reset job for retry
    job.attempts = 0;
    job.status = "pending";
    job.errors = [];

    return this.scrapeProperty(job.url, {
      ...job.context,
      source: "manual_retry",
    });
  }

  /**
   * Clean up old completed jobs
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
    const toDelete: string[] = [];

    for (const [jobId, job] of this.jobQueue.entries()) {
      if (
        (job.status === "completed" || job.status === "failed") &&
        job.createdAt.getTime() < cutoffTime
      ) {
        toDelete.push(jobId);
      }
    }

    toDelete.forEach((jobId) => this.jobQueue.delete(jobId));

    if (toDelete.length > 0) {
      logger.info(
        `Cleaned up ${toDelete.length} old scraping jobs`,
        {},
        "ROBUST_SCRAPER",
      );
    }
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    logger.info("Robust scraping service shut down", {}, "ROBUST_SCRAPER");
  }
}

// Export singleton instance
export const robustScrapingService = RobustScrapingService.getInstance();

// Export convenience functions
export const scrapePropertyRobustly = (
  url: string,
  context?: ScrapingJob["context"],
) => robustScrapingService.scrapeProperty(url, context);

export const getScrapingJobStatus = (jobId: string) =>
  robustScrapingService.getJobStatus(jobId);

export const retryScrapingJob = (jobId: string) =>
  robustScrapingService.retryJob(jobId);
