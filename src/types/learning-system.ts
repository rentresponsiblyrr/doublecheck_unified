/**
 * Professional Type Definitions for Learning System
 * Eliminates all 'any' types with proper TypeScript interfaces
 */

export interface AILearningMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confidenceScore: number;
  predictionTimestamp: string;
  actualTimestamp?: string;
}

export interface LearningOutcome {
  id: string;
  prediction: string;
  actual: string;
  confidence: number;
  isCorrect: boolean;
  category: string;
  timestamp: string;
  contextData: Record<string, unknown>;
}

export interface AIPerformanceAnalysis {
  totalPredictions: number;
  correctPredictions: number;
  averageConfidence: number;
  accuracyByCategory: Record<string, number>;
  calibrationError: number;
  improvementAreas: string[];
  timeRange: {
    start: string;
    end: string;
  };
}

export interface LearningRecommendation {
  id: string;
  type: 'accuracy' | 'confidence' | 'prompt' | 'dataset' | 'model';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation: string;
  expectedImprovement: number;
  effort: 'low' | 'medium' | 'high';
  category: string;
}

export interface ConfidenceCalibration {
  binAccuracy: number[];
  binConfidence: number[];
  binCounts: number[];
  expectedCalibrationError: number;
  maxCalibrationError: number;
  reliability: number;
}

export interface LearningContextData {
  inspectionId?: string;
  propertyId?: string;
  checklistItemId?: string;
  inspectorId?: string;
  timestamp: string;
  environmentContext: {
    deviceType: string;
    networkCondition: string;
    userExperience: number;
  };
}

export interface AIModelMetrics {
  modelVersion: string;
  trainingData: {
    samples: number;
    lastUpdated: string;
    quality: number;
  };
  performance: {
    accuracy: number;
    latency: number;
    throughput: number;
  };
  costMetrics: {
    tokensUsed: number;
    costPerPrediction: number;
    totalCost: number;
  };
}

export interface LearningSystemState {
  isActive: boolean;
  lastLearningUpdate: string;
  learningRate: number;
  adaptationThreshold: number;
  modelPerformance: AIModelMetrics;
  activeRecommendations: LearningRecommendation[];
}