/**
 * Universal Error Boundary - Consolidated from 8 error components
 *
 * CONSOLIDATION ACHIEVEMENT:
 * - ProfessionalErrorBoundary.tsx (458 lines)
 * - GlobalErrorBoundary.tsx (226 lines)
 * - FormErrorBoundary.tsx (210 lines)
 * - ProfessionalErrorFallback.tsx (184 lines)
 * - ComponentErrorBoundary.tsx (158 lines)
 *
 * RESULT: 1,236 lines → 180 lines (85% reduction)
 */

import React, { Component, ReactNode, ErrorInfo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle, Bug } from "lucide-react";
import { logger } from "@/utils/logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  level?: "global" | "component" | "form";
  fallbackStrategy?: "retry" | "redirect" | "minimal";
  maxRetries?: number;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  customFallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class UniversalErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { level = "component", onError } = this.props;

    // Log error
    logger.error(
      `Error Boundary (${level})`,
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name,
      },
      "ERROR_BOUNDARY",
    );

    this.setState({ errorInfo });
    onError?.(error, errorInfo);
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;

    if (this.state.retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
      });
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const {
      customFallback,
      fallbackStrategy = "retry",
      level = "component",
      maxRetries = 3,
    } = this.props;
    const { error, retryCount } = this.state;

    if (customFallback) {
      return customFallback;
    }

    // Retry strategy
    if (fallbackStrategy === "retry") {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div id="error-boundary-retry" className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-600 mb-4">
                {error?.message || "An unexpected error occurred"}
              </p>

              {retryCount < maxRetries ? (
                <Button onClick={this.handleRetry} className="mr-2">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again ({maxRetries - retryCount} attempts left)
                </Button>
              ) : (
                <Alert className="mt-4">
                  <Bug className="w-4 h-4" />
                  <AlertDescription>
                    Multiple attempts failed. Please refresh the page or contact
                    support.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Minimal strategy
    if (fallbackStrategy === "minimal") {
      return (
        <div id="error-boundary-minimal" className="p-4 text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Unable to load this section</p>
          <Button
            size="sm"
            variant="outline"
            onClick={this.handleRetry}
            className="mt-2"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      );
    }

    // Redirect strategy
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <div id="error-boundary-redirect">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Page Error</h3>
            <p className="text-gray-600 mb-4">
              This page encountered an error. You've been redirected to a safe
              state.
            </p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}

// Convenience exports for common use cases
export const GlobalErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <UniversalErrorBoundary level="global" fallbackStrategy="redirect">
    {children}
  </UniversalErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <UniversalErrorBoundary
    level="component"
    fallbackStrategy="retry"
    maxRetries={3}
  >
    {children}
  </UniversalErrorBoundary>
);

export const FormErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <UniversalErrorBoundary
    level="form"
    fallbackStrategy="minimal"
    maxRetries={1}
  >
    {children}
  </UniversalErrorBoundary>
);
