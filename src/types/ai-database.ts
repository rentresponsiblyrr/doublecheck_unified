// AI Database Types for STR Certified Learning System
// Corresponds to the enhanced Supabase schema for AI learning infrastructure

// Type definitions for flexible data structures
type FlexibleValue = string | number | boolean | object | null | undefined;
type MetadataRecord = Record<string, FlexibleValue>;

export type KnowledgeCategory =
  | "building_codes"
  | "safety_regulations"
  | "ada_compliance"
  | "fire_safety"
  | "electrical_standards"
  | "plumbing_codes"
  | "hvac_requirements"
  | "structural_integrity"
  | "environmental_health"
  | "best_practices"
  | "local_ordinances";

export type FeedbackCategory =
  | "photo_quality"
  | "object_detection"
  | "room_classification"
  | "damage_assessment"
  | "completeness_check"
  | "safety_compliance"
  | "amenity_verification"
  | "measurement_accuracy"
  | "condition_rating";

export type FeedbackType = "correction" | "validation" | "suggestion" | "issue";

// ===================================================================
// KNOWLEDGE BASE TYPES
// ===================================================================

export interface KnowledgeBaseEntry {
  id: string;
  category: KnowledgeCategory;
  title: string;
  content: string;
  source: string;

  // Vector embedding (1536 dimensions for OpenAI ada-002)
  embedding: number[];

  // Flexible metadata structure
  metadata: {
    jurisdiction?: string;
    code_section?: string;
    applies_to?: string[];
    tags?: string[];
    version?: string;
    effective_date?: string;
    expiration_date?: string;
    [key: string]: FlexibleValue;
  };

  // Usage tracking
  query_count: number;
  relevance_score: number; // 0-1
  citation_count: number;

  // Lifecycle
  status: "active" | "deprecated" | "draft";
  effective_date?: string;
  expiration_date?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSearchResult
  extends Omit<KnowledgeBaseEntry, "embedding"> {
  similarity: number;
}

export interface KnowledgeSearchRequest {
  query: string;
  category?: KnowledgeCategory;
  threshold?: number; // Similarity threshold (0-1)
  limit?: number;
  filters?: {
    jurisdiction?: string;
    tags?: string[];
    status?: "active" | "deprecated" | "draft";
  };
}

// ===================================================================
// AUDITOR FEEDBACK TYPES
// ===================================================================

export interface AuditorFeedbackEntry {
  id: string;
  inspection_id: string;
  auditor_id: string;
  checklist_item_id?: string;

  // Core feedback data
  ai_prediction: {
    value: FlexibleValue;
    confidence: number;
    reasoning?: string;
    model_version: string;
    processing_time_ms?: number;
  };

  auditor_correction: {
    value: FlexibleValue;
    confidence: number;
    reasoning: string;
    severity?: "minor" | "moderate" | "major";
    evidence?: {
      photo_ids?: string[];
      video_timestamp?: number;
      additional_notes?: string;
    };
  };

  // Categorization
  feedback_type: FeedbackType;
  category: FeedbackCategory;

  // Learning impact metrics
  confidence_impact?: number; // -100 to +100
  accuracy_improvement?: number;

  // Context preservation for pattern learning
  property_context: {
    property_type?: string;
    property_value?: number;
    location?: {
      city: string;
      state: string;
      climate?: string;
    };
    amenities?: string[];
    special_features?: string[];
  };

  inspector_context: {
    inspector_id: string;
    experience_level?: "junior" | "mid" | "senior" | "expert";
    specializations?: string[];
    performance_rating?: number;
  };

  temporal_context: {
    season?: "spring" | "summer" | "fall" | "winter";
    time_of_day?: "morning" | "afternoon" | "evening";
    weather_conditions?: string;
    market_conditions?: string;
  };

  // Learning processing state
  processed: boolean;
  processed_at?: string;
  impact_score?: number; // 0-100

