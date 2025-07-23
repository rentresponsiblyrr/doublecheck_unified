/**
 * @fileoverview Enterprise Error Handling Types
 * Professional TypeScript interfaces for error handling hooks and utilities
 *
 * Eliminates amateur 'any' error patterns with proper typing
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0
 */

/**
 * Standard error context for business operations
 */
export interface ErrorContext {
  operation: string;
  component: string;
  userId?: string;
  propertyId?: string;
  inspectionId?: string;
  sessionId?: string;
  timestamp?: number;
  userAgent?: string;
  url?: string;
  correlationId?: string;
}

/**
 * API-specific error context
 */
export interface ApiErrorContext extends ErrorContext {
  endpoint: string;
  method: string;
  statusCode?: number;
  requestId?: string;
  retryAttempt?: number;
  requestPayload?: Record<string, unknown>;
}

/**
 * Form-specific error context
 */
export interface FormErrorContext extends ErrorContext {
  formName: string;
  fieldName?: string;
  fieldValue?: string | number | boolean;
  validationRule?: string;
}

/**
 * Detailed error information
 */
export interface ErrorDetails {
  message: string;
  code?: string;
  type: string;
  stack?: string;
  cause?: Error;
  timestamp: number;
  context: ErrorContext;
}

/**
 * Error handling options
 */
export interface ErrorHandlingOptions {
  showLoading?: boolean;
  context?: ErrorContext;
  retryable?: boolean;
  silent?: boolean;
  timeout?: number;
}

/**
 * Async operation wrapper result
 */
export interface AsyncOperationResult<T> {
  data?: T;
  error?: ErrorDetails;
  success: boolean;
  loading: boolean;
}

/**
 * Form error handling state
 */
export interface FormErrorState {
  fieldErrors: Record<string, string>;
  generalError: string | null;
  hasErrors: boolean;
  isValidating: boolean;
}

/**
 * Error recovery actions
 */
export interface ErrorRecoveryActions {
  retry: () => void;
  reset: () => void;
  reportError: (details?: Record<string, unknown>) => void;
  dismiss: () => void;
}

/**
 * Type guard to check if error is an API error
 */
export function isApiError(
  error: unknown,
): error is Error & { status?: number; statusCode?: number } {
  return error instanceof Error && ("status" in error || "statusCode" in error);
}

/**
 * Type guard to check if error is a validation error
 */
export function isValidationError(
  error: unknown,
): error is Error & { field?: string; rule?: string } {
  return error instanceof Error && ("field" in error || "rule" in error);
}

/**
 * Type guard to check if error is a network error
 */
export function isNetworkError(error: unknown): error is Error {
  const networkKeywords = [
    "network",
    "timeout",
    "connection",
    "fetch",
    "abort",
  ];
  return (
    error instanceof Error &&
    networkKeywords.some((keyword) =>
      error.message.toLowerCase().includes(keyword),
    )
  );
}

/**
 * Utility to create standardized error details
 */
export function createErrorDetails(
  error: Error,
  context: ErrorContext,
  type: string = "generic",
): ErrorDetails {
  return {
    message: error.message,
    code: (error as any)?.code,
    type,
    stack: error.stack,
    cause: error.cause as Error | undefined,
    timestamp: Date.now(),
    context,
  };
}

/**
 * Utility to format error for display
 */
export function formatErrorMessage(error: ErrorDetails): string {
  let message = error.message;

  if (error.code) {
    message += ` (${error.code})`;
  }

  if (error.context.operation) {
    message += ` - Operation: ${error.context.operation}`;
  }

  return message;
}
