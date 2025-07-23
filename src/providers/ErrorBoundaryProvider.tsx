/**
 * ERROR BOUNDARY PROVIDER - APPLICATION-WIDE ERROR HANDLING
 * 
 * Comprehensive error boundary provider that wraps the entire application
 * with layered error boundaries, centralized error handling, and 
 * production-ready error recovery mechanisms.
 * 
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { GlobalErrorBoundary } from '@/components/common/GlobalErrorBoundary';
import { AsyncErrorBoundary } from '@/components/common/AsyncErrorBoundary';
import { ErrorMonitoringDashboard } from '@/components/monitoring/ErrorMonitoringDashboard';
import { errorRecoveryService } from '@/lib/error/ErrorRecoveryService';
import { logger } from '@/utils/logger';

interface ErrorBoundaryContextValue {
  reportError: (error: Error, context?: Record<string, unknown>) => void;
  clearErrors: () => void;
  retryLastOperation: () => void;
  showErrorMonitor: () => void;
  hideErrorMonitor: () => void;
  isMonitoringVisible: boolean;
  errorCount: number;
  lastError: Error | null;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | null>(null);

interface ErrorBoundaryProviderProps {
  children: ReactNode;
  enableMonitoring?: boolean;
  enableAsyncErrorHandling?: boolean;
  developmentMode?: boolean;
  errorReportingEndpoint?: string;
  fallbackComponent?: React.ComponentType<Record<string, unknown>>;
}

export const ErrorBoundaryProvider: React.FC<ErrorBoundaryProviderProps> = ({
  children,
  enableMonitoring = process.env.NODE_ENV === 'development',
  enableAsyncErrorHandling = true,
  developmentMode = process.env.NODE_ENV === 'development',
  errorReportingEndpoint,
  fallbackComponent,
}) => {
  const [isMonitoringVisible, setIsMonitoringVisible] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [lastOperation, setLastOperation] = useState<() => void | null>(null);

  // Global error handler for the context
  const handleGlobalError = useCallback(async (error: Error, errorInfo: Record<string, unknown>) => {
    setErrorCount(prev => prev + 1);
    setLastError(error);

    logger.error('Global error boundary caught error', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      errorCount: errorCount + 1,
    });

    // Report to external service if endpoint is provided
    if (errorReportingEndpoint) {
      try {
        await fetch(errorReportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
            context: errorInfo,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          }),
        });
      } catch (reportingError) {
        logger.warn('Failed to report error to external service', { reportingError });
      }
    }

    // Attempt recovery using the error recovery service
    try {
      const recoveryResult = await errorRecoveryService.recoverFromError(error, {
        component: errorInfo?.componentStack?.split('\n')[0] || 'unknown',
        operationType: 'render',
      });

      if (recoveryResult.success) {
        logger.info('Error successfully recovered', { 
          strategy: recoveryResult.strategy,
          timeTaken: recoveryResult.timeTaken 
        });
      }
    } catch (recoveryError) {
      logger.error('Error recovery failed', { recoveryError });
    }
  }, [errorReportingEndpoint, errorCount]);

  // Context methods
  const reportError = useCallback((error: Error, context?: Record<string, unknown>) => {
    handleGlobalError(error, context);
  }, [handleGlobalError]);

  const clearErrors = useCallback(() => {
    setErrorCount(0);
    setLastError(null);
    logger.info('Error count cleared');
  }, []);

  const retryLastOperation = useCallback(() => {
    if (lastOperation) {
      try {
        lastOperation();
        logger.info('Last operation retried successfully');
      } catch (error) {
        logger.error('Failed to retry last operation', { error });
      }
    } else {
      logger.warn('No operation available to retry');
    }
  }, [lastOperation]);

  const showErrorMonitor = useCallback(() => {
    setIsMonitoringVisible(true);
  }, []);

  const hideErrorMonitor = useCallback(() => {
    setIsMonitoringVisible(false);
  }, []);

  const contextValue: ErrorBoundaryContextValue = {
    reportError,
    clearErrors,
    retryLastOperation,
    showErrorMonitor,
    hideErrorMonitor,
    isMonitoringVisible,
    errorCount,
    lastError,
  };

  return (
    <ErrorBoundaryContext.Provider value={contextValue}>
      {/* Root Error Boundary - Catches all uncaught errors */}
      <GlobalErrorBoundary
        context="Application Root"
        enableRecovery={true}
        onError={handleGlobalError}
        fallbackComponent={fallbackComponent}
        maxRetries={3}
        criticalComponent={true}
      >
        {/* Async Error Boundary - Handles promise rejections and async operations */}
        {enableAsyncErrorHandling ? (
          <AsyncErrorBoundary
            context="Application Async"
            enableOfflineMode={true}
            onAsyncError={handleGlobalError}
            maxRetries={3}
          >
            {children}
          </AsyncErrorBoundary>
        ) : (
          children
        )}

        {/* Error Monitoring Dashboard */}
        {enableMonitoring && (
          <ErrorMonitoringDashboard
            isVisible={isMonitoringVisible}
            onToggle={() => setIsMonitoringVisible(!isMonitoringVisible)}
            position="bottom-right"
            updateInterval={3000}
          />
        )}

        {/* Development Mode Error Overlay */}
        {developmentMode && lastError && (
          <DevelopmentErrorOverlay 
            error={lastError}
            onDismiss={() => setLastError(null)}
          />
        )}
      </GlobalErrorBoundary>
    </ErrorBoundaryContext.Provider>
  );
};

