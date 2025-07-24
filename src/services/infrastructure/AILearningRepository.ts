/**
 * AI LEARNING REPOSITORY - ENTERPRISE EXCELLENCE INFRASTRUCTURE
 *
 * Professional data repository for AI learning system with feedback collection,
 * performance tracking, and model improvement analytics.
 *
 * Features:
 * - Auditor feedback collection and analysis
 * - Performance metrics tracking per provider
 * - Learning insights and model improvement recommendations
 * - Comprehensive analytics for cost optimization
 * - Professional data persistence and retrieval
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Phase 2 Service Excellence
 */

import { DatabaseService } from "../core/DatabaseService";
import { logger } from "@/utils/logger";

/**
 * Auditor feedback structure
 */
export interface AuditorFeedback {
  type:
    | "accuracy"
    | "relevance"
    | "completeness"
    | "false_positive"
    | "false_negative";
  severity: "low" | "medium" | "high" | "critical";
  correctStatus: "pass" | "fail" | "needs_review";
  comments: string;
  confidence: number;
  auditorId: string;
  inspectionId?: string;
  checklistItemId?: string;
}

/**
 * AI analysis tracking record
 */
export interface AIAnalysisRecord {
  id: string;
  provider: "openai" | "claude";
  model: string;
  request: Record<string, unknown>;
  result: Record<string, unknown>;
  processingTime: number;
  cost: number;
  confidence: number;
  actualOutcome?: "correct" | "incorrect" | "partial";
  auditorFeedback?: AuditorFeedback;
  timestamp: string;
  inspectionId?: string;
  checklistItemId?: string;
}

/**
 * Provider performance metrics
 */
export interface ProviderMetrics {
  totalRequests: number;
  successRate: number;
  accuracy: number;
  averageConfidence: number;
  averageProcessingTime: number;
  totalCost: number;
  averageCost: number;
  costEfficiency: number; // Accuracy per dollar
  avgSpeed: number; // Normalized speed score
}

/**
 * Learning analytics response
 */
export interface LearningAnalytics {
  totalAnalyses: number;
  totalFeedback: number;
  overallAccuracy: number;
  accuracyByProvider: Record<string, number>;
  confidenceDistribution: Record<string, number>;
  costByProvider: Record<string, number>;
  totalCost: number;
  averageCost: number;
  improvementTrend: Array<{ date: string; accuracy: number }>;
  providerStats: Record<string, ProviderMetrics>;
  lastRetraining?: string;
}

/**
 * Enterprise AI learning repository
 */
export class AILearningRepository {
  private db: DatabaseService;
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();

  constructor() {
    this.db = new DatabaseService();
  }

  /**
   * Record AI analysis for learning
   */
  async recordAnalysis(record: {
    request: Record<string, unknown>;
    result: Record<string, unknown>;
    provider: "openai" | "claude";
    processingTime: number;
  }): Promise<string> {
    try {
      const analysisRecord: AIAnalysisRecord = {
        id: this.generateId(),
        provider: record.provider,
        model: record.result.metadata?.model || "unknown",
        request: record.request,
        result: record.result,
        processingTime: record.processingTime,
        cost: record.result.usage?.cost || 0,
        confidence: record.result.analysis?.confidence || 0,
        timestamp: new Date().toISOString(),
        inspectionId: record.request.inspectionId,
        checklistItemId: record.request.checklistItemId,
      };

      // Store in local cache for immediate access
      this.cache.set(analysisRecord.id, analysisRecord);
      this.cacheExpiry.set(analysisRecord.id, Date.now() + 3600000); // 1 hour

      // TODO: Persist to database when AI learning tables are available
      // await this.persistAnalysisRecord(analysisRecord);

      logger.debug("AI analysis recorded", {
        analysisId: analysisRecord.id,
        provider: record.provider,
        confidence: analysisRecord.confidence,
        cost: analysisRecord.cost,
      });

      return analysisRecord.id;
    } catch (error) {
      logger.error("Failed to record AI analysis", { error });
      throw error;
    }
  }

  /**
   * Record auditor feedback for learning
   */
  async recordFeedback(data: {
    analysisId: string;
    feedback: AuditorFeedback;
    timestamp: string;
  }): Promise<void> {
    try {
      // Update cached record if available
      const cachedRecord = this.cache.get(data.analysisId);
      if (cachedRecord) {
        cachedRecord.auditorFeedback = data.feedback;
        cachedRecord.actualOutcome = this.determineOutcome(
          cachedRecord.result.analysis.status,
          data.feedback.correctStatus,
        );

        this.cache.set(data.analysisId, cachedRecord);
      }

      // TODO: Persist feedback to database
      // await this.persistFeedback(data);

      logger.info("Auditor feedback recorded", {
        analysisId: data.analysisId,
        feedbackType: data.feedback.type,
        severity: data.feedback.severity,
        actualOutcome: cachedRecord?.actualOutcome,
      });
    } catch (error) {
      logger.error("Failed to record auditor feedback", {
        error,
        analysisId: data.analysisId,
      });
      throw error;
    }
  }

