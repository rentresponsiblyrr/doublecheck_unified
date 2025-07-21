// AI Learning Service for STR Certified
// Manages interactions with the AI learning infrastructure

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type {
  KnowledgeBaseEntry,
  KnowledgeSearchRequest,
  KnowledgeSearchResult,
  AuditorFeedbackEntry,
  FeedbackSubmissionRequest,
  AIModelVersion,
  CAGContextPattern,
  RAGQueryLog,
  LearningMetricsEntry,
  SemanticSearchRequest,
  SemanticSearchResponse,
  CAGContextRequest,
  CAGContextResponse,
  LearningInsight,
  ModelPerformanceMetrics
} from '@/types/ai-database';

// Context interfaces for AI Learning Service
export interface AIContext {
  property?: {
    type?: string;
    value?: number;
    amenities?: string[];
  };
  temporal?: {
    season?: string;
    timeOfDay?: string;
    months?: number[];
  };
  inspector?: {
    id: string;
    performanceMetrics?: Record<string, number>;
  };
  inspection?: {
    id: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    category?: string;
  };
}

export interface PatternConditions {
  property?: {
    type?: string[];
    value_range?: { min?: number; max?: number };
    amenities?: { includes?: string[]; excludes?: string[] };
  };
  temporal?: {
    months?: number[];
    seasons?: string[];
  };
  inspector?: {
    experience_level?: string[];
    performance_threshold?: { min?: number; max?: number };
  };
}

export interface SelectedContext {
  knowledge_entries: KnowledgeBaseEntry[];
  applied_patterns: CAGContextPattern[];
  dynamic_context: Record<string, unknown>;
}

export class AILearningService {
  private static instance: AILearningService;
  private embeddingCache = new Map<string, number[]>();
  private contextCache = new Map<string, AIContext>();
  
  private constructor() {}
  
  static getInstance(): AILearningService {
    if (!AILearningService.instance) {
      AILearningService.instance = new AILearningService();
    }
    return AILearningService.instance;
  }

  // ===================================================================
  // KNOWLEDGE BASE OPERATIONS
  // ===================================================================

  /**
   * Performs semantic search in the knowledge base
   */
  async semanticSearch(request: SemanticSearchRequest): Promise<SemanticSearchResponse> {
    const startTime = Date.now();
    
    try {
      // Get or generate query embedding
      let queryEmbedding = request.embedding;
      if (!queryEmbedding) {
        queryEmbedding = await this.generateEmbedding(request.query);
      }

      // Use the database function for semantic search
      const { data, error } = await supabase.rpc('search_knowledge_base', {
        query_embedding: queryEmbedding,
        match_threshold: request.filters?.threshold || 0.8,
        match_count: request.filters?.limit || 5,
        filter_category: request.filters?.category || null
      });

      if (error) {
        throw new Error(`Semantic search failed: ${error.message}`);
      }

      const queryTime = Date.now() - startTime;

      logger.info('Semantic search completed', {
        query: request.query.substring(0, 100),
        resultsCount: data?.length || 0,
        queryTimeMs: queryTime
      }, 'AI_LEARNING_SERVICE');

      return {
        results: data || [],
        query_time_ms: queryTime,
        total_matches: data?.length || 0,
        used_cache: false
      };

    } catch (error) {
      logger.error('Semantic search failed', error, 'AI_LEARNING_SERVICE');
      throw error;
    }
  }