/**
 * Hook to access error boundary context
 */
export const useErrorBoundary = () => {
  const context = useContext(ErrorBoundaryContext);
  
  if (!context) {
    throw new Error('useErrorBoundary must be used within an ErrorBoundaryProvider');
  }
  
  return context;
};

/**
 * Hook for manual error reporting
 */
export const useErrorReporting = () => {
  const { reportError } = useErrorBoundary();
  
  const reportAsyncError = useCallback(async (
    operation: () => Promise<unknown>,
    context?: Record<string, unknown>
  ) => {
    try {
      return await operation();
    } catch (error) {
      reportError(error as Error, {
        ...context,
        type: 'async_operation',
        timestamp: Date.now(),
      });
      throw error;
    }
  }, [reportError]);

  const reportFormError = useCallback((
    error: Error,
    formData?: Record<string, unknown>,
    fieldName?: string
  ) => {
    reportError(error, {
      type: 'form_validation',
      formData: formData ? Object.keys(formData) : undefined, // Don't log actual form data for privacy
      fieldName,
      timestamp: Date.now(),
    });
  }, [reportError]);

  const reportNetworkError = useCallback((
    error: Error,
    url?: string,
    method?: string,
    statusCode?: number
  ) => {
    reportError(error, {
      type: 'network_error',
      url,
      method,
      statusCode,
      timestamp: Date.now(),
    });
  }, [reportError]);

  return {
    reportError,
    reportAsyncError,
    reportFormError,
    reportNetworkError,
  };
};

/**
 * Development Error Overlay Component
 */
const DevelopmentErrorOverlay: React.FC<{
  error: Error;
  onDismiss: () => void;
}> = ({ error, onDismiss }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div 
      id="development-error-overlay"
      className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="bg-red-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Development Error</h2>
            <button
              onClick={onDismiss}
              className="text-white hover:text-gray-200 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-auto max-h-96">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">Error Message:</h3>
            <p className="text-red-600 font-mono text-sm bg-red-50 p-3 rounded">
              {error.message}
            </p>
          </div>

          {error.stack && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Stack Trace:</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto font-mono">
                {error.stack}
              </pre>
            </div>
          )}

          <div className="text-xs text-gray-600">
            <p>This overlay only appears in development mode.</p>
            <p>Error occurred at: {new Date().toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex gap-2">
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Dismiss
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                console.error('Development Error Details:', error);
                alert('Error details logged to console');
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              Log to Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Higher-order component for wrapping components with specific error boundaries
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ComponentType<Record<string, unknown>>;
    onError?: (error: Error, errorInfo: Record<string, unknown>) => void;
    enableRetry?: boolean;
    context?: string;
  } = {}
) => {
  return React.forwardRef<any, P>((props, ref) => {
    const { reportError } = useErrorBoundary();

    const handleError = useCallback((error: Error, errorInfo: Record<string, unknown>) => {
      reportError(error, {
        ...errorInfo,
        component: options.context || Component.displayName || Component.name,
        wrappedComponent: true,
      });
      
      options.onError?.(error, errorInfo);
    }, [reportError]);

    return (
      <GlobalErrorBoundary
        context={options.context || Component.displayName || Component.name}
        onError={handleError}
        fallbackComponent={options.fallback}
        enableRecovery={options.enableRetry}
      >
        <Component {...props} ref={ref} />
      </GlobalErrorBoundary>
    );
  });
};

export default ErrorBoundaryProvider;