  // Pattern identification
  identified_patterns?: string[];
  similar_cases?: string[]; // IDs of similar feedback instances

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface FeedbackSubmissionRequest {
  inspection_id: string;
  checklist_item_id?: string;
  ai_prediction: AuditorFeedbackEntry["ai_prediction"];
  auditor_correction: AuditorFeedbackEntry["auditor_correction"];
  feedback_type: FeedbackType;
  category: FeedbackCategory;
  additional_context?: {
    notes?: string;
    evidence?: AuditorFeedbackEntry["auditor_correction"]["evidence"];
  };
}

// ===================================================================
// AI MODEL VERSIONING TYPES
// ===================================================================

export interface AIModelVersion {
  id: string;
  version: string; // e.g., "v1.2.3"
  model_type:
    | "photo_analysis"
    | "checklist_generation"
    | "completeness_validation"
    | "pattern_recognition";
  parent_version?: string;

  // Performance metrics
  accuracy_rate?: number; // 0-100
  confidence_calibration?: number;
  processing_speed_ms?: number;
  false_positive_rate?: number;
  false_negative_rate?: number;

  // Training data statistics
  training_feedback_count: number;
  validation_feedback_count: number;
  validation_results: {
    test_set_accuracy?: number;
    cross_validation_score?: number;
    auditor_approval_rate?: number;
    confidence_calibration_score?: number;
  };

  // Model configuration
  model_parameters: {
    temperature?: number;
    max_tokens?: number;
    confidence_threshold?: number;
    [key: string]: FlexibleValue;
  };

  training_config: {
    learning_rate?: number;
    batch_size?: number;
    epochs?: number;
    validation_split?: number;
    [key: string]: FlexibleValue;
  };

  // Deployment information
  deployed_at?: string;
  deployment_trigger?: "scheduled" | "threshold" | "manual";
  deployment_notes?: string;

  // Lifecycle
  status: "training" | "testing" | "deployed" | "deprecated";
  deprecated_at?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ModelPerformanceMetrics {
  version: string;
  model_type: string;
  period_start: string;
  period_end: string;

  // Accuracy metrics
  overall_accuracy: number;
  accuracy_by_category: Record<FeedbackCategory, number>;
  accuracy_trend: "improving" | "declining" | "stable";

  // Confidence metrics
  confidence_calibration: number;
  overconfidence_rate: number;
  underconfidence_rate: number;

  // Performance metrics
  avg_processing_time: number;
  success_rate: number;
  error_rate: number;

  // Learning metrics
  feedback_volume: number;
  correction_rate: number;
  improvement_velocity: number; // Rate of accuracy improvement
}

// ===================================================================
// CAG (CONTEXT AUGMENTED GENERATION) TYPES
// ===================================================================

export interface CAGContextPattern {
  id: string;
  pattern_name: string;
  pattern_type:
    | "property_specific"
    | "seasonal"
    | "regulatory"
    | "inspector_specific"
    | "temporal";

  // Pattern definition
  conditions: {
    property?: {
      type?: string[];
      value_range?: { min?: number; max?: number };
      amenities?: { includes?: string[]; excludes?: string[] };
      location?: { states?: string[]; cities?: string[]; climate?: string[] };
    };
    temporal?: {
      months?: number[];
      seasons?: string[];
      time_of_day?: string[];
      weather?: string[];
    };
    inspector?: {
      experience_levels?: string[];
      specializations?: string[];
      performance_threshold?: number;
    };
    [key: string]: FlexibleValue;
  };

  context_data: {
    focus_areas?: string[];
    additional_checks?: string[];
    quality_threshold?: number;
    priority_adjustments?: Record<string, number>;
    regulatory_emphasis?: string[];
    [key: string]: FlexibleValue;
  };

  weight: number; // 0-1, importance of this pattern

  // Performance tracking
  usage_count: number;
  accuracy_improvement?: number;
  confidence_boost?: number;

  // Validation
  confidence: number; // 0-1, confidence in pattern effectiveness
  last_validated: string;
  validation_score?: number;

