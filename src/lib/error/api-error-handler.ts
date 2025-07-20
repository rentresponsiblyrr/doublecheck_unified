import { ErrorReporter } from '../monitoring/error-reporter';
import { env } from '../config/environment';
import { log } from '@/lib/logging/enterprise-logger';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'network' | 'validation' | 'authentication' | 'authorization' | 'server' | 'client' | 'unknown';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  details?: Record<string, any>;
  retry?: boolean;
  userMessage?: string;
  timestamp?: string;
  requestId?: string;
}

export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  retryableErrors?: string[];
}

export interface ApiErrorContext {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  userId?: string;
  sessionId?: string;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['NetworkError', 'TimeoutError', 'ECONNREFUSED', 'ENOTFOUND'],
};

export class ApiErrorHandler {
  private static instance: ApiErrorHandler;
  private retryConfig: RetryConfig;
  private errorReporter: ErrorReporter;

  private constructor() {
    this.retryConfig = DEFAULT_RETRY_CONFIG;
    this.errorReporter = ErrorReporter.getInstance();
  }

  static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler();
    }
    return ApiErrorHandler.instance;
  }

  /**
   * Handle API errors with retry logic
   */
  async handleError(
    error: any,
    context: ApiErrorContext,
    retryConfig?: RetryConfig
  ): Promise<ApiError> {
    const apiError = this.normalizeError(error, context);
    
    // Report error to monitoring
    this.errorReporter.reportError(apiError, {
      api: true,
      context,
      severity: apiError.severity,
      category: apiError.category,
    });

    // Log all API errors with enterprise logger
    log.error('API Error occurred', apiError, {
      component: 'ApiErrorHandler',
      action: 'handleError',
      url: context.url,
      method: context.method,
      userId: context.userId,
      category: apiError.category,
      severity: apiError.severity,
      status: apiError.status,
      code: apiError.code
    }, 'API_ERROR_HANDLED');

    return apiError;
  }

  /**
   * Execute request with retry logic
   */
  async executeWithRetry<T>(
    request: () => Promise<T>,
    context: ApiErrorContext,
    customRetryConfig?: RetryConfig
  ): Promise<T> {
    const config = { ...this.retryConfig, ...customRetryConfig };
    let lastError: ApiError | null = null;
    let attempt = 0;

    while (attempt < (config.maxAttempts || 3)) {
      try {
        return await request();
      } catch (error) {
        attempt++;
        lastError = await this.handleError(error, context, config);

        if (!this.shouldRetry(lastError, attempt, config)) {
          throw lastError;
        }

        const delay = this.calculateDelay(attempt, config);
        
        log.debug('API retry attempt scheduled', {
          component: 'ApiErrorHandler',
          action: 'executeWithRetry',
          attempt,
          maxAttempts: config.maxAttempts,
          delayMs: delay,
          url: context.url,
          method: context.method,
          errorCategory: lastError.category,
          errorStatus: lastError.status
        }, 'API_RETRY_SCHEDULED');

        await this.delay(delay);
      }
    }

    throw lastError || new Error('Maximum retry attempts reached');
  }

  /**
   * Normalize various error types into ApiError
   */
  private normalizeError(error: any, context: ApiErrorContext): ApiError {
    // Already an ApiError
    if (error instanceof Error && 'category' in error) {
      return error as ApiError;
    }

    const apiError: ApiError = new Error(error.message || 'Unknown error') as ApiError;
    apiError.timestamp = new Date().toISOString();

    // Handle fetch/network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      apiError.category = 'network';
      apiError.severity = 'high';
      apiError.retry = true;
      apiError.userMessage = 'Network connection error. Please check your internet connection.';
      return apiError;
    }

    // Handle HTTP response errors
    if (error.status || error.response?.status) {
      const status = error.status || error.response.status;
      apiError.status = status;
      apiError.details = error.response?.data || error.data;
      
      // Categorize by status code
      if (status >= 400 && status < 500) {
        apiError.category = this.categorizeClientError(status);
        apiError.severity = status === 401 || status === 403 ? 'high' : 'medium';
        apiError.retry = status === 429; // Retry rate limit errors
        apiError.userMessage = this.getUserMessage(status, error);
      } else if (status >= 500) {
        apiError.category = 'server';
        apiError.severity = 'high';
        apiError.retry = true;
        apiError.userMessage = 'Server error. Please try again later.';
      }
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      apiError.category = 'network';
      apiError.severity = 'medium';
      apiError.retry = true;
      apiError.userMessage = 'Request timed out. Please try again.';
    }

    // Handle Supabase errors
    if (error.code && error.message && error.details) {
      apiError.code = error.code;
      apiError.details = error.details;
      apiError.category = this.categorizeSupabaseError(error.code);
      apiError.severity = this.getSeverityFromSupabaseError(error.code);
      apiError.userMessage = this.getSupabaseUserMessage(error);
    }

    // Default values
    apiError.category = apiError.category || 'unknown';
    apiError.severity = apiError.severity || 'medium';
    apiError.retry = apiError.retry ?? false;
    apiError.userMessage = apiError.userMessage || 'An unexpected error occurred. Please try again.';

    return apiError;
  }

  /**
   * Determine if error should trigger a retry
   */
  private shouldRetry(error: ApiError, attempt: number, config: RetryConfig): boolean {
    // Don't retry if explicitly set to false
    if (error.retry === false) return false;

    // Check max attempts
    if (attempt >= (config.maxAttempts || 3)) return false;

    // Check retryable status codes
    if (error.status && config.retryableStatuses) {
      if (config.retryableStatuses.includes(error.status)) return true;
    }

    // Check retryable error messages
    if (config.retryableErrors) {
      const errorMessage = error.message.toLowerCase();
      if (config.retryableErrors.some(msg => errorMessage.includes(msg.toLowerCase()))) {
        return true;
      }
    }

    // Check if error explicitly allows retry
    return error.retry === true;
  }

  /**
   * Calculate delay for retry with exponential backoff
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const { initialDelay = 1000, maxDelay = 30000, backoffMultiplier = 2 } = config;
    
    // Exponential backoff with jitter
    const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
    const delay = Math.min(exponentialDelay + jitter, maxDelay);
    
    return Math.round(delay);
  }

  /**
   * Categorize client errors
   */
  private categorizeClientError(status: number): ErrorCategory {
    switch (status) {
      case 401:
        return 'authentication';
      case 403:
        return 'authorization';
      case 400:
      case 422:
        return 'validation';
      default:
        return 'client';
    }
  }

  /**
   * Categorize Supabase errors
   */
  private categorizeSupabaseError(code: string): ErrorCategory {
    if (code.startsWith('AUTH_')) return 'authentication';
    if (code.startsWith('PGRST')) return 'server';
    if (code.includes('NETWORK')) return 'network';
    return 'unknown';
  }

  /**
   * Get severity from Supabase error
   */
  private getSeverityFromSupabaseError(code: string): ErrorSeverity {
    if (code.startsWith('AUTH_')) return 'high';
    if (code.includes('RATE_LIMIT')) return 'medium';
    if (code.includes('NETWORK')) return 'high';
    return 'medium';
  }

  /**
   * Get user-friendly message based on status code
   */
  private getUserMessage(status: number, error: any): string {
    const customMessage = error.response?.data?.message || error.data?.message;
    if (customMessage) return customMessage;

    switch (status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Please sign in to continue.';
      case 403:
        return 'You don\'t have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 422:
        return 'The provided data is invalid. Please check and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Our team has been notified.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  /**
   * Get user-friendly message for Supabase errors
   */
  private getSupabaseUserMessage(error: any): string {
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (error.message.includes('User already registered')) {
      return 'An account with this email already exists.';
    }
    if (error.message.includes('Email not confirmed')) {
      return 'Please verify your email address to continue.';
    }
    if (error.message.includes('Invalid token')) {
      return 'Your session has expired. Please sign in again.';
    }
    return error.message || 'An error occurred with the database.';
  }

  /**
   * Utility function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format error for logging
   */
  formatErrorForLogging(error: ApiError, context?: ApiErrorContext): Record<string, any> {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      category: error.category,
      severity: error.severity,
      timestamp: error.timestamp,
      stack: error.stack,
      details: error.details,
      context: context ? {
        url: context.url,
        method: context.method,
        userId: context.userId,
        sessionId: context.sessionId,
      } : undefined,
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error: ApiError): boolean {
    return error.retry === true || 
           (error.status !== undefined && DEFAULT_RETRY_CONFIG.retryableStatuses!.includes(error.status)) ||
           DEFAULT_RETRY_CONFIG.retryableErrors!.some(msg => error.message.includes(msg));
  }

  /**
   * Get error recovery suggestions
   */
  getRecoverySuggestions(error: ApiError): string[] {
    const suggestions: string[] = [];

    switch (error.category) {
      case 'network':
        suggestions.push('Check your internet connection');
        suggestions.push('Try refreshing the page');
        suggestions.push('Disable VPN or proxy if active');
        break;
      case 'authentication':
        suggestions.push('Sign in to your account');
        suggestions.push('Check your credentials');
        suggestions.push('Reset your password if forgotten');
        break;
      case 'authorization':
        suggestions.push('Contact support for access');
        suggestions.push('Check your subscription status');
        break;
      case 'validation':
        suggestions.push('Review the form for errors');
        suggestions.push('Check required fields');
        suggestions.push('Ensure data formats are correct');
        break;
      case 'server':
        suggestions.push('Wait a few minutes and try again');
        suggestions.push('Contact support if the issue persists');
        break;
    }

    return suggestions;
  }
}

// Export singleton instance
export const apiErrorHandler = ApiErrorHandler.getInstance();

// Export convenience functions
export const handleApiError = (error: any, context: ApiErrorContext) =>
  apiErrorHandler.handleError(error, context);

export const executeWithRetry = <T>(
  request: () => Promise<T>,
  context: ApiErrorContext,
  retryConfig?: RetryConfig
) => apiErrorHandler.executeWithRetry(request, context, retryConfig);