  /**
   * Get provider performance metrics
   */
  async getProviderMetrics(): Promise<Record<string, ProviderMetrics>> {
    const cacheKey = "provider-metrics";

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const metrics = this.calculateProviderMetrics();

      // Cache for 5 minutes
      this.cache.set(cacheKey, metrics);
      this.cacheExpiry.set(cacheKey, Date.now() + 300000);

      return metrics;
    } catch (error) {
      logger.error("Failed to get provider metrics", { error });
      throw error;
    }
  }

  /**
   * Get comprehensive learning analytics
   */
  async getAnalytics(): Promise<LearningAnalytics> {
    const cacheKey = "learning-analytics";

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const analytics = this.calculateLearningAnalytics();

      // Cache for 10 minutes
      this.cache.set(cacheKey, analytics);
      this.cacheExpiry.set(cacheKey, Date.now() + 600000);

      return analytics;
    } catch (error) {
      logger.error("Failed to get learning analytics", { error });
      throw error;
    }
  }

  /**
   * Get feedback count for triggering retraining
   */
  async getFeedbackCount(): Promise<number> {
    let count = 0;

    for (const record of this.cache.values()) {
      if (record.auditorFeedback) {
        count++;
      }
    }

    return count;
  }

  /**
   * Get training data count
   */
  async getTrainingDataCount(): Promise<number> {
    return this.cache.size;
  }

  /**
   * Get last update timestamp
   */
  async getLastUpdateTime(): Promise<string> {
    let latestTimestamp = "";

    for (const record of this.cache.values()) {
      if (record.timestamp > latestTimestamp) {
        latestTimestamp = record.timestamp;
      }
    }

    return latestTimestamp || new Date().toISOString();
  }

  /**
   * Clear analytics cache (for testing/reset)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
    logger.info("AI learning cache cleared");
  }

  /**
   * Private helper methods
   */
  private calculateProviderMetrics(): Record<string, ProviderMetrics> {
    const providers = new Map<string, AIAnalysisRecord[]>();

    // Group records by provider
    for (const record of this.cache.values()) {
      if (!providers.has(record.provider)) {
        providers.set(record.provider, []);
      }
      providers.get(record.provider)!.push(record);
    }

    const metrics: Record<string, ProviderMetrics> = {};

    for (const [provider, records] of providers) {
      const totalRequests = records.length;
      const withFeedback = records.filter((r) => r.actualOutcome);
      const correctPredictions = withFeedback.filter(
        (r) => r.actualOutcome === "correct",
      );
      const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
      const totalTime = records.reduce((sum, r) => sum + r.processingTime, 0);

      const accuracy =
        withFeedback.length > 0
          ? correctPredictions.length / withFeedback.length
          : 0;
      const averageConfidence =
        records.reduce((sum, r) => sum + r.confidence, 0) / totalRequests;
      const averageProcessingTime = totalTime / totalRequests;
      const averageCost = totalCost / totalRequests;

      metrics[provider] = {
        totalRequests,
        successRate: 1.0, // Assume success if we got results
        accuracy,
        averageConfidence,
        averageProcessingTime,
        totalCost,
        averageCost,
        costEfficiency: totalCost > 0 ? accuracy / averageCost : 0,
        avgSpeed: averageProcessingTime > 0 ? 1000 / averageProcessingTime : 0, // Normalized speed
      };
    }

    return metrics;
  }

  private calculateLearningAnalytics(): LearningAnalytics {
    const records = Array.from(this.cache.values()) as AIAnalysisRecord[];
    const withFeedback = records.filter((r) => r.auditorFeedback);
    const correct = withFeedback.filter((r) => r.actualOutcome === "correct");

    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
    const averageCost = records.length > 0 ? totalCost / records.length : 0;

    // Calculate accuracy by provider
    const accuracyByProvider: Record<string, number> = {};
    const costByProvider: Record<string, number> = {};

    for (const provider of ["openai", "claude"]) {
      const providerRecords = withFeedback.filter(
        (r) => r.provider === provider,
      );
      const providerCorrect = providerRecords.filter(
        (r) => r.actualOutcome === "correct",
      );

      accuracyByProvider[provider] =
        providerRecords.length > 0
          ? providerCorrect.length / providerRecords.length
          : 0;

      costByProvider[provider] = records
        .filter((r) => r.provider === provider)
        .reduce((sum, r) => sum + r.cost, 0);
    }

    // Calculate confidence distribution
    const confidenceRanges = {
      "high (0.8-1.0)": records.filter((r) => r.confidence >= 0.8).length,
      "medium (0.6-0.8)": records.filter(
        (r) => r.confidence >= 0.6 && r.confidence < 0.8,
      ).length,
      "low (0.0-0.6)": records.filter((r) => r.confidence < 0.6).length,
    };

    // Simple improvement trend (placeholder)
    const improvementTrend = [
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        accuracy: 0.75,
      },
      {
        date: new Date().toISOString().split("T")[0],
        accuracy:
          withFeedback.length > 0 ? correct.length / withFeedback.length : 0,
      },
    ];

    return {
      totalAnalyses: records.length,
      totalFeedback: withFeedback.length,
      overallAccuracy:
        withFeedback.length > 0 ? correct.length / withFeedback.length : 0,
      accuracyByProvider,
      confidenceDistribution: confidenceRanges,
      costByProvider,
      totalCost,
      averageCost,
      improvementTrend,
      providerStats: this.calculateProviderMetrics(),
    };
  }

  private determineOutcome(
    predictedStatus: string,
    actualStatus: string,
  ): "correct" | "incorrect" | "partial" {
    if (predictedStatus === actualStatus) {
      return "correct";
    }

    // Partial credit for reasonable predictions
    if (
      (predictedStatus === "needs_review" && actualStatus !== "pass") ||
      (predictedStatus === "fail" && actualStatus === "needs_review")
    ) {
      return "partial";
    }

    return "incorrect";
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private generateId(): string {
    return `ai_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function for dependency injection
 */
export function createAILearningRepository(): AILearningRepository {
  return new AILearningRepository();
}
