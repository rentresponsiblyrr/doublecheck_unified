/**
 * BUSINESS LOGIC TYPES - PHASE 2 QUERY STANDARDIZATION
 *
 * Clean, application-focused interfaces that abstract database complexity.
 * These types provide a consistent API for components while hiding
 * the underlying schema details and compatibility layer complexity.
 *
 * @author STR Certified Engineering Team
 * @phase Phase 2 - Query Standardization & Architectural Excellence
 */

// ========================================
// CORE BUSINESS ENTITIES
// ========================================

/**
 * Active Inspection - Optimized for inspector workflows
 * Includes all data needed for property selection and inspection resumption
 */
export interface ActiveInspection {
  inspectionId: string; // Always UUID for consistency
  propertyId: string; // Always UUID for consistency
  propertyName: string; // Human-readable property name
  propertyAddress: string; // Full formatted address
  status: InspectionStatus; // Current inspection state
  progress: ProgressMetrics; // Completion tracking
  lastActivity: Date; // When last worked on
  estimatedCompletion: Date | null; // AI-predicted completion time
  hasOfflineChanges: boolean; // Unsynchronized local changes
  inspector: InspectorInfo; // Assigned inspector details
  priority: InspectionPriority; // Business priority level
  conditions: InspectionConditions; // Special requirements/notes
}

/**
 * Detailed Inspection - Complete inspection view
 * Used for full inspection interface and detailed reporting
 */
export interface DetailedInspection {
  inspectionId: string;
  property: PropertyDetails;
  inspector: InspectorInfo;
  status: InspectionStatus;
  timeline: InspectionTimeline;
  checklist: ChecklistProgress;
  media: MediaCollection;
  notes: InspectionNotes;
  audit: AuditTrail;
  compliance: ComplianceStatus;
}

/**
 * Inspection Summary - Lightweight for lists and dashboards
 * Optimized for dashboard widgets and summary views
 */
export interface InspectionSummary {
  inspectionId: string;
  propertyName: string;
  propertyAddress: string;
  status: InspectionStatus;
  progressPercentage: number;
  inspector: string; // Inspector name
  startDate: Date;
  targetCompletion: Date;
  isOverdue: boolean;
  riskLevel: "low" | "medium" | "high";
}

// ========================================
// PROPERTY ENTITIES
// ========================================

/**
 * Property with Status - Property info with inspection context
 * Used for property selection and management interfaces
 */
export interface PropertyWithStatus {
  propertyId: string;
  name: string;
  address: PropertyAddress;
  urls: PropertyUrls;
  inspectionStatus: PropertyInspectionStatus;
  stats: PropertyStats;
  lastInspection: InspectionSummary | null;
  nextInspectionDue: Date | null;
  complianceRating: number; // 0-100 score
  riskFactors: string[]; // Identified risk areas
}

/**
 * Available Property - Properties ready for new inspections
 * Filtered and optimized for inspection creation workflows
 */
export interface AvailableProperty {
  propertyId: string;
  name: string;
  address: string;
  type: PropertyType;
  estimatedDuration: number; // Minutes for typical inspection
  specialRequirements: string[]; // Access codes, keys, etc.
  lastInspected: Date | null;
  urgency: "low" | "medium" | "high" | "critical";
  preferredInspectors: string[]; // Inspector IDs with property familiarity
}

/**
 * Property Details - Complete property information
 * Used in detailed inspection and property management views
 */
export interface PropertyDetails {
  propertyId: string;
  name: string;
  address: PropertyAddress;
  urls: PropertyUrls;
  metadata: PropertyMetadata;
  inspectionHistory: InspectionHistory;
  compliance: PropertyCompliance;
  access: PropertyAccess;
}

// ========================================
// CHECKLIST & PROGRESS ENTITIES
// ========================================

/**
 * Checklist Item - Individual inspection task
 * Core unit of inspection work with all necessary context
 */
export interface ChecklistItem {
  itemId: string;
  inspectionId: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  required: boolean;
  evidenceType: EvidenceType;
  status: ChecklistItemStatus;
  result: ChecklistItemResult | null;
  media: MediaItem[];
  notes: string;
  estimatedTime: number; // Minutes to complete
  dependencies: string[]; // Other item IDs that must be completed first
  aiGuidance: AIGuidance | null; // AI-provided hints and validation
}

