// AI Learning System Types for STR Certified

export interface AuditorFeedback {
  id: string;
  inspectionId: string;
  auditorId: string;
  timestamp: Date;
  feedbackType: 'correction' | 'validation' | 'suggestion' | 'issue';
  category: FeedbackCategory;
  
  // AI prediction vs auditor correction
  aiPrediction: {
    value: unknown;
    confidence: number;
    reasoning?: string;
    modelVersion: string;
  };
  
  auditorCorrection: {
    value: unknown;
    confidence: number;
    reasoning: string;
  };
  
  // Additional context
  context: {
    propertyType: string;
    roomType?: string;
    checklistItem?: string;
    photoId?: string;
    videoTimestamp?: number;
  };
  
  // Learning metadata
  learningMetadata: {
    processed: boolean;
    processedAt?: Date;
    impactScore: number; // 0-100, how much this feedback impacts the model
    patterns?: string[]; // Identified patterns from this feedback
  };
}

export type FeedbackCategory = 
  | 'photo_quality'
  | 'object_detection'
  | 'room_classification'
  | 'damage_assessment'
  | 'completeness_check'
  | 'safety_compliance'
  | 'amenity_verification'
  | 'measurement_accuracy'
  | 'condition_rating';

export interface LearningMetrics {
  periodStart: Date;
  periodEnd: Date;
  
  // Overall metrics
  accuracyTrend: TrendData;
  confidenceImprovement: TrendData;
  feedbackVolume: number;
  feedbackProcessed: number;
  
  // Category-specific performance
  categoryPerformance: Map<FeedbackCategory, CategoryMetrics>;
  
  // Property type performance
  propertyTypePerformance: Map<string, PropertyTypeMetrics>;
  
  // Model improvements
  modelUpdates: ModelUpdate[];
  
  // Key insights
  insights: LearningInsight[];
}

export interface TrendData {
  dataPoints: Array<{
    timestamp: Date;
    value: number;
  }>;
  trend: 'improving' | 'declining' | 'stable';
  changePercent: number;
  forecast?: number; // Predicted next value
}

export interface CategoryMetrics {
  category: FeedbackCategory;
  totalFeedback: number;
  corrections: number;
  validations: number;
  accuracy: number; // 0-100
  confidenceAvg: number; // 0-100
  commonErrors: Array<{
    type: string;
    frequency: number;
    examples: string[];
  }>;
  improvementRate: number; // % improvement over period
}

export interface PropertyTypeMetrics {
  propertyType: string;
  inspectionCount: number;
  feedbackCount: number;
  accuracy: number;
  specificChallenges: string[];
  learningProgress: {
    learned: string[];
    inProgress: string[];
    needsMoreData: string[];
  };
}

export interface ModelUpdate {
  version: string;
  timestamp: Date;
  trigger: 'scheduled' | 'threshold' | 'manual';
  feedbackIncorporated: number;
  improvements: Array<{
    category: FeedbackCategory;
    metric: string;
    before: number;
    after: number;
  }>;
  validationResults: {
    testSetAccuracy: number;
    crossValidation: number;
    auditorApproval?: number;
  };
}

export interface LearningInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'recommendation' | 'achievement';
  severity: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  description: string;
  affectedCategories: FeedbackCategory[];
  suggestedActions?: string[];
  metrics?: Record<string, number>;
  createdAt: Date;
}

// Knowledge Base Types

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  source: string;
  
  // Vector embeddings for RAG
  embeddings: {
    vector: number[];
    model: string;
    dimension: number;
  };
  
  // Metadata
  metadata: {
    regulationType?: 'building_code' | 'safety' | 'ada' | 'fire' | 'electrical' | 'plumbing';
    jurisdiction?: string;
    applicablePropertyTypes?: string[];
    tags: string[];
    version: string;
    effectiveDate: Date;
    expirationDate?: Date;
  };
  
  // Usage tracking
  usage: {
    queryCount: number;
    lastQueried?: Date;
    relevanceScore: number; // Based on auditor feedback
    citationCount: number;
  };
  
  lastUpdated: Date;
  status: 'active' | 'deprecated' | 'draft';
}

