// Feedback Processor for STR Certified AI Learning System
// Handles collection, validation, and categorization of auditor feedback

import type {
  AuditorFeedback,
  FeedbackCategory,
  FeedbackFormData,
  FeedbackItem,
  LearningPattern
} from '@/types/learning';

export class FeedbackProcessor {
  private validationRules: Map<FeedbackCategory, ValidationRule[]> = new Map();
  private feedbackQueue: FeedbackQueueItem[] = [];
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeValidationRules();
    this.startProcessingQueue();
  }

  /**
   * Collects feedback from auditor and prepares it for learning
   */
  async collectFeedback(
    formData: FeedbackFormData,
    auditorId: string,
    inspectionId: string
  ): Promise<AuditorFeedback[]> {
    const feedback: AuditorFeedback[] = [];

    for (const item of formData.feedbackItems) {
      // Validate feedback item
      const validation = await this.validateFeedbackItem(item);
      if (!validation.isValid) {
        continue;
      }

      // Create auditor feedback entry
      const auditorFeedback: AuditorFeedback = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inspectionId,
        auditorId,
        timestamp: new Date(),
        feedbackType: this.determineFeedbackType(item),
        category: item.type,
        aiPrediction: {
          value: item.aiValue,
          confidence: item.confidenceRating,
          modelVersion: 'v1.0.0' // Would come from actual model
        },
        auditorCorrection: {
          value: item.correctValue,
          confidence: 95, // Auditor corrections assumed high confidence
          reasoning: item.explanation || ''
        },
        context: await this.extractContext(item, inspectionId),
        learningMetadata: {
          processed: false,
          impactScore: this.calculateImpactScore(item),
          patterns: []
        }
      };

      feedback.push(auditorFeedback);
    }

    // Queue for processing
    this.queueFeedback(feedback);

    // Store feedback
    await this.storeFeedback(feedback);

    return feedback;
  }

  /**
   * Categorizes feedback by type, severity, and impact
   */
  async categorizeFeedback(
    feedback: AuditorFeedback[]
  ): Promise<Map<string, CategorizedFeedback>> {
    const categorized = new Map<string, CategorizedFeedback>();

    // Group by multiple dimensions
    const dimensions = {
      byCategory: this.groupByCategory(feedback),
      bySeverity: this.groupBySeverity(feedback),
      byPropertyType: this.groupByPropertyType(feedback),
      byConfidenceLevel: this.groupByConfidenceLevel(feedback)
    };

    // Create categorized views
    for (const [category, items] of dimensions.byCategory) {
      const categoryKey = `category_${category}`;
      categorized.set(categoryKey, {
        dimension: 'category',
        key: category,
        items,
        statistics: this.calculateStatistics(items),
        patterns: await this.detectPatterns(items),
        recommendations: this.generateRecommendations(items)
      });
    }

    // Add severity-based categorization
    for (const [severity, items] of dimensions.bySeverity) {
      const severityKey = `severity_${severity}`;
      categorized.set(severityKey, {
        dimension: 'severity',
        key: severity,
        items,
        statistics: this.calculateStatistics(items),
        patterns: await this.detectPatterns(items),
        recommendations: this.generateRecommendations(items)
      });
    }

    return categorized;
  }

  /**
   * Validates feedback for quality and completeness
   */
  async validateFeedback(feedback: AuditorFeedback): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!feedback.auditorCorrection.value) {
      errors.push('Auditor correction value is required');
    }

    // Check confidence levels
    if (feedback.auditorCorrection.confidence < 50) {
      warnings.push('Low confidence in auditor correction');
    }

    // Validate against category-specific rules
    const rules = this.validationRules.get(feedback.category) || [];
    for (const rule of rules) {
      const result = await rule.validate(feedback);
      if (!result.isValid) {
        errors.push(...result.errors);
      }
      warnings.push(...result.warnings);
    }

    // Check for consistency
    const consistency = await this.checkConsistency(feedback);
    if (!consistency.isConsistent) {
      warnings.push(consistency.reason);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateValidationScore(errors, warnings)
    };
  }

  /**
   * Analyzes feedback to identify patterns and trends
   */
  async analyzeFeedbackPatterns(
    feedback: AuditorFeedback[],
    timeWindow: number = 24 * 60 * 60 * 1000 // 24 hours
  ): Promise<FeedbackAnalysis> {
    const now = Date.now();
    const recentFeedback = feedback.filter(
      f => now - f.timestamp.getTime() < timeWindow
    );

    // Identify error patterns
    const errorPatterns = await this.findErrorPatterns(recentFeedback);

    // Calculate trend metrics
    const trends = this.calculateTrends(feedback);

    // Find correlations
    const correlations = await this.findCorrelations(recentFeedback);

    // Generate insights
    const insights = this.generateInsights(errorPatterns, trends, correlations);

    return {
      patterns: errorPatterns,
      trends,
      correlations,
      insights,
      summary: this.generateAnalysisSummary(recentFeedback)
    };
  }

  /**
   * Prioritizes feedback based on impact and learning value
   */
  prioritizeFeedback(feedback: AuditorFeedback[]): AuditorFeedback[] {
    return feedback.sort((a, b) => {
      // Priority factors
      const aPriority = this.calculatePriority(a);
      const bPriority = this.calculatePriority(b);
      
      return bPriority - aPriority;
    });
  }

  // Private helper methods

  private initializeValidationRules(): void {
    // Photo quality rules
    this.validationRules.set('photo_quality', [
      {
        name: 'resolution_check',
        validate: async (feedback) => {
          const value = feedback.auditorCorrection.value;
          if (typeof value === 'object' && 'resolution' in value) {
            const resolution = value.resolution;
            if (resolution < 1920 * 1080) {
              return {
                isValid: false,
                errors: ['Photo resolution below minimum requirements'],
                warnings: []
              };
            }
          }
          return { isValid: true, errors: [], warnings: [] };
        }
      }
    ]);

    // Object detection rules
    this.validationRules.set('object_detection', [
      {
        name: 'object_count_validation',
        validate: async (feedback) => {
          const aiCount = Array.isArray(feedback.aiPrediction.value) 
            ? feedback.aiPrediction.value.length : 0;
          const auditorCount = Array.isArray(feedback.auditorCorrection.value)
            ? feedback.auditorCorrection.value.length : 0;
          
          if (Math.abs(aiCount - auditorCount) > 5) {
            return {
              isValid: true,
              errors: [],
              warnings: ['Large discrepancy in object count']
            };
          }
          return { isValid: true, errors: [], warnings: [] };
        }
      }
    ]);

    // Add more category-specific rules
  }

  private determineFeedbackType(item: FeedbackItem): AuditorFeedback['feedbackType'] {
    const aiValue = JSON.stringify(item.aiValue);
    const correctValue = JSON.stringify(item.correctValue);

    if (aiValue === correctValue) {
      return 'validation';
    }

    if (item.severity === 'major') {
      return 'correction';
    }

    if (item.explanation?.toLowerCase().includes('suggest')) {
      return 'suggestion';
    }

    return 'issue';
  }

  private async extractContext(
    item: FeedbackItem,
    inspectionId: string
  ): Promise<AuditorFeedback['context']> {
    // In production, would fetch from database
    return {
      propertyType: 'single-family',
      roomType: item.evidence?.checklistItemId ? 'bedroom' : undefined,
      checklistItem: item.evidence?.checklistItemId,
      photoId: item.evidence?.photoIds?.[0],
      videoTimestamp: item.evidence?.videoTimestamp
    };
  }

  private calculateImpactScore(item: FeedbackItem): number {
    let score = 50; // Base score

    // Severity impact
    switch (item.severity) {
      case 'major': score += 30; break;
      case 'moderate': score += 20; break;
      case 'minor': score += 10; break;
    }

    // Confidence impact
    if (item.confidenceRating > 80) {
      score += 10; // High confidence corrections are more impactful
    }

    // Evidence impact
    if (item.evidence) {
      score += 10; // Feedback with evidence is more valuable
    }

    return Math.min(100, score);
  }

  private queueFeedback(feedback: AuditorFeedback[]): void {
    feedback.forEach(f => {
      this.feedbackQueue.push({
        feedback: f,
        priority: this.calculatePriority(f),
        queuedAt: new Date(),
        attempts: 0
      });
    });
  }

  private startProcessingQueue(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 5000); // Process every 5 seconds
  }

  private async processQueue(): Promise<void> {
    if (this.feedbackQueue.length === 0) return;

    // Sort by priority
    this.feedbackQueue.sort((a, b) => b.priority - a.priority);

    // Process top items
    const batchSize = 10;
    const batch = this.feedbackQueue.splice(0, batchSize);

    for (const item of batch) {
      try {
        await this.processFeedbackItem(item);
      } catch (error) {
        item.attempts++;
        if (item.attempts < 3) {
          this.feedbackQueue.push(item); // Retry
        }
      }
    }
  }

  private async processFeedbackItem(item: FeedbackQueueItem): Promise<void> {
    // In production, would send to learning engine
  }

  private async storeFeedback(feedback: AuditorFeedback[]): Promise<void> {
    // In production, would save to database
    const stored = localStorage.getItem('auditor_feedback') || '[]';
    const existing = JSON.parse(stored);
    existing.push(...feedback);
    localStorage.setItem('auditor_feedback', JSON.stringify(existing));
  }

  private groupByCategory(feedback: AuditorFeedback[]): Map<FeedbackCategory, AuditorFeedback[]> {
    const groups = new Map<FeedbackCategory, AuditorFeedback[]>();
    
    feedback.forEach(item => {
      if (!groups.has(item.category)) {
        groups.set(item.category, []);
      }
      groups.get(item.category)!.push(item);
    });

    return groups;
  }

  private groupBySeverity(feedback: AuditorFeedback[]): Map<string, AuditorFeedback[]> {
    const groups = new Map<string, AuditorFeedback[]>();
    
    feedback.forEach(item => {
      const severity = this.determineSeverity(item);
      if (!groups.has(severity)) {
        groups.set(severity, []);
      }
      groups.get(severity)!.push(item);
    });

    return groups;
  }

  private groupByPropertyType(feedback: AuditorFeedback[]): Map<string, AuditorFeedback[]> {
    const groups = new Map<string, AuditorFeedback[]>();
    
    feedback.forEach(item => {
      const propertyType = item.context.propertyType || 'unknown';
      if (!groups.has(propertyType)) {
        groups.set(propertyType, []);
      }
      groups.get(propertyType)!.push(item);
    });

    return groups;
  }

  private groupByConfidenceLevel(feedback: AuditorFeedback[]): Map<string, AuditorFeedback[]> {
    const groups = new Map<string, AuditorFeedback[]>();
    
    feedback.forEach(item => {
      const level = this.getConfidenceLevel(item.aiPrediction.confidence);
      if (!groups.has(level)) {
        groups.set(level, []);
      }
      groups.get(level)!.push(item);
    });

    return groups;
  }

  private determineSeverity(feedback: AuditorFeedback): string {
    const confidenceDiff = Math.abs(
      feedback.aiPrediction.confidence - feedback.auditorCorrection.confidence
    );

    if (confidenceDiff > 30) return 'high';
    if (confidenceDiff > 15) return 'medium';
    return 'low';
  }

  private getConfidenceLevel(confidence: number): string {
    if (confidence >= 90) return 'very_high';
    if (confidence >= 75) return 'high';
    if (confidence >= 60) return 'medium';
    if (confidence >= 40) return 'low';
    return 'very_low';
  }

  private calculateStatistics(feedback: AuditorFeedback[]): FeedbackStatistics {
    const total = feedback.length;
    const corrections = feedback.filter(f => f.feedbackType === 'correction').length;
    const validations = feedback.filter(f => f.feedbackType === 'validation').length;
    
    const avgConfidence = feedback.reduce(
      (sum, f) => sum + f.aiPrediction.confidence, 0
    ) / total;

    const avgImpact = feedback.reduce(
      (sum, f) => sum + f.learningMetadata.impactScore, 0
    ) / total;

    return {
      total,
      corrections,
      validations,
      correctionRate: (corrections / total) * 100,
      averageConfidence: avgConfidence,
      averageImpact: avgImpact
    };
  }

  private async detectPatterns(feedback: AuditorFeedback[]): Promise<LearningPattern[]> {
    // Simple pattern detection
    const patterns: LearningPattern[] = [];

    // Check for repeated errors
    const errorGroups = new Map<string, AuditorFeedback[]>();
    feedback.forEach(f => {
      if (f.feedbackType === 'correction') {
        const key = `${f.category}_${JSON.stringify(f.aiPrediction.value)}`;
        if (!errorGroups.has(key)) {
          errorGroups.set(key, []);
        }
        errorGroups.get(key)!.push(f);
      }
    });

    // Create patterns for repeated errors
    for (const [key, items] of errorGroups) {
      if (items.length >= 3) {
        patterns.push({
          id: `pattern_${Date.now()}`,
          name: `Repeated error in ${items[0].category}`,
          description: `AI consistently makes the same error in ${items[0].category}`,
          category: items[0].category,
          pattern: {
            conditions: [{
              field: 'category',
              operator: 'equals',
              value: items[0].category
            }],
            frequency: items.length,
            timeWindow: 24
          },
          metadata: {
            firstDetected: items[0].timestamp,
            lastSeen: items[items.length - 1].timestamp,
            occurrences: items.length,
            affectedInspections: [...new Set(items.map(i => i.inspectionId))],
            severity: 'medium'
          },
          recommendations: {
            immediate: ['Review training data for this category'],
            longTerm: ['Consider model retraining'],
            modelAdjustments: []
          }
        });
      }
    }

    return patterns;
  }

  private generateRecommendations(feedback: AuditorFeedback[]): string[] {
    const recommendations: string[] = [];
    const stats = this.calculateStatistics(feedback);

    if (stats.correctionRate > 30) {
      recommendations.push('High correction rate detected - consider model retraining');
    }

    if (stats.averageConfidence < 60) {
      recommendations.push('Low average confidence - review model parameters');
    }

    if (stats.averageImpact > 80) {
      recommendations.push('High impact feedback - prioritize for immediate processing');
    }

    return recommendations;
  }

  private async validateFeedbackItem(item: FeedbackItem): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!item.type) {
      errors.push('Feedback type is required');
    }

    if (item.aiValue === undefined || item.correctValue === undefined) {
      errors.push('Both AI and correct values are required');
    }

    if (!item.severity) {
      warnings.push('Severity not specified, defaulting to minor');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: errors.length === 0 ? 100 - warnings.length * 10 : 0
    };
  }

  private async checkConsistency(feedback: AuditorFeedback): Promise<{
    isConsistent: boolean;
    reason: string;
  }> {
    // Check if feedback is consistent with previous feedback
    // In production, would query historical data
    return {
      isConsistent: true,
      reason: ''
    };
  }

  private calculateValidationScore(errors: string[], warnings: string[]): number {
    let score = 100;
    score -= errors.length * 20;
    score -= warnings.length * 5;
    return Math.max(0, score);
  }

  private async findErrorPatterns(feedback: AuditorFeedback[]): Promise<LearningPattern[]> {
    return this.detectPatterns(feedback);
  }

  private calculateTrends(feedback: AuditorFeedback[]): TrendMetrics {
    // Sort by timestamp
    const sorted = [...feedback].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Calculate accuracy over time
    const accuracyTrend: number[] = [];
    const windowSize = Math.max(1, Math.floor(sorted.length / 10));

    for (let i = 0; i < sorted.length; i += windowSize) {
      const window = sorted.slice(i, i + windowSize);
      const accuracy = window.filter(
        f => f.feedbackType === 'validation'
      ).length / window.length * 100;
      accuracyTrend.push(accuracy);
    }

    return {
      accuracyTrend,
      improvementRate: accuracyTrend.length > 1 
        ? accuracyTrend[accuracyTrend.length - 1] - accuracyTrend[0]
        : 0,
      volatility: this.calculateVolatility(accuracyTrend)
    };
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }

  private async findCorrelations(feedback: AuditorFeedback[]): Promise<Correlation[]> {
    const correlations: Correlation[] = [];
    
    // Find correlations between categories
    const categories = [...new Set(feedback.map(f => f.category))];
    
    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const cat1 = categories[i];
        const cat2 = categories[j];
        
        const cat1Errors = feedback.filter(
          f => f.category === cat1 && f.feedbackType === 'correction'
        );
        const cat2Errors = feedback.filter(
          f => f.category === cat2 && f.feedbackType === 'correction'
        );
        
        // Check if errors occur together
        const coOccurrence = cat1Errors.filter(e1 =>
          cat2Errors.some(e2 => 
            e2.inspectionId === e1.inspectionId &&
            Math.abs(e2.timestamp.getTime() - e1.timestamp.getTime()) < 300000 // 5 minutes
          )
        ).length;
        
        if (coOccurrence > Math.min(cat1Errors.length, cat2Errors.length) * 0.5) {
          correlations.push({
            factor1: cat1,
            factor2: cat2,
            strength: coOccurrence / Math.min(cat1Errors.length, cat2Errors.length),
            type: 'error_correlation'
          });
        }
      }
    }
    
    return correlations;
  }

  private generateInsights(
    patterns: LearningPattern[],
    trends: TrendMetrics,
    correlations: Correlation[]
  ): string[] {
    const insights: string[] = [];
    
    if (patterns.length > 0) {
      insights.push(`Detected ${patterns.length} recurring error patterns`);
    }
    
    if (trends.improvementRate > 5) {
      insights.push(`Accuracy improving at ${trends.improvementRate.toFixed(1)}% rate`);
    } else if (trends.improvementRate < -5) {
      insights.push(`Warning: Accuracy declining at ${Math.abs(trends.improvementRate).toFixed(1)}% rate`);
    }
    
    if (correlations.length > 0) {
      insights.push(`Found ${correlations.length} error correlations between categories`);
    }
    
    if (trends.volatility > 20) {
      insights.push('High volatility in accuracy - model may be unstable');
    }
    
    return insights;
  }

  private generateAnalysisSummary(feedback: AuditorFeedback[]): string {
    const stats = this.calculateStatistics(feedback);
    
    return `Analyzed ${stats.total} feedback items with ${stats.correctionRate.toFixed(1)}% correction rate. ` +
           `Average confidence: ${stats.averageConfidence.toFixed(1)}%, Average impact: ${stats.averageImpact.toFixed(1)}.`;
  }

  private calculatePriority(feedback: AuditorFeedback): number {
    let priority = feedback.learningMetadata.impactScore;
    
    // Boost priority for high-confidence errors
    if (feedback.feedbackType === 'correction' && feedback.aiPrediction.confidence > 80) {
      priority += 20;
    }
    
    // Boost priority for safety-related categories
    if (['safety_compliance', 'damage_assessment'].includes(feedback.category)) {
      priority += 15;
    }
    
    // Boost priority for recent feedback
    const age = Date.now() - feedback.timestamp.getTime();
    if (age < 3600000) { // Less than 1 hour old
      priority += 10;
    }
    
    return priority;
  }

  // Cleanup
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

// Types for internal use

interface ValidationRule {
  name: string;
  validate: (feedback: AuditorFeedback) => Promise<ValidationResult>;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

interface FeedbackQueueItem {
  feedback: AuditorFeedback;
  priority: number;
  queuedAt: Date;
  attempts: number;
}

interface CategorizedFeedback {
  dimension: string;
  key: string;
  items: AuditorFeedback[];
  statistics: FeedbackStatistics;
  patterns: LearningPattern[];
  recommendations: string[];
}

interface FeedbackStatistics {
  total: number;
  corrections: number;
  validations: number;
  correctionRate: number;
  averageConfidence: number;
  averageImpact: number;
}

interface FeedbackAnalysis {
  patterns: LearningPattern[];
  trends: TrendMetrics;
  correlations: Correlation[];
  insights: string[];
  summary: string;
}

interface TrendMetrics {
  accuracyTrend: number[];
  improvementRate: number;
  volatility: number;
}

interface Correlation {
  factor1: string;
  factor2: string;
  strength: number;
  type: string;
}

// Export factory function
export const createFeedbackProcessor = (): FeedbackProcessor => {
  return new FeedbackProcessor();
};