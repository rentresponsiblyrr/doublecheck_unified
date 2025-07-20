import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Home, RefreshCw, ArrowLeft } from 'lucide-react';

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // REMOVED: console.error('🚨 Global Error Boundary caught error:', error, errorInfo);
    
    // Log to external service if configured
    try {
      if (window.location.hostname.includes('doublecheckverified.com')) {
        // In production, could send to monitoring service
        // REMOVED: console.error('Production error logged:', { error, errorInfo });
      }
    } catch (e) {
      // REMOVED: console.error('Failed to log error:', e);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleSafeReturn = () => {
    try {
      // Professional navigation without session destruction
      window.location.replace('/');
    } catch (e) {
      // Graceful fallback - navigate home without reload
      console.warn('Navigation failed, using history fallback:', e);
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  handleGoBack = () => {
    try {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        this.handleSafeReturn();
      }
    } catch (e) {
      this.handleSafeReturn();
    }
  };

  render() {
    if (this.state.hasError) {
      const isNavigationError = this.state.error?.message?.includes('navigate') || 
                               this.state.error?.message?.includes('route') ||
                               this.state.error?.message?.includes('redirect');

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-lg w-full">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">
                {isNavigationError ? 'Navigation Error' : 'Application Error'}
              </AlertTitle>
              <AlertDescription className="text-red-700 mb-6">
                {isNavigationError ? (
                  <>
                    There was a problem navigating to this page. This could be due to:
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>Missing page or component</li>
                      <li>Routing configuration issue</li>
                      <li>Permission restrictions</li>
                    </ul>
                  </>
                ) : (
                  <>
                    The application encountered an unexpected error. 
                    {this.state.error?.message && (
                      <div className="mt-2 p-2 bg-red-100 rounded text-sm font-mono">
                        {this.state.error.message}
                      </div>
                    )}
                  </>
                )}
              </AlertDescription>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={this.handleGoBack}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleSafeReturn}
                  variant="outline"
                  className="w-full col-span-2"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Button>
                <Button
                  onClick={() => window.location.replace(window.location.pathname)}
                  variant="outline"
                  className="w-full col-span-2"
                >
                  Refresh Page
                </Button>
              </div>

              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer text-red-600">Debug Info</summary>
                  <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </Alert>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}