/**
 * Progress Metrics - Quantified inspection progress
 * Used for progress bars, time estimates, and completion tracking
 */
export interface ProgressMetrics {
  completedItems: number;
  totalItems: number;
  progressPercentage: number;
  requiredItemsCompleted: number;
  requiredItemsTotal: number;
  photosRequired: number;
  photosCaptured: number;
  videosRequired: number;
  videosRecorded: number;
  estimatedTimeRemaining: number; // Minutes based on AI analysis
  actualTimeSpent: number; // Minutes tracked
  efficiencyScore: number; // 0-100 based on historical data
}

/**
 * Checklist Progress - Overall checklist state
 * Aggregated view of all checklist items and their relationships
 */
export interface ChecklistProgress {
  totalItems: number;
  completedItems: number;
  categories: CategoryProgress[];
  criticalIssues: CriticalIssue[];
  recommendations: string[];
  estimatedCompletion: Date;
  qualityScore: number; // 0-100 based on completeness and accuracy
}

// ========================================
// MEDIA & DOCUMENTATION
// ========================================

/**
 * Media Item - Photo, video, or document with metadata
 * Unified interface for all media types in inspections
 */
export interface MediaItem {
  mediaId: string;
  checklistItemId: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  filename: string;
  size: number; // Bytes
  dimensions: MediaDimensions | null;
  duration: number | null; // Seconds for video/audio
  capturedAt: Date;
  location: GeolocationCoords | null;
  aiAnalysis: MediaAIAnalysis | null;
  quality: MediaQuality;
  processing: MediaProcessingStatus;
}

/**
 * Media Collection - Organized media for an inspection
 * Provides structured access to all inspection media
 */
export interface MediaCollection {
  totalCount: number;
  totalSize: number; // Total bytes
  photos: MediaItem[];
  videos: MediaItem[];
  documents: MediaItem[];
  byCategory: Record<ChecklistCategory, MediaItem[]>;
  featured: MediaItem[]; // Key/representative media
  issues: MediaItem[]; // Media flagged as issues
}

// ========================================
// USER & INSPECTOR ENTITIES
// ========================================

/**
 * Inspector Info - Inspector details for assignments and tracking
 * Contains all relevant information for inspector-related operations
 */
export interface InspectorInfo {
  inspectorId: string;
  name: string;
  email: string;
  phone: string | null;
  certifications: Certification[];
  specialties: PropertyType[];
  availability: InspectorAvailability;
  performance: InspectorPerformance;
  location: GeolocationCoords | null;
  preferredRegions: string[];
}

/**
 * Inspector Performance - Performance metrics and history
 * Used for assignment optimization and quality tracking
 */
export interface InspectorPerformance {
  completedInspections: number;
  averageTime: number; // Minutes per inspection
  qualityScore: number; // 0-100 based on audit feedback
  onTimeRate: number; // Percentage of on-time completions
  accuracyRate: number; // Percentage matching audit results
  customerRating: number; // 0-5 stars from property owners
  lastMonth: PerformanceTrend;
  lastYear: PerformanceTrend;
}

// ========================================
// STATISTICS & ANALYTICS
// ========================================

/**
 * Inspection Stats - Aggregated statistics for dashboards
 * Provides key metrics for management and reporting
 */
export interface InspectionStats {
  period: DateRange;
  totalInspections: number;
  completedInspections: number;
  pendingInspections: number;
  overdueInspections: number;
  averageCompletionTime: number; // Minutes
  qualityScoreAverage: number; // 0-100
  inspectorUtilization: number; // Percentage
  trendData: TrendPoint[];
  categoryBreakdown: CategoryStats[];
  issueFrequency: IssueFrequencyMap;
}

/**
 * Property Stats - Property-specific statistics
 * Historical data and trends for individual properties
 */
export interface PropertyStats {
  totalInspections: number;
  averageScore: number;
  improvementTrend: TrendDirection;
  commonIssues: string[];
  lastInspectionScore: number;
  complianceHistory: ComplianceHistoryPoint[];
  maintenanceAlerts: MaintenanceAlert[];
  costAnalysis: PropertyCostAnalysis;
}

