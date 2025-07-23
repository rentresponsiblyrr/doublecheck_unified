// Video Recording and Processing Types for STR Certified

export interface VideoRecording {
  id: string;
  propertyId: string;
  inspectorId: string;
  file: File | Blob;
  duration: number; // seconds
  size: number; // bytes
  format: string;
  resolution: VideoResolution;
  quality: VideoQuality;
  timestamps: VideoTimestamp[];
  metadata: VideoMetadata;
  status: VideoStatus;
  createdAt: Date;
  uploadedAt?: Date;
  processedAt?: Date;
}

export interface VideoResolution {
  width: number;
  height: number;
  aspectRatio: string;
}

export interface VideoQuality {
  overall: number; // 0-100
  stability: number; // 0-100 (lower is more shaky)
  brightness: number; // 0-100
  focus: number; // 0-100
  audioQuality?: number; // 0-100
  bitrate: number; // kbps
  fps: number;
}

export interface VideoTimestamp {
  id: string;
  time: number; // seconds from start
  sceneType: SceneType;
  roomDetected?: string;
  features: string[];
  description: string;
  thumbnail?: string; // base64 or URL
  confidence: number; // 0-100
  isKeyFrame: boolean;
  annotations?: VideoAnnotation[];
}

export type SceneType =
  | "room_entry"
  | "room_overview"
  | "detail_shot"
  | "transition"
  | "exterior"
  | "amenity_focus"
  | "issue_documentation";

export interface VideoAnnotation {
  type: "text" | "arrow" | "box" | "circle";
  content: string;
  position: { x: number; y: number };
  style?: {
    color?: string;
    fontSize?: number;
    strokeWidth?: number;
  };
}

export interface VideoMetadata {
  deviceInfo: {
    model: string;
    os: string;
    browser?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  propertyDetails: {
    address: string;
    unitNumber?: string;
    propertyType: string;
  };
  recordingConditions: {
    lighting: string;
    weather?: string;
    timeOfDay: string;
  };
  inspectionType: string;
  notes?: string;
}

export type VideoStatus =
  | "recording"
  | "paused"
  | "stopped"
  | "processing"
  | "uploading"
  | "uploaded"
  | "analyzing"
  | "completed"
  | "failed";

export interface VideoAnalysisResult {
  videoId: string;
  scenes: SceneAnalysis[];
  qualityMetrics: VideoQualityMetrics;
  featureDetection: FeatureDetectionResult[];
  roomSequence: RoomSequence[];
  issues: VideoIssue[];
  summary: AnalysisSummary;
  processingTime: number;
  aiConfidence: number;
}

export interface SceneAnalysis {
  startTime: number;
  endTime: number;
  sceneType: SceneType;
  roomType?: string;
  keyFrames: KeyFrame[];
  objects: DetectedObject[];
  quality: SceneQuality;
  transitions: SceneTransition[];
}

export interface KeyFrame {
  timestamp: number;
  frameUrl: string;
  quality: number;
  isRepresentative: boolean;
  features: string[];
}

export interface DetectedObject {
  type: string;
  confidence: number;
  boundingBox: BoundingBox;
  attributes?: Record<string, any>;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SceneQuality {
  sharpness: number;
  stability: number;
  lighting: number;
  framing: number;
  overall: number;
}

export interface SceneTransition {
  fromScene: number;
  toScene: number;
  type: "cut" | "pan" | "zoom" | "fade";
  duration: number;
  smooth: boolean;
}

export interface VideoQualityMetrics {
  averageQuality: number;
  stabilityScore: number;
  consistencyScore: number;
  coverageScore: number; // How well the property was covered
  technicalIssues: TechnicalIssue[];
  recommendations: string[];
}

export interface TechnicalIssue {
  type: "shaky" | "dark" | "blurry" | "audio" | "framerate";
  severity: "low" | "medium" | "high";
  timestamp: number;
  duration: number;
  description: string;
}

export interface FeatureDetectionResult {
  feature: string;
  detected: boolean;
  confidence: number;
  timestamps: number[];
  evidence: string[];
}

export interface RoomSequence {
  roomId: string;
  roomType: string;
  startTime: number;
  endTime: number;
  coverage: "complete" | "partial" | "minimal";
  keyMoments: VideoTimestamp[];
}

export interface VideoIssue {
  type: "missing_room" | "poor_quality" | "incomplete_coverage" | "technical";
  severity: "low" | "medium" | "high";
  description: string;
  affectedTimestamps: number[];
  suggestedAction?: string;
}

export interface AnalysisSummary {
  totalDuration: number;
  roomsCovered: string[];
  roomsMissing: string[];
  overallQuality: number;
  keyFindings: string[];
  recommendedActions: string[];
  readyForSubmission: boolean;
}

// Video processing configuration
export interface VideoProcessingConfig {
  extractFrameInterval: number; // seconds
  keyFrameQualityThreshold: number; // 0-100
  sceneChangeThreshold: number; // 0-1
  maxProcessingTime: number; // seconds
  enableAudioAnalysis: boolean;
  targetFrameRate: number;
  compressionQuality: number; // 0-1
}

// Video recording configuration
export interface VideoRecordingConfig {
  maxDuration: number; // seconds
  targetResolution: VideoResolution;
  targetBitrate: number; // kbps
  audioEnabled: boolean;
  stabilizationEnabled: boolean;
  autoFocusEnabled: boolean;
  lowLightEnhancement: boolean;
}

// Video upload configuration
export interface VideoUploadConfig {
  chunkSize: number; // bytes
  maxRetries: number;
  retryDelay: number; // milliseconds
  compressionEnabled: boolean;
  wifiOnlyUpload: boolean;
  backgroundUpload: boolean;
}

// Video player state
export interface VideoPlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isBuffering: boolean;
  playbackRate: number;
  volume: number;
  selectedTimestamp?: VideoTimestamp;
  activeAnnotations: VideoAnnotation[];
}

// Video recording stats
export interface VideoRecordingStats {
  duration: number;
  fileSize: number;
  framesRecorded: number;
  droppedFrames: number;
  averageFps: number;
  storageUsed: number;
  storageAvailable: number;
  batteryLevel?: number;
}