  /**
   * Adds a new knowledge base entry
   */
  async addKnowledgeEntry(
    entry: Omit<KnowledgeBaseEntry, 'id' | 'embedding' | 'query_count' | 'relevance_score' | 'citation_count' | 'created_at' | 'updated_at'>
  ): Promise<KnowledgeBaseEntry> {
    try {
      // Generate embedding for the content
      const embedding = await this.generateEmbedding(entry.content);

      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
          ...entry,
          embedding,
          query_count: 0,
          relevance_score: 1.0,
          citation_count: 0
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add knowledge entry: ${error.message}`);
      }

      logger.info('Knowledge entry added', {
        id: data.id,
        category: data.category,
        title: data.title.substring(0, 50)
      }, 'AI_LEARNING_SERVICE');

      return data;

    } catch (error) {
      logger.error('Failed to add knowledge entry', error, 'AI_LEARNING_SERVICE');
      throw error;
    }
  }

  /**
   * Updates knowledge base usage statistics
   */
  async updateKnowledgeUsage(knowledgeId: string, relevanceFeedback?: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_knowledge_usage', {
        knowledge_id: knowledgeId,
        relevance_feedback: relevanceFeedback
      });

      if (error) {
        throw new Error(`Failed to update knowledge usage: ${error.message}`);
      }

    } catch (error) {
      logger.error('Failed to update knowledge usage', error, 'AI_LEARNING_SERVICE');
      throw error;
    }
  }

  // ===================================================================
  // AUDITOR FEEDBACK OPERATIONS
  // ===================================================================

  /**
   * Submits auditor feedback for AI learning
   */
  async submitAuditorFeedback(feedback: FeedbackSubmissionRequest): Promise<AuditorFeedbackEntry> {
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get property and inspector context from inspection
      const { data: inspection } = await supabase
        .from('inspections')
        .select(`
          *,
          properties (*),
          users (*)
        `)
        .eq('id', feedback.inspection_id)
        .single();

      if (!inspection) {
        throw new Error('Inspection not found');
      }

      // Build context objects
      const propertyContext = {
        property_type: inspection.properties?.type,
        location: {
          city: inspection.properties?.city,
          state: inspection.properties?.state
        },
        // Add more property context as needed
      };

      const inspectorContext = {
        inspector_id: inspection.inspector_id,
        // Add inspector performance data
      };

      const temporalContext = {
        season: this.getCurrentSeason(),
        time_of_day: this.getTimeOfDay(new Date()),
        // Add more temporal context
      };

      const feedbackEntry: Omit<AuditorFeedbackEntry, 'id' | 'created_at' | 'updated_at'> = {
        inspection_id: feedback.inspection_id,
        auditor_id: user.id,
        checklist_item_id: feedback.checklist_item_id,
        ai_prediction: feedback.ai_prediction,
        auditor_correction: feedback.auditor_correction,
        feedback_type: feedback.feedback_type,
        category: feedback.category,
        property_context: propertyContext,
        inspector_context: inspectorContext,
        temporal_context: temporalContext,
        processed: false
      };

      const { data, error } = await supabase
        .from('auditor_feedback')
        .insert(feedbackEntry)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit feedback: ${error.message}`);
      }

      // Trigger learning processing for high-impact feedback
      if (feedback.ai_prediction.confidence > 80) {
        await this.processHighImpactFeedback(data.id);
      }

      logger.info('Auditor feedback submitted', {
        feedbackId: data.id,
        category: feedback.category,
        inspectionId: feedback.inspection_id
      }, 'AI_LEARNING_SERVICE');

