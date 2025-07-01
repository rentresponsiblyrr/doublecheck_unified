import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface InspectionData {
  id: string;
  propertyId: string;
  checklistId: string;
  inspectorId: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  items: InspectionItem[];
  score?: number;
  completedAt?: Date;
  scheduledDate?: Date;
}

export interface InspectionItem {
  id: string;
  name: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'NOT_APPLICABLE' | 'PENDING';
  notes?: string;
  photos?: string[];
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface PropertyData {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  recommendations: string[];
  aiInsights: {
    validation: InspectionValidation;
    propertyCondition: PropertyConditionAssessment;
    timestamp: string;
  };
}

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  affectedItem?: string;
}

export interface InspectionValidation {
  isValid: boolean;
  completenessScore: number;
  missingItems: string[];
  suggestions: string[];
}

export interface PropertyConditionAssessment {
  overallScore: number;
  categories: {
    structural: number;
    interior: number;
    exterior: number;
    systems: number;
  };
  maintenanceRecommendations: string[];
  priorityIssues: string[];
}

export interface MarketInsights {
  location: string;
  propertyType: string;
  insights: {
    marketTrends: string[];
    averageOccupancyRate: number;
    averageDailyRate: number;
    seasonalPatterns: Record<string, number>;
    competitorCount: number;
    investmentScore: number;
  };
  recommendations: string[];
  generatedAt: string;
}

export interface PhotoAnalysis {
  photoUrl: string;
  category?: string;
  analysis: {
    cleanliness: number;
    maintenanceIssues: string[];
    safetyConcerns: string[];
    guestExperienceImpact: string;
    complianceNotes: string[];
  };
  timestamp: string;
}

export interface ChecklistValidation {
  completeness: number;
  accuracy: number;
  missingRequired: string[];
  inconsistencies: string[];
}

// Helper type for OpenAI message formatting
export type OpenAIMessage = ChatCompletionMessageParam;

// Response format types
export interface OpenAITextResponse {
  content: string;
  tokensUsed: number;
  cached: boolean;
}

export interface OpenAIVisionResponse {
  analysis: string;
  confidence: number;
  detectedIssues: string[];
}