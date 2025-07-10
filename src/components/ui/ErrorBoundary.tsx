/**
 * Enhanced Error Boundary Component for STR Certified
 * Provides comprehensive error handling with retry mechanisms and fallback UI
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { logger } from '@/utils/logger';
import { sanitizeErrorMessage } from '@/utils/sanitization';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  showDetails?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: string[];
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, componentName } = this.props;
    
    // Log error details
    logger.error(
      `Error boundary caught error in ${componentName || 'unknown component'}`,
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount
      },
      'ERROR_BOUNDARY'
    );

    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Here you would send to error tracking service like Sentry
      console.error('Error boundary caught:', error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(key => 
        prevProps[key as keyof ErrorBoundaryProps] !== this.props[key as keyof ErrorBoundaryProps]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
    });
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      logger.warn('Max retries exceeded', { retryCount, maxRetries }, 'ERROR_BOUNDARY');
      return;
    }

    this.setState({ isRetrying: true });

    // Add exponential backoff delay
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);

    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));
    }, delay);

    logger.info('Retrying after error', { retryCount: retryCount + 1, delay }, 'ERROR_BOUNDARY');
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const { componentName } = this.props;
    
    const bugReport = {
      component: componentName || 'unknown',
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // In production, send to bug reporting service
    console.log('Bug report:', bugReport);
    
    // For demo, just copy to clipboard
    navigator.clipboard?.writeText(JSON.stringify(bugReport, null, 2));
    alert('Bug report copied to clipboard');
  };

  render() {
    const { 
      children, 
      fallback, 
      showRetry = true, 
      showDetails = false,
      maxRetries = 3,
      componentName 
    } = this.props;
    const { hasError, error, errorInfo, retryCount, isRetrying } = this.state;

    if (hasError) {
      // If custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      const canRetry = showRetry && retryCount < maxRetries;
      const errorMessage = sanitizeErrorMessage(error);

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-red-900 dark:text-red-100">
                Something went wrong
              </CardTitle>
              <CardDescription>
                {componentName ? `Error in ${componentName}` : 'An unexpected error occurred'}
                {retryCount > 0 && ` (Attempt ${retryCount + 1})`}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription className="text-sm">
                  {errorMessage}
                </AlertDescription>
              </Alert>

              {showDetails && error && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium mb-2">
                    Technical Details
                  </summary>
                  <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                  {errorInfo && (
                    <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto max-h-40 mt-2">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}

              <div className="flex flex-col gap-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry} 
                    disabled={isRetrying}
                    className="w-full"
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again ({maxRetries - retryCount} attempts left)
                      </>
                    )}
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={this.handleGoHome}
                    className="flex-1"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={this.handleReportBug}
                    className="flex-1"
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Report Bug
                  </Button>
                </div>
              </div>

              {!canRetry && retryCount >= maxRetries && (
                <Alert>
                  <AlertDescription className="text-sm">
                    Maximum retry attempts exceeded. Please refresh the page or contact support.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    logger.error('Handled error', error, 'USE_ERROR_HANDLER');
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps} componentName={Component.displayName || Component.name}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;