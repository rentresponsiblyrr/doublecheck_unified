/**
 * Service Standards - Elite Architecture Foundation
 *
 * Standardized service interfaces that eliminate naming inconsistencies
 * and provide bulletproof error handling patterns across the entire codebase.
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0 - Netflix/Google/Meta Production Standards
 */

/**
 * Standard service response wrapper with comprehensive metadata
 */
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata: {
    timestamp: string;
    requestId: string;
    performance: {
      startTime: number;
      endTime: number;
      duration: number;
    };
    operation: string;
    service: string;
  };
}

/**
 * Standardized error structure with user-friendly messages
 */
export interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
  retryable: boolean;
  userMessage: string;
  category:
    | "validation"
    | "network"
    | "database"
    | "auth"
    | "business"
    | "system";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
}

/**
 * Standard pagination options
 */
export interface ListOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, any>;
}

/**
 * Standard search options
 */
export interface SearchOptions extends ListOptions {
  fuzzy?: boolean;
  fields?: string[];
  highlightMatches?: boolean;
}

/**
 * Standard service methods interface - eliminates naming inconsistencies
 */
export interface StandardServiceMethods<
  T,
  CreateData = Partial<T>,
  UpdateData = Partial<CreateData>,
> {
  // ✅ STANDARDIZED CREATION OPERATIONS
  create(data: CreateData): Promise<ServiceResponse<T>>;

  // ✅ STANDARDIZED RETRIEVAL OPERATIONS
  get(id: string): Promise<ServiceResponse<T>>;
  getList(options?: ListOptions): Promise<ServiceResponse<T[]>>;
  search(query: string, options?: SearchOptions): Promise<ServiceResponse<T[]>>;

  // ✅ STANDARDIZED UPDATE OPERATIONS
  update(id: string, data: UpdateData): Promise<ServiceResponse<T>>;
  patch(id: string, data: Partial<T>): Promise<ServiceResponse<T>>;

  // ✅ STANDARDIZED DELETION OPERATIONS
  delete(id: string): Promise<ServiceResponse<boolean>>;

  // ✅ STANDARDIZED VALIDATION
  validate(data: CreateData | UpdateData): Promise<ServiceResponse<boolean>>;
}

/**
 * Report-specific service interface to standardize all report generation
 */
export interface ReportServiceInterface<TReportData, TReportOptions = {}> {
  // ✅ SINGLE STANDARDIZED METHOD for all report creation
  createReport(
    data: TReportData,
    options?: TReportOptions,
  ): Promise<ServiceResponse<ReportResult>>;

  // ✅ STANDARDIZED RETRIEVAL
  getReport(id: string): Promise<ServiceResponse<ReportResult>>;
  getReportList(
    options?: ListOptions,
  ): Promise<ServiceResponse<ReportResult[]>>;

  // ✅ STANDARDIZED DELETION
  deleteReport(id: string): Promise<ServiceResponse<boolean>>;
}

/**
 * Standard report result structure
 */
export interface ReportResult {
  id: string;
  type: string;
  format: "pdf" | "html" | "json" | "csv";
  url?: string;
  blob?: Blob;
  metadata: {
    createdAt: string;
    size: number;
    checksum?: string;
  };
}

/**
 * Bug report service interface to standardize all bug reporting
 */
export interface BugReportServiceInterface {
  // ✅ SINGLE STANDARDIZED METHOD replacing all create*Report variations
  createReport(
    data: BugReportData,
  ): Promise<ServiceResponse<GitHubIssueResponse>>;

  // ✅ STANDARDIZED RETRIEVAL
  getReport(id: string): Promise<ServiceResponse<BugReportResult>>;
  getReportList(
    options?: ListOptions,
  ): Promise<ServiceResponse<BugReportResult[]>>;
}

/**
 * Standard bug report data structure
 */
export interface BugReportData {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "ui" | "functionality" | "performance" | "security" | "other";
  steps: string[];
  userActions: Record<string, unknown>[];
  screenshot?: Record<string, unknown>;
  systemInfo: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    timestamp: string;
    url: string;
  };
  userInfo: {
    userId?: string;
    userRole?: string;
    email?: string;
  };
}

/**
 * Standard bug report result
 */
export interface BugReportResult {
  id: string;
  githubIssueNumber?: number;
  status: "submitted" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  updatedAt?: string;
}

/**
 * GitHub issue response structure
 */
export interface GitHubIssueResponse {
  number: number;
  title: string;
  html_url: string;
  state: string;
  labels?: Array<{ name: string; color: string }>;
}

/**
 * Performance metrics tracking interface
 */
export interface ServiceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  lastError?: ServiceError;
  uptime: number;
}

/**
 * Standard service base class providing common functionality
 */
