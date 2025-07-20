/**
 * @fileoverview AI System Type Definitions
 * Professional TypeScript interfaces for AI/ML systems
 * 
 * Eliminates amateur 'any' types in AI prediction and validation systems
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

/**
 * AI prediction result structure
 */
export interface AIPrediction {
  prediction: string;
  confidence: number; // 0-1
  reasoning?: string;
  alternatives?: Array<{
    prediction: string;
    confidence: number;
  }>;
  metadata?: {
    model: string;
    version: string;
    processingTime: number;
    inputTokens?: number;
    outputTokens?: number;
  };
}

/**
 * Auditor correction for AI learning
 */
export interface AuditorCorrection {
  originalPrediction: string;
  correctedPrediction: string;
  feedback: string;
  category: 'accuracy' | 'relevance' | 'completeness' | 'safety';
  confidence: number; // 0-1
  reasoning?: string;
  tags?: string[];
}

/**
 * AI validation result
 */
export interface AIValidationResult {
  isValid: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  suggestions: string[];
  confidence: number; // 0-1
  processingTime: number;
}

/**
 * Validation issue details
 */
export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  field?: string;
  value?: unknown;
  suggestion?: string;
}

/**
 * Checklist item for AI processing
 */
export interface ChecklistItemForAI {
  id: string;
  title: string;
  description?: string;
  category: string;
  requiredEvidence: 'photo' | 'video' | 'text' | 'none';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * AI processing options
 */
export interface AIProcessingOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryCount?: number;
  enableCache?: boolean;
  context?: Record<string, unknown>;
}

/**
 * AI service response wrapper
 */
export interface AIServiceResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  metadata: {
    requestId: string;
    timestamp: number;
    processingTime: number;
    model: string;
    tokensUsed?: number;
    cached?: boolean;
  };
}

/**
 * AI learning feedback data
 */
export interface AILearningFeedback {
  id: string;
  predictionId: string;
  originalInput: string;
  aiPrediction: AIPrediction;
  humanCorrection: AuditorCorrection;
  learningScore: number; // -1 to 1, where 1 is most valuable for learning
  category: string;
  timestamp: number;
  processed: boolean;
}

/**
 * Type guard for AI prediction
 */
export function isAIPrediction(obj: unknown): obj is AIPrediction {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as AIPrediction).prediction === 'string' &&
    typeof (obj as AIPrediction).confidence === 'number'
  );
}

/**
 * Type guard for auditor correction
 */
export function isAuditorCorrection(obj: unknown): obj is AuditorCorrection {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as AuditorCorrection).originalPrediction === 'string' &&
    typeof (obj as AuditorCorrection).correctedPrediction === 'string' &&
    typeof (obj as AuditorCorrection).feedback === 'string'
  );
}

/**
 * Type guard for validation result
 */
export function isAIValidationResult(obj: unknown): obj is AIValidationResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as AIValidationResult).isValid === 'boolean' &&
    typeof (obj as AIValidationResult).score === 'number' &&
    Array.isArray((obj as AIValidationResult).issues)
  );
}