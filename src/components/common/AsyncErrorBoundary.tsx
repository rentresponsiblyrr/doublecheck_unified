/**
 * ASYNC ERROR BOUNDARY - PROMISE REJECTION HANDLING
 * 
 * Specialized error boundary for handling async operations, promise rejections,
 * network errors, and loading state management with comprehensive recovery
 * mechanisms for production resilience.
 * 
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import React, { Component, ReactNode } from 'react';
import { GlobalErrorBoundary, ErrorInfo } from './GlobalErrorBoundary';
import { Loader2, Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/utils/logger';

interface AsyncErrorBoundaryState {
  hasAsyncError: boolean;
  asyncError: Error | null;
  isLoading: boolean;
  networkStatus: 'online' | 'offline' | 'slow' | 'unstable';
  retryCount: number;
  lastRetryTime: number;
  operationType: 'fetch' | 'mutation' | 'upload' | 'sync' | 'unknown';
  recoveryStrategy: 'retry' | 'fallback' | 'manual' | 'cached';
}

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  maxRetries?: number;
  retryDelay?: number;
  enableOfflineMode?: boolean;
  onAsyncError?: (error: Error, context: any) => void;
  loadingFallback?: ReactNode;
  context?: string;
}

export class AsyncErrorBoundary extends Component<
  AsyncErrorBoundaryProps,
  AsyncErrorBoundaryState
> {
  private retryTimeouts: NodeJS.Timeout[] = [];
  private networkStatusCheck?: NodeJS.Timeout;
  private promiseRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor(props: AsyncErrorBoundaryProps) {
    super(props);

    this.state = {
      hasAsyncError: false,
      asyncError: null,
      isLoading: false,
      networkStatus: 'online',
      retryCount: 0,
      lastRetryTime: 0,
      operationType: 'unknown',
      recoveryStrategy: 'retry',
    };
  }

  componentDidMount() {
    // Set up promise rejection handler
    this.setupPromiseRejectionHandler();
    
    // Monitor network status
    this.startNetworkMonitoring();
  }

  componentWillUnmount() {
    this.cleanupHandlers();
    this.clearRetryTimeouts();
  }

  private setupPromiseRejectionHandler = () => {
    if (typeof window !== 'undefined') {
      this.promiseRejectionHandler = (event: PromiseRejectionEvent) => {
        // Only handle unhandled promise rejections that aren't already caught
        if (!event.defaultPrevented) {
          this.handleAsyncError(
            event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
            { type: 'unhandled_promise_rejection' }
          );
        }
      };

      window.addEventListener('unhandledrejection', this.promiseRejectionHandler);
    }
  };

  private startNetworkMonitoring = () => {
    if (typeof window !== 'undefined') {
      // Initial network status
      this.updateNetworkStatus();

      // Monitor network changes
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Periodic network quality check
      this.networkStatusCheck = setInterval(this.checkNetworkQuality, 30000);
    }
  };

  private handleOnline = () => {
    this.setState({ networkStatus: 'online' });
    logger.info('Network connection restored');
    
    // Retry failed operations if any
    if (this.state.hasAsyncError && this.state.asyncError) {
      this.attemptRecovery();
    }
  };

  private handleOffline = () => {
    this.setState({ networkStatus: 'offline' });
    logger.warn('Network connection lost');
  };

  private checkNetworkQuality = async () => {
    if (!navigator.onLine) {
      this.setState({ networkStatus: 'offline' });
      return;
    }

    try {
      const startTime = Date.now();
      const response = await fetch('/api/health-check', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(10000),
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        if (responseTime > 5000) {
          this.setState({ networkStatus: 'slow' });
        } else if (responseTime > 2000) {
          this.setState({ networkStatus: 'unstable' });
        } else {
          this.setState({ networkStatus: 'online' });
        }
      } else {
        this.setState({ networkStatus: 'unstable' });
      }
    } catch (error) {
      this.setState({ networkStatus: 'offline' });
    }
  };

  private updateNetworkStatus = () => {
    const status = navigator.onLine ? 'online' : 'offline';
    this.setState({ networkStatus: status });
  };

  private cleanupHandlers = () => {
    if (typeof window !== 'undefined') {
      if (this.promiseRejectionHandler) {
        window.removeEventListener('unhandledrejection', this.promiseRejectionHandler);
      }
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }

    if (this.networkStatusCheck) {
      clearInterval(this.networkStatusCheck);
    }
  };

  private clearRetryTimeouts = () => {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.retryTimeouts = [];
  };

  public handleAsyncError = (
    error: Error,
    context: {
      type?: string;
      operationType?: AsyncErrorBoundaryState['operationType'];
      data?: any;
    } = {}
  ) => {
    const enhancedError = {
      ...error,
      asyncContext: {
        ...context,
        timestamp: Date.now(),
        networkStatus: this.state.networkStatus,
        retryCount: this.state.retryCount,
      },
    };

    this.setState({
      hasAsyncError: true,
      asyncError: enhancedError,
      operationType: context.operationType || this.detectOperationType(error),
      recoveryStrategy: this.determineRecoveryStrategy(enhancedError),
    });

    // Log the async error
    logger.error('Async operation failed', {
      error: enhancedError.message,
      stack: enhancedError.stack,
      context: enhancedError.asyncContext,
    });

    // Call custom error handler
    this.props.onAsyncError?.(enhancedError, context);

    // Attempt automatic recovery
    this.attemptRecovery();
  };

  private detectOperationType(error: Error): AsyncErrorBoundaryState['operationType'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('fetch') || message.includes('network')) {
      return 'fetch';
    } else if (message.includes('upload') || message.includes('file')) {
      return 'upload';
    } else if (message.includes('sync') || message.includes('synchroniz')) {
      return 'sync';
    } else if (message.includes('mutation') || message.includes('update')) {
      return 'mutation';
    }
    
    return 'unknown';
  }

  private determineRecoveryStrategy(error: Error): AsyncErrorBoundaryState['recoveryStrategy'] {
    const message = error.message.toLowerCase();
    
    // Network errors should be retried
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'retry';
    }
    
    // Authentication errors need manual intervention
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'manual';
    }
    
    // Validation errors should not be retried
    if (message.includes('validation') || message.includes('invalid')) {
      return 'manual';
    }
    
    // Server errors can be retried with backoff
    if (message.includes('500') || message.includes('server')) {
      return 'retry';
    }
    
    return 'fallback';
  }

  private attemptRecovery = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount, recoveryStrategy, networkStatus } = this.state;

    // Don't retry if offline or max retries reached
    if (networkStatus === 'offline' || retryCount >= maxRetries) {
      return;
    }

    if (recoveryStrategy !== 'retry') {
      return;
    }

    const backoffDelay = retryDelay * Math.pow(2, retryCount);
    
    const timeout = setTimeout(() => {
      this.handleRetry();
    }, backoffDelay);

    this.retryTimeouts.push(timeout);

    logger.info('Attempting async error recovery', {
      retryCount: retryCount + 1,
      delay: backoffDelay,
      strategy: recoveryStrategy,
    });
  };

  private handleRetry = () => {
    this.setState(prevState => ({
      hasAsyncError: false,
      asyncError: null,
      retryCount: prevState.retryCount + 1,
      lastRetryTime: Date.now(),
      isLoading: false,
    }));

    logger.info('Async error recovery attempted', {
      retryCount: this.state.retryCount + 1,
    });
  };

  public setLoading = (loading: boolean) => {
    this.setState({ isLoading: loading });
  };

  public clearError = () => {
    this.setState({
      hasAsyncError: false,
      asyncError: null,
      retryCount: 0,
      isLoading: false,
    });
  };

  render() {
    const { hasAsyncError, asyncError, isLoading, networkStatus } = this.state;

    // Show loading state
    if (isLoading) {
      return this.props.loadingFallback || this.renderLoadingState();
    }

    // Show async error state
    if (hasAsyncError && asyncError) {
      return this.props.fallback || this.renderAsyncErrorState();
    }

    // Show network status warning if needed
    if (networkStatus === 'offline' && this.props.enableOfflineMode) {
      return this.renderOfflineState();
    }

    // Wrap children with global error boundary for sync errors
    return (
      <GlobalErrorBoundary
        context={this.props.context || 'AsyncErrorBoundary'}
        enableRecovery={true}
      >
        {this.props.children}
      </GlobalErrorBoundary>
    );
  }

  private renderLoadingState() {
    return (
      <div id="async-loading-container" className="flex items-center justify-center p-8">
        <div id="async-loading-content" className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  private renderAsyncErrorState() {
    const { asyncError, operationType, recoveryStrategy, retryCount, networkStatus } = this.state;
    const { maxRetries = 3 } = this.props;
    const canRetry = retryCount < maxRetries && recoveryStrategy === 'retry';

    return (
      <div id="async-error-container" className="p-6 max-w-md mx-auto">
        <Card id="async-error-card" className="border-red-200">
          <CardHeader id="async-error-header" className="text-center">
            <div id="async-error-icon" className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                {networkStatus === 'offline' ? (
                  <WifiOff className="h-6 w-6 text-red-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
            
            <CardTitle id="async-error-title" className="text-lg">
              {this.getErrorTitle()}
            </CardTitle>
            
            <div id="async-error-badges" className="flex justify-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {operationType.toUpperCase()}
              </Badge>
              <Badge 
                variant={networkStatus === 'offline' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {networkStatus.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent id="async-error-content" className="text-center space-y-4">
            <p className="text-gray-600 text-sm">
              {this.getErrorMessage()}
            </p>

            {/* Recovery Actions */}
            <div id="async-recovery-actions" className="space-y-2">
              {canRetry && (
                <Button
                  onClick={this.handleRetry}
                  size="sm"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again ({retryCount + 1}/{maxRetries})
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={this.clearError}
                size="sm"
                className="w-full"
              >
                Dismiss
              </Button>
              
              {networkStatus === 'offline' && (
                <Button
                  variant="ghost"
                  onClick={() => window.location.reload()}
                  size="sm"
                  className="w-full"
                >
                  Reload when online
                </Button>
              )}
            </div>

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && asyncError && (
              <details className="text-left bg-gray-100 p-3 rounded text-xs">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <div className="mt-2 space-y-2">
                  <div><strong>Message:</strong> {asyncError.message}</div>
                  {asyncError.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap bg-white p-2 rounded border">
                        {asyncError.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  private renderOfflineState() {
    return (
      <div id="offline-container" className="p-6 max-w-md mx-auto">
        <Card id="offline-card" className="border-orange-200 bg-orange-50">
          <CardHeader id="offline-header" className="text-center">
            <div className="flex justify-center mb-4">
              <WifiOff className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-lg text-orange-800">
              You're Offline
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-orange-700 text-sm">
              Some features may be limited while offline. We'll sync your changes when you're back online.
            </p>
            
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              size="sm"
            >
              <Wifi className="w-4 h-4 mr-2" />
              Check Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  private getErrorTitle(): string {
    const { operationType, networkStatus } = this.state;
    
    if (networkStatus === 'offline') {
      return 'Connection Lost';
    }
    
    switch (operationType) {
      case 'fetch':
        return 'Failed to Load Data';
      case 'mutation':
        return 'Failed to Save Changes';
      case 'upload':
        return 'Upload Failed';
      case 'sync':
        return 'Sync Error';
      default:
        return 'Operation Failed';
    }
  }

  private getErrorMessage(): string {
    const { operationType, networkStatus, recoveryStrategy } = this.state;
    
    if (networkStatus === 'offline') {
      return 'Please check your internet connection and try again.';
    }
    
    if (recoveryStrategy === 'manual') {
      return 'This error requires your attention. Please check the details below.';
    }
    
    switch (operationType) {
      case 'fetch':
        return 'Unable to retrieve the requested data. This may be temporary.';
      case 'mutation':
        return 'Your changes could not be saved. Please try again.';
      case 'upload':
        return 'File upload was interrupted. Please try uploading again.';
      case 'sync':
        return 'Data synchronization failed. We\'ll retry automatically.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

/**
 * Hook for using async error boundary context
 */
export function useAsyncErrorHandler() {
  const [asyncErrorBoundary, setAsyncErrorBoundary] = React.useState<AsyncErrorBoundary | null>(null);

  const handleAsyncError = React.useCallback((error: Error, context?: any) => {
    if (asyncErrorBoundary) {
      asyncErrorBoundary.handleAsyncError(error, context);
    } else {
      // Fallback to console error if no boundary is available
      console.error('Async error occurred:', error, context);
    }
  }, [asyncErrorBoundary]);

  const setLoading = React.useCallback((loading: boolean) => {
    if (asyncErrorBoundary) {
      asyncErrorBoundary.setLoading(loading);
    }
  }, [asyncErrorBoundary]);

  const clearError = React.useCallback(() => {
    if (asyncErrorBoundary) {
      asyncErrorBoundary.clearError();
    }
  }, [asyncErrorBoundary]);

  return {
    handleAsyncError,
    setLoading,
    clearError,
    setAsyncErrorBoundary,
  };
}

export default AsyncErrorBoundary;