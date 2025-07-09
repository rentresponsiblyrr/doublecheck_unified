// Enhanced AI Service with CAG (Context Augmented Generation) Integration
// Combines the existing OpenAI service with advanced context augmentation

import { STRCertifiedAIService } from './openai-service';
import { aiLearningService } from '@/services/aiLearningService';
import { logger } from '@/utils/logger';
import type {
  AIAnalysisResult,
  PhotoComparisonResult,
  DynamicChecklistItem,
  PropertyData,
  AIServiceConfig,
  AIAnalysisOptions
} from './types';
import type {
  CAGContextRequest,
  CAGContextResponse,
  FeedbackSubmissionRequest,
  AuditorFeedbackEntry
} from '@/types/ai-database';

interface EnhancedAnalysisResult extends AIAnalysisResult {
  context_used: {
    knowledge_sources: string[];
    applied_patterns: string[];
    confidence_boost: number;
  };
  learning_metadata: {
    model_version: string;
    processing_time_ms: number;
    context_retrieval_time_ms: number;
    total_time_ms: number;
  };
}

interface InspectionContext {
  property: {
    id: string;
    type: string;
    location: {
      city: string;
      state: string;
      climate?: string;
    };
    amenities: string[];
    value_estimate?: number;
    special_features?: string[];
  };
  inspector: {
    id: string;
    experience_level?: 'junior' | 'mid' | 'senior' | 'expert';
    specializations?: string[];
    performance_rating?: number;
  };
  temporal: {
    season: 'spring' | 'summer' | 'fall' | 'winter';
    time_of_day: 'morning' | 'afternoon' | 'evening';
    weather_conditions?: string;
  };
  inspection: {
    id: string;
    current_step: number;
    total_steps: number;
    priority_areas?: string[];
  };
}

export class EnhancedAIService extends STRCertifiedAIService {
  private currentModelVersion = 'v1.1.0-cag';
  private contextCache = new Map<string, CAGContextResponse>();
  private feedbackBuffer: AuditorFeedbackEntry[] = [];

  constructor(config: AIServiceConfig) {
    super(config);
  }

  /**
   * Enhanced photo analysis with context augmentation
   */
  async analyzeInspectionPhotoWithContext(
    file: File,
    checklistItem: DynamicChecklistItem,
    inspectionContext: InspectionContext,
    options: AIAnalysisOptions = {}
  ): Promise<EnhancedAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // 1. Retrieve relevant context using CAG
      const contextRequest: CAGContextRequest = {
        query: `Analyze ${checklistItem.category} inspection photo: ${checklistItem.description}`,
        context: inspectionContext,
        model_type: 'photo_analysis',
        options: {
          include_patterns: true,
          context_weight: 1.0,
          max_context_length: 2000
        }
      };

      logger.info('Retrieving CAG context for photo analysis', {
        checklistItemId: checklistItem.id,
        category: checklistItem.category,
        propertyType: inspectionContext.property.type
      }, 'ENHANCED_AI_SERVICE');

      const cagContext = await aiLearningService.getCAGContext(contextRequest);
      const contextRetrievalTime = Date.now() - startTime;

      // 2. Build enhanced prompt with context
      const enhancedPrompt = this.buildContextAugmentedPrompt(
        checklistItem,
        cagContext,
        inspectionContext,
        options
      );

      // 3. Perform AI analysis with enhanced prompt
      const analysisStartTime = Date.now();
      const baseAnalysis = await this.analyzeInspectionPhoto(
        file,
        enhancedPrompt,
        options
      );
      const analysisTime = Date.now() - analysisStartTime;

      // 4. Enhance result with context information
      const enhancedResult: EnhancedAnalysisResult = {
        ...baseAnalysis,
        confidence: this.adjustConfidenceWithContext(
          baseAnalysis.confidence,
          cagContext,
          checklistItem
        ),
        reasoning: this.enhanceReasoningWithContext(
          baseAnalysis.reasoning,
          cagContext
        ),
        context_used: {
          knowledge_sources: cagContext.selected_context.knowledge_entries.map(k => k.title),
          applied_patterns: cagContext.selected_context.applied_patterns.map(p => p.pattern_name),
          confidence_boost: this.calculateConfidenceBoost(cagContext)
        },
        learning_metadata: {
          model_version: this.currentModelVersion,
          processing_time_ms: analysisTime,
          context_retrieval_time_ms: contextRetrievalTime,
          total_time_ms: Date.now() - startTime
        }
      };

