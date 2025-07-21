/**
 * ENTERPRISE ERROR HANDLING SYSTEM - GOOGLE/META/NETFLIX STANDARDS
 * 
 * This is how real engineers handle errors in production systems.
 * ZERO TOLERANCE for amateur error patterns.
 * 
 * Features:
 * - Circuit breaker pattern for resilience
 * - Automatic retry with exponential backoff
 * - Error correlation and aggregation
 * - Real-time alerting and escalation
 * - Graceful degradation strategies
 * - Recovery mechanisms and rollback
 */

import { log } from '../logging/enterprise-logger';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// ENTERPRISE ERROR TYPES
// ============================================================================

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ErrorCategory = 'NETWORK' | 'VALIDATION' | 'BUSINESS' | 'SYSTEM' | 'SECURITY' | 'PERFORMANCE';
export type RecoveryAction = 'RETRY' | 'FALLBACK' | 'ESCALATE' | 'CIRCUIT_BREAK' | 'IGNORE';

export interface ErrorContext {
  correlationId: string;
  userId?: string;
  sessionId?: string;
  component: string;
  operation: string;
  retryCount?: number;
  userAgent?: string;
  url?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorReport {
  id: string;
  error: Error;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  recoveryAction: RecoveryAction;
  isRecoverable: boolean;
  retryable: boolean;
  userMessage: string;
  timestamp: string;
  resolved: boolean;
  resolutionTime?: number;
}

export interface CircuitBreakerState {
  name: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
  nextAttemptTime: number;
  threshold: number;
  timeout: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
}

export interface ErrorHandlerConfig {
  enableCircuitBreaker: boolean;
  enableRetry: boolean;
  enableAlerting: boolean;
  maxConcurrentErrors: number;
  errorAggregationWindow: number;
  alertingThreshold: number;
  defaultRetryConfig: RetryConfig;
  circuitBreakerTimeout: number;
  circuitBreakerThreshold: number;
}

// ============================================================================
// ENTERPRISE ERROR CLASSES
// ============================================================================

export class EnterpriseError extends Error {
  public readonly id: string;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly isRecoverable: boolean;
  public readonly retryable: boolean;
  public readonly userMessage: string;
  public readonly context: Partial<ErrorContext>;
  public readonly timestamp: string;

  constructor(
    message: string,
    options: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      isRecoverable?: boolean;
      retryable?: boolean;
      userMessage?: string;
      context?: Partial<ErrorContext>;
      cause?: Error;
    } = {}
  ) {
    super(message);
    
    this.name = 'EnterpriseError';
    this.id = uuidv4();
    this.severity = options.severity || 'MEDIUM';
    this.category = options.category || 'SYSTEM';
    this.isRecoverable = options.isRecoverable !== false;
    this.retryable = options.retryable !== false;
    this.userMessage = options.userMessage || 'An unexpected error occurred. Please try again.';
    this.context = options.context || {};
    this.timestamp = new Date().toISOString();

    if (options.cause) {
      this.cause = options.cause;
      this.stack = options.cause.stack;
    }
  }
}

export class ValidationError extends EnterpriseError {
  constructor(message: string, field?: string, value?: unknown) {
    super(message, {
      severity: 'LOW',
      category: 'VALIDATION',
      isRecoverable: true,
      retryable: false,
      userMessage: `Validation failed: ${message}`,
      context: { field, value }
    });
    this.name = 'ValidationError';
  }
}

export class BusinessError extends EnterpriseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      severity: 'MEDIUM',
      category: 'BUSINESS',
      isRecoverable: true,
      retryable: false,
      userMessage: message,
      context
    });
    this.name = 'BusinessError';
  }
}

export class NetworkError extends EnterpriseError {
  constructor(message: string, statusCode?: number, endpoint?: string) {
    super(message, {
      severity: statusCode && statusCode >= 500 ? 'HIGH' : 'MEDIUM',
      category: 'NETWORK',
      isRecoverable: true,
      retryable: true,
      userMessage: 'Network error occurred. Please check your connection and try again.',
      context: { statusCode, endpoint }
    });
    this.name = 'NetworkError';
  }
}

export class SecurityError extends EnterpriseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      severity: 'CRITICAL',
      category: 'SECURITY',
      isRecoverable: false,
      retryable: false,
      userMessage: 'Access denied. Please contact support if this issue persists.',
      context
    });
    this.name = 'SecurityError';
  }
}

export class SystemError extends EnterpriseError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      severity: 'CRITICAL',
      category: 'SYSTEM',
      isRecoverable: true,
      retryable: true,
      userMessage: 'System error occurred. Our team has been notified.',
      context
    });
    this.name = 'SystemError';
  }
}

// ============================================================================
// CIRCUIT BREAKER IMPLEMENTATION
// ============================================================================

