// AI Learning Engine for STR Certified
// Processes auditor feedback to improve AI accuracy over time

import type {
  AuditorFeedback,
  FeedbackCategory,
  LearningMetrics,
  LearningInsight,
  CategoryMetrics,
  PropertyTypeMetrics,
  ModelUpdate,
  TrendData,
  LearningConfig,
  LearningProgress,
  LearningPattern
} from '@/types/learning';

export class LearningEngine {
  private config: LearningConfig;
  private feedbackBuffer: Map<string, AuditorFeedback[]> = new Map();
  private metricsCache: Map<string, LearningMetrics> = new Map();
  private confidenceModels: Map<FeedbackCategory, ConfidenceModel> = new Map();
  private propertyTypeModels: Map<string, PropertyTypeModel> = new Map();
  private patternDetector: PatternDetector;

  constructor(config: LearningConfig) {
    this.config = config;
    this.patternDetector = new PatternDetector();
    this.initializeModels();
  }

  /**
   * Processes auditor feedback and learns from corrections
   */
  async processAuditorFeedback(feedback: AuditorFeedback): Promise<void> {
    // Add to buffer
    const bufferKey = this.getBufferKey(feedback);
    if (!this.feedbackBuffer.has(bufferKey)) {
      this.feedbackBuffer.set(bufferKey, []);
    }
    this.feedbackBuffer.get(bufferKey)!.push(feedback);

    // Extract learning insights
    const insights = await this.extractInsights(feedback);
    
    // Update confidence models immediately for critical feedback
    if (feedback.auditorCorrection.confidence > this.config.confidenceThreshold) {
      await this.updateConfidenceModels([feedback]);
    }

    // Check if we should trigger batch processing
    const shouldProcess = this.shouldProcessBatch(bufferKey);
    if (shouldProcess) {
      await this.processFeedbackBatch(bufferKey);
    }

    // Detect patterns
    await this.patternDetector.analyze(feedback);

    // Mark as processed
    feedback.learningMetadata.processed = true;
    feedback.learningMetadata.processedAt = new Date();
  }

  /**
   * Updates confidence models based on feedback
   */
  async updateConfidenceModels(feedbackItems: AuditorFeedback[]): Promise<void> {
    // Group by category
    const categoryGroups = this.groupByCategory(feedbackItems);

    for (const [category, items] of categoryGroups) {
      const model = this.confidenceModels.get(category);
      if (!model) continue;

      // Calculate accuracy metrics
      const accuracy = this.calculateAccuracy(items);
      const confidenceAdjustment = this.calculateConfidenceAdjustment(items);

      // Update model
      model.updateWithFeedback(items, accuracy, confidenceAdjustment);

      // Store updated model parameters
      await this.persistModelUpdate(category, model);
    }

    // Update cross-category correlations
    await this.updateCrossModelCorrelations(feedbackItems);
  }

  /**
   * Categorizes feedback by property type to learn patterns
   */
  async categorizeByPropertyType(feedbackItems: AuditorFeedback[]): Promise<Map<string, PropertyTypeMetrics>> {
    const propertyTypeMap = new Map<string, PropertyTypeMetrics>();

    // Group by property type
    const propertyGroups = this.groupByPropertyType(feedbackItems);

    for (const [propertyType, items] of propertyGroups) {
      const metrics = await this.calculatePropertyTypeMetrics(propertyType, items);
      propertyTypeMap.set(propertyType, metrics);

      // Update property-specific model
      let model = this.propertyTypeModels.get(propertyType);
      if (!model) {
        model = new PropertyTypeModel(propertyType);
        this.propertyTypeModels.set(propertyType, model);
      }

      model.updateWithFeedback(items);
      
      // Identify property-specific challenges
      const challenges = await this.identifyPropertyChallenges(propertyType, items);
      metrics.specificChallenges = challenges;
    }

    return propertyTypeMap;
  }

