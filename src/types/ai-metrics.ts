/**
 * Comprehensive AI Metrics Type Definitions
 * Replaces all 'any' types with proper TypeScript interfaces
 */

import { PropertyId, InspectionId, UserId } from "./branded-types";

// Core metric interfaces
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

export interface PredictionData {
  classification?: string;
  confidence: number;
  boundingBoxes?: BoundingBox[];
  features?: Record<string, number>;
}

export interface GroundTruthData {
  classification: string;
  boundingBoxes?: BoundingBox[];
  verifiedBy: UserId;
  verificationDate: string;
}

export interface UserFeedback {
  userId: UserId;
  rating: number;
  correctness: "correct" | "incorrect" | "partially_correct";
  suggestedCorrection?: PredictionData;
  notes?: string;
}

export interface MetricValue {
  value: number | string | boolean;
  unit?: string;
  timestamp: string;
}

export interface PerformanceMetric {
  value: number;
  unit: "ms" | "seconds" | "count" | "percentage";
  timestamp: string;
  metadata?: Record<string, string | number>;
}

export interface AccuracyMetric {
  correctedValue?: PredictionData;
  actualValue: GroundTruthData;
  metadata: Record<string, string | number>;
}

export interface UsageMetric {
  endpoint: string;
  requestCount: number;
  totalCost: number;
  metadata: Record<string, string | number>;
}

export interface AlertData {
  metric: string;
  threshold: number;
  currentValue: number;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata: Record<string, string | number>;
}

export interface ModelComparison {
  summary: {
    totalPredictions: number;
    averageAccuracy: number;
    totalCost: number;
    averageLatency: number;
  };
  trends: Record<string, TrendData>;
  models: Record<string, ModelMetrics>;
  details: {
    timeRange: string;
    comparisonCriteria: string[];
    recommendations: string[];
  };
}

export interface TrendData {
  direction: "increasing" | "decreasing" | "stable";
  slope: number;
  correlation: number;
  significance: number;
}

export interface ModelMetrics {
  accuracy: number;
  latency: number;
  cost: number;
  usage: number;
  reliability: number;
}

export interface ReportData {
  summary: {
    period: string;
    totalRequests: number;
    averageCost: number;
    errorRate: number;
  };
  breakdowns: {
    byModel: Record<string, ModelMetrics>;
    byEndpoint: Record<string, UsageMetric>;
    byTimeOfDay: Record<string, number>;
  };
  insights: string[];
  metadata: Record<string, string | number>;
}
