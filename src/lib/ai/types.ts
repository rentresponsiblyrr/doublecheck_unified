// AI Analysis Types for STR Certified

export interface AIAnalysisResult {
  confidence: number; // 0-100 confidence score
  detected_features: string[]; // Array of detected features/objects
  pass_fail_recommendation: 'pass' | 'fail' | 'review_required';
  reasoning: string; // AI explanation of the analysis
  safety_concerns?: string[]; // Optional safety issues detected
  compliance_status?: {
    building_code: boolean;
    fire_safety: boolean;
    accessibility: boolean;
  };
}

export interface PhotoComparisonResult {
  similarity_score: number; // 0-100 similarity percentage
  discrepancies: string[]; // List of differences found
  recommendation: 'matches_listing' | 'minor_differences' | 'major_discrepancies';
  confidence: number; // 0-100 confidence in comparison
  details: {
    lighting_differences: boolean;
    furniture_changes: boolean;
    structural_differences: boolean;
    room_layout_match: boolean;
  };
}

export interface DynamicChecklistItem {
  id: string;
  title: string;
  description: string;
  required: boolean;
  ai_generated: boolean;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_time_minutes: number;
  inspection_notes?: string;
}

export interface PropertyData {
  amenities: string[]; // List of property amenities
  photos: string[]; // URLs to property listing photos
  description: string; // Property description text
  room_count: {
    bedrooms: number;
    bathrooms: number;
    total_rooms?: number;
  };
  property_type: 'apartment' | 'house' | 'condo' | 'townhouse' | 'other';
  square_footage?: number;
  location: {
    city: string;
    state: string;
    country: string;
  };
  special_features?: string[]; // Pool, hot tub, fireplace, etc.
}

export interface AIServiceConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface AIAnalysisOptions {
  includeDetailedAnalysis?: boolean;
  checkSafetyConcerns?: boolean;
  compareToStandards?: boolean;
  generateRecommendations?: boolean;
}

export interface AIError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

export type AIAnalysisStatus = 'idle' | 'analyzing' | 'completed' | 'error' | 'retrying';

export interface AIAnalysisState {
  status: AIAnalysisStatus;
  result?: AIAnalysisResult;
  error?: AIError;
  progress?: number; // 0-100 for long-running analyses
}