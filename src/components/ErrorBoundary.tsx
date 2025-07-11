/**
 * Enterprise Error Boundary System
 * Comprehensive error handling with monitoring and recovery
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isRecovering: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Log error to monitoring service
    this.logError(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorReport = {
        error_id: this.state.errorId,
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        component_name: this.props.componentName || 'Unknown',
        error_level: this.props.level || 'component',
        user_agent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        retry_count: this.state.retryCount,
        additional_info: {
          props: this.sanitizeProps(this.props),
          state: this.sanitizeState(),
        },
      };

      // Log to Supabase
      await supabase.from('error_reports').insert(errorReport);

      // In production, also send to external monitoring service
      if (process.env.NODE_ENV === 'production') {
        await this.sendToMonitoringService(errorReport);
      }

    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  private async sendToMonitoringService(errorReport: any) {
    try {
      // Send to Sentry, LogRocket, or similar service
      // This would be configured with actual monitoring service
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      });
    } catch (error) {
      console.error('Failed to send error to monitoring service:', error);
    }
  }

  private sanitizeProps(props: any): any {
    // Remove sensitive data and functions from props for logging
    const sanitized: any = {};
    
    Object.keys(props).forEach(key => {
      const value = props[key];
      
      if (typeof value === 'function') {
        sanitized[key] = '[Function]';
      } else if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = '[Object]';
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  private sanitizeState(): any {
    // Remove sensitive data from state for logging
    const { error, errorInfo, ...safeState } = this.state;
    return safeState;
  }

  private handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ 
      isRecovering: true,
      retryCount: this.state.retryCount + 1,
    });

    // Log retry attempt
    try {
      await supabase.from('error_recovery_attempts').insert({
        error_id: this.state.errorId,
        attempt_number: this.state.retryCount + 1,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log retry attempt:', error);
    }

    // Wait before retry
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false,
      });
    }, this.retryDelay);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      component: this.props.componentName,
    };

    const mailtoLink = `mailto:support@doublecheckverified.com?subject=Error Report - ${this.state.errorId}&body=${encodeURIComponent(
      `Error Details:\n${JSON.stringify(errorDetails, null, 2)}\n\nPlease describe what you were doing when this error occurred:`
    )}`;

    window.open(mailtoLink);
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Recovery mode
      if (this.state.isRecovering) {
        return (
          <div className="flex items-center justify-center min-h-[200px] p-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Attempting to recover...</p>
            </div>
          </div>
        );
      }

      // Error level determines UI complexity
      const isCritical = this.props.level === 'critical';
      const isPageLevel = this.props.level === 'page';

      return (
        <div className={`flex items-center justify-center p-8 ${isPageLevel ? 'min-h-screen' : 'min-h-[400px]'}`}>
          <div className="max-w-lg w-full text-center">
            <div className={`mb-6 ${isCritical ? 'text-red-500' : 'text-orange-500'}`}>
              <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">
                {isCritical ? 'Critical Error' : 'Something went wrong'}
              </h1>
              <p className="text-gray-600 mb-4">
                {isCritical 
                  ? 'A critical error has occurred that requires immediate attention.'
                  : 'We encountered an unexpected error. This has been reported to our team.'
                }
              </p>
            </div>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <h3 className="font-semibold mb-2">Error Details:</h3>
                <p className="text-sm text-red-600 mb-2">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Error ID for support */}
            {this.state.errorId && (
              <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Error ID:</strong> {this.state.errorId}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Please include this ID when reporting the issue.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {/* Retry button (if not max retries) */}
              {this.state.retryCount < this.maxRetries && !isCritical && (
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  className="w-full"
                  disabled={this.state.isRecovering}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </Button>
              )}

              {/* Reload page */}
              {isPageLevel && (
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
              )}

              {/* Go home */}
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>

              {/* Report bug */}
              <Button
                onClick={this.handleReportBug}
                variant="ghost"
                className="w-full"
              >
                <Bug className="h-4 w-4 mr-2" />
                Report This Issue
              </Button>
            </div>

            {/* Additional help text */}
            <div className="mt-6 text-xs text-gray-500">
              <p>
                If this problem persists, please contact support at{' '}
                <a 
                  href="mailto:support@doublecheckverified.com"
                  className="text-blue-500 hover:underline"
                >
                  support@doublecheckverified.com
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithErrorBoundary;
}

// Async error handler for promises
export function handleAsyncError(error: Error, context?: string) {
  console.error('Async error occurred:', error, context);
  
  // Create a synthetic error boundary event
  const errorEvent = new CustomEvent('asyncError', {
    detail: { error, context }
  });
  
  window.dispatchEvent(errorEvent);
}

// Global error handlers
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    handleAsyncError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      'unhandledrejection'
    );
  });

  // Handle global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    handleAsyncError(
      event.error || new Error(event.message),
      'global'
    );
  });
}