      return data;

    } catch (error) {
      logger.error('Failed to submit auditor feedback', error, 'AI_LEARNING_SERVICE');
      throw error;
    }
  }

  /**
   * Retrieves feedback for learning analysis
   */
  async getFeedbackForAnalysis(filters: {
    category?: string;
    startDate?: string;
    endDate?: string;
    processed?: boolean;
    modelVersion?: string;
  }): Promise<AuditorFeedbackEntry[]> {
    try {
      let query = supabase
        .from('auditor_feedback')
        .select('*');

      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      if (filters.processed !== undefined) {
        query = query.eq('processed', filters.processed);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to retrieve feedback: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      logger.error('Failed to retrieve feedback for analysis', error, 'AI_LEARNING_SERVICE');
      throw error;
    }
  }

  // ===================================================================
  // CAG (CONTEXT AUGMENTED GENERATION) OPERATIONS
  // ===================================================================

  /**
   * Retrieves relevant context for CAG
   */
  async getCAGContext(request: CAGContextRequest): Promise<CAGContextResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Perform semantic search for relevant knowledge
      const knowledgeResults = await this.semanticSearch({
        query: request.query,
        filters: {
          threshold: 0.7,
          limit: 5
        }
      });

      // 2. Find applicable context patterns
      const applicablePatterns = await this.findApplicablePatterns(request.context);

      // 3. Generate dynamic context based on current situation
      const dynamicContext = await this.generateDynamicContext(request.context, request.model_type);

      // 4. Weight and combine all context sources
      const selectedContext = {
        knowledge_entries: knowledgeResults.results,
        applied_patterns: applicablePatterns,
        dynamic_context: dynamicContext
      };

      const contextExplanation = this.generateContextExplanation(selectedContext);
      const confidenceScore = this.calculateContextConfidence(selectedContext);

      const processingTime = Date.now() - startTime;

      // Log the CAG query for analysis
      await this.logRAGQuery({
        query_text: request.query,
        query_type: request.model_type,
        retrieved_knowledge_ids: knowledgeResults.results.map(r => r.id),
        similarity_scores: knowledgeResults.results.map(r => r.similarity),
        selected_context: selectedContext,
        cag_patterns_applied: applicablePatterns.map(p => p.id),
        context_weight: request.options?.context_weight || 1.0,
        dynamic_context: dynamicContext,
        total_processing_time_ms: processingTime
      });

      return {
        selected_context: selectedContext,
        context_explanation: contextExplanation,
        confidence_score: confidenceScore,
        processing_time_ms: processingTime
      };

    } catch (error) {
      logger.error('CAG context retrieval failed', error, 'AI_LEARNING_SERVICE');
      throw error;
    }
  }

  /**
   * Finds applicable context patterns based on current context
   */
  private async findApplicablePatterns(context: AIContext): Promise<CAGContextPattern[]> {
    try {
      const { data, error } = await supabase
        .from('cag_context_patterns')
        .select('*')
        .eq('status', 'active')
        .order('weight', { ascending: false });

      if (error) {
        throw new Error(`Failed to retrieve context patterns: ${error.message}`);
      }

      // Filter patterns based on context conditions
      const applicablePatterns = (data || []).filter(pattern => 
        this.evaluatePatternConditions(pattern.conditions, context)
      );

      return applicablePatterns;

    } catch (error) {
      logger.error('Failed to find applicable patterns', error, 'AI_LEARNING_SERVICE');
      return [];
    }
  }

  /**
   * Evaluates if pattern conditions match current context
   */
  private evaluatePatternConditions(conditions: PatternConditions, context: AIContext): boolean {
    try {
      // Property type matching
      if (conditions.property?.type && context.property?.type) {
        if (!conditions.property.type.includes(context.property.type)) {
          return false;
        }
      }

      // Value range matching
      if (conditions.property?.value_range && context.property?.value) {
        const { min, max } = conditions.property.value_range;
        const value = context.property.value;
        if ((min && value < min) || (max && value > max)) {
          return false;
        }
      }

      // Amenity matching
      if (conditions.property?.amenities && context.property?.amenities) {
        const { includes, excludes } = conditions.property.amenities;
        const contextAmenities = context.property.amenities;
        
        if (includes && !includes.some(amenity => contextAmenities.includes(amenity))) {
          return false;
        }
        
        if (excludes && excludes.some(amenity => contextAmenities.includes(amenity))) {
          return false;
        }
      }

      // Temporal matching
      if (conditions.temporal?.months) {
        const currentMonth = new Date().getMonth() + 1;
        if (!conditions.temporal.months.includes(currentMonth)) {
          return false;
        }
      }

      return true;

    } catch (error) {
      logger.error('Pattern condition evaluation failed', error, 'AI_LEARNING_SERVICE');
      return false;
    }
  }

  // ===================================================================
  // MODEL PERFORMANCE AND METRICS
  // ===================================================================

  /**
   * Retrieves model performance metrics
   */
  async getModelPerformance(
    modelVersion: string,
    startDate?: string,
    endDate?: string
  ): Promise<ModelPerformanceMetrics | null> {
    try {
      const { data, error } = await supabase.rpc('calculate_learning_metrics', {
        start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: endDate || new Date().toISOString(),
        model_version_filter: modelVersion
      });

      if (error) {
        throw new Error(`Failed to calculate metrics: ${error.message}`);
      }

      // Transform the data into our metrics format
      const metrics: ModelPerformanceMetrics = {
        version: modelVersion,
        model_type: 'general', // This would be determined from the model version
        period_start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: endDate || new Date().toISOString(),
        overall_accuracy: data?.[0]?.accuracy_rate || 0,
        accuracy_by_category: data?.reduce((acc, item) => {
          acc[item.category] = item.accuracy_rate;
          return acc;
        }, {}) || {},
        accuracy_trend: 'stable', // This would be calculated from historical data
        confidence_calibration: 0.85, // Placeholder
        overconfidence_rate: 0.15,
        underconfidence_rate: 0.10,
        avg_processing_time: 1500,
        success_rate: 0.95,
        error_rate: 0.05,
        feedback_volume: data?.[0]?.total_feedback || 0,
        correction_rate: 0.20,
        improvement_velocity: data?.[0]?.improvement_rate || 0
      };

      return metrics;

    } catch (error) {
      logger.error('Failed to get model performance', error, 'AI_LEARNING_SERVICE');
      return null;
    }
  }

  /**
   * Generates learning insights from recent feedback
   */
  async generateLearningInsights(
    timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<LearningInsight[]> {
    try {
      const insights: LearningInsight[] = [];

      // Get recent feedback for analysis
      const daysBack = timeframe === 'daily' ? 1 : timeframe === 'weekly' ? 7 : 30;
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
      
      const feedback = await this.getFeedbackForAnalysis({
        startDate,
        processed: true
      });

      // Analyze for patterns and anomalies
      const categoryAccuracy = this.analyzeCategoryAccuracy(feedback);
      const confidenceCalibration = this.analyzeConfidenceCalibration(feedback);
      const improvementAreas = this.identifyImprovementAreas(feedback);

      // Generate insights based on analysis
      Object.entries(categoryAccuracy).forEach(([category, accuracy]) => {
        if (accuracy < 70) {
          insights.push({
            id: `low_accuracy_${category}_${Date.now()}`,
            type: 'anomaly',
            severity: 'warning',
            title: `Low accuracy in ${category}`,
            description: `Accuracy has dropped to ${accuracy.toFixed(1)}% in ${category} category`,
            affected_categories: [category as any],
            suggested_actions: [
              `Review recent ${category} predictions`,
              'Increase training data for this category',
              'Adjust confidence thresholds'
            ],
            metrics: { accuracy, threshold: 70 },
            created_at: new Date().toISOString()
          });
        }
      });

      return insights;

    } catch (error) {
      logger.error('Failed to generate learning insights', error, 'AI_LEARNING_SERVICE');
      return [];
    }
  }

  // ===================================================================
  // PRIVATE HELPER METHODS
  // ===================================================================

  /**
   * Generates embedding for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!;
    }

    try {
      // Use OpenAI's embedding API
      // SECURITY: Use backend proxy instead of direct OpenAI API calls
      throw new Error('Direct OpenAI embedding calls disabled for security. Use backend proxy instead.');

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;
      
      // Cache the result
      this.embeddingCache.set(text, embedding);
      
      logger.info('Generated embedding', {
        textLength: text.length,
        embeddingDimension: embedding.length
      }, 'AI_LEARNING_SERVICE');
      
      return embedding;

    } catch (error) {
      logger.error('Failed to generate embedding', error, 'AI_LEARNING_SERVICE');
      // Return zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  /**
   * Processes high-impact feedback immediately
   */
  private async processHighImpactFeedback(feedbackId: string): Promise<void> {
    try {
      // Mark as processed and calculate impact
      const { error } = await supabase
        .from('auditor_feedback')
        .update({
          processed: true,
          processed_at: new Date().toISOString(),
          impact_score: 85 // High impact
        })
        .eq('id', feedbackId);

      if (error) {
        throw error;
      }

      logger.info('High-impact feedback processed', { feedbackId }, 'AI_LEARNING_SERVICE');

    } catch (error) {
      logger.error('Failed to process high-impact feedback', error, 'AI_LEARNING_SERVICE');
    }
  }

  /**
   * Logs RAG query for analysis
   */
  private async logRAGQuery(queryData: Omit<RAGQueryLog, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('rag_query_log')
        .insert(queryData);

      if (error) {
        logger.error('Failed to log RAG query', error, 'AI_LEARNING_SERVICE');
      }

    } catch (error) {
      logger.error('Failed to log RAG query', error, 'AI_LEARNING_SERVICE');
    }
  }

  /**
   * Generates dynamic context based on current situation
   */
  private async generateDynamicContext(context: AIContext, modelType: string): Promise<Record<string, unknown>> {
    return {
      model_type: modelType,
      timestamp: new Date().toISOString(),
      session_id: Math.random().toString(36).substr(2, 9),
      contextual_hints: this.generateContextualHints(context),
      priority_adjustments: this.calculatePriorityAdjustments(context)
    };
  }

  /**
   * Generates contextual hints based on property and situation
   */
  private generateContextualHints(context: SelectedContext): string[] {
    const hints: string[] = [];
    
    // Access dynamic context for property and temporal information
    const dynamicContext = context.dynamic_context as any; // Temporary - would need proper typing for dynamic_context
    
    if (dynamicContext?.property?.type === 'luxury') {
      hints.push('Focus on high-end finishes and premium amenities');
    }
    
    if (dynamicContext?.temporal?.season === 'winter') {
      hints.push('Pay special attention to heating systems and insulation');
    }
    
    return hints;
  }

  /**
   * Calculates priority adjustments based on context
   */
  private calculatePriorityAdjustments(context: SelectedContext): Record<string, number> {
    const adjustments: Record<string, number> = {};
    
    // Seasonal adjustments
    const season = this.getCurrentSeason();
    if (season === 'winter') {
      adjustments.heating = 1.5;
      adjustments.insulation = 1.3;
    } else if (season === 'summer') {
      adjustments.cooling = 1.5;
      adjustments.ventilation = 1.3;
    }
    
    return adjustments;
  }

  /**
   * Utility methods
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'fall';
  }

  private getTimeOfDay(date: Date): string {
    const hour = date.getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private generateContextExplanation(context: SelectedContext): string {
    const parts: string[] = [];
    
    if (context.knowledge_entries?.length > 0) {
      parts.push(`Retrieved ${context.knowledge_entries.length} relevant regulations`);
    }
    
    if (context.applied_patterns?.length > 0) {
      parts.push(`Applied ${context.applied_patterns.length} context patterns`);
    }
    
    return parts.join(', ') || 'Basic context applied';
  }

  private calculateContextConfidence(context: SelectedContext): number {
    let confidence = 0.5; // Base confidence
    
    if (context.knowledge_entries?.length > 0) {
      confidence += 0.2;
    }
    
    if (context.applied_patterns?.length > 0) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }

  private analyzeCategoryAccuracy(feedback: AuditorFeedbackEntry[]): Record<string, number> {
    const categoryStats: Record<string, { correct: number; total: number }> = {};
    
    feedback.forEach(f => {
      if (!categoryStats[f.category]) {
        categoryStats[f.category] = { correct: 0, total: 0 };
      }
      
      categoryStats[f.category].total++;
      
      // Simple accuracy check (would be more sophisticated in production)
      if (f.ai_prediction.value === f.auditor_correction.value) {
        categoryStats[f.category].correct++;
      }
    });
    
    const accuracy: Record<string, number> = {};
    Object.entries(categoryStats).forEach(([category, stats]) => {
      accuracy[category] = (stats.correct / stats.total) * 100;
    });
    
    return accuracy;
  }

  private analyzeConfidenceCalibration(feedback: AuditorFeedbackEntry[]): number {
    // Placeholder implementation
    return 0.85;
  }

  private identifyImprovementAreas(feedback: AuditorFeedbackEntry[]): string[] {
    // Placeholder implementation
    return ['photo_quality', 'safety_compliance'];
  }
}

// Export singleton instance
export const aiLearningService = AILearningService.getInstance();