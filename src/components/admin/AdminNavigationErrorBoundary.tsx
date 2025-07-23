/**
 * Admin Navigation Error Boundary - Production Safety
 *
 * Provides graceful error handling for admin navigation components
 * with fallback UI and error recovery options.
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0 - Elite Standards
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { logger } from "@/lib/logger/production-logger";

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class AdminNavigationErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `nav-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error for production monitoring
    logger.error("Admin navigation error boundary triggered", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      currentPath: window.location.pathname,
      component: "AdminNavigationErrorBoundary",
    });
  }

  handleRetry = () => {
    this.retryCount++;

    logger.info("Admin navigation error recovery attempted", {
      errorId: this.state.errorId,
      retryCount: this.retryCount,
      component: "AdminNavigationErrorBoundary",
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    });
  };

  handleGoHome = () => {
    logger.info("Admin navigation fallback to home", {
      errorId: this.state.errorId,
      component: "AdminNavigationErrorBoundary",
    });

    try {
      window.location.href = "/admin";
    } catch (error) {
      logger.error("Admin navigation fallback failed", {
        error,
        component: "AdminNavigationErrorBoundary",
      });
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default error UI
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Navigation Error</AlertTitle>
            <AlertDescription>
              The admin navigation encountered an unexpected error. This has
              been automatically reported to our engineering team.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">What happened?</h3>
            <p className="text-sm text-gray-600 mb-3">
              A technical issue prevented the admin navigation from loading
              properly. You can try recovering or return to the admin dashboard.
            </p>

            <div className="text-xs text-gray-500 font-mono bg-white p-2 rounded border">
              Error ID: {this.state.errorId}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={this.handleRetry}
              disabled={this.retryCount >= this.maxRetries}
              className="flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {this.retryCount >= this.maxRetries
                ? "Max Retries Reached"
                : "Try Again"}
            </Button>

            <Button
              variant="outline"
              onClick={this.handleGoHome}
              className="flex items-center justify-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Admin Dashboard
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
              <summary className="font-medium text-red-800 cursor-pointer">
                Development Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-700 overflow-auto">
                {this.state.error.stack}
              </pre>
              {this.state.errorInfo && (
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
