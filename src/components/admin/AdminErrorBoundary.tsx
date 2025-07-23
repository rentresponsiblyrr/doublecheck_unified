/**
 * Admin Error Boundary Component
 * 
 * Production-grade error boundary specifically for admin section failures.
 * Provides graceful recovery from SystemStatusPanel and user management errors.
 * 
 * @author STR Certified Engineering Team
 * @since 1.0.0
 * @version 1.0.0
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home, Bug, Trash2 } from "lucide-react";
import { logger } from "@/lib/logger/production-logger";
import { cacheManager } from "@/services/cacheManagementService";

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isClearing: boolean;
}

export class AdminErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
    isClearing: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for tracking
    const errorId = `admin-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId,
      isClearing: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || `admin-catch-${Date.now()}`;
    
    // Log the error with full context
    logger.error("Admin section error caught by boundary", {
      component: "AdminErrorBoundary",
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.retryCount,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo,
      errorId,
    });
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      
      logger.info("Retrying admin section after error", {
        component: "AdminErrorBoundary",
        errorId: this.state.errorId,
        retryCount: this.retryCount,
      });

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isClearing: false,
      });
    }
  };

  private handleClearCacheAndRetry = async () => {
    this.setState({ isClearing: true });

    try {
      logger.info("Clearing cache due to admin error", {
        component: "AdminErrorBoundary",
        errorId: this.state.errorId,
        error: this.state.error?.message,
      });

      // Check if this error indicates cache issues
      const shouldClearCache = this.state.error && cacheManager.shouldClearCaches(this.state.error);

      if (shouldClearCache) {
        await cacheManager.clearSupabaseCaches();
      } else {
        await cacheManager.clearAllCaches();
      }

      // Wait a moment for cache clearing to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset error state and retry
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isClearing: false,
      });

    } catch (clearError) {
      logger.error("Cache clearing failed", {
        component: "AdminErrorBoundary",
        errorId: this.state.errorId,
        clearError: clearError instanceof Error ? clearError.message : "Unknown error",
      });

      // If cache clearing fails, just reload the page
      cacheManager.forceReloadWithCacheClear();
    }
  };

  private handleRefreshPage = () => {
    logger.info("Refreshing page after admin error", {
      component: "AdminErrorBoundary",
      errorId: this.state.errorId,
    });
    
    window.location.reload();
  };

  private handleGoHome = () => {
    logger.info("Navigating to home after admin error", {
      component: "AdminErrorBoundary",
      errorId: this.state.errorId,
    });
    
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      // Render custom fallback component if provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Determine error type for better user messaging
      const isConfigError = this.state.error?.message?.includes("interval") || 
                           this.state.error?.message?.includes("POLLING_CONFIG");
      const isNetworkError = this.state.error?.message?.includes("404") || 
                            this.state.error?.message?.includes("fetch");
      const isRPCError = this.state.error?.message?.includes("rpc") || 
                        this.state.error?.message?.includes("get_user_profile");

      let errorTitle = "Something went wrong";
      let errorDescription = "The admin section encountered an unexpected error.";

      if (isConfigError) {
        errorTitle = "Configuration Error";
        errorDescription = "System configuration is being updated. Please try again.";
      } else if (isNetworkError || isRPCError) {
        errorTitle = "Connection Issue";
        errorDescription = "Unable to connect to admin services. Please check your connection.";
      }

      return (
        <div 
          id="admin-error-boundary-container" 
          className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        >
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {errorTitle}
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {errorDescription}
                </AlertDescription>
              </Alert>

              {/* Error details for debugging (only show in development) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                  <summary className="cursor-pointer font-medium">
                    Technical Details
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="mt-2 whitespace-pre-wrap break-words">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}

              {/* Error ID for support */}
              {this.state.errorId && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <span className="font-medium">Error ID:</span> {this.state.errorId}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col space-y-2">
                {this.retryCount < this.maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    disabled={this.state.isClearing}
                    id="admin-error-retry-button"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${this.state.isClearing ? 'animate-spin' : ''}`} />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}

                {/* Cache clearing button - show for cache-related errors */}
                {this.state.error && cacheManager.shouldClearCaches(this.state.error) && (
                  <Button
                    onClick={this.handleClearCacheAndRetry}
                    variant="default"
                    className="w-full"
                    disabled={this.state.isClearing}
                    id="admin-error-clear-cache-button"
                  >
                    <Trash2 className={`h-4 w-4 mr-2 ${this.state.isClearing ? 'animate-spin' : ''}`} />
                    {this.state.isClearing ? 'Clearing Cache...' : 'Clear Cache & Retry'}
                  </Button>
                )}

                <Button
                  onClick={this.handleRefreshPage}
                  variant="outline"
                  className="w-full"
                  disabled={this.state.isClearing}
                  id="admin-error-refresh-button"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                  disabled={this.state.isClearing}
                  id="admin-error-home-button"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </div>

              {/* Development-only debugging button */}
              {process.env.NODE_ENV === "development" && (
                <Button
                  onClick={() => {
                    console.error("Admin Error Details:", {
                      error: this.state.error,
                      errorInfo: this.state.errorInfo,
                      errorId: this.state.errorId,
                      retryCount: this.retryCount,
                    });
                  }}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  id="admin-error-debug-button"
                >
                  <Bug className="h-3 w-3 mr-1" />
                  Log Debug Info
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;