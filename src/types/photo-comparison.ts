/**
 * Photo Comparison Types
 * Extracted from PhotoComparisonView.tsx
 */

export interface PhotoQualityMetrics {
  overallScore: number;
  sharpness: number;
  brightness: number;
  contrast: number;
  colorBalance: number;
  noise: number;
  resolution: string;
  fileSize: string;
  issues?: string[];
  recommendations?: string[];
}

export interface DiscrepancyReport {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AIAnalysis {
  summary: string;
  keyFindings: string[];
  recommendation: string;
  confidence: number;
}

export interface PhotoComparisonResult {
  overallMatch: 'match' | 'partial' | 'mismatch';
  similarityScore: number;
  confidence: number;
  discrepancies: DiscrepancyReport[];
  qualityMetrics: PhotoQualityMetrics;
  aiAnalysis?: AIAnalysis;
  processingTime: number;
  timestamp: string;
}