export abstract class StandardService {
  protected readonly serviceName: string;
  protected metrics: ServiceMetrics;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      uptime: Date.now(),
    };
  }

  /**
   * Generate unique request ID for tracking
   */
  protected generateRequestId(): string {
    return `${this.serviceName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create standardized success response
   */
  protected createSuccessResponse<T>(
    data: T,
    startTime: number,
    operation: string,
  ): ServiceResponse<T> {
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Update metrics
    this.updateMetrics(duration, false);

    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        performance: {
          startTime,
          endTime,
          duration,
        },
        operation,
        service: this.serviceName,
      },
    };
  }

  /**
   * Create standardized error response
   */
  protected createErrorResponse<T>(
    error: ServiceError,
    startTime: number,
    operation: string,
  ): ServiceResponse<T> {
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Update metrics
    this.updateMetrics(duration, true);

    return {
      success: false,
      error: {
        ...error,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        performance: {
          startTime,
          endTime,
          duration,
        },
        operation,
        service: this.serviceName,
      },
    };
  }

  /**
   * Create standardized service error
   */
  protected createServiceError(
    code: string,
    message: string,
    options: {
      details?: unknown;
      retryable?: boolean;
      userMessage?: string;
      category?: ServiceError["category"];
      severity?: ServiceError["severity"];
    } = {},
  ): ServiceError {
    return {
      code,
      message,
      details: options.details,
      retryable: options.retryable ?? true,
      userMessage:
        options.userMessage ?? "An error occurred. Please try again.",
      category: options.category ?? "system",
      severity: options.severity ?? "medium",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update service metrics
   */
  private updateMetrics(duration: number, isError: boolean): void {
    this.metrics.requestCount++;

    // Update average response time
    const totalTime =
      this.metrics.averageResponseTime * (this.metrics.requestCount - 1) +
      duration;
    this.metrics.averageResponseTime = totalTime / this.metrics.requestCount;

    // Update error rate
    if (isError) {
      const totalErrors =
        this.metrics.errorRate * (this.metrics.requestCount - 1) + 1;
      this.metrics.errorRate = totalErrors / this.metrics.requestCount;
    } else {
      const totalErrors =
        this.metrics.errorRate * (this.metrics.requestCount - 1);
      this.metrics.errorRate = totalErrors / this.metrics.requestCount;
    }
  }

  /**
   * Get service health metrics
   */
  getMetrics(): ServiceMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime,
    };
  }

  /**
   * Reset service metrics (for testing)
   */
  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      uptime: Date.now(),
    };
  }
}

/**
 * Validation utilities for consistent data validation
 */
export class ValidationUtils {
  /**
   * Validate required fields
   */
  static validateRequired(
    data: Record<string, unknown>,
    requiredFields: string[],
  ): ServiceError | null {
    const missingFields = requiredFields.filter(
      (field) =>
        data[field] === undefined || data[field] === null || data[field] === "",
    );

    if (missingFields.length > 0) {
      return {
        code: "VALIDATION_REQUIRED_FIELDS",
        message: `Missing required fields: ${missingFields.join(", ")}`,
        details: { missingFields },
        retryable: false,
        userMessage: `Please provide: ${missingFields.join(", ")}`,
        category: "validation",
        severity: "medium",
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Validate field formats
   */
  static validateFormat(
    value: unknown,
    format: "email" | "url" | "uuid" | "phone",
    fieldName: string,
  ): ServiceError | null {
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      url: /^https?:\/\/.+/,
      uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      phone: /^\+?[\d\s\-\(\)]{10,}$/,
    };

    if (value && !patterns[format].test(value)) {
      return {
        code: `VALIDATION_INVALID_${format.toUpperCase()}`,
        message: `Invalid ${format} format for field: ${fieldName}`,
        details: { field: fieldName, value, expectedFormat: format },
        retryable: false,
        userMessage: `Please enter a valid ${format} for ${fieldName}`,
        category: "validation",
        severity: "medium",
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }
}

/**
 * Type utility for inferring service types
 */
export type ServiceMethodsOf<T> =
  T extends StandardServiceMethods<infer U, any, any> ? U : never;

/**
 * Common error codes used across services
 */
export const CommonErrorCodes = {
  // Validation errors
  VALIDATION_REQUIRED_FIELDS: "VALIDATION_REQUIRED_FIELDS",
  VALIDATION_INVALID_FORMAT: "VALIDATION_INVALID_FORMAT",
  VALIDATION_DUPLICATE_VALUE: "VALIDATION_DUPLICATE_VALUE",

  // Database errors
  DATABASE_CONNECTION_FAILED: "DATABASE_CONNECTION_FAILED",
  DATABASE_QUERY_FAILED: "DATABASE_QUERY_FAILED",
  DATABASE_RECORD_NOT_FOUND: "DATABASE_RECORD_NOT_FOUND",

  // Network errors
  NETWORK_REQUEST_FAILED: "NETWORK_REQUEST_FAILED",
  NETWORK_TIMEOUT: "NETWORK_TIMEOUT",
  NETWORK_RATE_LIMITED: "NETWORK_RATE_LIMITED",

  // Authentication errors
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_INSUFFICIENT_PERMISSIONS",

  // Business logic errors
  BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION",
  BUSINESS_STATE_INVALID: "BUSINESS_STATE_INVALID",

  // System errors
  SYSTEM_INTERNAL_ERROR: "SYSTEM_INTERNAL_ERROR",
  SYSTEM_SERVICE_UNAVAILABLE: "SYSTEM_SERVICE_UNAVAILABLE",
  SYSTEM_CONFIGURATION_ERROR: "SYSTEM_CONFIGURATION_ERROR",
} as const;

export type ErrorCode =
  (typeof CommonErrorCodes)[keyof typeof CommonErrorCodes];
