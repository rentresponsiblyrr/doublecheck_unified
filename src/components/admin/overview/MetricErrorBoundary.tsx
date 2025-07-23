/**
 * Elite Metric Error Boundary Component
 * Netflix-grade fault tolerance for individual dashboard metrics
 */

import React, { Component, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, Clock, TrendingDown } from "lucide-react";
import { logger } from "@/lib/logger/production-logger";

interface MetricErrorBoundaryProps {
  metricName: string;
  fallbackData?: any;
  onRetry: () => void;
  onError?: (error: Error, errorInfo: any) => void;
  children: ReactNode;
  showFallbackData?: boolean;
  retryDelay?: number;
}

interface MetricErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  retryCount: number;
  lastErrorTime: number;
  isRetrying: boolean;
}

export class MetricErrorBoundary extends Component<
  MetricErrorBoundaryProps,
  MetricErrorBoundaryState
> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;

  constructor(props: MetricErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastErrorTime: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<MetricErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const { metricName, onError } = this.props;

    // Log error with comprehensive context
    logger.error("Metric component error boundary triggered", {
      metricName,
      error: error.message,
      stack: error.stack,
      errorInfo,
      retryCount: this.state.retryCount,
      component: "MetricErrorBoundary",
    });

    this.setState({
      errorInfo,
      retryCount: this.state.retryCount + 1,
    });

    // Call optional error callback
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const { onRetry, retryDelay = 2000 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= this.maxRetries) {
      logger.warn("Max retry attempts reached for metric", {
        metricName: this.props.metricName,
        retryCount,
        component: "MetricErrorBoundary",
      });
      return;
    }

    this.setState({ isRetrying: true });

    logger.info("Retrying failed metric", {
      metricName: this.props.metricName,
      retryAttempt: retryCount + 1,
      component: "MetricErrorBoundary",
    });

    // Clear any existing timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Retry with exponential backoff
    const delay = retryDelay * Math.pow(2, retryCount);
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
      });
      onRetry();
    }, delay);
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  formatError(error: Error): string {
    if (error.message.includes("fetch")) {
      return "Network connection issue";
    }
    if (error.message.includes("timeout")) {
      return "Request timed out";
    }
    if (error.message.includes("validation")) {
      return "Data validation failed";
    }
    if (error.message.includes("permission")) {
      return "Access denied";
    }
    return "System error occurred";
  }

  renderFallbackData() {
    const { fallbackData, showFallbackData = true } = this.props;

    if (!showFallbackData || !fallbackData) return null;

    return (
      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
        <div className="flex items-center text-amber-700 text-sm mb-2">
          <Clock className="h-4 w-4 mr-1" />
          <span className="font-medium">Showing cached data</span>
        </div>
        <div className="text-2xl font-bold text-amber-800">
          {typeof fallbackData === "object"
            ? JSON.stringify(fallbackData)
            : fallbackData}
        </div>
      </div>
    );
  }

  renderErrorState() {
    const { metricName, fallbackData } = this.props;
    const { error, retryCount, isRetrying, lastErrorTime } = this.state;

    const timeAgo = Math.floor((Date.now() - lastErrorTime) / 1000);
    const canRetry = retryCount < this.maxRetries;
    const errorMessage = error ? this.formatError(error) : "Unknown error";

    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <h3 className="text-sm font-medium text-red-800">
                {metricName} Unavailable
              </h3>
              <Badge variant="destructive" className="ml-2 text-xs">
                Error
              </Badge>
            </div>

            <p className="text-xs text-red-600 mb-2">{errorMessage}</p>

            <div className="flex items-center text-xs text-red-500 space-x-3">
              <span>Failed {timeAgo}s ago</span>
              {retryCount > 0 && (
                <span>
                  Retry {retryCount}/{this.maxRetries}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2 ml-4">
            {canRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={this.handleRetry}
                disabled={isRetrying}
                className="text-red-700 border-red-300 hover:bg-red-100 disabled:opacity-50"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </>
                )}
              </Button>
            )}

            {!canRetry && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.location.reload()}
                className="text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh Page
              </Button>
            )}
          </div>
        </div>

        {this.renderFallbackData()}

        {/* Technical details for debugging (only in development) */}
        {process.env.NODE_ENV === "development" && error && (
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-red-600 hover:text-red-800">
              Technical Details
            </summary>
            <div className="mt-2 p-2 bg-red-100 rounded font-mono text-red-800 overflow-auto max-h-32">
              <div>
                <strong>Error:</strong> {error.message}
              </div>
              {error.stack && (
                <div className="mt-1">
                  <strong>Stack:</strong>
                  <pre className="text-xs whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </Card>
    );
  }

  render() {
    if (this.state.hasError) {
      return this.renderErrorState();
    }

    return this.props.children;
  }
}

// Convenience wrapper for functional components
interface MetricErrorWrapperProps {
  metricName: string;
  fallbackData?: any;
  onRetry: () => void;
  children: ReactNode;
  showFallbackData?: boolean;
}

export const MetricErrorWrapper: React.FC<MetricErrorWrapperProps> = (
  props,
) => {
  return <MetricErrorBoundary {...props} />;
};

// HOC for wrapping metric components
export function withMetricErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  metricName: string,
  fallbackData?: any,
) {
  return React.forwardRef<any, P & { onRetry?: () => void }>((props, ref) => {
    const { onRetry = () => {}, ...componentProps } = props;

    return (
      <MetricErrorBoundary
        metricName={metricName}
        fallbackData={fallbackData}
        onRetry={onRetry}
      >
        <Component {...(componentProps as P)} ref={ref} />
      </MetricErrorBoundary>
    );
  });
}

// Specialized error boundaries for different metric types
export const InspectionCountsErrorBoundary: React.FC<{
  children: ReactNode;
  onRetry: () => void;
  fallbackData?: any;
}> = ({ children, onRetry, fallbackData }) => (
  <MetricErrorBoundary
    metricName="Inspection Counts"
    fallbackData={
      fallbackData || { total: 0, completed: 0, in_progress: 0, draft: 0 }
    }
    onRetry={onRetry}
    showFallbackData={true}
  >
    {children}
  </MetricErrorBoundary>
);

export const TimeAnalyticsErrorBoundary: React.FC<{
  children: ReactNode;
  onRetry: () => void;
  fallbackData?: any;
}> = ({ children, onRetry, fallbackData }) => (
  <MetricErrorBoundary
    metricName="Time Analytics"
    fallbackData={fallbackData || { avg_duration_minutes: 0 }}
    onRetry={onRetry}
  >
    {children}
  </MetricErrorBoundary>
);

export const AIMetricsErrorBoundary: React.FC<{
  children: ReactNode;
  onRetry: () => void;
  fallbackData?: any;
}> = ({ children, onRetry, fallbackData }) => (
  <MetricErrorBoundary
    metricName="AI Performance"
    fallbackData={fallbackData || { accuracy_rate: 0, total_predictions: 0 }}
    onRetry={onRetry}
  >
    {children}
  </MetricErrorBoundary>
);

export const RevenueMetricsErrorBoundary: React.FC<{
  children: ReactNode;
  onRetry: () => void;
  fallbackData?: any;
}> = ({ children, onRetry, fallbackData }) => (
  <MetricErrorBoundary
    metricName="Revenue Analytics"
    fallbackData={fallbackData || { monthly_revenue: 0, total_revenue: 0 }}
    onRetry={onRetry}
  >
    {children}
  </MetricErrorBoundary>
);
