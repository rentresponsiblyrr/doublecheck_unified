import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';

interface PWAErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  recoveryAttempts: number;
  lastRecoveryTime: number;
  isRecovering: boolean;
}

interface PWAErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: React.ComponentType<PWAErrorFallbackProps>;
  maxRecoveryAttempts?: number;
  recoveryDelay?: number;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRecovery?: () => void;
  className?: string;
}

interface PWAErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  onRetry: () => void;
  onReport: () => void;
  isRecovering: boolean;
}

export class PWAErrorBoundary extends Component<PWAErrorBoundaryProps, PWAErrorBoundaryState> {
  private recoveryTimer: number | null = null;

  constructor(props: PWAErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      recoveryAttempts: 0,
      lastRecoveryTime: 0,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<PWAErrorBoundaryState> {
    const errorId = `pwa_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
      isRecovering: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;

    // Log comprehensive error information
    logger.error('PWA Error Boundary caught error', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }, 'PWA_ERROR_BOUNDARY');

    this.setState({ errorInfo });

    // Call custom error handler
    onError?.(error, errorInfo);

    // Attempt automatic recovery for recoverable errors
    this.attemptRecovery(error);
  }

  private attemptRecovery = (error: Error) => {
    const { maxRecoveryAttempts = 3, recoveryDelay = 1000 } = this.props;
    const { recoveryAttempts } = this.state;

    if (recoveryAttempts < maxRecoveryAttempts && this.isRecoverableError(error)) {
      this.setState({ isRecovering: true });

      const delay = Math.pow(2, recoveryAttempts) * recoveryDelay; // Exponential backoff

      this.recoveryTimer = window.setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          errorId: null,
          recoveryAttempts: recoveryAttempts + 1,
          lastRecoveryTime: Date.now(),
          isRecovering: false
        });

        this.props.onRecovery?.();

        logger.info('PWA Error Boundary attempted automatic recovery', {
          attempt: recoveryAttempts + 1,
          delay,
          errorType: error.name
        }, 'PWA_ERROR_BOUNDARY');

      }, delay);
    }
  };

  private isRecoverableError = (error: Error): boolean => {
    // Define which errors are recoverable
    const recoverableErrors = [
      'ChunkLoadError',
      'NetworkError',
      'ServiceWorkerError',
      'QuotaExceededError',
      'SecurityError',
      'NotFoundError'
    ];

    const nonRecoverableErrors = [
      'SyntaxError',
      'ReferenceError',
      'TypeError'
    ];

    // Don't recover from syntax/reference errors
    if (nonRecoverableErrors.some(nonRecoverable =>
      error.name.includes(nonRecoverable) || error.message.includes(nonRecoverable)
    )) {
      return false;
    }

    // Recover from known recoverable errors
    return recoverableErrors.some(recoverable =>
      error.name.includes(recoverable) ||
      error.message.includes(recoverable) ||
      error.stack?.includes(recoverable)
    );
  };

  private manualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRecovering: false
    });

    logger.info('PWA Error Boundary manual retry initiated', {}, 'PWA_ERROR_BOUNDARY');
  };

  componentWillUnmount() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }
  }

  render() {
    const { hasError, error, errorInfo, errorId, isRecovering } = this.state;
    const { children, fallbackComponent: FallbackComponent = DefaultPWAErrorFallback, className = '' } = this.props;

    if (hasError && error) {
      return (
        <div id="pwa-error-boundary-container" className={className}>
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            errorId={errorId}
            onRetry={this.manualRetry}
            onReport={() => this.reportError(error, errorInfo)}
            isRecovering={isRecovering}
          />
        </div>
      );
    }

    return children;
  }

  private reportError = (error: Error, errorInfo: ErrorInfo | null) => {
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: errorInfo?.componentStack,
      errorId: this.state.errorId,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      recoveryAttempts: this.state.recoveryAttempts,
      browserInfo: {
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        platform: navigator.platform
      },
      pwaInfo: {
        serviceWorkerSupported: 'serviceWorker' in navigator,
        notificationSupported: 'Notification' in window,
        standalone: window.matchMedia('(display-mode: standalone)').matches
      }
    };

    // Send error report to monitoring service
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    }).catch(reportError => {
      logger.error('Failed to report PWA error', {
        reportError: reportError.message,
        originalError: error.message
      }, 'PWA_ERROR_BOUNDARY');
    });

    logger.info('PWA error report sent', { errorId: this.state.errorId }, 'PWA_ERROR_BOUNDARY');
  };
}

// Default fallback UI component with professional styling
const DefaultPWAErrorFallback: React.FC<PWAErrorFallbackProps> = ({
  error,
  errorId,
  onRetry,
  onReport,
  isRecovering
}) => (
  <div id="pwa-error-boundary-fallback" className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-white">
              PWA Component Error
            </h3>
            <p className="text-sm text-red-100">
              Something went wrong with the Progressive Web App features
            </p>
          </div>
        </div>
      </div>

      {/* Error Details */}
      <div className="px-6 py-4">
        <div className="bg-gray-50 rounded-md p-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Error Details:</h4>
          <p className="text-sm text-gray-900 font-mono break-words">
            {error.name}: {error.message}
          </p>
          {errorId && (
            <p className="text-xs text-gray-500 mt-2">
              Error ID: <span className="font-mono">{errorId}</span>
            </p>
          )}
        </div>

        {/* Recovery Status */}
        {isRecovering && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Attempting automatic recovery...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 mb-4">
          <p className="mb-2">This error has been automatically reported to our team.</p>
          <p>You can try the following:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
            <li>Click "Try Again" to reload the component</li>
            <li>Refresh the page to restart the application</li>
            <li>Check your internet connection</li>
            <li>Clear your browser cache if the problem persists</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-6 py-4 flex space-x-3">
        <button
          id="pwa-error-retry-button"
          onClick={onRetry}
          disabled={isRecovering}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isRecovering ? 'Recovering...' : 'Try Again'}
        </button>
        <button
          id="pwa-error-report-button"
          onClick={onReport}
          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Report Issue
        </button>
      </div>
    </div>
  </div>
);

export default PWAErrorBoundary;