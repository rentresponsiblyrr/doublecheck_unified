/**
 * @fileoverview Error Analysis Type Definitions
 * Comprehensive type definitions for error tracking, analysis, and root cause identification
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

export interface ErrorDetails {
  id?: string;
  message: string;
  stack?: string;
  code?: string;
  type: 'javascript' | 'network' | 'database' | 'authentication' | 'validation' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  frequency: number;
  affectedUsers: number;
  firstSeen: string;
  lastSeen: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  buildVersion?: string;
  environment: 'development' | 'staging' | 'production';
  additionalContext?: Record<string, any>;
}

export interface ErrorPattern {
  id: string;
  pattern: string;
  regex?: string;
  frequency: number;
  correlation: number;
  category: string;
  description: string;
  examples: string[];
  relatedErrors: string[];
  commonCauses: string[];
  suggestedActions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemContext {
  browser: {
    name: string;
    version: string;
    engine: string;
  };
  os: {
    name: string;
    version: string;
  };
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    model?: string;
  };
  screen: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
  };
  network: {
    type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
    speed: 'slow' | 'medium' | 'fast';
    latency?: number;
  };
  url: string;
  referrer?: string;
  userAgent: string;
  timestamp: string;
  sessionId: string;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  performance?: {
    loadTime: number;
    renderTime: number;
    networkLatency: number;
  };
}

export interface ErrorAnalysisResult {
  errorId: string;
  analysisId: string;
  confidence: number;
  classification: {
    type: ErrorDetails['type'];
    severity: ErrorDetails['severity'];
    category: string;
    subcategory?: string;
  };
  impact: {
    userExperience: 'minimal' | 'moderate' | 'severe' | 'blocking';
    businessCritical: boolean;
    affectedFeatures: string[];
    estimatedRevenue?: number;
  };
  technicalDetails: {
    component: string;
    function?: string;
    lineNumber?: number;
    stackTrace?: string;
    relatedCode?: string[];
  };
  contextualFactors: {
    timeOfDay: string;
    dayOfWeek: string;
    seasonality?: string;
    userBehaviorPattern?: string;
    systemLoad?: 'low' | 'medium' | 'high';
  };
  similarErrors: {
    errorId: string;
    similarity: number;
    sharedContext: string[];
  }[];
  metadata: {
    analysisModel: string;
    analysisVersion: string;
    processingTime: number;
    createdAt: string;
  };
}

export interface UserFrustrationMetrics {
  frustrationLevel: number; // 1-10 scale
  bounceRate: number;
  sessionDuration: number;
  pageViewsBeforeError: number;
  errorRecoveryAttempts: number;
  userReportedIssue: boolean;
  sentimentScore?: number; // -1 to 1
  contextualClues: {
    rapidClicking: boolean;
    pageRefreshes: number;
    backButtonUsage: number;
    formAbandonmentRate: number;
  };
}

export interface ErrorResolutionHistory {
  errorId: string;
  resolutionId: string;
  status: 'open' | 'investigating' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resolution: {
    type: 'code_fix' | 'config_change' | 'data_correction' | 'infrastructure' | 'third_party';
    description: string;
    changesApplied: string[];
    testingPerformed: string[];
    deploymentNotes?: string;
  };
  timeline: {
    reported: string;
    acknowledged: string;
    investigating?: string;
    fixDeployed?: string;
    verified?: string;
    closed?: string;
  };
  verificationMetrics: {
    errorRecurrenceRate: number;
    userSatisfactionScore?: number;
    performanceImpact?: number;
    monitoringPeriod: string;
  };
}

export interface ErrorTrendAnalysis {
  timeframe: 'hour' | 'day' | 'week' | 'month';
  errorCounts: {
    timestamp: string;
    count: number;
    severity: Record<ErrorDetails['severity'], number>;
    types: Record<ErrorDetails['type'], number>;
  }[];
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number; // percentage change
    significance: 'low' | 'medium' | 'high';
    seasonality?: {
      pattern: 'daily' | 'weekly' | 'monthly';
      confidence: number;
    };
  };
  correlations: {
    with: 'user_activity' | 'system_load' | 'deployments' | 'external_services';
    strength: number; // -1 to 1
    description: string;
  }[];
  predictions: {
    nextHour: number;
    nextDay: number;
    nextWeek: number;
    confidence: number;
  };
}

export interface ErrorAlertConfiguration {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: {
    errorType?: ErrorDetails['type'][];
    severity?: ErrorDetails['severity'][];
    frequency?: {
      threshold: number;
      timeWindow: string; // ISO duration
    };
    userImpact?: {
      minAffectedUsers: number;
      frustrationThreshold: number;
    };
    patterns?: {
      regex: string;
      description: string;
    }[];
  };
  actions: {
    type: 'email' | 'slack' | 'webhook' | 'ticket' | 'escalation';
    configuration: Record<string, any>;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }[];
  schedule: {
    timezone: string;
    activeHours?: {
      start: string;
      end: string;
    };
    activeDays?: string[]; // ['monday', 'tuesday', ...]
  };
  escalationRules: {
    timeToEscalate: string; // ISO duration
    escalateTo: string[];
    conditions: string[];
  }[];
}

export interface ErrorReportRequest {
  error: Partial<ErrorDetails>;
  context: Partial<SystemContext>;
  userInput?: {
    description: string;
    stepsToReproduce?: string[];
    expectedBehavior?: string;
    actualBehavior?: string;
    screenshots?: File[];
  };
  includeAnalysis?: boolean;
  includeSuggestions?: boolean;
  includeRootCause?: boolean;
}

export interface ErrorReportResponse {
  reportId: string;
  error: ErrorDetails;
  analysis?: ErrorAnalysisResult;
  rootCauseAnalysis?: Record<string, unknown>; // Will be defined in rootCauseAnalyzer
  suggestions?: string[]; // Will be defined in reproductionStepsGenerator
  estimatedResolution?: {
    timeframe: string;
    confidence: number;
    factors: string[];
  };
  relatedDocumentation?: {
    title: string;
    url: string;
    relevance: number;
  }[];
  status: 'created' | 'analyzing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}