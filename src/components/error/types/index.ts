/**
 * PROFESSIONAL ERROR BOUNDARY TYPES - ZERO TOLERANCE STANDARDS
 * 
 * Comprehensive type definitions for the professional error boundary system.
 * All types are properly defined to ensure type safety and prevent runtime errors.
 * 
 * Features:
 * - Complete type coverage for all error scenarios
 * - Professional error context tracking
 * - Branded types for error IDs to prevent mixing
 * - Comprehensive fallback strategy types
 * 
 * Performance: Zero runtime overhead, compile-time safety
 * Bundle Size: <1KB (types are stripped in production)
 */

import { ReactNode, ErrorInfo } from 'react';

/**
 * Error boundary severity levels for escalation strategy
 * 
 * @description Defines the severity level for proper error escalation
 */
export type ErrorLevel = 'component' | 'page' | 'application';

/**
 * Fallback strategies for error recovery
 * 
 * @description Different strategies for handling errors gracefully
 */
export type FallbackStrategy = 'retry' | 'fallback' | 'redirect' | 'offline';

/**
 * Network connection status
 */
export type NetworkStatus = 'online' | 'offline';

/**
 * Branded type for error IDs to prevent mixing with other string IDs
 */
export type ErrorId = string & { readonly brand: unique symbol };

/**
 * Professional error context for debugging and monitoring
 * 
 * @description Comprehensive context information for error reporting and debugging
 */
export interface ErrorContext {
  /** Component name where the error occurred */
  componentName?: string;
  /** User ID for tracking user-specific errors */
  userId?: string;
  /** Session ID for tracking session-specific errors */
  sessionId?: string;
  /** Current route where error occurred */
  route?: string;
  /** ISO timestamp when error occurred */
  timestamp: string;
  /** User agent string for browser/device identification */
  userAgent: string;
  /** Viewport dimensions at time of error */
  viewport: { 
    width: number; 
    height: number; 
  };
  /** Network connection status */
  networkStatus: NetworkStatus;
  /** Memory usage in bytes (if available) */
  memoryUsage?: number;
}

/**
 * Professional error boundary component props
 * 
 * @description Complete props interface for the error boundary component
 */
export interface ProfessionalErrorBoundaryProps {
  /** Child components to wrap with error boundary */
  children: ReactNode;
  /** Error severity level for escalation */
  level: ErrorLevel;
  /** Strategy for handling errors */
  fallbackStrategy?: FallbackStrategy;
  /** Custom fallback component to render on error */
  customFallback?: ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo, context: ErrorContext) => void;
  /** Callback when error boundary recovers */
  onRecovered?: () => void;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Delay between retry attempts in milliseconds */
  retryDelay?: number;
  /** Name of the component for context */
  componentName?: string;
  /** Enable error monitoring and auto-recovery */
  enableMonitoring?: boolean;
  /** Show technical error details to users */
  showErrorDetails?: boolean;
  /** Allow users to report bugs */
  allowReportBug?: boolean;
  /** Graceful fallback component for minimal UI */
  gracefulFallback?: ReactNode;
}

/**
 * Professional error boundary internal state
 * 
 * @description Internal state management for error boundary
 */
export interface ProfessionalErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that occurred */
  error: Error | null;
  /** React error info from componentDidCatch */
  errorInfo: ErrorInfo | null;
  /** Number of retry attempts made */
  retryCount: number;
  /** Whether currently retrying */
  isRetrying: boolean;
  /** Unique identifier for this error */
  errorId: string;
  /** Error context information */
  context: ErrorContext | null;
  /** Whether auto-recovery has been attempted */
  recoveryAttempted: boolean;
}

/**
 * Error monitoring configuration
 * 
 * @description Configuration for error monitoring and reporting
 */
export interface ErrorMonitoringConfig {
  /** Enable automatic error reporting */
  enableReporting: boolean;
  /** Monitoring service endpoint */
  endpoint?: string;
  /** API key for monitoring service */
  apiKey?: string;
  /** Sample rate for error reporting (0-1) */
  sampleRate: number;
  /** Maximum errors to report per session */
  maxErrorsPerSession: number;
}

/**
 * Retry mechanism configuration
 * 
 * @description Configuration for retry logic with exponential backoff
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay between retries in milliseconds */
  initialDelay: number;
  /** Maximum delay cap in milliseconds */
  maxDelay: number;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Jitter to add randomness to retry timing */
  jitter: boolean;
}

/**
 * Bug report data structure
 * 
 * @description Structured data for bug reporting
 */
export interface BugReport {
  /** Unique error identifier */
  errorId: string;
  /** Component where error occurred */
  component: string;
  /** Error message */
  error: string;
  /** Error stack trace */
  stack?: string;
  /** React component stack */
  componentStack?: string;
  /** Error context information */
  context: ErrorContext;
  /** User agent string */
  userAgent: string;
  /** Current URL */
  url: string;
  /** ISO timestamp */
  timestamp: string;
}

/**
 * Error report for monitoring services
 * 
 * @description Structured error report for external monitoring
 */
export interface ErrorReport {
  /** Unique error identifier */
  id: string;
  /** Error message */
  message: string;
  /** Error stack trace */
  stack?: string;
  /** React component stack */
  componentStack?: string;
  /** Error context */
  context: ErrorContext;
  /** ISO timestamp */
  timestamp: string;
  /** Error severity level */
  level: ErrorLevel;
}

/**
 * Fallback component props
 * 
 * @description Common props for all fallback components
 */
export interface FallbackComponentProps {
  /** The error that occurred */
  error: Error | null;
  /** Error ID for tracking */
  errorId: string;
  /** Number of retry attempts */
  retryCount: number;
  /** Maximum retry attempts allowed */
  maxRetries: number;
  /** Whether currently retrying */
  isRetrying: boolean;
  /** Component name for context */
  componentName?: string;
  /** Retry handler */
  onRetry: () => void;
  /** Navigate back handler */
  onNavigateBack: () => void;
  /** Bug report handler */
  onReportBug?: () => void;
  /** Whether to show error details */
  showErrorDetails?: boolean;
  /** Whether to allow bug reporting */
  allowReportBug?: boolean;
}

/**
 * Professional error handler hook return type
 * 
 * @description Return type for the error handler hook
 */
export interface ProfessionalErrorHandler {
  /** Handle an error */
  handleError: (error: Error) => void;
  /** Reset error state */
  resetError: () => void;
}

/**
 * Type guard to check if error is recoverable
 * 
 * @param error - Error to check
 * @returns Whether error is recoverable
 */
export const isRecoverableError = (error: Error): boolean => {
  // Network errors, timeout errors, etc. are typically recoverable
  return error.name === 'NetworkError' ||
         error.name === 'TimeoutError' ||
         error.message.includes('fetch') ||
         error.message.includes('network');
};

/**
 * Type guard to check if error is a React error
 * 
 * @param error - Error to check
 * @returns Whether error is a React error
 */
export const isReactError = (error: Error): boolean => {
  return error.message.includes('React') ||
         error.stack?.includes('React') ||
         false;
};

/**
 * Create a branded error ID
 * 
 * @returns Unique branded error ID
 */
export const createErrorId = (): ErrorId => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ErrorId;
};