// ========================================
// SUPPORTING TYPES & ENUMS
// ========================================

/**
 * Inspection Status - All possible inspection states
 */
export type InspectionStatus =
  | "draft" // Created but not started
  | "in_progress" // Currently being worked on
  | "paused" // Temporarily suspended
  | "completed" // Finished by inspector
  | "under_review" // Being audited
  | "approved" // Passed audit
  | "rejected" // Failed audit, needs rework
  | "cancelled"; // Cancelled before completion

/**
 * Checklist Item Status - Individual item completion states
 */
export type ChecklistItemStatus =
  | "pending" // Not yet started
  | "in_progress" // Currently being worked on
  | "completed" // Finished with result
  | "skipped" // Marked as not applicable
  | "flagged"; // Requires attention/review

/**
 * Checklist Item Result - Outcome of inspection item
 */
export interface ChecklistItemResult {
  passed: boolean;
  score: number | null; // 0-100 if applicable
  issues: string[]; // Identified problems
  recommendations: string[]; // Suggested fixes
  confidence: number; // AI confidence 0-100
  reviewRequired: boolean; // Needs human review
  riskLevel: "low" | "medium" | "high" | "critical";
}

/**
 * Property Address - Structured address information
 */
export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formatted: string; // Full formatted address
  coordinates: GeolocationCoords | null;
}

/**
 * Property URLs - All listing URLs for the property
 */
export interface PropertyUrls {
  primary: string | null; // Main listing URL
  airbnb: string | null; // Airbnb listing
  vrbo: string | null; // VRBO listing
  booking: string | null; // Booking.com listing
  other: Record<string, string>; // Additional platforms
}

/**
 * Time-based entities
 */
export interface DateRange {
  start: Date;
  end: Date;
}

export interface InspectionTimeline {
  created: Date;
  started: Date | null;
  lastActivity: Date;
  completed: Date | null;
  approved: Date | null;
  milestones: TimelineMilestone[];
}

export interface TimelineMilestone {
  timestamp: Date;
  event: string;
  description: string;
  user: string | null;
  automated: boolean;
}

/**
 * Geolocation coordinates
 */
export interface GeolocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
}

/**
 * Media-related types
 */
export type MediaType = "photo" | "video" | "audio" | "document";
export type EvidenceType = "photo" | "video" | "both" | "document" | "none";

export interface MediaDimensions {
  width: number;
  height: number;
}

export interface MediaQuality {
  resolution: string; // e.g., "1920x1080"
  clarity: number; // 0-100 AI assessment
  lighting: number; // 0-100 lighting quality
  angle: "good" | "poor" | "unclear";
  issues: string[]; // Blurry, dark, etc.
}

export type MediaProcessingStatus =
  | "uploading"
  | "processing"
  | "ready"
  | "failed";

/**
 * AI Analysis types
 */
export interface AIGuidance {
  instructions: string;
  tips: string[];
  commonMistakes: string[];
  qualityChecks: string[];
  estimatedTime: number; // Minutes
}

export interface MediaAIAnalysis {
  objects: DetectedObject[];
  text: string | null; // OCR text if applicable
  issues: DetectedIssue[];
  compliance: ComplianceCheck[];
  confidence: number; // 0-100 overall confidence
  processingTime: number; // Milliseconds
}

export interface DetectedObject {
  type: string;
  confidence: number;
  boundingBox: BoundingBox;
  properties: Record<string, any>;
}

