/**
 * GLOBAL ERROR BOUNDARY - NETFLIX/META PRODUCTION STANDARDS
 *
 * Comprehensive error boundary system with advanced recovery mechanisms,
 * user-friendly error handling, logging integration, and fallback UI patterns.
 * Designed for production resilience and optimal user experience.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/utils/logger";

// EXTRACTED COMPONENTS - ARCHITECTURAL EXCELLENCE
import { ErrorFallbackUI } from "./GlobalErrorBoundary/components/ErrorFallbackUI";
import {
  logErrorToService,
  determineSeverity,
  shouldAutoRecover,
} from "./GlobalErrorBoundary/utils/errorUtils";

export interface ErrorInfo extends Error {
  componentStack?: string;
  errorBoundary?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  context?: Record<string, any>;
  severity?: "low" | "medium" | "high" | "critical";
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: ErrorInfo | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastErrorTime: number;
  isRecovering: boolean;
  fallbackMode: "minimal" | "partial" | "full";
  userReported: boolean;
}

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<{
    error: ErrorInfo;
    retry: () => void;
  }>;
  maxRetries?: number;
  retryDelay?: number;
  enableRecovery?: boolean;
  onError?: (error: ErrorInfo, errorInfo: ErrorInfo) => void;
  context?: string;
  criticalComponent?: boolean;
}

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  private retryTimeout?: NodeJS.Timeout;
  private errorReportingQueue: ErrorInfo[] = [];
  private readonly MAX_ERROR_REPORTS = 10;
  private readonly ERROR_THROTTLE_MS = 60000; // 1 minute

  constructor(props: GlobalErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0,
      isRecovering: false,
      fallbackMode: "partial",
      userReported: false,
    };
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<GlobalErrorBoundaryState> {
    // Update state to trigger fallback UI
    return {
      hasError: true,
      error: error as ErrorInfo,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const enhancedError: ErrorInfo = {
      ...error,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.context || "GlobalErrorBoundary",
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      timestamp: Date.now(),
      context: this.gatherContext(),
      severity: this.calculateSeverity(error, errorInfo),
    };

    this.setState({
      errorInfo: enhancedError,
    });

    // Log error with comprehensive context
    this.logError(enhancedError, errorInfo);

    // Report to external error tracking service
    this.reportError(enhancedError);

    // Trigger custom error handler
    this.props.onError?.(enhancedError, errorInfo);

    // Attempt automatic recovery if enabled
    if (this.props.enableRecovery !== false) {
      this.attemptRecovery(enhancedError);
    }
  }

  private getUserId(): string | undefined {
    try {
      // Get user ID from various potential sources
      const userData = localStorage.getItem("user");
      if (userData) {
        return JSON.parse(userData).id;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string | undefined {
    try {
      return sessionStorage.getItem("sessionId") || undefined;
    } catch {
      return undefined;
    }
  }

  private gatherContext(): Record<string, any> {
    const context: Record<string, any> = {
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      timestamp: new Date().toISOString(),
      viewport:
        typeof window !== "undefined"
          ? {
              width: window.innerWidth,
              height: window.innerHeight,
            }
          : null,
      memory:
        typeof performance !== "undefined" && (performance as any).memory
          ? {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
              jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
            }
          : null,
    };

    // Add React component context if available
    if (this.props.context) {
      context.componentContext = this.props.context;
    }

    return context;
  }

  private calculateSeverity(
    error: Error,
    errorInfo: ErrorInfo,
  ): ErrorInfo["severity"] {
    // Critical errors that completely break the app
    if (
      this.props.criticalComponent ||
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Loading chunk") ||
      error.stack?.includes("TypeError: Cannot read prop")
    ) {
      return "critical";
    }

    // High severity for runtime errors that affect functionality
    if (
      error.name === "TypeError" ||
      error.name === "ReferenceError" ||
      error.message.includes("Network Error")
    ) {
      return "high";
    }

    // Medium for rendering errors
    if (errorInfo.componentStack || error.name === "Error") {
      return "medium";
    }

    return "low";
  }

  private logError(error: ErrorInfo, errorInfo: ErrorInfo): void {
    logger.error("React Error Boundary caught error", {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        severity: error.severity,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      context: error.context,
      userId: error.userId,
      sessionId: error.sessionId,
      retryCount: this.state.retryCount,
    });
  }

  private reportError(error: ErrorInfo): void {
    // Throttle error reporting to prevent spam
    const now = Date.now();
    if (
      now - this.state.lastErrorTime < this.ERROR_THROTTLE_MS &&
      this.errorReportingQueue.length >= this.MAX_ERROR_REPORTS
    ) {
      return;
    }

    // Add to reporting queue
    this.errorReportingQueue.push(error);

    // Report to external service (e.g., Sentry, LogRocket, etc.)
    try {
      // This would be your actual error reporting service
      this.sendErrorReport(error);
    } catch (reportingError) {
      logger.warn("Error reporting service failed", { reportingError });
    }
  }

  private async sendErrorReport(error: ErrorInfo): Promise<void> {
    // Simulate error reporting service call
    // In production, this would be your actual error reporting integration
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: error.componentStack,
      context: error.context,
      severity: error.severity,
      userId: error.userId,
      sessionId: error.sessionId,
      timestamp: error.timestamp,
    };

    // Example: Send to your error reporting service
    try {
      const response = await fetch("/api/error-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorReport),
      });

      if (!response.ok) {
        throw new Error("Error reporting failed");
      }
    } catch (error) {
      // Fallback to localStorage for offline error reporting
      this.storeErrorOffline(errorReport);
    }
  }

  private storeErrorOffline(errorReport: Record<string, unknown>): void {
    try {
      const offlineErrors = JSON.parse(
        localStorage.getItem("offline_errors") || "[]",
      );
      offlineErrors.push(errorReport);

      // Keep only last 50 errors to prevent storage overflow
      const trimmedErrors = offlineErrors.slice(-50);
      localStorage.setItem("offline_errors", JSON.stringify(trimmedErrors));
    } catch (error) {
      // If localStorage is full, clear old errors
      localStorage.removeItem("offline_errors");
      logger.warn("Could not store error offline due to storage limitations");
    }
  }

  private attemptRecovery(error: ErrorInfo): void {
    const maxRetries = this.props.maxRetries || 3;

    if (this.state.retryCount >= maxRetries) {
      logger.warn("Maximum retry attempts reached", {
        retryCount: this.state.retryCount,
        maxRetries,
        error: error.message,
      });
      return;
    }

    this.setState({ isRecovering: true });

    const retryDelay = this.props.retryDelay || 1000;
    const backoffDelay = retryDelay * Math.pow(2, this.state.retryCount);

    this.retryTimeout = setTimeout(() => {
      this.handleRetry();
    }, backoffDelay);

    logger.info("Attempting automatic error recovery", {
      retryCount: this.state.retryCount + 1,
      delay: backoffDelay,
    });
  }

  private handleRetry = (): void => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isRecovering: false,
    }));

    logger.info("Error boundary retry attempted", {
      retryCount: this.state.retryCount + 1,
    });
  };

  private handleManualRetry = (): void => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      userReported: false,
    });

    logger.info("Manual error boundary retry triggered");
  };

  private handleReportError = (): void => {
    if (this.state.error) {
      this.reportError({
        ...this.state.error,
        context: {
          ...this.state.error.context,
          userReported: true,
          reportedAt: Date.now(),
        },
      });

      this.setState({ userReported: true });
    }
  };

  private handleGoHome = (): void => {
    window.location.href = "/";
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.props.fallbackComponent) {
        return (
          <this.props.fallbackComponent
            error={this.state.error!}
            retry={this.handleManualRetry}
          />
        );
      }

      // Default comprehensive fallback UI
      return this.renderFallbackUI();
    }

    return this.props.children;
  }

  private renderFallbackUI() {
    const { error, retryCount, isRecovering, userReported } = this.state;
    const maxRetries = this.props.maxRetries || 3;
    const canRetry = retryCount < maxRetries;

    return (
      <ErrorFallbackUI
        error={error}
        retryCount={retryCount}
        maxRetries={maxRetries}
        isRecovering={isRecovering}
        userReported={userReported}
        canRetry={canRetry}
        onRetry={this.handleRetry}
        onNavigateHome={this.handleNavigateHome}
        onReportError={this.handleReportError}
      />
    );
  }

  private renderFallbackUIOriginal() {
    const { error, retryCount, isRecovering, userReported } = this.state;
    const maxRetries = this.props.maxRetries || 3;
    const canRetry = retryCount < maxRetries;

    return (
      <div
        id="error-boundary-fallback"
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      >
        <div className="max-w-2xl w-full space-y-6">
          {/* Error Status Card */}
          <Card id="error-status-card" className="border-red-200">
            <CardHeader id="error-header" className="text-center">
              <div
                id="error-icon-container"
                className="flex justify-center mb-4"
              >
                <div
                  id="error-icon-background"
                  className="bg-red-100 p-3 rounded-full"
                >
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <CardTitle id="error-title" className="text-2xl text-gray-900">
                {error?.severity === "critical"
                  ? "Critical System Error"
                  : error?.severity === "high"
                    ? "Application Error"
                    : "Something went wrong"}
              </CardTitle>

              <div
                id="error-badges-container"
                className="flex justify-center gap-2 mt-2"
              >
                <Badge
                  variant={
                    error?.severity === "critical" ? "destructive" : "secondary"
                  }
                  className="text-xs"
                >
                  {error?.severity?.toUpperCase() || "ERROR"}
                </Badge>

                {retryCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Retry {retryCount}/{maxRetries}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent id="error-content" className="text-center space-y-4">
              <p className="text-gray-600">
                {error?.severity === "critical"
                  ? "A critical error has occurred that prevents the application from functioning properly."
                  : "We encountered an unexpected error. Don't worry - your data is safe and we're working to resolve this."}
              </p>

              {/* Error Details (Development) */}
              {process.env.NODE_ENV === "development" && error && (
                <details
                  id="error-details"
                  className="text-left bg-gray-100 p-4 rounded"
                >
                  <summary className="cursor-pointer font-medium text-gray-800">
                    Technical Details (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {error.context && (
                      <div>
                        <strong>Context:</strong>
                        <pre className="text-xs bg-white p-2 rounded border">
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>

          {/* Recovery Actions */}
          <Card id="recovery-actions-card">
            <CardHeader id="recovery-header">
              <CardTitle className="text-lg">Recovery Options</CardTitle>
            </CardHeader>

            <CardContent id="recovery-content">
              <div
                id="recovery-buttons-container"
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {/* Retry Button */}
                {canRetry && (
                  <Button
                    onClick={this.handleManualRetry}
                    disabled={isRecovering}
                    className="flex items-center justify-center"
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${isRecovering ? "animate-spin" : ""}`}
                    />
                    {isRecovering ? "Recovering..." : "Try Again"}
                  </Button>
                )}

                {/* Go Home Button */}
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>

                {/* Reload Page */}
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>

                {/* Report Error */}
                <Button
                  variant="outline"
                  onClick={this.handleReportError}
                  disabled={userReported}
                  className="flex items-center justify-center"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {userReported ? "Error Reported" : "Report Error"}
                </Button>
              </div>

              {/* Additional Help */}
              <div id="additional-help" className="mt-6 pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-3">
                  Need more help?
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open("/help", "_blank")}
                    className="flex items-center justify-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Documentation
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open("/support", "_blank")}
                    className="flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recovery Status */}
          {(isRecovering || retryCount > 0) && (
            <Card
              id="recovery-status-card"
              className="border-blue-200 bg-blue-50"
            >
              <CardContent className="pt-4">
                <div className="flex items-center">
                  <RefreshCw
                    className={`w-5 h-5 mr-3 text-blue-600 ${isRecovering ? "animate-spin" : ""}`}
                  />
                  <div>
                    <div className="font-medium text-blue-800">
                      {isRecovering
                        ? "Attempting to recover..."
                        : `Recovery attempted ${retryCount} time${retryCount > 1 ? "s" : ""}`}
                    </div>
                    <div className="text-sm text-blue-600">
                      {isRecovering
                        ? "Please wait while we try to resolve the issue."
                        : canRetry
                          ? "You can try again or use one of the options above."
                          : "Maximum retry attempts reached. Please try reloading the page."}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }
}

/**
 * High-Order Component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<GlobalErrorBoundaryProps>,
) {
  return function WrappedComponent(props: P) {
    return (
      <GlobalErrorBoundary
        {...errorBoundaryProps}
        context={Component.displayName || Component.name}
      >
        <Component {...props} />
      </GlobalErrorBoundary>
    );
  };
}

/**
 * Hook for triggering error boundaries programmatically
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    // Enhance error with additional context
    const enhancedError = Object.assign(error, {
      timestamp: Date.now(),
      triggeredProgrammatically: true,
    });

    setError(enhancedError);
  }, []);

  // Trigger error boundary on next render if error is set
  if (error) {
    throw error;
  }

  return handleError;
}

export default GlobalErrorBoundary;