export class CircuitBreaker {
  private state: CircuitBreakerState;
  private readonly config: ErrorHandlerConfig;

  constructor(
    name: string,
    config: ErrorHandlerConfig
  ) {
    this.config = config;
    this.state = {
      name,
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
      nextAttemptTime: 0,
      threshold: config.circuitBreakerThreshold,
      timeout: config.circuitBreakerTimeout
    };
  }

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.config.enableCircuitBreaker) {
      return operation();
    }

    this.updateState();

    if (this.state.state === 'OPEN') {
      throw new SystemError(
        `Circuit breaker is OPEN for ${this.state.name}`,
        { 
          circuitState: this.state,
          nextAttemptTime: new Date(this.state.nextAttemptTime).toISOString()
        }
      );
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private updateState(): void {
    const now = Date.now();

    if (this.state.state === 'OPEN' && now >= this.state.nextAttemptTime) {
      this.state.state = 'HALF_OPEN';
      this.state.successCount = 0;
      log.info(`Circuit breaker ${this.state.name} moved to HALF_OPEN`, {
        component: 'circuit-breaker',
        circuitName: this.state.name
      });
    }
  }

  private onSuccess(): void {
    if (this.state.state === 'HALF_OPEN') {
      this.state.successCount++;
      
      if (this.state.successCount >= 3) { // Require 3 successes to close
        this.state.state = 'CLOSED';
        this.state.failureCount = 0;
        log.info(`Circuit breaker ${this.state.name} moved to CLOSED`, {
          component: 'circuit-breaker',
          circuitName: this.state.name
        });
      }
    } else if (this.state.state === 'CLOSED') {
      this.state.failureCount = Math.max(0, this.state.failureCount - 1);
    }
  }

  private onFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = Date.now();

    if (this.state.state === 'CLOSED' && this.state.failureCount >= this.state.threshold) {
      this.state.state = 'OPEN';
      this.state.nextAttemptTime = Date.now() + this.state.timeout;
      
      log.error(`Circuit breaker ${this.state.name} moved to OPEN`, undefined, {
        component: 'circuit-breaker',
        circuitName: this.state.name,
        failureCount: this.state.failureCount,
        threshold: this.state.threshold
      });
    } else if (this.state.state === 'HALF_OPEN') {
      this.state.state = 'OPEN';
      this.state.nextAttemptTime = Date.now() + this.state.timeout;
      
      log.warn(`Circuit breaker ${this.state.name} returned to OPEN from HALF_OPEN`, {
        component: 'circuit-breaker',
        circuitName: this.state.name
      });
    }
  }

  public getState(): CircuitBreakerState {
    return { ...this.state };
  }

  public reset(): void {
    this.state.state = 'CLOSED';
    this.state.failureCount = 0;
    this.state.successCount = 0;
    this.state.nextAttemptTime = 0;
    
    log.info(`Circuit breaker ${this.state.name} manually reset`, {
      component: 'circuit-breaker',
      circuitName: this.state.name
    });
  }
}

// ============================================================================
// RETRY MECHANISM WITH EXPONENTIAL BACKOFF
// ============================================================================

