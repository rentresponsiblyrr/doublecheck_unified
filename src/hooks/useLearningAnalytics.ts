// Learning Analytics Hook for STR Certified
// Tracks AI performance and improvement metrics

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type {
  LearningMetrics,
  LearningProgress,
  LearningInsight,
  FeedbackCategory,
  CategoryMetrics,
  PropertyTypeMetrics,
  TrendData,
  LearningPattern,
} from "@/types/learning";
import {
  createLearningEngine,
  defaultLearningConfig,
} from "@/lib/ai/learning-engine";

interface UseLearningAnalyticsOptions {
  modelVersion?: string;
  refreshInterval?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface UseLearningAnalyticsReturn {
  // Metrics
  metrics: LearningMetrics | null;
  progress: LearningProgress | null;
  isLoading: boolean;
  error: Error | null;

  // Real-time updates
  latestInsights: LearningInsight[];
  activePatterns: LearningPattern[];

  // Performance tracking
  accuracyTrend: TrendData | null;
  confidenceTrend: TrendData | null;
  categoryBreakdown: Map<FeedbackCategory, CategoryMetrics>;
  propertyTypeBreakdown: Map<string, PropertyTypeMetrics>;

  // Actions
  refreshMetrics: () => void;
  generateReport: (startDate: Date, endDate: Date) => Promise<LearningMetrics>;
  exportAnalytics: (format: "json" | "csv") => void;

  // Filtering
  setDateRange: (start: Date, end: Date) => void;
  setModelVersion: (version: string) => void;

  // Comparisons
  compareModels: (version1: string, version2: string) => ComparisonResult;
  comparePeriods: (period1: DateRange, period2: DateRange) => ComparisonResult;
}

interface ComparisonResult {
  accuracyDelta: number;
  confidenceDelta: number;
  improvementRate: number;
  significantChanges: Array<{
    category: FeedbackCategory;
    change: number;
    direction: "improved" | "declined";
  }>;
}

interface DateRange {
  start: Date;
  end: Date;
}

export const useLearningAnalytics = (
  options: UseLearningAnalyticsOptions = {},
): UseLearningAnalyticsReturn => {
  // State
  const [modelVersion, setModelVersion] = useState(
    options.modelVersion || "latest",
  );
  const [dateRange, setDateRange] = useState<DateRange>(
    options.dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
    },
  );
  const [latestInsights, setLatestInsights] = useState<LearningInsight[]>([]);
  const [activePatterns, setActivePatterns] = useState<LearningPattern[]>([]);

  // Initialize learning engine
  const learningEngine = useMemo(
    () => createLearningEngine(defaultLearningConfig),
    [],
  );