  /**
   * Generates comprehensive learning report
   */
  async generateLearningReport(
    startDate: Date,
    endDate: Date
  ): Promise<LearningMetrics> {
    // Check cache first
    const cacheKey = `${startDate.toISOString()}_${endDate.toISOString()}`;
    if (this.metricsCache.has(cacheKey)) {
      return this.metricsCache.get(cacheKey)!;
    }

    // Collect all feedback in period
    const periodFeedback = await this.getFeedbackInPeriod(startDate, endDate);

    // Calculate overall metrics
    const accuracyTrend = await this.calculateAccuracyTrend(periodFeedback);
    const confidenceImprovement = await this.calculateConfidenceImprovement(periodFeedback);

    // Category performance
    const categoryPerformance = new Map<FeedbackCategory, CategoryMetrics>();
    const categories = this.getUniqueCategories(periodFeedback);
    
    for (const category of categories) {
      const categoryItems = periodFeedback.filter(f => f.category === category);
      const metrics = await this.calculateCategoryMetrics(category, categoryItems);
      categoryPerformance.set(category, metrics);
    }

    // Property type performance
    const propertyTypePerformance = await this.categorizeByPropertyType(periodFeedback);

    // Model updates in period
    const modelUpdates = await this.getModelUpdatesInPeriod(startDate, endDate);

    // Generate insights
    const insights = await this.generateInsights(periodFeedback, categoryPerformance);

    const report: LearningMetrics = {
      periodStart: startDate,
      periodEnd: endDate,
      accuracyTrend,
      confidenceImprovement,
      feedbackVolume: periodFeedback.length,
      feedbackProcessed: periodFeedback.filter(f => f.learningMetadata.processed).length,
      categoryPerformance,
      propertyTypePerformance,
      modelUpdates,
      insights
    };

    // Cache the report
    this.metricsCache.set(cacheKey, report);

    return report;
  }

  /**
   * Generates learning progress report
   */
  async getLearningProgress(modelVersion: string): Promise<LearningProgress> {
    const startDate = await this.getModelStartDate(modelVersion);
    const currentDate = new Date();

    // Get all feedback since model start
    const allFeedback = await this.getFeedbackInPeriod(startDate, currentDate);

    // Calculate overall metrics
    const overallAccuracy = this.calculateOverallAccuracy(allFeedback);
    const startAccuracy = await this.getInitialAccuracy(modelVersion);
    const overallImprovement = ((overallAccuracy - startAccuracy) / startAccuracy) * 100;

    // Category progress
    const categoryProgress = new Map();
    for (const [category, model] of this.confidenceModels) {
      const progress = await model.getProgress();
      categoryProgress.set(category, progress);
    }

    // Achievements
    const achievements = await this.checkAchievements(allFeedback, overallAccuracy);

    // Predictions
    const predictions = await this.generatePredictions(
      allFeedback,
      overallAccuracy,
      categoryProgress
    );

    return {
      modelVersion,
      startDate,
      currentDate,
      overallAccuracy,
      overallImprovement,
      feedbackProcessed: allFeedback.length,
      categoryProgress,
      achievements,
      predictions
    };
  }

  // Private helper methods

  private initializeModels(): void {
    // Initialize confidence models for each category
    const categories: FeedbackCategory[] = [
      'photo_quality',
      'object_detection',
      'room_classification',
      'damage_assessment',
      'completeness_check',
      'safety_compliance',
      'amenity_verification',
      'measurement_accuracy',
      'condition_rating'
    ];

    categories.forEach(category => {
      this.confidenceModels.set(category, new ConfidenceModel(category));
    });
  }

  private getBufferKey(feedback: AuditorFeedback): string {
    return `${feedback.category}_${feedback.context.propertyType || 'general'}`;
  }

  private shouldProcessBatch(bufferKey: string): boolean {
    const buffer = this.feedbackBuffer.get(bufferKey) || [];
    
    // Process if we have enough feedback
    if (buffer.length >= this.config.minFeedbackForUpdate) {
      return true;
    }

    // Process if oldest feedback is beyond aggregation window
    if (buffer.length > 0) {
      const oldestTime = buffer[0].timestamp.getTime();
      const windowMs = this.config.feedbackAggregationWindow * 60 * 60 * 1000;
      return Date.now() - oldestTime > windowMs;
    }

    return false;
  }