export class RetryManager {
  private readonly config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: ['NetworkError', 'SystemError', 'ECONNRESET', 'ETIMEDOUT'],
      ...config
    };
  }

  public async execute<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt);
          log.info(`Retrying operation after ${delay}ms`, {
            component: 'retry-manager',
            attempt,
            maxRetries: this.config.maxRetries,
            delay,
            ...context
          });
          await this.sleep(delay);
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if this error type is not retryable
        if (!this.isRetryable(error as Error)) {
          log.warn(`Error not retryable, aborting retry attempts`, {
            component: 'retry-manager',
            errorName: lastError.name,
            errorMessage: lastError.message,
            attempt,
            ...context
          });
          break;
        }

        // Don't retry if we've reached max attempts
        if (attempt === this.config.maxRetries) {
          log.error(`Max retry attempts reached`, lastError, {
            component: 'retry-manager',
            attempt,
            maxRetries: this.config.maxRetries,
            ...context
          });
          break;
        }

        log.warn(`Operation failed, will retry`, {
          component: 'retry-manager',
          errorName: lastError.name,
          errorMessage: lastError.message,
          attempt,
          maxRetries: this.config.maxRetries,
          ...context
        });
      }
    }

    throw new EnterpriseError(
      `Operation failed after ${this.config.maxRetries} retry attempts`,
      {
        severity: 'HIGH',
        category: 'SYSTEM',
        retryable: false,
        context: { ...context, maxRetries: this.config.maxRetries },
        cause: lastError!
      }
    );
  }

  private isRetryable(error: Error): boolean {
    // Check if error type is in retryable list
    if (this.config.retryableErrors.includes(error.name)) {
      return true;
    }

    // Check if error code is retryable
    const errorCode = (error as any).code;
    if (errorCode && this.config.retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check if it's an EnterpriseError and explicitly retryable
    if (error instanceof EnterpriseError) {
      return error.retryable;
    }

    return false;
  }

  private calculateDelay(attempt: number): number {
    const baseDelay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    const cappedDelay = Math.min(baseDelay, this.config.maxDelay);
    
    if (this.config.jitter) {
      // Add ±25% jitter to prevent thundering herd
      const jitterRange = cappedDelay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      return Math.max(0, cappedDelay + jitter);
    }
    
    return cappedDelay;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// ENTERPRISE ERROR HANDLER
// ============================================================================

export class EnterpriseErrorHandler {
  private readonly config: ErrorHandlerConfig;
  private readonly circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private readonly retryManager: RetryManager;
  private readonly errorReports: Map<string, ErrorReport> = new Map();
  private readonly alertingQueue: ErrorReport[] = [];

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableCircuitBreaker: true,
      enableRetry: true,
      enableAlerting: true,
      maxConcurrentErrors: 100,
      errorAggregationWindow: 60000, // 1 minute
      alertingThreshold: 10,
      defaultRetryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
        retryableErrors: ['NetworkError', 'SystemError']
      },
      circuitBreakerTimeout: 60000, // 1 minute
      circuitBreakerThreshold: 5,
      ...config
    };

    this.retryManager = new RetryManager(this.config.defaultRetryConfig);
    
    if (this.config.enableAlerting) {
      this.startAlertingProcessor();
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Handle an error with full enterprise error processing
   */
  public async handleError(
    error: Error,
    context: Partial<ErrorContext>
  ): Promise<ErrorReport> {
    const enrichedContext: ErrorContext = {
      correlationId: uuidv4(),
      component: 'unknown',
      operation: 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...context
    };

    // Convert to EnterpriseError if needed
    const enterpriseError = this.normalizeError(error);
    
    // Create error report
    const report = this.createErrorReport(enterpriseError, enrichedContext);
    
    // Store error report
    this.errorReports.set(report.id, report);
    
    // Log the error
    log.error(
      `Error handled: ${enterpriseError.message}`,
      enterpriseError,
      enrichedContext,
      'ERROR_HANDLED'
    );

    // Security audit for security errors
    if (enterpriseError.category === 'SECURITY') {
      log.securityEvent(
        `Security error: ${enterpriseError.message}`,
        enterpriseError.severity as any,
        enrichedContext
      );
    }

    // Add to alerting queue if necessary
    if (this.shouldAlert(report)) {
      this.alertingQueue.push(report);
    }

    // Clean up old error reports
    this.cleanupErrorReports();

    return report;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  public async withCircuitBreaker<T>(
    operationName: string,
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    const circuitBreaker = this.getOrCreateCircuitBreaker(operationName);
    
    try {
      return await circuitBreaker.execute(operation);
    } catch (error) {
      await this.handleError(error as Error, {
        ...context,
        component: 'circuit-breaker',
        operation: operationName
      });
      throw error;
    }
  }

  /**
   * Execute operation with retry logic
   */
  public async withRetry<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {},
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const manager = retryConfig ? new RetryManager(retryConfig) : this.retryManager;
    
    try {
      return await manager.execute(operation, context);
    } catch (error) {
      await this.handleError(error as Error, {
        ...context,
        component: 'retry-manager'
      });
      throw error;
    }
  }

  /**
   * Execute operation with full protection (circuit breaker + retry)
   */
  public async withFullProtection<T>(
    operationName: string,
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    return this.withCircuitBreaker(
      operationName,
      () => this.withRetry(operation, context),
      context
    );
  }

  /**
   * Create a user-friendly error for display
   */
  public createUserError(error: Error, context: Partial<ErrorContext> = {}): {
    message: string;
    isRetryable: boolean;
    errorId: string;
  } {
    const enterpriseError = this.normalizeError(error);
    
    return {
      message: enterpriseError.userMessage,
      isRetryable: enterpriseError.retryable,
      errorId: enterpriseError.id
    };
  }

  // ============================================================================
  // PRIVATE IMPLEMENTATION
  // ============================================================================

  private normalizeError(error: Error): EnterpriseError {
    if (error instanceof EnterpriseError) {
      return error;
    }

    // Detect error category based on error properties
    let category: ErrorCategory = 'SYSTEM';
    let severity: ErrorSeverity = 'MEDIUM';
    let retryable = false;

    if (error.name.includes('Network') || (error as any).code === 'NETWORK_ERROR') {
      category = 'NETWORK';
      retryable = true;
    } else if (error.name.includes('Validation') || error.message.includes('validation')) {
      category = 'VALIDATION';
      severity = 'LOW';
    } else if (error.name.includes('Permission') || error.name.includes('Auth')) {
      category = 'SECURITY';
      severity = 'HIGH';
    } else if ((error as any).statusCode >= 500) {
      category = 'SYSTEM';
      severity = 'HIGH';
      retryable = true;
    }

    return new EnterpriseError(error.message, {
      severity,
      category,
      retryable,
      cause: error,
      context: {}
    });
  }

  private createErrorReport(
    error: EnterpriseError,
    context: ErrorContext
  ): ErrorReport {
    const recoveryAction = this.determineRecoveryAction(error);
    
    return {
      id: error.id,
      error,
      severity: error.severity,
      category: error.category,
      context,
      recoveryAction,
      isRecoverable: error.isRecoverable,
      retryable: error.retryable,
      userMessage: error.userMessage,
      timestamp: error.timestamp,
      resolved: false
    };
  }

  private determineRecoveryAction(error: EnterpriseError): RecoveryAction {
    if (error.severity === 'CRITICAL') {
      return 'ESCALATE';
    }
    
    if (error.retryable) {
      return 'RETRY';
    }
    
    if (error.isRecoverable) {
      return 'FALLBACK';
    }
    
    if (error.category === 'NETWORK' || error.category === 'SYSTEM') {
      return 'CIRCUIT_BREAK';
    }
    
    return 'IGNORE';
  }

  private shouldAlert(report: ErrorReport): boolean {
    if (report.severity === 'CRITICAL') return true;
    if (report.category === 'SECURITY') return true;
    
    // Check error frequency
    const recentErrors = Array.from(this.errorReports.values())
      .filter(r => 
        Date.now() - new Date(r.timestamp).getTime() < this.config.errorAggregationWindow &&
        r.error.name === report.error.name
      );
    
    return recentErrors.length >= this.config.alertingThreshold;
  }

  private getOrCreateCircuitBreaker(name: string): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name, this.config));
    }
    return this.circuitBreakers.get(name)!;
  }

  private cleanupErrorReports(): void {
    const cutoff = Date.now() - this.config.errorAggregationWindow * 10; // Keep 10x window
    
    for (const [id, report] of this.errorReports) {
      if (new Date(report.timestamp).getTime() < cutoff) {
        this.errorReports.delete(id);
      }
    }
  }

  private startAlertingProcessor(): void {
    setInterval(() => {
      if (this.alertingQueue.length > 0) {
        const alerts = this.alertingQueue.splice(0);
        this.processAlerts(alerts);
      }
    }, 5000); // Process alerts every 5 seconds
  }

  private async processAlerts(alerts: ErrorReport[]): Promise<void> {
    for (const alert of alerts) {
      try {
        // In production, this would send to alerting service (PagerDuty, Slack, etc.)
        log.fatal(
          `ALERT: ${alert.error.message}`,
          alert.error,
          {
            ...alert.context,
            alertId: alert.id,
            severity: alert.severity,
            category: alert.category
          },
          'ERROR_ALERT'
        );
      } catch (error) {
      }
    }
  }

  // ============================================================================
  // PUBLIC UTILITIES
  // ============================================================================

  public getCircuitBreakerStates(): CircuitBreakerState[] {
    return Array.from(this.circuitBreakers.values()).map(cb => cb.getState());
  }

  public getErrorReports(): ErrorReport[] {
    return Array.from(this.errorReports.values());
  }

  public resetCircuitBreaker(name: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(name);
    if (circuitBreaker) {
      circuitBreaker.reset();
      return true;
    }
    return false;
  }

  public getStats(): {
    totalErrors: number;
    activeCircuitBreakers: number;
    pendingAlerts: number;
  } {
    return {
      totalErrors: this.errorReports.size,
      activeCircuitBreakers: this.circuitBreakers.size,
      pendingAlerts: this.alertingQueue.length
    };
  }
}

// ============================================================================
// GLOBAL ERROR HANDLER INSTANCE
// ============================================================================

let globalErrorHandler: EnterpriseErrorHandler | null = null;

export function getGlobalErrorHandler(): EnterpriseErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new EnterpriseErrorHandler();
  }
  return globalErrorHandler;
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

const errorHandler = getGlobalErrorHandler();

export const errorManager = {
  handle: errorHandler.handleError.bind(errorHandler),
  withCircuitBreaker: errorHandler.withCircuitBreaker.bind(errorHandler),
  withRetry: errorHandler.withRetry.bind(errorHandler),
  withFullProtection: errorHandler.withFullProtection.bind(errorHandler),
  createUserError: errorHandler.createUserError.bind(errorHandler),
  getStats: errorHandler.getStats.bind(errorHandler),
  resetCircuitBreaker: errorHandler.resetCircuitBreaker.bind(errorHandler)
};