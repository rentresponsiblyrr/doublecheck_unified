// Photo Comparison and Quality Types for STR Certified

export interface PhotoComparisonResult {
  similarity_score: number; // 0-100 percentage similarity
  discrepancies: DiscrepancyReport[];
  quality_score: PhotoQualityMetrics;
  recommendation: ComparisonRecommendation;
  confidence: number; // 0-100 confidence in analysis
  timestamp: Date;
  processingTime: number; // milliseconds
  metadata: ComparisonMetadata;
}

export interface PhotoQualityMetrics {
  sharpness: QualityScore;
  lighting: QualityScore;
  composition: QualityScore;
  overall_score: number; // 0-100
  issues: QualityIssue[];
  suggestions: QualityImprovement[];
}

export interface QualityScore {
  score: number; // 0-100
  rating: "excellent" | "good" | "acceptable" | "poor" | "unacceptable";
  details?: string;
}

export interface QualityIssue {
  type:
    | "blur"
    | "underexposed"
    | "overexposed"
    | "poor_angle"
    | "obstruction"
    | "low_resolution";
  severity: "critical" | "major" | "minor";
  description: string;
  affectedArea?: ImageRegion;
}

export interface QualityImprovement {
  action: string;
  priority: "high" | "medium" | "low";
  icon?: string;
  estimatedImprovement: number; // percentage improvement if followed
}

export interface DiscrepancyReport {
  type: DiscrepancyType;
  severity: "critical" | "major" | "minor" | "negligible";
  description: string;
  location?: ImageRegion;
  confidence: number; // 0-100
  visualEvidence?: VisualEvidence;
}

export type DiscrepancyType =
  | "missing_furniture"
  | "furniture_moved"
  | "damage_detected"
  | "color_mismatch"
  | "missing_amenity"
  | "structural_change"
  | "cleanliness_issue"
  | "lighting_difference"
  | "staging_difference"
  | "maintenance_needed";

export interface ImageRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface VisualEvidence {
  highlightRegions: ImageRegion[];
  comparisonOverlay?: string; // base64 overlay image
  heatmapData?: number[][]; // difference heatmap
}

export type ComparisonRecommendation =
  | "matches_listing"
  | "acceptable_differences"
  | "review_required"
  | "significant_discrepancies"
  | "retake_photo";

export interface ComparisonMetadata {
  roomType?: string;
  listingPhotoDate?: Date;
  inspectorPhotoDate: Date;
  deviceInfo?: DeviceInfo;
  analysisVersion: string;
}

export interface DeviceInfo {
  deviceType: "mobile" | "tablet" | "camera";
  model?: string;
  cameraResolution?: string;
  orientation: "portrait" | "landscape";
}

// Photo capture guidance types
export interface PhotoGuidance {
  isAcceptable: boolean;
  qualityScore: number;
  messages: GuidanceMessage[];
  referencePhoto?: string;
  overlayGuides?: OverlayGuide[];
}

export interface GuidanceMessage {
  type: "error" | "warning" | "info" | "success";
  message: string;
  action?: string;
  priority: number; // 1-5, higher is more important
}

export interface OverlayGuide {
  type: "grid" | "frame" | "arrow" | "highlight";
  coordinates?: ImageRegion;
  color?: string;
  opacity?: number;
  label?: string;
}

// Room feature detection types
export interface RoomFeatures {
  furniture: DetectedFurniture[];
  fixtures: DetectedFixture[];
  amenities: DetectedAmenity[];
  condition: ConditionAssessment;
  roomType: string;
  confidence: number;
}

export interface DetectedFurniture {
  type: string; // bed, sofa, table, chair, etc.
  brand?: string;
  condition: "new" | "excellent" | "good" | "fair" | "poor";
  location: ImageRegion;
  confidence: number;
}

export interface DetectedFixture {
  type: string; // light, outlet, switch, vent, etc.
  working: boolean;
  condition: string;
  location: ImageRegion;
  needsMaintenance: boolean;
}

export interface DetectedAmenity {
  name: string;
  present: boolean;
  functional?: boolean;
  location?: ImageRegion;
  matchesListing: boolean;
}

export interface ConditionAssessment {
  overall: "excellent" | "good" | "fair" | "poor";
  cleanliness: number; // 0-100
  maintenance: number; // 0-100
  damage: DamageReport[];
  wearAndTear: string;
}

export interface DamageReport {
  type: string;
  severity: "minor" | "moderate" | "severe";
  location: ImageRegion;
  description: string;
  repairNeeded: boolean;
  estimatedCost?: number;
}

// Batch comparison types
export interface BatchComparisonResult {
  roomComparisons: Map<string, PhotoComparisonResult>;
  overallSimilarity: number;
  criticalIssues: DiscrepancyReport[];
  summary: ComparisonSummary;
  recommendations: string[];
}

export interface ComparisonSummary {
  totalPhotos: number;
  matchingPhotos: number;
  minorDifferences: number;
  majorDifferences: number;
  averageSimilarity: number;
  averageQuality: number;
  passRate: number;
}

// Configuration types
export interface PhotoComparisonConfig {
  similarityThreshold: number; // 0-100
  qualityThreshold: number; // 0-100
  enableAIAnalysis: boolean;
  enableManualReview: boolean;
  strictMode: boolean; // Requires higher similarity scores
  comparisonModel?: string; // AI model to use
  maxProcessingTime?: number; // milliseconds
}

export interface QualityCheckConfig {
  minSharpness: number;
  minLighting: number;
  minResolution: { width: number; height: number };
  maxFileSize: number; // bytes
  acceptableFormats: string[];
  realTimeFeedback: boolean;
}

// History and tracking types
export interface ComparisonHistory {
  id: string;
  propertyId: string;
  roomId: string;
  timestamp: Date;
  result: PhotoComparisonResult;
  inspectorId: string;
  reviewed: boolean;
  reviewNotes?: string;
}

export interface PhotoComparisonStats {
  totalComparisons: number;
  averageSimilarity: number;
  averageQuality: number;
  commonIssues: { type: string; count: number }[];
  passRate: number;
  timeRange: { start: Date; end: Date };
}

// Mobile photo optimization types
export interface PhotoOptimizationConfig {
  targetQuality: number;
  maxDimensions: { width: number; height: number };
  compressionLevel: number;
  format: "jpeg" | "webp" | "png";
  preserveMetadata: boolean;
}

// Checklist item type for guidance
export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  roomName?: string;
  category?: string;
  required: boolean;
  completed: boolean;
  photoRequired?: boolean;
  photoCount?: number;
  referencePhotos?: string[];
}