  private async processFeedbackBatch(bufferKey: string): Promise<void> {
    const feedback = this.feedbackBuffer.get(bufferKey) || [];
    if (feedback.length === 0) return;

    // Update models
    await this.updateConfidenceModels(feedback);

    // Clear buffer
    this.feedbackBuffer.delete(bufferKey);

    // Check if we should deploy new model
    if (this.config.updateFrequency === 'realtime') {
      await this.deployModelUpdates();
    }
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

  private calculateAccuracy(feedback: AuditorFeedback[]): number {
    if (feedback.length === 0) return 0;

    const correctPredictions = feedback.filter(f => 
      this.isPredictionCorrect(f.aiPrediction.value, f.auditorCorrection.value)
    ).length;

    return (correctPredictions / feedback.length) * 100;
  }

  private calculateConfidenceAdjustment(feedback: AuditorFeedback[]): number {
    const adjustments = feedback.map(f => {
      const wasCorrect = this.isPredictionCorrect(f.aiPrediction.value, f.auditorCorrection.value);
      const confidenceDiff = f.aiPrediction.confidence - f.auditorCorrection.confidence;
      
      if (wasCorrect) {
        // Increase confidence if we were correct but not confident enough
        return confidenceDiff < 0 ? Math.abs(confidenceDiff) * 0.1 : 0;
      } else {
        // Decrease confidence if we were wrong
        return -Math.abs(confidenceDiff) * 0.2;
      }
    });

    return adjustments.reduce((sum, adj) => sum + adj, 0) / feedback.length;
  }

  private isPredictionCorrect(aiValue: unknown, auditorValue: unknown): boolean {
    // Handle different types of values
    if (typeof aiValue === 'boolean' && typeof auditorValue === 'boolean') {
      return aiValue === auditorValue;
    }
    
    if (typeof aiValue === 'number' && typeof auditorValue === 'number') {
      // Allow 10% margin for numeric values
      return Math.abs(aiValue - auditorValue) / auditorValue < 0.1;
    }
    
    if (typeof aiValue === 'string' && typeof auditorValue === 'string') {
      return aiValue.toLowerCase() === auditorValue.toLowerCase();
    }
    
    // For complex objects, use JSON comparison
    return JSON.stringify(aiValue) === JSON.stringify(auditorValue);
  }

  private async extractInsights(feedback: AuditorFeedback): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Check for critical accuracy drop
    if (feedback.aiPrediction.confidence > 80 && !this.isPredictionCorrect(feedback.aiPrediction.value, feedback.auditorCorrection.value)) {
      insights.push({
        id: `insight_${Date.now()}_1`,
        type: 'anomaly',
        severity: 'critical',
        title: 'High-confidence incorrect prediction',
        description: `AI was ${feedback.aiPrediction.confidence}% confident but incorrect in ${feedback.category}`,
        affectedCategories: [feedback.category],
        suggestedActions: [
          'Review similar cases in this category',
          'Adjust confidence thresholds',
          'Retrain model with focus on this scenario'
        ],
        metrics: {
          confidenceDrop: feedback.aiPrediction.confidence - feedback.auditorCorrection.confidence
        },
        createdAt: new Date()
      });
    }

    // Check for pattern emergence
    const patterns = await this.patternDetector.getRecentPatterns(feedback.category);
    if (patterns.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_2`,
        type: 'pattern',
        severity: 'info',
        title: 'Emerging pattern detected',
        description: `New pattern in ${feedback.category}: ${patterns[0].description}`,
        affectedCategories: [feedback.category],
        suggestedActions: patterns[0].recommendations.immediate,
        createdAt: new Date()
      });
    }

    return insights;
  }

  private async persistModelUpdate(category: FeedbackCategory, model: ConfidenceModel): Promise<void> {
    // In production, this would save to database
    const modelData = model.serialize();
    localStorage.setItem(`model_${category}`, JSON.stringify(modelData));
  }

  private async deployModelUpdates(): Promise<void> {
    // Check if improvements meet threshold
    const improvements = await this.calculateModelImprovements();
    
    if (improvements.averageImprovement >= this.config.minAccuracyImprovement) {
      // Deploy new models
      const version = `v${Date.now()}`;
      
      for (const [category, model] of this.confidenceModels) {
        await model.deploy(version);
      }
      
      // Log model update
      const update: ModelUpdate = {
        version,
        timestamp: new Date(),
        trigger: 'threshold',
        feedbackIncorporated: this.getTotalFeedbackCount(),
        improvements: improvements.categoryImprovements,
        validationResults: await this.validateModels()
      };
      
      await this.logModelUpdate(update);
    }
  }

  // Mock implementations for remaining methods
  private async getFeedbackInPeriod(start: Date, end: Date): Promise<AuditorFeedback[]> {
    // In production, query from database
    return [];
  }

  private async calculateAccuracyTrend(feedback: AuditorFeedback[]): Promise<TrendData> {
    return {
      dataPoints: [],
      trend: 'improving',
      changePercent: 5.2
    };
  }

  private async calculateConfidenceImprovement(feedback: AuditorFeedback[]): Promise<TrendData> {
    return {
      dataPoints: [],
      trend: 'stable',
      changePercent: 1.8
    };
  }

  private getUniqueCategories(feedback: AuditorFeedback[]): FeedbackCategory[] {
    return [...new Set(feedback.map(f => f.category))];
  }

  private async calculateCategoryMetrics(
    category: FeedbackCategory,
    feedback: AuditorFeedback[]
  ): Promise<CategoryMetrics> {
    return {
      category,
      totalFeedback: feedback.length,
      corrections: feedback.filter(f => f.feedbackType === 'correction').length,
      validations: feedback.filter(f => f.feedbackType === 'validation').length,
      accuracy: this.calculateAccuracy(feedback),
      confidenceAvg: feedback.reduce((sum, f) => sum + f.aiPrediction.confidence, 0) / feedback.length,
      commonErrors: [],
      improvementRate: 3.5
    };
  }

  private async calculatePropertyTypeMetrics(
    propertyType: string,
    feedback: AuditorFeedback[]
  ): Promise<PropertyTypeMetrics> {
    return {
      propertyType,
      inspectionCount: new Set(feedback.map(f => f.inspectionId)).size,
      feedbackCount: feedback.length,
      accuracy: this.calculateAccuracy(feedback),
      specificChallenges: [],
      learningProgress: {
        learned: [],
        inProgress: [],
        needsMoreData: []
      }
    };
  }

  private async generateInsights(
    feedback: AuditorFeedback[],
    categoryPerformance: Map<FeedbackCategory, CategoryMetrics>
  ): Promise<LearningInsight[]> {
    const insights: LearningInsight[] = [];

    // Find categories with significant improvement
    for (const [category, metrics] of categoryPerformance) {
      if (metrics.improvementRate > 5) {
        insights.push({
          id: `achievement_${Date.now()}`,
          type: 'achievement',
          severity: 'success',
          title: `Significant improvement in ${category}`,
          description: `${metrics.improvementRate.toFixed(1)}% improvement in accuracy`,
          affectedCategories: [category],
          metrics: {
            improvementRate: metrics.improvementRate,
            accuracy: metrics.accuracy
          },
          createdAt: new Date()
        });
      }
    }

    return insights;
  }

  private async getModelUpdatesInPeriod(start: Date, end: Date): Promise<ModelUpdate[]> {
    // In production, query from database
    return [];
  }

  private async getModelStartDate(version: string): Promise<Date> {
    // In production, query from database
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  }

  private async getInitialAccuracy(version: string): Promise<number> {
    return 75; // Mock initial accuracy
  }

  private calculateOverallAccuracy(feedback: AuditorFeedback[]): number {
    return this.calculateAccuracy(feedback);
  }

  private async checkAchievements(feedback: AuditorFeedback[], accuracy: number): Promise<Array<{
    id: string;
    type: string;
    description: string;
    unlockedAt: Date;
  }>> {
    return [];
  }

  private async generatePredictions(
    feedback: AuditorFeedback[],
    currentAccuracy: number,
    categoryProgress: Map<FeedbackCategory, {
      startAccuracy: number;
      currentAccuracy: number;
      improvement: number;
      dataPoints: number;
      nextMilestone: {
        target: number;
        estimatedDate: Date;
        requiredFeedback: number;
      };
    }>
  ): Promise<{
    nextWeekAccuracy: number;
    nextMonthAccuracy: number;
    timeToTarget: number;
    bottlenecks: string[];
  }> {
    return {
      nextWeekAccuracy: currentAccuracy + 1.2,
      nextMonthAccuracy: currentAccuracy + 4.5,
      timeToTarget: 45,
      bottlenecks: ['Need more data for luxury properties']
    };
  }

  private async identifyPropertyChallenges(
    propertyType: string,
    feedback: AuditorFeedback[]
  ): Promise<string[]> {
    const challenges: string[] = [];
    
    // Analyze common errors for this property type
    const errorTypes = feedback
      .filter(f => !this.isPredictionCorrect(f.aiPrediction.value, f.auditorCorrection.value))
      .map(f => f.category);
    
    const errorCounts = new Map<string, number>();
    errorTypes.forEach(error => {
      errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
    });
    
    // Find most common challenges
    for (const [category, count] of errorCounts) {
      if (count > feedback.length * 0.1) { // More than 10% error rate
        challenges.push(`High error rate in ${category} detection`);
      }
    }
    
    return challenges;
  }

  private async updateCrossModelCorrelations(feedback: AuditorFeedback[]): Promise<void> {
    // Analyze correlations between different categories
    // This helps identify when errors in one category affect another
  }

  private async calculateModelImprovements(): Promise<{
    averageImprovement: number;
    categoryImprovements: Array<{
      category: FeedbackCategory;
      improvement: number;
      confidence: number;
    }>;
  }> {
    return {
      averageImprovement: 5.5,
      categoryImprovements: [] as Array<{
        category: FeedbackCategory;
        improvement: number;
        confidence: number;
      }>
    };
  }

  private getTotalFeedbackCount(): number {
    let total = 0;
    for (const buffer of this.feedbackBuffer.values()) {
      total += buffer.length;
    }
    return total;
  }

  private async validateModels(): Promise<{
    testSetAccuracy: number;
    crossValidation: number;
    auditorApproval: number;
  }> {
    return {
      testSetAccuracy: 82.5,
      crossValidation: 81.2,
      auditorApproval: 88.0
    };
  }

  private async logModelUpdate(update: ModelUpdate): Promise<void> {
    // In production, save to database
  }
}

// Supporting classes

class ConfidenceModel {
  constructor(private category: FeedbackCategory) {}

  updateWithFeedback(feedback: AuditorFeedback[], accuracy: number, adjustment: number): void {
    // Update model parameters based on feedback
  }

  async getProgress(): Promise<{
    startAccuracy: number;
    currentAccuracy: number;
    improvement: number;
    dataPoints: number;
    nextMilestone: {
      target: number;
      estimatedDate: Date;
      requiredFeedback: number;
    };
  }> {
    return {
      startAccuracy: 75,
      currentAccuracy: 82,
      improvement: 7,
      dataPoints: 150,
      nextMilestone: {
        target: 85,
        estimatedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        requiredFeedback: 50
      }
    };
  }

  serialize(): {
    category: FeedbackCategory;
    parameters: Record<string, unknown>;
    lastUpdated: Date;
  } {
    return {
      category: this.category,
      parameters: {},
      lastUpdated: new Date()
    };
  }

  async deploy(version: string): Promise<void> {
    // Deploy model version
  }
}

class PropertyTypeModel {
  constructor(private propertyType: string) {}

  updateWithFeedback(feedback: AuditorFeedback[]): void {
    // Update property-specific patterns
  }
}

class PatternDetector {
  private patterns: Map<string, LearningPattern[]> = new Map();

  async analyze(feedback: AuditorFeedback): Promise<void> {
    // Detect patterns in feedback
  }

  async getRecentPatterns(category: FeedbackCategory): Promise<LearningPattern[]> {
    return this.patterns.get(category) || [];
  }
}

// Export factory function
export const createLearningEngine = (config: LearningConfig): LearningEngine => {
  return new LearningEngine(config);
};

// Default configuration
export const defaultLearningConfig: LearningConfig = {
  minFeedbackForUpdate: 10,
  confidenceThreshold: 80,
  feedbackAggregationWindow: 24, // hours
  updateFrequency: 'daily',
  validationSplitRatio: 0.2,
  minAccuracyImprovement: 2,
  embeddingModel: 'text-embedding-ada-002',
  vectorDimension: 1536,
  similarityThreshold: 0.85,
  maxRetrievalResults: 5,
  criticalAccuracyThreshold: 70,
  targetAccuracy: 90,
  confidenceDecayRate: 0.05
};