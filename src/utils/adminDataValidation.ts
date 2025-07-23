/**
 * Elite Admin Dashboard Data Validation
 * Zero-trust architecture with comprehensive validation
 */

import { z } from "zod";
import { logger } from "@/lib/logger/production-logger";

// Custom error class for validation failures
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// Base schemas for core entities
const InspectionStatusSchema = z.enum([
  "draft",
  "in_progress",
  "completed",
  "auditing",
]);
const UserRoleSchema = z.enum(["inspector", "auditor", "admin"]);
const AIStatusSchema = z.enum(["pass", "fail", "conflict", "pending"]);

// Individual metric schemas
const InspectionCountsSchema = z
  .object({
    draft: z.number().min(0).int(),
    in_progress: z.number().min(0).int(),
    completed: z.number().min(0).int(),
    auditing: z.number().min(0).int().optional(),
    total: z.number().min(0).int(),
  })
  .refine(
    (data) => {
      const sum =
        data.draft + data.in_progress + data.completed + (data.auditing || 0);
      return sum === data.total;
    },
    {
      message: "Sum of individual counts must equal total count",
    },
  );

const TimeAnalyticsSchema = z
  .object({
    avg_duration_minutes: z.number().min(0).max(1440), // Max 24 hours
    median_duration_minutes: z.number().min(0).max(1440).optional(),
    total_with_times: z.number().min(0).int(),
  })
  .nullable();

const AIMetricsSchema = z
  .object({
    accuracy_rate: z.number().min(0).max(100),
    total_predictions: z.number().min(0).int(),
    ai_pass_rate: z.number().min(0).max(100).optional(),
    human_pass_rate: z.number().min(0).max(100).optional(),
  })
  .nullable();

const UserMetricsSchema = z.object({
  active_inspectors: z.number().min(0).int(),
  total_users: z.number().min(0).int(),
  auditors: z.number().min(0).int().optional(),
  admins: z.number().min(0).int().optional(),
});

const RevenueMetricsSchema = z.object({
  monthly_revenue: z.number().min(0),
  completed_this_month: z.number().min(0).int(),
  total_revenue: z.number().min(0),
  avg_revenue_per_day: z.number().min(0).optional(),
});

const PropertyMetricsSchema = z.object({
  total_properties: z.number().min(0).int(),
  active_properties: z.number().min(0).int(),
  properties_with_inspections: z.number().min(0).int(),
});

const MediaMetricsSchema = z.object({
  total_photos: z.number().min(0).int(),
  avg_photos_per_inspection: z.number().min(0),
});

const PerformanceMetricsSchema = z.object({
  cache_enabled: z.boolean(),
  query_timestamp: z.number(),
  data_freshness: z.string(),
});

// Main dashboard metrics schema
export const DashboardMetricsSchema = z.object({
  inspection_counts: InspectionCountsSchema,
  time_analytics: TimeAnalyticsSchema,
  ai_metrics: AIMetricsSchema,
  user_metrics: UserMetricsSchema,
  revenue_metrics: RevenueMetricsSchema,
  property_metrics: PropertyMetricsSchema.optional(),
  media_metrics: MediaMetricsSchema.optional(),
  performance_metrics: PerformanceMetricsSchema.optional(),
});

// Time range metrics schema
const TrendDataPointSchema = z.object({
  date: z.string().datetime(),
  count: z.number().min(0).int(),
  completed: z.number().min(0).int(),
});

const GrowthMetricsSchema = z.object({
  current_period_inspections: z.number().min(0).int(),
  previous_period_inspections: z.number().min(0).int(),
  growth_rate: z.number(),
});

export const TimeRangeMetricsSchema = z.object({
  time_range: z.object({
    start_date: z.string().datetime(),
    end_date: z.string().datetime(),
    days: z.number().min(0),
  }),
  inspection_trends: z.array(TrendDataPointSchema).nullable(),
  growth_metrics: GrowthMetricsSchema,
});

// Health check schema
export const DashboardHealthSchema = z.object({
  database_health: z.object({
    connection_status: z.string(),
    query_start_time: z.string().datetime(),
    total_inspections: z.number().min(0).int(),
    total_users: z.number().min(0).int(),
    total_properties: z.number().min(0).int(),
    total_checklist_items: z.number().min(0).int(),
    rls_enabled: z.boolean(),
  }),
  performance_indicators: z.object({
    query_duration_ms: z.number().min(0).optional(),
    avg_query_time_ms: z.number().min(0),
    cache_hit_rate: z.number().min(0).max(100),
    concurrent_connections: z.number().min(0).int(),
  }),
});

// Type exports
export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
export type TimeRangeMetrics = z.infer<typeof TimeRangeMetricsSchema>;
export type DashboardHealth = z.infer<typeof DashboardHealthSchema>;
export type InspectionCounts = z.infer<typeof InspectionCountsSchema>;
export type TimeAnalytics = z.infer<typeof TimeAnalyticsSchema>;
export type AIMetrics = z.infer<typeof AIMetricsSchema>;

// Validation functions
export const validateDashboardMetrics = (data: unknown): DashboardMetrics => {
  try {
    const startTime = performance.now();
    const validatedData = DashboardMetricsSchema.parse(data);
    const validationTime = performance.now() - startTime;

    logger.debug("Dashboard metrics validated", {
      validationTime: `${validationTime.toFixed(2)}ms`,
      dataKeys: Object.keys(validatedData),
      component: "AdminDataValidation",
    });

    return validatedData;
  } catch (error) {
    logger.error("Dashboard metrics validation failed", {
      error: error instanceof z.ZodError ? error.errors : error,
      data: typeof data === "object" ? Object.keys(data as any) : typeof data,
      component: "AdminDataValidation",
    });

    throw new ValidationError("Invalid dashboard metrics data", {
      originalError: error,
      data,
    });
  }
};

