import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Copy } from 'lucide-react';

interface VerboseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface VerboseErrorBoundaryProps {
  children: ReactNode;
  componentName?: string;
  showDetails?: boolean;
}

export class VerboseErrorBoundary extends Component<VerboseErrorBoundaryProps, VerboseErrorBoundaryState> {
  constructor(props: VerboseErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<VerboseErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName = 'Unknown Component' } = this.props;
    const { errorId } = this.state;

    // FORCE ERROR VISIBILITY - Log to console even in production
    // REMOVED: console.error(`🚨 VERBOSE ERROR BOUNDARY CAUGHT ERROR in ${componentName}:`, error);
    // REMOVED: console.error(`🚨 ERROR INFO:`, errorInfo);
    // REMOVED: console.error(`🚨 COMPONENT STACK:`, errorInfo.componentStack);
    // REMOVED: console.error(`🚨 ERROR ID:`, errorId);

    // Also log to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).lastAdminError = {
        component: componentName,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        errorId
      };
      
      // Dispatch custom event for error diagnostic tool
      window.dispatchEvent(new CustomEvent('adminComponentError', {
        detail: {
          component: componentName,
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          errorId
        }
      }));
    }

    this.setState({ errorInfo });
  }

  copyErrorToClipboard = () => {
    const { error, errorInfo } = this.state;
    const { componentName = 'Unknown Component' } = this.props;
    
    const errorDetails = `
COMPONENT: ${componentName}
ERROR: ${error?.message}
STACK TRACE:
${error?.stack}

COMPONENT STACK:
${errorInfo?.componentStack}

TIMESTAMP: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard.writeText(errorDetails).then(() => {
      alert('Error details copied to clipboard!');
    });
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, componentName = 'Unknown Component', showDetails = true } = this.props;

    if (hasError && error) {
      return (
        <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
          <Card className="border-red-300">
            <CardHeader className="bg-red-100">
              <CardTitle className="flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Component Error: {componentName}
              </CardTitle>
              <CardDescription className="text-red-700">
                This component failed to render due to a JavaScript error. Details below:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {error.message}
                </AlertDescription>
              </Alert>

              {showDetails && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Error ID:</h4>
                    <code className="text-xs bg-red-100 p-2 rounded block">{errorId}</code>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-800 mb-2">Stack Trace:</h4>
                    <pre className="text-xs bg-red-100 p-3 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </div>

                  {errorInfo?.componentStack && (
                    <div>
                      <h4 className="font-medium text-red-800 mb-2">Component Stack:</h4>
                      <pre className="text-xs bg-red-100 p-3 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-medium text-red-800">Debugging Info:</h4>
                    <div className="text-sm text-red-700 space-y-1">
                      <p>• Component: {componentName}</p>
                      <p>• Timestamp: {new Date().toISOString()}</p>
                      <p>• Error available in window.lastAdminError</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={() => window.location.assign(window.location.href)} 
                  variant="destructive"
                  size="sm"
                >
                  Reload Page
                </Button>
                <Button 
                  onClick={this.copyErrorToClipboard}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Error Details
                </Button>
                <Button 
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component to wrap components with verbose error boundary
export function withVerboseErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent = (props: P) => (
    <VerboseErrorBoundary componentName={componentName || Component.displayName || Component.name}>
      <Component {...props} />
    </VerboseErrorBoundary>
  );

  WrappedComponent.displayName = `withVerboseErrorBoundary(${componentName || Component.displayName || Component.name})`;

  return WrappedComponent;
}