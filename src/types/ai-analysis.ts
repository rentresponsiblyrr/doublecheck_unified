/**
 * AI analysis result interfaces
 * Eliminates any types in AI processing and photo analysis
 */

export interface AIAnalysisResult {
  id: string;
  confidence: number; // 0-1
  classification: 'pass' | 'fail' | 'review' | 'pending';
  reasoning: string;
  suggestions?: string[];
  processingTime: number; // milliseconds
  timestamp: string;
  modelVersion: string;
}

export interface PhotoAnalysis extends AIAnalysisResult {
  imageMetadata: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
    hasFlash: boolean;
    timestamp: string;
  };
  qualityScore: number; // 0-1
  detectedObjects: DetectedObject[];
  issues: PhotoIssue[];
  complianceChecks: ComplianceCheck[];
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  relevantToInspection: boolean;
}

export interface PhotoIssue {
  type: 'blur' | 'lighting' | 'composition' | 'obstruction' | 'quality';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedFix?: string;
}

export interface ComplianceCheck {
  requirement: string;
  status: 'passed' | 'failed' | 'warning';
  details: string;
  relevantRegulations?: string[];
}

export interface VideoAnalysis extends AIAnalysisResult {
  duration: number; // seconds
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
  keyFrames: VideoKeyFrame[];
  audioQuality?: AudioQuality;
  motionAnalysis: MotionAnalysis;
}

export interface VideoKeyFrame {
  timestamp: number; // seconds
  description: string;
  confidence: number;
  thumbnail: string; // base64 or URL
  issues?: PhotoIssue[];
}

export interface AudioQuality {
  clarity: number; // 0-1
  backgroundNoise: number; // 0-1
  hasNarration: boolean;
  transcription?: string;
}

export interface MotionAnalysis {
  steadiness: number; // 0-1
  coverage: number; // 0-1 how much of property was covered
  pacing: 'too_fast' | 'appropriate' | 'too_slow';
  recommendations?: string[];
}