export type KnowledgeCategory = 
  | 'building_codes'
  | 'safety_regulations'
  | 'ada_compliance'
  | 'fire_safety'
  | 'electrical_standards'
  | 'plumbing_codes'
  | 'hvac_requirements'
  | 'structural_integrity'
  | 'environmental_health'
  | 'best_practices'
  | 'local_ordinances';

// Learning Configuration
export interface LearningConfig {
  // Feedback processing
  minFeedbackForUpdate: number; // Minimum feedback items before model update
  confidenceThreshold: number; // Minimum confidence for automatic acceptance
  feedbackAggregationWindow: number; // Hours to aggregate feedback
  
  // Model update settings
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  validationSplitRatio: number; // Percentage for validation set
  minAccuracyImprovement: number; // Minimum improvement to deploy new model
  
  // Knowledge base settings
  embeddingModel: string;
  vectorDimension: number;
  similarityThreshold: number;
  maxRetrievalResults: number;
  
  // Performance thresholds
  criticalAccuracyThreshold: number; // Below this triggers alerts
  targetAccuracy: number; // Goal accuracy
  confidenceDecayRate: number; // How fast confidence decreases without feedback
}

// Feedback Collection Types
export interface FeedbackFormData {
  inspectionId: string;
  feedbackItems: FeedbackItem[];
  overallRating: number; // 1-5
  comments?: string;
  suggestedImprovements?: string[];
}

export interface FeedbackItem {
  id: string;
  type: FeedbackCategory;
  aiValue: any;
  correctValue: any;
  confidenceRating: number; // 0-100
  severity: 'minor' | 'moderate' | 'major';
  explanation?: string;
  evidence?: {
    photoIds?: string[];
    videoTimestamp?: number;
    checklistItemId?: string;
  };
}

// Learning Progress Types
export interface LearningProgress {
  modelVersion: string;
  startDate: Date;
  currentDate: Date;
  
  // Overall progress
  overallAccuracy: number;
  overallImprovement: number; // % improvement since start
  feedbackProcessed: number;
  
  // Category progress
  categoryProgress: Map<FeedbackCategory, {
    startAccuracy: number;
    currentAccuracy: number;
    improvement: number;
    dataPoints: number;
    nextMilestone: {
      target: number;
      estimatedDate?: Date;
      requiredFeedback: number;
    };
  }>;
  
  // Milestones achieved
  achievements: Array<{
    type: 'accuracy' | 'volume' | 'consistency' | 'speed';
    category?: FeedbackCategory;
    milestone: string;
    achievedAt: Date;
    metric: number;
  }>;
  
  // Predictions
  predictions: {
    nextWeekAccuracy: number;
    nextMonthAccuracy: number;
    timeToTarget: number; // Days to reach target accuracy
    bottlenecks: string[]; // Areas slowing progress
  };
}

// Pattern Recognition Types
export interface LearningPattern {
  id: string;
  name: string;
  description: string;
  category: FeedbackCategory;
  
  // Pattern definition
  pattern: {
    conditions: Array<{
      field: string;
      operator: 'equals' | 'contains' | 'gt' | 'lt' | 'regex';
      value: any;
    }>;
    frequency: number; // Minimum occurrences
    timeWindow?: number; // Hours
  };
  
  // Pattern metadata
  metadata: {
    firstDetected: Date;
    lastSeen: Date;
    occurrences: number;
    affectedInspections: string[];
    severity: 'low' | 'medium' | 'high';
  };
  
  // Recommended actions
  recommendations: {
    immediate: string[];
    longTerm: string[];
    modelAdjustments?: {
      parameter: string;
      currentValue: any;
      suggestedValue: any;
    }[];
  };
}