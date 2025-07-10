import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface SafeWorkflowWrapperProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SafeWorkflowWrapper extends React.Component<
  SafeWorkflowWrapperProps,
  ErrorBoundaryState
> {
  constructor(props: SafeWorkflowWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Workflow Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Workflow Error</AlertTitle>
              <AlertDescription className="text-red-700 mb-4">
                {this.state.error?.message || 
                 'The inspection workflow encountered an error. Please try one of the options below.'}
              </AlertDescription>
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined });
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => {
                    try {
                      window.history.pushState(null, '', '/');
                      window.location.reload();
                    } catch (e) {
                      window.location.href = '/';
                    }
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}

// HOC for safe component wrapping
export function withSafeWrapper<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function SafeComponent(props: P) {
    return (
      <SafeWorkflowWrapper>
        <Component {...props} />
      </SafeWorkflowWrapper>
    );
  };
}