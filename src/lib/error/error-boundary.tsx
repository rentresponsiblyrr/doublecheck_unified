import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorReporter } from '../monitoring/error-reporter';
import { env } from '../config/environment';
import { log } from '@/lib/logging/enterprise-logger';

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (props: {
    error: Error;
    errorInfo: ErrorInfo;
    resetError: () => void;
    errorId: string;
  }) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  showErrorDetails?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    const { errorId, retryCount } = this.state;

    // Log with enterprise logger
    log.error('Error caught by ErrorBoundary', error, {
      component: 'ErrorBoundary',
      action: 'componentDidCatch',
      errorId: errorId || 'unknown',
      level,
      retryCount,
      componentStack: errorInfo.componentStack,
      errorName: error.name,
      propsKeys: Object.keys(this.sanitizeProps())
    }, 'ERROR_BOUNDARY_CATCH');

    // Update state with error info
    this.setState({ errorInfo });

    // Report to monitoring service
    ErrorReporter.getInstance().reportError(error, {
      errorBoundary: true,
      level,
      errorId: errorId || undefined,
      componentStack: errorInfo.componentStack,
      retryCount,
      props: this.sanitizeProps(),
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Set up automatic retry for transient errors
    if (this.shouldAutoRetry(error) && retryCount < 3) {
      this.scheduleRetry();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset on prop changes if enabled
    if (hasError && resetOnPropsChange && this.propsHaveChanged(prevProps)) {
      this.resetError();
      return;
    }

    // Reset on resetKeys change
    if (resetKeys && hasError) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== this.previousResetKeys[index]
      );

      if (hasResetKeyChanged) {
        this.resetError();
      }
    }

    this.previousResetKeys = resetKeys || [];
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    // Auto-retry network errors and specific known transient errors
    const transientErrors = [
      'NetworkError',
      'TimeoutError',
      'ChunkLoadError',
      'Loading chunk',
      'Failed to fetch',
      'Load failed',
    ];

    return transientErrors.some(msg => 
      error.message.includes(msg) || error.name.includes(msg)
    );
  }

  private scheduleRetry() {
    const { retryCount } = this.state;
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

    this.resetTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }, delay);
  }

  private propsHaveChanged(prevProps: ErrorBoundaryProps): boolean {
    // Simple shallow comparison of props
    return Object.keys(this.props).some(key => {
      if (key === 'children' || key === 'fallback') return false;
      return (this.props as any)[key] !== (prevProps as any)[key];
    });
  }

  private sanitizeProps(): Record<string, any> {
    // Remove sensitive data from props before reporting
    const { children, fallback, ...safeProps } = this.props;
    return safeProps;
  }

  resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    });
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback, isolate = true } = this.props;

    if (hasError && error && errorInfo) {
      // Use custom fallback if provided
      if (fallback) {
        return (
          <>
            {fallback({
              error,
              errorInfo,
              resetError: this.resetError,
              errorId: errorId || 'unknown',
            })}
          </>
        );
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          errorId={errorId || 'unknown'}
          showDetails={this.props.showErrorDetails ?? env.isDevelopment()}
        />
      );
    }

    // Wrap children in a div if isolation is enabled
    // This prevents errors from propagating to sibling components
    if (isolate) {
      return <div className="error-boundary-container">{children}</div>;
    }

    return children;
  }
}

// Default error fallback component
function DefaultErrorFallback({
  error,
  errorInfo,
  resetError,
  errorId,
  showDetails,
}: {
  error: Error;
  errorInfo: ErrorInfo;
  resetError: () => void;
  errorId: string;
  showDetails: boolean;
}) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            Something went wrong
          </h3>
          
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            We're sorry for the inconvenience. The error has been reported and we'll look into it.
          </p>

          {showDetails && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                Error Details
              </summary>
              <div className="mt-2 text-xs">
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Error ID:</strong> {errorId}
                </p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  <strong>Message:</strong> {error.message}
                </p>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </div>
            </details>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetError}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            
            <button
              onClick={() => {
                // NUCLEAR REMOVED: window.location.replace(window.location.pathname)
                // Professional page refresh without session destruction
                window.history.pushState(null, '', window.location.pathname);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Higher-order component for adding error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for imperatively triggering error boundary
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return (error: Error) => {
    setError(error);
  };
}