      logger.info('Enhanced photo analysis completed', {
        checklistItemId: checklistItem.id,
        confidence: enhancedResult.confidence,
        contextSources: enhancedResult.context_used.knowledge_sources.length,
        totalTimeMs: enhancedResult.learning_metadata.total_time_ms
      }, 'ENHANCED_AI_SERVICE');

      return enhancedResult;

    } catch (error) {
      logger.error('Enhanced photo analysis failed', error, 'ENHANCED_AI_SERVICE');
      
      // Fallback to basic analysis
      const basicResult = await this.analyzeInspectionPhoto(file, checklistItem.description, options);
      return {
        ...basicResult,
        context_used: {
          knowledge_sources: [],
          applied_patterns: [],
          confidence_boost: 0
        },
        learning_metadata: {
          model_version: this.currentModelVersion,
          processing_time_ms: Date.now() - startTime,
          context_retrieval_time_ms: 0,
          total_time_ms: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Enhanced checklist generation with property-specific context
   */
  async generateContextualChecklist(
    propertyData: PropertyData,
    inspectionContext: InspectionContext
  ): Promise<{
    items: DynamicChecklistItem[];
    context_applied: string[];
    generation_confidence: number;
  }> {
    const startTime = Date.now();

    try {
      // 1. Get relevant context for checklist generation
      const contextRequest: CAGContextRequest = {
        query: `Generate inspection checklist for ${propertyData.property_type} with ${propertyData.amenities.join(', ')}`,
        context: inspectionContext,
        model_type: 'checklist_generation',
        options: {
          include_patterns: true,
          context_weight: 1.0
        }
      };

      const cagContext = await aiLearningService.getCAGContext(contextRequest);

      // 2. Generate base checklist with enhanced context
      const enhancedPropertyData = this.augmentPropertyDataWithContext(
        propertyData,
        cagContext,
        inspectionContext
      );

      const baseItems = await this.generateDynamicChecklist(enhancedPropertyData);

      // 3. Apply context-specific modifications
      const contextualItems = this.applyContextualModifications(
        baseItems,
        cagContext,
        inspectionContext
      );

      logger.info('Contextual checklist generated', {
        itemCount: contextualItems.length,
        appliedPatterns: cagContext.selected_context.applied_patterns.length,
        processingTimeMs: Date.now() - startTime
      }, 'ENHANCED_AI_SERVICE');

      return {
        items: contextualItems,
        context_applied: [
          ...cagContext.selected_context.knowledge_entries.map(k => k.title),
          ...cagContext.selected_context.applied_patterns.map(p => p.pattern_name)
        ],
        generation_confidence: cagContext.confidence_score
      };

    } catch (error) {
      logger.error('Contextual checklist generation failed', error, 'ENHANCED_AI_SERVICE');
      
      // Fallback to basic generation
      const basicItems = await this.generateDynamicChecklist(propertyData);
      return {
        items: basicItems,
        context_applied: [],
        generation_confidence: 0.5
      };
    }
  }

  /**
   * Validates inspection completeness with contextual awareness
   */
  async validateInspectionCompletenessWithContext(
    checklistItems: any[],
    photos: File[],
    inspectionContext: InspectionContext
  ): Promise<{
    complete: boolean;
    missingItems: string[];
    recommendations: string[];
    confidence: number;
    context_insights: string[];
  }> {
    try {
      // Get context-specific validation criteria
      const contextRequest: CAGContextRequest = {
        query: `Validate inspection completeness for ${inspectionContext.property.type} property`,
        context: inspectionContext,
        model_type: 'completeness_validation'
      };

      const cagContext = await aiLearningService.getCAGContext(contextRequest);

      // Perform enhanced validation
      const baseValidation = await this.validateInspectionCompleteness(checklistItems, photos);

      // Apply contextual insights
      const contextInsights = this.generateContextualInsights(
        checklistItems,
        photos,
        cagContext,
        inspectionContext
      );

      // Enhance recommendations with context
      const enhancedRecommendations = [
        ...baseValidation.recommendations,
        ...this.generateContextualRecommendations(cagContext, inspectionContext)
      ];

      return {
        complete: baseValidation.complete,
        missingItems: baseValidation.missingItems,
        recommendations: enhancedRecommendations,
        confidence: baseValidation.confidence,
        context_insights: contextInsights
      };

    } catch (error) {
      logger.error('Contextual validation failed', error, 'ENHANCED_AI_SERVICE');
      
      // Fallback to basic validation
      const basic = await this.validateInspectionCompleteness(checklistItems, photos);
      return {
        ...basic,
        context_insights: []
      };
    }
  }

  /**
   * Processes auditor feedback for continuous learning
   */
  async processAuditorFeedback(
    inspectionId: string,
    checklistItemId: string,
    aiPrediction: any,
    auditorCorrection: any,
    category: string,
    feedbackType: 'correction' | 'validation' | 'suggestion' | 'issue'
  ): Promise<void> {
    try {
      const feedbackRequest: FeedbackSubmissionRequest = {
        inspection_id: inspectionId,
        checklist_item_id: checklistItemId,
        ai_prediction: {
          value: aiPrediction,
          confidence: aiPrediction.confidence || 75,
          reasoning: aiPrediction.reasoning,
          model_version: this.currentModelVersion
        },
        auditor_correction: {
          value: auditorCorrection,
          confidence: auditorCorrection.confidence || 90,
          reasoning: auditorCorrection.reasoning || 'Auditor correction'
        },
        feedback_type: feedbackType,
        category: category as any
      };

      await aiLearningService.submitAuditorFeedback(feedbackRequest);

      logger.info('Auditor feedback processed', {
        inspectionId,
        checklistItemId,
        category,
        feedbackType
      }, 'ENHANCED_AI_SERVICE');

    } catch (error) {
      logger.error('Failed to process auditor feedback', error, 'ENHANCED_AI_SERVICE');
      throw error;
    }
  }

  // ===================================================================
  // PRIVATE HELPER METHODS
  // ===================================================================

  private buildContextAugmentedPrompt(
    checklistItem: DynamicChecklistItem,
    cagContext: CAGContextResponse,
    inspectionContext: InspectionContext,
    options: AIAnalysisOptions
  ): string {
    const basePrompt = checklistItem.description;
    
    let enhancedPrompt = `${basePrompt}\n\nCONTEXT:\n`;
    
    // Add relevant knowledge base information
    if (cagContext.selected_context.knowledge_entries.length > 0) {
      enhancedPrompt += '\nRELEVANT REGULATIONS:\n';
      cagContext.selected_context.knowledge_entries.forEach(entry => {
        enhancedPrompt += `- ${entry.title}: ${entry.content.substring(0, 200)}...\n`;
      });
    }
    
    // Add applicable patterns
    if (cagContext.selected_context.applied_patterns.length > 0) {
      enhancedPrompt += '\nAPPLICABLE INSPECTION PATTERNS:\n';
      cagContext.selected_context.applied_patterns.forEach(pattern => {
        const focusAreas = pattern.context_data.focus_areas || [];
        if (focusAreas.length > 0) {
          enhancedPrompt += `- Focus on: ${focusAreas.join(', ')}\n`;
        }
      });
    }
    
    // Add property-specific context
    enhancedPrompt += `\nPROPERTY CONTEXT:\n`;
    enhancedPrompt += `- Type: ${inspectionContext.property.type}\n`;
    enhancedPrompt += `- Location: ${inspectionContext.property.location.city}, ${inspectionContext.property.location.state}\n`;
    enhancedPrompt += `- Amenities: ${inspectionContext.property.amenities.join(', ')}\n`;
    
    // Add seasonal considerations
    enhancedPrompt += `\nSEASONAL CONSIDERATIONS:\n`;
    enhancedPrompt += `- Season: ${inspectionContext.temporal.season}\n`;
    enhancedPrompt += `- Time: ${inspectionContext.temporal.time_of_day}\n`;
    
    return enhancedPrompt;
  }

  private adjustConfidenceWithContext(
    baseConfidence: number,
    cagContext: CAGContextResponse,
    checklistItem: DynamicChecklistItem
  ): number {
    let adjustedConfidence = baseConfidence;
    
    // Boost confidence if we have relevant knowledge
    if (cagContext.selected_context.knowledge_entries.length > 0) {
      adjustedConfidence += 5;
    }
    
    // Boost confidence if applicable patterns are found
    if (cagContext.selected_context.applied_patterns.length > 0) {
      adjustedConfidence += 3;
    }
    
    // Adjust based on item importance
    if (checklistItem.priority === 'critical') {
      adjustedConfidence += 2;
    }
    
    return Math.min(adjustedConfidence, 100);
  }

  private enhanceReasoningWithContext(
    baseReasoning: string,
    cagContext: CAGContextResponse
  ): string {
    let enhancedReasoning = baseReasoning;
    
    if (cagContext.selected_context.knowledge_entries.length > 0) {
      enhancedReasoning += `\n\nContext from regulations: This assessment considers relevant building codes and safety regulations.`;
    }
    
    if (cagContext.selected_context.applied_patterns.length > 0) {
      enhancedReasoning += `\n\nContextual patterns: Analysis adapted for property-specific characteristics.`;
    }
    
    return enhancedReasoning;
  }

  private calculateConfidenceBoost(cagContext: CAGContextResponse): number {
    let boost = 0;
    
    boost += cagContext.selected_context.knowledge_entries.length * 2;
    boost += cagContext.selected_context.applied_patterns.length * 3;
    boost += cagContext.confidence_score * 5;
    
    return Math.min(boost, 15);
  }

  private augmentPropertyDataWithContext(
    propertyData: PropertyData,
    cagContext: CAGContextResponse,
    inspectionContext: InspectionContext
  ): PropertyData {
    // Clone property data and enhance with context
    const enhanced = { ...propertyData };
    
    // Add special features based on context patterns
    const additionalFeatures: string[] = [];
    cagContext.selected_context.applied_patterns.forEach(pattern => {
      const focusAreas = pattern.context_data.focus_areas || [];
      additionalFeatures.push(...focusAreas);
    });
    
    enhanced.special_features = [
      ...(enhanced.special_features || []),
      ...additionalFeatures
    ];
    
    return enhanced;
  }

  private applyContextualModifications(
    baseItems: DynamicChecklistItem[],
    cagContext: CAGContextResponse,
    inspectionContext: InspectionContext
  ): DynamicChecklistItem[] {
    return baseItems.map(item => {
      const modified = { ...item };
      
      // Adjust priority based on context patterns
      cagContext.selected_context.applied_patterns.forEach(pattern => {
        const priorityAdjustments = pattern.context_data.priority_adjustments || {};
        if (priorityAdjustments[item.category]) {
          // Increase estimated time if priority is higher
          modified.estimatedTimeMinutes = Math.round(
            modified.estimatedTimeMinutes * priorityAdjustments[item.category]
          );
        }
      });
      
      // Add seasonal modifications
      if (inspectionContext.temporal.season === 'winter' && item.category === 'safety') {
        modified.description += ' Pay special attention to heating safety and ice prevention.';
      }
      
      return modified;
    });
  }

  private generateContextualInsights(
    checklistItems: any[],
    photos: File[],
    cagContext: CAGContextResponse,
    inspectionContext: InspectionContext
  ): string[] {
    const insights: string[] = [];
    
    // Check if seasonal considerations were applied
    if (inspectionContext.temporal.season === 'winter') {
      insights.push('Winter inspection protocols applied - heating and insulation given priority');
    }
    
    // Check if property-specific patterns were used
    if (cagContext.selected_context.applied_patterns.length > 0) {
      insights.push(`Applied ${cagContext.selected_context.applied_patterns.length} property-specific inspection patterns`);
    }
    
    // Check photo coverage
    const photosPerItem = photos.length / checklistItems.length;
    if (photosPerItem < 1) {
      insights.push('Consider additional photo documentation for thorough inspection');
    }
    
    return insights;
  }

  private generateContextualRecommendations(
    cagContext: CAGContextResponse,
    inspectionContext: InspectionContext
  ): string[] {
    const recommendations: string[] = [];
    
    // Add knowledge-based recommendations
    cagContext.selected_context.knowledge_entries.forEach(entry => {
      if (entry.category === 'safety_regulations') {
        recommendations.push(`Ensure compliance with ${entry.title}`);
      }
    });
    
    // Add pattern-based recommendations
    cagContext.selected_context.applied_patterns.forEach(pattern => {
      const additionalChecks = pattern.context_data.additional_checks || [];
      additionalChecks.forEach(check => {
        recommendations.push(`Consider additional check: ${check}`);
      });
    });
    
    return recommendations;
  }
}

// Factory function to create enhanced AI service
export const createEnhancedAIService = (config: AIServiceConfig): EnhancedAIService => {
  return new EnhancedAIService(config);
};

// Default instance with environment configuration
export const enhancedAIService = new EnhancedAIService({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  model: 'gpt-4-vision-preview',
  maxTokens: 2000,
  temperature: 0.2
});