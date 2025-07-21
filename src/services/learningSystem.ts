/**
 * @fileoverview Learning and Improvement Feedback Loop System
 * Continuous learning system that analyzes bug resolution outcomes,
 * user feedback, and system performance to improve AI accuracy over time
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

import { OpenAI } from 'openai';
import { 
  LearningOutcome, 
  AIPerformanceAnalysis, 
  LearningRecommendation,
  LearningContextData,
  AIModelMetrics 
} from '@/types/learning-system';
import { supabase } from '@/integrations/supabase/client';
import { ErrorDetails, ErrorResolutionHistory } from '@/types/errorTypes';
import { log } from '@/lib/logging/enterprise-logger';

// Types for learning context data
type SystemStateData = Record<string, string | number | boolean | null>;
type UserBehaviorData = Record<string, string | number | boolean | null>;
type EnvironmentalFactorsData = Record<string, string | number | boolean | null>;

// Type for resolution learnings
interface ResolutionLearnings {
  errorId: string;
  resolutionTime: number | null;
  resolutionType: string;
  successful: boolean;
  verificationMetrics?: unknown;
}

// Type for overall performance analysis
interface OverallPerformanceAnalysis {
  avgAccuracy: number;
  avgResponseTime: number;
  categoriesNeedingImprovement: string[];
  overallTrend: string;
}

interface AIResult {
  classification?: {
    category: string;
    subcategory?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  rootCause?: {
    primaryCause: string;
    contributingFactors: string[];
    affectedComponents: string[];
  };
  reproduction?: {
    steps: string[];
    environment: string;
    success: boolean;
  };
  healing?: {
    suggestions: string[];
    automatedFixes: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  prediction?: {
    likelihood: number;
    timeframe: string;
    preventionActions: string[];
  };
}

interface LearningDataPoint {
  id: string;
  errorId: string;
  category: 'classification' | 'root_cause' | 'reproduction' | 'healing' | 'prediction';
  
  // Original AI prediction/analysis
  aiPrediction: {
    confidence: number;
    result: AIResult;
    model: string;
    timestamp: string;
  };
  
  // Actual outcome/correction
  actualOutcome: {
    result: AIResult;
    verifiedBy: 'human' | 'automated' | 'user_feedback';
    timestamp: string;
    source: string;
  };
  
  // Accuracy metrics
  accuracy: {
    overall: number;
    categorySpecific: number;
    confidenceCalibration: number;
  };
  
  // Context that influenced the prediction
  context: {
    systemState: SystemStateData;
    userBehavior: UserBehaviorData;
    environmentalFactors: EnvironmentalFactorsData;
  };
  
  // Learning insights
  insights: {
    strengths: string[];
    weaknesses: string[];
    improvementAreas: string[];
    patterns: string[];
  };
  
  createdAt: string;
  processedAt?: string;
}

interface ModelPerformanceMetrics {
  modelName: string;
  category: string;
  timeframe: '1h' | '24h' | '7d' | '30d';
  
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confidenceCalibration: number;
    avgResponseTime: number;
  };
  
  trends: {
    accuracyTrend: 'improving' | 'degrading' | 'stable';
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    complexityTrend: 'increasing' | 'decreasing' | 'stable';
  };
  
  topErrors: {
    errorType: string;
    frequency: number;
    avgAccuracy: number;
    improvementPotential: number;
  }[];
  
  lastUpdated: string;
}

interface LearningRecommendation {
  id: string;
  type: 'model_retrain' | 'prompt_optimization' | 'feature_enhancement' | 'data_collection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  description: string;
  technicalDetails: string;
  expectedImpact: {
    accuracyImprovement: number;
    performanceImpact: number;
    implementationEffort: 'low' | 'medium' | 'high';
  };
  
  implementation: {
    steps: string[];
    timeline: string;
    resources: string[];
    risks: string[];
  };
  
  successCriteria: string[];
  rollbackPlan: string;
  
  createdAt: string;
  status: 'pending' | 'approved' | 'implementing' | 'completed' | 'rejected';
}

interface UserFeedback {
  id: string;
  errorId: string;
  userId?: string;
  sessionId: string;
  
  feedback: {
    accuracy: number; // 1-5 scale
    helpfulness: number; // 1-5 scale
    completeness: number; // 1-5 scale
    timeliness: number; // 1-5 scale
  };
  
  comments: string;
  suggestedImprovements: string[];
  
  context: {
    resolutionTime: number;
    resolutionMethod: string;
    userExperience: 'positive' | 'neutral' | 'negative';
    wouldRecommend: boolean;
  };
  
  createdAt: string;
}

export class LearningSystem {
  private openai: OpenAI;
  private learningData: Map<string, LearningDataPoint[]> = new Map();
  private performanceMetrics: Map<string, ModelPerformanceMetrics> = new Map();
  private recommendations: LearningRecommendation[] = [];
  private isLearning = false;

  constructor() {
    // SECURITY: Direct AI integration disabled for security
    log.warn('LearningSystem: Direct AI integration disabled', {
      component: 'LearningSystem',
      action: 'constructor',
      reason: 'security',
      recommendation: 'Use AIProxyService instead'
    }, 'AI_INTEGRATION_DISABLED');
    this.openai = null as unknown as OpenAI; // DISABLED
  }

  /**
   * Record a learning data point from AI prediction and actual outcome
   */
  async recordLearningData(
    errorId: string,
    category: LearningDataPoint['category'],
    aiPrediction: AIResult,
    actualOutcome: AIResult,
    context: Record<string, unknown>
  ): Promise<void> {
    try {
      const accuracy = await this.calculateAccuracy(aiPrediction, actualOutcome, category);
      const insights = await this.generateInsights(aiPrediction, actualOutcome, context);

      const dataPoint: LearningDataPoint = {
        id: this.generateLearningId(),
        errorId,
        category,
        aiPrediction: {
          confidence: aiPrediction.confidence || 0,
          result: aiPrediction,
          model: aiPrediction.model || 'gpt-4o',
          timestamp: aiPrediction.timestamp || new Date().toISOString()
        },
        actualOutcome: {
          result: actualOutcome,
          verifiedBy: actualOutcome.verifiedBy || 'automated',
          timestamp: new Date().toISOString(),
          source: actualOutcome.source || 'system'
        },
        accuracy,
        context,
        insights,
        createdAt: new Date().toISOString()
      };

      // Store learning data
      if (!this.learningData.has(category)) {
        this.learningData.set(category, []);
      }
      this.learningData.get(category)!.push(dataPoint);

      // Store in database for persistence
      await this.storeLearningData(dataPoint);

      // Trigger learning analysis
      await this.analyzeLearningData(category);

    } catch (error) {
      log.error('Failed to record learning data', error as Error, {
        component: 'LearningSystem',
        action: 'recordLearningData',
        errorId,
        category
      }, 'LEARNING_DATA_RECORD_FAILED');
    }
  }

  /**
   * Record user feedback for continuous improvement
   */
  async recordUserFeedback(
    errorId: string,
    feedback: UserFeedback['feedback'],
    comments: string,
    context: UserFeedback['context']
  ): Promise<void> {
    try {
      const userFeedback: UserFeedback = {
        id: this.generateFeedbackId(),
        errorId,
        sessionId: this.getCurrentSessionId(),
        feedback,
        comments,
        suggestedImprovements: this.extractSuggestions(comments),
        context,
        createdAt: new Date().toISOString()
      };

      // Store feedback
      await this.storeUserFeedback(userFeedback);

      // Analyze feedback for learning
      await this.analyzeFeedback(userFeedback);

    } catch (error) {
      log.error('Failed to record user feedback', error as Error, {
        component: 'LearningSystem',
        action: 'recordUserFeedback',
        errorId
      }, 'USER_FEEDBACK_RECORD_FAILED');
    }
  }

  /**
   * Analyze error resolution outcomes for learning
   */
  async analyzeResolutionOutcome(
    errorId: string,
    resolutionHistory: ErrorResolutionHistory
  ): Promise<void> {
    try {
      // Extract learnings from resolution process
      const resolutionLearnings = await this.extractResolutionLearnings(errorId, resolutionHistory);

      // Update model performance metrics
      await this.updatePerformanceMetrics(resolutionLearnings);

      // Generate improvement recommendations
      const recommendations = await this.generateImprovementRecommendations(resolutionLearnings);

      // Store recommendations
      this.recommendations.push(...recommendations);

    } catch (error) {
      log.error('Failed to analyze resolution outcome', error as Error, {
        component: 'LearningSystem',
        action: 'analyzeResolutionOutcome',
        errorId
      }, 'RESOLUTION_ANALYSIS_FAILED');
    }
  }

  /**
   * Generate AI model improvement recommendations
   */
  async generateModelRecommendations(): Promise<LearningRecommendation[]> {
    try {
      // Analyze current performance across all categories
      const performanceAnalysis = await this.analyzeOverallPerformance();

      // Generate recommendations using AI
      const recommendations = await this.generateAIRecommendations(performanceAnalysis);

      // Prioritize recommendations
      const prioritizedRecommendations = this.prioritizeRecommendations(recommendations);

      return prioritizedRecommendations;

    } catch (error) {
      log.error('Failed to generate model recommendations', error as Error, {
        component: 'LearningSystem',
        action: 'generateModelRecommendations'
      }, 'MODEL_RECOMMENDATIONS_FAILED');
      return [];
    }
  }

  /**
   * Calculate accuracy between AI prediction and actual outcome
   */
  private async calculateAccuracy(
    aiPrediction: AIResult,
    actualOutcome: AIResult,
    category: string
  ): Promise<LearningDataPoint['accuracy']> {
    let overall = 0;
    let categorySpecific = 0;
    let confidenceCalibration = 0;

    switch (category) {
      case 'classification':
        overall = this.calculateClassificationAccuracy(aiPrediction, actualOutcome);
        categorySpecific = overall;
        confidenceCalibration = this.calculateConfidenceCalibration(aiPrediction, actualOutcome);
        break;

      case 'root_cause':
        overall = this.calculateRootCauseAccuracy(aiPrediction, actualOutcome);
        categorySpecific = overall;
        confidenceCalibration = this.calculateConfidenceCalibration(aiPrediction, actualOutcome);
        break;

      case 'reproduction':
        overall = this.calculateReproductionAccuracy(aiPrediction, actualOutcome);
        categorySpecific = overall;
        confidenceCalibration = this.calculateConfidenceCalibration(aiPrediction, actualOutcome);
        break;

      case 'healing':
        overall = this.calculateHealingAccuracy(aiPrediction, actualOutcome);
        categorySpecific = overall;
        confidenceCalibration = this.calculateConfidenceCalibration(aiPrediction, actualOutcome);
        break;

      case 'prediction':
        overall = this.calculatePredictionAccuracy(aiPrediction, actualOutcome);
        categorySpecific = overall;
        confidenceCalibration = this.calculateConfidenceCalibration(aiPrediction, actualOutcome);
        break;
    }

    return { overall, categorySpecific, confidenceCalibration };
  }

  /**
   * Calculate classification accuracy
   */
  private calculateClassificationAccuracy(aiPrediction: AIResult, actualOutcome: AIResult): number {
    if (!aiPrediction.classification || !actualOutcome.classification) {
      return 0;
    }

    const predicted = aiPrediction.classification;
    const actual = actualOutcome.classification;

    let score = 0;
    
    // Type accuracy
    if (predicted.type === actual.type) score += 0.4;
    
    // Severity accuracy
    if (predicted.severity === actual.severity) score += 0.3;
    
    // Category accuracy
    if (predicted.category === actual.category) score += 0.3;

    return score;
  }

  /**
   * Calculate root cause accuracy
   */
  private calculateRootCauseAccuracy(aiPrediction: AIResult, actualOutcome: AIResult): number {
    if (!aiPrediction.rootCause || !actualOutcome.rootCause) {
      return 0;
    }

    // Simple text similarity for root cause comparison
    const predicted = aiPrediction.rootCause.toLowerCase();
    const actual = actualOutcome.rootCause.toLowerCase();

    // Calculate word overlap
    const predictedWords = new Set(predicted.split(' '));
    const actualWords = new Set(actual.split(' '));
    const intersection = new Set([...predictedWords].filter(x => actualWords.has(x)));
    
    const similarity = intersection.size / Math.max(predictedWords.size, actualWords.size);
    return similarity;
  }

  /**
   * Calculate reproduction accuracy
   */
  private calculateReproductionAccuracy(aiPrediction: AIResult, actualOutcome: AIResult): number {
    if (!aiPrediction.steps || !actualOutcome.successRate) {
      return 0;
    }

    // Base success rate of reproduction steps
    const successRate = actualOutcome.successRate || 0;
    
    // Adjust based on completeness and clarity
    const completeness = aiPrediction.steps.length > 5 ? 1 : aiPrediction.steps.length / 5;
    const clarity = aiPrediction.confidence || 0.5;
    
    return successRate * completeness * clarity;
  }

  /**
   * Calculate healing accuracy
   */
  private calculateHealingAccuracy(aiPrediction: AIResult, actualOutcome: AIResult): number {
    if (!aiPrediction.suggestions || !actualOutcome.results) {
      return 0;
    }

    const results = actualOutcome.results;
    let score = 0;

    // Success rate of healing suggestions
    if (results.success) score += 0.5;
    
    // Safety assessment (no negative side effects)
    if (results.sideEffects && results.sideEffects.length === 0) score += 0.3;
    
    // Impact assessment
    if (results.metrics && results.metrics.errorsReduced > 0) score += 0.2;

    return score;
  }

  /**
   * Calculate prediction accuracy
   */
  private calculatePredictionAccuracy(aiPrediction: AIResult, actualOutcome: AIResult): number {
    if (!aiPrediction.predictions || !actualOutcome.actualEvents) {
      return 0;
    }

    // Compare predicted events vs actual events
    const predicted = aiPrediction.predictions;
    const actual = actualOutcome.actualEvents;

    let correct = 0;
    let total = predicted.length;

    for (const prediction of predicted) {
      const matchingActual = actual.find((a: LearningOutcome) => 
        a.type === prediction.type && 
        Math.abs(new Date(a.timestamp).getTime() - new Date(prediction.timestamp).getTime()) < 3600000 // 1 hour tolerance
      );
      
      if (matchingActual) {
        correct++;
      }
    }

    return total > 0 ? correct / total : 0;
  }

  /**
   * Calculate confidence calibration
   */
  private calculateConfidenceCalibration(aiPrediction: LearningOutcome, actualOutcome: LearningOutcome): number {
    const predictedConfidence = aiPrediction.confidence || 0.5;
    const actualAccuracy = actualOutcome.accuracy || 0;

    // Perfect calibration would have confidence = accuracy
    const calibrationError = Math.abs(predictedConfidence - actualAccuracy);
    
    // Convert to 0-1 scale where 1 is perfect calibration
    return Math.max(0, 1 - calibrationError);
  }

  /**
   * Generate insights from prediction vs outcome comparison
   */
  private async generateInsights(
    aiPrediction: LearningOutcome,
    actualOutcome: LearningOutcome,
    context: LearningContextData
  ): Promise<LearningDataPoint['insights']> {
    const prompt = `
Analyze this AI prediction vs actual outcome and provide learning insights:

AI PREDICTION:
${JSON.stringify(aiPrediction, null, 2)}

ACTUAL OUTCOME:
${JSON.stringify(actualOutcome, null, 2)}

CONTEXT:
${JSON.stringify(context, null, 2)}

Provide insights in the following categories:
1. STRENGTHS: What did the AI do well?
2. WEAKNESSES: Where did the AI fall short?
3. IMPROVEMENT AREAS: What could be improved?
4. PATTERNS: Any patterns or trends noticed?

Format as JSON with arrays of strings for each category.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI learning analyst. Provide specific, actionable insights about AI performance. Respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      });

      const insightsText = response.choices[0]?.message?.content;
      if (insightsText) {
        return JSON.parse(insightsText);
      }
    } catch (error) {
      log.error('Failed to generate insights from AI prediction analysis', error as Error, {
        component: 'LearningSystem',
        action: 'generateInsights'
      }, 'INSIGHTS_GENERATION_FAILED');
    }

    // Fallback insights
    return {
      strengths: ['Automated analysis provided'],
      weaknesses: ['Accuracy could be improved'],
      improvementAreas: ['Better training data needed'],
      patterns: ['Common error pattern detected']
    };
  }

  /**
   * Analyze learning data for a specific category
   */
  private async analyzeLearningData(category: string): Promise<void> {
    const categoryData = this.learningData.get(category) || [];
    
    if (categoryData.length < 10) {
      return; // Need more data for meaningful analysis
    }

    // Calculate performance metrics
    const metrics = this.calculatePerformanceMetrics(categoryData, category);
    
    // Store metrics
    this.performanceMetrics.set(category, metrics);

    // Check for improvement opportunities
    if (metrics.metrics.accuracy < 0.8) {
      const recommendation = await this.generateCategoryRecommendation(category, metrics);
      this.recommendations.push(recommendation);
    }
  }

  /**
   * Calculate performance metrics for a category
   */
  private calculatePerformanceMetrics(
    data: LearningDataPoint[],
    category: string
  ): ModelPerformanceMetrics {
    const recent = data.slice(-100); // Last 100 data points
    
    const accuracy = recent.reduce((sum, d) => sum + d.accuracy.overall, 0) / recent.length;
    const avgResponseTime = recent.reduce((sum, d) => {
      const predTime = new Date(d.aiPrediction.timestamp).getTime();
      const outcomeTime = new Date(d.actualOutcome.timestamp).getTime();
      return sum + (outcomeTime - predTime);
    }, 0) / recent.length;

    return {
      modelName: 'gpt-4o',
      category,
      timeframe: '24h',
      metrics: {
        accuracy,
        precision: accuracy, // Simplified
        recall: accuracy, // Simplified
        f1Score: accuracy, // Simplified
        confidenceCalibration: recent.reduce((sum, d) => sum + d.accuracy.confidenceCalibration, 0) / recent.length,
        avgResponseTime
      },
      trends: {
        accuracyTrend: this.calculateTrend(recent.map(d => d.accuracy.overall)),
        volumeTrend: 'stable',
        complexityTrend: 'stable'
      },
      topErrors: this.identifyTopErrors(recent),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Calculate trend from array of values
   */
  private calculateTrend(values: number[]): 'improving' | 'degrading' | 'stable' {
    if (values.length < 5) return 'stable';
    
    const recent = values.slice(-5);
    const older = values.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.05) return 'improving';
    if (recentAvg < olderAvg - 0.05) return 'degrading';
    return 'stable';
  }

  /**
   * Identify top error patterns
   */
  private identifyTopErrors(data: LearningDataPoint[]): ModelPerformanceMetrics['topErrors'] {
    const errorMap = new Map<string, { count: number; accuracySum: number }>();
    
    data.forEach(d => {
      if (d.accuracy.overall < 0.7) { // Consider as error if accuracy < 70%
        const errorType = d.aiPrediction.result.type || 'unknown';
        const existing = errorMap.get(errorType) || { count: 0, accuracySum: 0 };
        errorMap.set(errorType, {
          count: existing.count + 1,
          accuracySum: existing.accuracySum + d.accuracy.overall
        });
      }
    });

    return Array.from(errorMap.entries())
      .map(([errorType, stats]) => ({
        errorType,
        frequency: stats.count,
        avgAccuracy: stats.accuracySum / stats.count,
        improvementPotential: 1 - (stats.accuracySum / stats.count)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  /**
   * Store learning data in database
   */
  private async storeLearningData(dataPoint: LearningDataPoint): Promise<void> {
    try {
      await supabase
        .from('ai_learning_data')
        .insert({
          id: dataPoint.id,
          error_id: dataPoint.errorId,
          category: dataPoint.category,
          ai_prediction: dataPoint.aiPrediction,
          actual_outcome: dataPoint.actualOutcome,
          accuracy: dataPoint.accuracy,
          context: dataPoint.context,
          insights: dataPoint.insights,
          created_at: dataPoint.createdAt
        });
    } catch (error) {
      log.error('Failed to store learning data in database', error as Error, {
        component: 'LearningSystem',
        action: 'storeLearningData',
        dataPointId: dataPoint.id,
        errorId: dataPoint.errorId
      }, 'LEARNING_DATA_STORAGE_FAILED');
    }
  }

  /**
   * Store user feedback in database
   */
  private async storeUserFeedback(feedback: UserFeedback): Promise<void> {
    try {
      await supabase
        .from('user_feedback')
        .insert({
          id: feedback.id,
          error_id: feedback.errorId,
          user_id: feedback.userId,
          session_id: feedback.sessionId,
          feedback: feedback.feedback,
          comments: feedback.comments,
          suggested_improvements: feedback.suggestedImprovements,
          context: feedback.context,
          created_at: feedback.createdAt
        });
    } catch (error) {
      log.error('Failed to store user feedback in database', error as Error, {
        component: 'LearningSystem',
        action: 'storeUserFeedback',
        feedbackId: feedback.id,
        errorId: feedback.errorId
      }, 'USER_FEEDBACK_STORAGE_FAILED');
    }
  }

  /**
   * Extract suggestions from comments
   */
  private extractSuggestions(comments: string): string[] {
    // Simple extraction - in a real system this would use NLP
    const suggestions: string[] = [];
    
    if (comments.toLowerCase().includes('faster')) {
      suggestions.push('Improve response time');
    }
    if (comments.toLowerCase().includes('accurate')) {
      suggestions.push('Improve accuracy');
    }
    if (comments.toLowerCase().includes('detail')) {
      suggestions.push('Provide more detailed analysis');
    }
    
    return suggestions;
  }

  /**
   * Extract learnings from resolution process
   */
  private async extractResolutionLearnings(
    errorId: string,
    resolutionHistory: ErrorResolutionHistory
  ): Promise<ResolutionLearnings> {
    return {
      errorId,
      resolutionTime: resolutionHistory.timeline.closed ? 
        new Date(resolutionHistory.timeline.closed).getTime() - new Date(resolutionHistory.timeline.reported).getTime() : null,
      resolutionType: resolutionHistory.resolution.type,
      successful: resolutionHistory.status === 'resolved',
      verificationMetrics: resolutionHistory.verificationMetrics
    };
  }

  /**
   * Update performance metrics based on new learnings
   */
  private async updatePerformanceMetrics(learnings: LearningOutcome[]): Promise<void> {
    // Update metrics based on resolution outcomes
    log.info('Updating performance metrics with new learnings', {
      component: 'LearningSystem',
      action: 'updatePerformanceMetrics',
      errorId: learnings.errorId,
      resolutionTime: learnings.resolutionTime,
      successful: learnings.successful
    }, 'PERFORMANCE_METRICS_UPDATE');
  }

  /**
   * Generate improvement recommendations
   */
  private async generateImprovementRecommendations(learnings: LearningOutcome[]): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];

    if (learnings.resolutionTime > 3600000) { // > 1 hour
      recommendations.push({
        id: this.generateRecommendationId(),
        type: 'prompt_optimization',
        priority: 'medium',
        description: 'Optimize AI prompts to provide faster initial analysis',
        technicalDetails: 'Review and streamline prompts to reduce complexity while maintaining accuracy',
        expectedImpact: {
          accuracyImprovement: 0.05,
          performanceImpact: -0.3,
          implementationEffort: 'low'
        },
        implementation: {
          steps: ['Analyze current prompts', 'Simplify complex instructions', 'Test optimized prompts'],
          timeline: '1 week',
          resources: ['AI engineer', 'QA tester'],
          risks: ['Potential accuracy reduction']
        },
        successCriteria: ['Response time < 30 seconds', 'Accuracy maintained > 85%'],
        rollbackPlan: 'Revert to previous prompts if accuracy drops',
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    }

    return recommendations;
  }

  /**
   * Analyze overall system performance
   */
  private async analyzeOverallPerformance(): Promise<OverallPerformanceAnalysis> {
    const allMetrics = Array.from(this.performanceMetrics.values());
    
    return {
      avgAccuracy: allMetrics.reduce((sum, m) => sum + m.metrics.accuracy, 0) / allMetrics.length,
      avgResponseTime: allMetrics.reduce((sum, m) => sum + m.metrics.avgResponseTime, 0) / allMetrics.length,
      categoriesNeedingImprovement: allMetrics.filter(m => m.metrics.accuracy < 0.8).map(m => m.category),
      overallTrend: this.calculateOverallTrend(allMetrics)
    };
  }

  /**
   * Calculate overall trend across all categories
   */
  private calculateOverallTrend(metrics: ModelPerformanceMetrics[]): string {
    const improvingCount = metrics.filter(m => m.trends.accuracyTrend === 'improving').length;
    const degradingCount = metrics.filter(m => m.trends.accuracyTrend === 'degrading').length;
    
    if (improvingCount > degradingCount) return 'improving';
    if (degradingCount > improvingCount) return 'degrading';
    return 'stable';
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateAIRecommendations(performanceAnalysis: AIPerformanceAnalysis): Promise<LearningRecommendation[]> {
    // Simplified recommendation generation
    const recommendations: LearningRecommendation[] = [];

    if (performanceAnalysis.avgAccuracy < 0.8) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: 'model_retrain',
        priority: 'high',
        description: 'Retrain models with recent learning data to improve accuracy',
        technicalDetails: 'Use accumulated learning data to fine-tune model parameters',
        expectedImpact: {
          accuracyImprovement: 0.15,
          performanceImpact: 0.1,
          implementationEffort: 'high'
        },
        implementation: {
          steps: ['Prepare training data', 'Retrain models', 'Validate improvements', 'Deploy updated models'],
          timeline: '2 weeks',
          resources: ['ML engineer', 'DevOps engineer', 'QA team'],
          risks: ['Training instability', 'Performance regression']
        },
        successCriteria: ['Accuracy > 85%', 'No performance degradation'],
        rollbackPlan: 'Keep previous model version for rollback',
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
    }

    return recommendations;
  }

  /**
   * Prioritize recommendations by impact and effort
   */
  private prioritizeRecommendations(recommendations: LearningRecommendation[]): LearningRecommendation[] {
    return recommendations.sort((a, b) => {
      // Score based on impact vs effort
      const scoreA = a.expectedImpact.accuracyImprovement * this.getEffortMultiplier(a.expectedImpact.implementationEffort);
      const scoreB = b.expectedImpact.accuracyImprovement * this.getEffortMultiplier(b.expectedImpact.implementationEffort);
      
      return scoreB - scoreA;
    });
  }

  /**
   * Get effort multiplier for prioritization
   */
  private getEffortMultiplier(effort: 'low' | 'medium' | 'high'): number {
    switch (effort) {
      case 'low': return 1.0;
      case 'medium': return 0.7;
      case 'high': return 0.4;
    }
  }

  /**
   * Analyze user feedback for patterns
   */
  private async analyzeFeedback(feedback: UserFeedback): Promise<void> {
    // Store feedback insights for future improvements
    log.info('Analyzing user feedback for insights', {
      component: 'LearningSystem',
      action: 'analyzeFeedback',
      feedbackId: feedback.id,
      errorId: feedback.errorId,
      overallRating: Object.values(feedback.feedback).reduce((sum, val) => sum + val, 0) / Object.values(feedback.feedback).length,
      userExperience: feedback.context.userExperience
    }, 'FEEDBACK_ANALYSIS');
  }

  /**
   * Generate category-specific recommendation
   */
  private async generateCategoryRecommendation(
    category: string,
    metrics: ModelPerformanceMetrics
  ): Promise<LearningRecommendation> {
    return {
      id: this.generateRecommendationId(),
      type: 'prompt_optimization',
      priority: 'medium',
      description: `Improve ${category} accuracy through prompt optimization`,
      technicalDetails: `Current accuracy: ${metrics.metrics.accuracy.toFixed(2)}. Optimize prompts for better ${category} performance.`,
      expectedImpact: {
        accuracyImprovement: 0.1,
        performanceImpact: 0,
        implementationEffort: 'low'
      },
      implementation: {
        steps: ['Review current prompts', 'Identify improvement areas', 'Test new prompts'],
        timeline: '3 days',
        resources: ['AI engineer'],
        risks: ['Minimal risk']
      },
      successCriteria: [`${category} accuracy > 80%`],
      rollbackPlan: 'Revert to previous prompts',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
  }

  /**
   * Get current session ID
   */
  private getCurrentSessionId(): string {
    let sessionId = sessionStorage.getItem('learning_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('learning_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Generate unique learning ID
   */
  private generateLearningId(): string {
    return `learn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique feedback ID
   */
  private generateFeedbackId(): string {
    return `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique recommendation ID
   */
  private generateRecommendationId(): string {
    return `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get learning system status and metrics
   */
  getLearningStatus(): {
    dataPoints: number;
    categories: string[];
    avgAccuracy: number;
    recommendations: number;
    lastUpdate: string;
  } {
    const totalDataPoints = Array.from(this.learningData.values()).reduce((sum, arr) => sum + arr.length, 0);
    const categories = Array.from(this.learningData.keys());
    const allMetrics = Array.from(this.performanceMetrics.values());
    const avgAccuracy = allMetrics.length > 0 ? 
      allMetrics.reduce((sum, m) => sum + m.metrics.accuracy, 0) / allMetrics.length : 0;

    return {
      dataPoints: totalDataPoints,
      categories,
      avgAccuracy,
      recommendations: this.recommendations.length,
      lastUpdate: new Date().toISOString()
    };
  }
}

export const learningSystem = new LearningSystem();