export interface DetectedIssue {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  location: BoundingBox | null;
  confidence: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Compliance and audit types
 */
export interface ComplianceStatus {
  overall: "compliant" | "non_compliant" | "pending";
  score: number; // 0-100
  requirements: ComplianceRequirement[];
  violations: ComplianceViolation[];
  recommendations: string[];
  nextReviewDate: Date;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  status: "met" | "not_met" | "partial" | "not_applicable";
  evidence: string[]; // Media item IDs
  notes: string;
}

export interface ComplianceViolation {
  id: string;
  severity: "minor" | "major" | "critical";
  description: string;
  requirement: string;
  correctiveAction: string;
  deadline: Date | null;
  status: "open" | "in_progress" | "resolved";
}

/**
 * Category and classification types
 */
export type ChecklistCategory =
  | "safety"
  | "cleanliness"
  | "amenities"
  | "maintenance"
  | "compliance"
  | "accessibility"
  | "security"
  | "outdoor"
  | "other";

export type PropertyType =
  | "apartment"
  | "house"
  | "condo"
  | "townhouse"
  | "cabin"
  | "villa"
  | "other";

export type InspectionPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | "critical";

export type TrendDirection = "improving" | "declining" | "stable";

/**
 * Performance and analytics types
 */
export interface CategoryProgress {
  category: ChecklistCategory;
  completed: number;
  total: number;
  issues: number;
  score: number; // 0-100
}

export interface TrendPoint {
  timestamp: Date;
  value: number;
  category?: string;
}

export interface PerformanceTrend {
  change: number; // Percentage change
  direction: TrendDirection;
  significance: "significant" | "minor" | "none";
}

/**
 * Complex supporting interfaces
 */
export interface InspectionConditions {
  accessInstructions: string | null;
  specialRequirements: string[];
  hazards: string[];
  timeConstraints: TimeConstraint[];
  weatherConsiderations: string | null;
  contactInfo: ContactInfo | null;
}

export interface TimeConstraint {
  type: "must_start_by" | "must_complete_by" | "available_hours";
  value: string; // Time or description
  reason: string;
}

export interface ContactInfo {
  name: string;
  phone: string | null;
  email: string | null;
  role: "owner" | "manager" | "tenant" | "other";
  preferredContact: "phone" | "email" | "text";
}

// ========================================
// QUERY OPTIMIZATION TYPES
// ========================================

/**
 * Active Inspection Query Options
 * Configures what data to include in active inspection queries
 */
export interface ActiveInspectionOptions {
  limit?: number;
  includeProgress?: boolean;
  includeOfflineStatus?: boolean;
  includeMedia?: boolean;
  status?: InspectionStatus[];
  inspectorId?: string;
  priorityLevel?: InspectionPriority[];
  sortBy?: "updated_at" | "created_at" | "progress" | "priority";
  sortOrder?: "asc" | "desc";
}

/**
 * Time Range options for statistics and reporting
 */
export interface TimeRange {
  start: Date;
  end: Date;
  granularity?: "hour" | "day" | "week" | "month";
}

/**
 * Data freshness and caching preferences
 */
export interface DataFreshnessOptions {
  maxAge?: number; // Seconds
  allowStale?: boolean; // Accept cached data past max age
  forceRefresh?: boolean; // Bypass cache entirely
  backgroundRefresh?: boolean; // Update cache in background
}

// ========================================
// ERROR HANDLING TYPES
// ========================================

/**
 * Service-level errors with business context
 */
export interface InspectionServiceError extends Error {
  code: InspectionErrorCode;
  context: {
    inspectionId?: string;
    propertyId?: string;
    userId?: string;
    operation: string;
  };
  recoverable: boolean;
  suggestions: string[];
}

export type InspectionErrorCode =
  | "INSPECTION_NOT_FOUND"
  | "PROPERTY_NOT_FOUND"
  | "INSPECTOR_NOT_AVAILABLE"
  | "CHECKLIST_INCOMPLETE"
  | "MEDIA_UPLOAD_FAILED"
  | "SYNC_CONFLICT"
  | "PERMISSION_DENIED"
  | "VALIDATION_FAILED"
  | "NETWORK_ERROR"
  | "DATA_CORRUPTION";

// ========================================
// SUCCESS RESPONSE TYPES
// ========================================

/**
 * Service operation results
 * Standardized response format for all service operations
 */
export interface ServiceResult<T> {
  success: boolean;
  data: T | null;
  error: InspectionServiceError | null;
  metadata: {
    timestamp: Date;
    duration: number; // Milliseconds
    fromCache: boolean;
    queryCount: number;
  };
}

/**
 * Batch operation results
 * For operations that affect multiple entities
 */
export interface BatchResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: InspectionServiceError;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}