  // Fetch metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refreshMetrics,
  } = useQuery({
    queryKey: ["learning-metrics", dateRange.start, dateRange.end],
    queryFn: async () => {
      return learningEngine.generateLearningReport(
        dateRange.start,
        dateRange.end,
      );
    },
    refetchInterval: options.refreshInterval || 60000, // Refresh every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });

  // Fetch progress
  const {
    data: progress,
    isLoading: progressLoading,
    error: progressError,
  } = useQuery({
    queryKey: ["learning-progress", modelVersion],
    queryFn: async () => {
      return learningEngine.getLearningProgress(modelVersion);
    },
    refetchInterval: options.refreshInterval || 60000,
  });

  // Update insights and patterns from metrics
  useEffect(() => {
    if (metrics) {
      // Extract latest insights
      const recentInsights = metrics.insights
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);
      setLatestInsights(recentInsights);

      // Extract active patterns
      const patterns: LearningPattern[] = [];
      for (const [_, categoryMetrics] of metrics.categoryPerformance) {
        // Mock pattern extraction - in production would analyze metrics
        if (categoryMetrics.improvementRate < -5) {
          patterns.push({
            id: `pattern_${categoryMetrics.category}_decline`,
            name: `Declining performance in ${categoryMetrics.category}`,
            description: `${Math.abs(categoryMetrics.improvementRate)}% decline in accuracy`,
            category: categoryMetrics.category,
            pattern: {
              conditions: [
                {
                  field: "accuracy",
                  operator: "lt",
                  value: 70,
                },
              ],
              frequency: categoryMetrics.totalFeedback,
              timeWindow: 24,
            },
            metadata: {
              firstDetected: dateRange.start,
              lastSeen: dateRange.end,
              occurrences: categoryMetrics.corrections,
              affectedInspections: [],
              severity: "high",
            },
            recommendations: {
              immediate: ["Review recent changes", "Analyze error patterns"],
              longTerm: ["Retrain model for this category"],
            },
          });
        }
      }
      setActivePatterns(patterns);
    }
  }, [metrics, dateRange]);

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ start, end }: { start: Date; end: Date }) => {
      return learningEngine.generateLearningReport(start, end);
    },
  });

  // Export analytics
  const exportAnalytics = useCallback(
    (format: "json" | "csv") => {
      if (!metrics) return;

      if (format === "json") {
        const data = {
          metrics,
          progress,
          insights: latestInsights,
          patterns: activePatterns,
          exported: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `learning-analytics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === "csv") {
        // Convert metrics to CSV
        const rows: string[] = [
          "Category,Total Feedback,Corrections,Validations,Accuracy,Improvement Rate",
        ];

        for (const [category, categoryMetrics] of metrics.categoryPerformance) {
          rows.push(
            [
              category,
              categoryMetrics.totalFeedback,
              categoryMetrics.corrections,
              categoryMetrics.validations,
              categoryMetrics.accuracy.toFixed(2),
              categoryMetrics.improvementRate.toFixed(2),
            ].join(","),
          );
        }

        const csv = rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `learning-analytics-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [metrics, progress, latestInsights, activePatterns],
  );

  // Compare models
  const compareModels = useCallback(
    (version1: string, version2: string): ComparisonResult => {
      // Mock comparison - in production would fetch real data
      const mockComparison: ComparisonResult = {
        accuracyDelta: 5.2,
        confidenceDelta: 3.8,
        improvementRate: 4.5,
        significantChanges: [
          {
            category: "object_detection",
            change: 8.5,
            direction: "improved",
          },
          {
            category: "damage_assessment",
            change: -2.3,
            direction: "declined",
          },
        ],
      };

      return mockComparison;
    },
    [],
  );

  // Compare periods
  const comparePeriods = useCallback(
    (period1: DateRange, period2: DateRange): ComparisonResult => {
      // Mock comparison - in production would fetch real data
      const mockComparison: ComparisonResult = {
        accuracyDelta: 3.7,
        confidenceDelta: 2.1,
        improvementRate: 2.9,
        significantChanges: [
          {
            category: "room_classification",
            change: 6.2,
            direction: "improved",
          },
        ],
      };

      return mockComparison;
    },
    [],
  );

  // Extract trend data
  const accuracyTrend = metrics?.accuracyTrend || null;
  const confidenceTrend = metrics?.confidenceImprovement || null;

  // Category and property type breakdowns
  const categoryBreakdown = metrics?.categoryPerformance || new Map();
  const propertyTypeBreakdown = metrics?.propertyTypePerformance || new Map();

  return {
    // Metrics
    metrics,
    progress,
    isLoading: metricsLoading || progressLoading,
    error: metricsError || progressError,

    // Real-time updates
    latestInsights,
    activePatterns,

    // Performance tracking
    accuracyTrend,
    confidenceTrend,
    categoryBreakdown,
    propertyTypeBreakdown,

    // Actions
    refreshMetrics,
    generateReport: async (start: Date, end: Date) => {
      const result = await generateReportMutation.mutateAsync({ start, end });
      return result;
    },
    exportAnalytics,

    // Filtering
    setDateRange: (start: Date, end: Date) => setDateRange({ start, end }),
    setModelVersion,

    // Comparisons
    compareModels,
    comparePeriods,
  };
};

// Hook for real-time performance monitoring
export const useLearningPerformance = (category?: FeedbackCategory) => {
  const [performance, setPerformance] = useState<PerformanceMetrics>({
    currentAccuracy: 0,
    recentTrend: "stable",
    confidenceLevel: 0,
    processingSpeed: 0,
    errorRate: 0,
  });

  useEffect(() => {
    // Mock real-time updates
    const interval = setInterval(() => {
      setPerformance((prev) => ({
        ...prev,
        currentAccuracy: 75 + Math.random() * 15,
        confidenceLevel: 70 + Math.random() * 20,
        processingSpeed: 90 + Math.random() * 10,
        errorRate: Math.random() * 10,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [category]);

  return performance;
};

// Hook for learning milestones
export const useLearningMilestones = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    // Mock milestones
    setMilestones([
      {
        id: "milestone_1",
        title: "90% Accuracy Achieved",
        description: "Object detection reached 90% accuracy",
        achievedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        category: "object_detection",
        metric: 90.5,
      },
      {
        id: "milestone_2",
        title: "1000 Feedback Items Processed",
        description: "Processed 1000 auditor feedback items",
        achievedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        metric: 1000,
      },
    ]);
  }, []);

  return milestones;
};

// Types
interface PerformanceMetrics {
  currentAccuracy: number;
  recentTrend: "improving" | "declining" | "stable";
  confidenceLevel: number;
  processingSpeed: number;
  errorRate: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  achievedAt: Date;
  category?: FeedbackCategory;
  metric: number;
}
