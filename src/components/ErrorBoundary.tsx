/**
 * Production Error Boundary Component
 * Replaces nuclear error handlers (window.location.reload) with graceful recovery
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { logger } from '@/utils/logger';
import { analyticsService } from '@/services/core/AnalyticsService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  isRecovering: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly MAX_RETRIES = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, componentName } = this.props;
    
    // Log error details
    logger.error('Component error caught by boundary', {
      component: componentName || 'Unknown',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to error tracking service (if configured)
    this.reportError(error, errorInfo);
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // Send to error tracking service
    try {
      // This would integrate with Sentry, LogRocket, etc.
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          error: {
            message: error.message,
            stack: error.stack,
            component: this.props.componentName
          }
        });
      }
    } catch (reportingError) {
      logger.error('Failed to report error', reportingError);
    }
  }

  private handleRetry = async () => {
    this.retryCount++;
    
    if (this.retryCount > this.MAX_RETRIES) {
      logger.warn('Max retry attempts reached', {
        component: this.props.componentName,
        retries: this.retryCount
      });
      return;
    }

    this.setState({ isRecovering: true });

    try {
      // Attempt recovery
      await errorRecovery.handleError(this.state.error, {
        operation: 'component_recovery',
        component: this.props.componentName,
        timestamp: new Date()
      });

      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false
      });
      
      this.retryCount = 0;
    } catch (recoveryError) {
      logger.error('Recovery failed', recoveryError);
      this.setState({ isRecovering: false });
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      isRecovering: false
    });
    this.retryCount = 0;
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      component: this.props.componentName,
      timestamp: new Date().toISOString()
    };

    // Open bug report (could be a modal, email, or external service)
    const subject = encodeURIComponent(`Bug Report: ${this.state.error?.message}`);
    const body = encodeURIComponent(`
Error Details:
${JSON.stringify(errorDetails, null, 2)}

Steps to reproduce:
1. 
2. 
3. 

Expected behavior:


Actual behavior:
${this.state.error?.message}
    `);

    window.open(`mailto:support@strcertified.com?subject=${subject}&body=${body}`);
  };

  render() {
    const { hasError, error, errorInfo, isRecovering } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI
      return (
        <div id="error-boundary-fallback" className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-2xl w-full shadow-lg">
            <CardHeader className="bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <CardTitle className="text-xl text-red-900">
                  Something went wrong
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700">
                  We encountered an unexpected error. The issue has been logged and our team has been notified.
                </p>

                {showDetails && (
                  <div className="bg-gray-100 rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-sm text-gray-900">
                      Error Details:
                    </p>
                    <p className="text-sm text-red-600 font-mono">
                      {error.message}
                    </p>
                    {errorInfo && (
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer hover:text-gray-800">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 overflow-auto max-h-40 p-2 bg-white rounded">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    onClick={this.handleRetry}
                    disabled={isRecovering || this.retryCount >= this.MAX_RETRIES}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
                    {isRecovering ? 'Recovering...' : 'Try Again'}
                  </Button>

                  <Button
                    onClick={this.handleReset}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset Component
                  </Button>

                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>

                  <Button
                    onClick={this.handleReportBug}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Bug className="h-4 w-4" />
                    Report Issue
                  </Button>
                </div>

                {this.retryCount >= this.MAX_RETRIES && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Automatic recovery failed after {this.MAX_RETRIES} attempts. 
                      Please try refreshing the page or contact support if the issue persists.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook for using error boundary in functional components
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    logger.error('Error handled by hook', {
      error: error.message,
      stack: error.stack,
      info: errorInfo
    });

    // Attempt recovery
    errorRecovery.handleError(error, {
      operation: 'hook_error_handler',
      timestamp: new Date()
    }).catch(recoveryError => {
      logger.error('Recovery failed in hook', recoveryError);
    });
  };
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ErrorBoundary;