  // Status
  status: "active" | "testing" | "deprecated";

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface RAGQueryLog {
  id: string;
  query_text: string;
  query_embedding?: number[]; // 1536 dimensions
  query_type:
    | "checklist_generation"
    | "photo_analysis"
    | "completeness_validation"
    | "regulatory_lookup";

  // Context and retrieval
  retrieved_knowledge_ids: string[];
  similarity_scores: number[];
  selected_context: {
    knowledge_entries?: KnowledgeSearchResult[];
    applied_patterns?: CAGContextPattern[];
    dynamic_context?: MetadataRecord;
  };
  context_selection_reason?: string;

  // CAG-specific context augmentation
  cag_patterns_applied: string[];
  context_weight: number;
  dynamic_context: MetadataRecord;

  // Performance metrics
  query_time_ms?: number;
  context_retrieval_time_ms?: number;
  total_processing_time_ms?: number;

  // Outcome tracking
  ai_prediction_accuracy?: number;
  auditor_satisfaction_score?: number; // 1-5
  context_relevance_score?: number; // 0-1

  // Associated inspection data
  inspection_id?: string;
  checklist_item_id?: string;

  // Timestamp
  created_at: string;
}

// ===================================================================
// LEARNING METRICS AND ANALYTICS TYPES
// ===================================================================

export interface LearningMetricsEntry {
  id: string;
  model_version?: string;
  metric_type: "daily" | "weekly" | "monthly" | "quarterly";
  category?: FeedbackCategory;

  // Time period
  period_start: string;
  period_end: string;

  // Aggregated metrics
  total_feedback: number;
  corrections_count: number;
  validations_count: number;
  accuracy_rate?: number;
  confidence_improvement?: number;

  // Trend analysis
  trend_direction?: "improving" | "declining" | "stable";
  change_percent?: number;

  // Context analysis
  property_type_performance: Record<
    string,
    {
      accuracy: number;
      feedback_count: number;
      improvement_rate: number;
    }
  >;

  inspector_performance: Record<
    string,
    {
      accuracy: number;
      feedback_volume: number;
      consistency_score: number;
    }
  >;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface LearningInsight {
  id: string;
  type: "pattern" | "anomaly" | "recommendation" | "achievement";
  severity: "info" | "warning" | "critical" | "success";

  title: string;
  description: string;
  affected_categories: FeedbackCategory[];

  // Actionable recommendations
  suggested_actions?: string[];
  estimated_impact?: {
    accuracy_improvement?: number;
    confidence_boost?: number;
    processing_speed_improvement?: number;
  };

  // Supporting metrics
  metrics?: {
    confidence?: number;
    frequency?: number;
    trend_strength?: number;
    [key: string]: FlexibleValue;
  };

  // Implementation tracking
  action_taken?: boolean;
  action_date?: string;
  action_notes?: string;

  created_at: string;
}

// ===================================================================
// API REQUEST/RESPONSE TYPES
// ===================================================================

export interface SemanticSearchRequest {
  query: string;
  embedding?: number[];
  filters?: {
    category?: KnowledgeCategory;
    threshold?: number;
    limit?: number;
    jurisdiction?: string;
    tags?: string[];
  };
}

export interface SemanticSearchResponse {
  results: KnowledgeSearchResult[];
  query_time_ms: number;
  total_matches: number;
  used_cache: boolean;
}

export interface CAGContextRequest {
  query: string;
  context: {
    property?: MetadataRecord;
    inspector?: MetadataRecord;
    temporal?: MetadataRecord;
  };
  model_type: string;
  options?: {
    include_patterns?: boolean;
    context_weight?: number;
    max_context_length?: number;
  };
}

export interface CAGContextResponse {
  selected_context: {
    knowledge_entries: KnowledgeSearchResult[];
    applied_patterns: CAGContextPattern[];
    dynamic_context: MetadataRecord;
  };
  context_explanation: string;
  confidence_score: number;
  processing_time_ms: number;
}

export interface ModelTrainingRequest {
  model_type: string;
  training_data: {
    feedback_ids: string[];
    validation_split: number;
  };
  training_config: AIModelVersion["training_config"];
  parent_version?: string;
}

export interface ModelTrainingResponse {
  training_job_id: string;
  estimated_completion: string;
  status: "queued" | "training" | "validating" | "completed" | "failed";
  progress?: {
    current_epoch?: number;
    total_epochs?: number;
    current_loss?: number;
    validation_accuracy?: number;
  };
}

// ===================================================================
// UTILITY TYPES
// ===================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  metadata?: MetadataRecord;
}

export interface PerformanceBenchmark {
  metric_name: string;
  current_value: number;
  target_value: number;
  benchmark_date: string;
  trend: "improving" | "declining" | "stable";
  change_rate: number; // % change per time period
}