export const validateTimeRangeMetrics = (data: unknown): TimeRangeMetrics => {
  try {
    return TimeRangeMetricsSchema.parse(data);
  } catch (error) {
    logger.error("Time range metrics validation failed", { error, data });
    throw new ValidationError("Invalid time range metrics data", {
      originalError: error,
    });
  }
};

export const validateDashboardHealth = (data: unknown): DashboardHealth => {
  try {
    return DashboardHealthSchema.parse(data);
  } catch (error) {
    logger.error("Dashboard health validation failed", { error, data });
    throw new ValidationError("Invalid dashboard health data", {
      originalError: error,
    });
  }
};

// Safe utility functions
export const safeDivision = (
  numerator: number,
  denominator: number,
  fallback = 0,
): number => {
  if (denominator === 0 || !isFinite(denominator) || !isFinite(numerator)) {
    return fallback;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
};

export const safePercentage = (value: number, total: number): number => {
  const percentage = safeDivision(value, total, 0) * 100;
  return Math.round(percentage * 100) / 100; // Round to 2 decimals
};

export const safeInteger = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && isFinite(value) && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

export const safeFloat = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

// Data sanitization for display
export const sanitizeDisplayValue = (
  value: unknown,
  type: "integer" | "float" | "percentage" = "integer",
): string => {
  switch (type) {
    case "integer":
      return safeInteger(value).toLocaleString();
    case "float":
      return safeFloat(value).toFixed(2);
    case "percentage":
      return `${safeFloat(value).toFixed(1)}%`;
    default:
      return String(value || "0");
  }
};

// Metric transformation utilities
export const transformRawMetrics = (rawData: any): DashboardMetrics => {
  try {
    // Ensure all required fields exist with safe defaults
    const transformed = {
      inspection_counts: {
        draft: safeInteger(rawData?.inspection_counts?.draft, 0),
        in_progress: safeInteger(rawData?.inspection_counts?.in_progress, 0),
        completed: safeInteger(rawData?.inspection_counts?.completed, 0),
        auditing: safeInteger(rawData?.inspection_counts?.auditing, 0),
        total: safeInteger(rawData?.inspection_counts?.total, 0),
      },
      time_analytics: rawData?.time_analytics
        ? {
            avg_duration_minutes: safeFloat(
              rawData.time_analytics.avg_duration_minutes,
              0,
            ),
            median_duration_minutes: safeFloat(
              rawData.time_analytics.median_duration_minutes,
              0,
            ),
            total_with_times: safeInteger(
              rawData.time_analytics.total_with_times,
              0,
            ),
          }
        : null,
      ai_metrics: rawData?.ai_metrics
        ? {
            accuracy_rate: safeFloat(rawData.ai_metrics.accuracy_rate, 0),
            total_predictions: safeInteger(
              rawData.ai_metrics.total_predictions,
              0,
            ),
            ai_pass_rate: safeFloat(rawData.ai_metrics.ai_pass_rate, 0),
            human_pass_rate: safeFloat(rawData.ai_metrics.human_pass_rate, 0),
          }
        : null,
      user_metrics: {
        active_inspectors: safeInteger(
          rawData?.user_metrics?.active_inspectors,
          0,
        ),
        total_users: safeInteger(rawData?.user_metrics?.total_users, 0),
        auditors: safeInteger(rawData?.user_metrics?.auditors, 0),
        admins: safeInteger(rawData?.user_metrics?.admins, 0),
      },
      revenue_metrics: {
        monthly_revenue: safeFloat(
          rawData?.revenue_metrics?.monthly_revenue,
          0,
        ),
        completed_this_month: safeInteger(
          rawData?.revenue_metrics?.completed_this_month,
          0,
        ),
        total_revenue: safeFloat(rawData?.revenue_metrics?.total_revenue, 0),
        avg_revenue_per_day: safeFloat(
          rawData?.revenue_metrics?.avg_revenue_per_day,
          0,
        ),
      },
    };

    // Validate the transformed data
    return validateDashboardMetrics(transformed);
  } catch (error) {
    logger.error("Metric transformation failed", { error, rawData });
    throw new ValidationError("Failed to transform raw metrics", {
      originalError: error,
    });
  }
};

// Comprehensive data health check
export const performDataHealthCheck = (
  metrics: DashboardMetrics,
): { isHealthy: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Check for basic data consistency
  const inspectionCounts = metrics.inspection_counts;
  const expectedTotal =
    inspectionCounts.draft +
    inspectionCounts.in_progress +
    inspectionCounts.completed +
    (inspectionCounts.auditing || 0);

  if (expectedTotal !== inspectionCounts.total) {
    issues.push(
      `Inspection count mismatch: expected ${expectedTotal}, got ${inspectionCounts.total}`,
    );
  }

  // Check for reasonable time analytics
  if (
    metrics.time_analytics &&
    metrics.time_analytics.avg_duration_minutes > 480
  ) {
    // 8 hours
    issues.push(
      `Unusually long average inspection time: ${metrics.time_analytics.avg_duration_minutes} minutes`,
    );
  }

  // Check for AI metrics reasonableness
  if (metrics.ai_metrics && metrics.ai_metrics.accuracy_rate > 100) {
    issues.push(
      `Invalid AI accuracy rate: ${metrics.ai_metrics.accuracy_rate}%`,
    );
  }

  // Check for user metrics consistency
  const userMetrics = metrics.user_metrics;
  if (userMetrics.active_inspectors > userMetrics.total_users) {
    issues.push(
      `More active inspectors than total users: ${userMetrics.active_inspectors} > ${userMetrics.total_users}`,
    );
  }

  return {
    isHealthy: issues.length === 0,
    issues,
  };
};
