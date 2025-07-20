
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class NavigationErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🧭 Navigation Error Boundary caught an error:', error, errorInfo);
    this.setState({ error });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Professional page refresh without destroying session
    window.location.replace(window.location.pathname);
  };

  private handleNavigateHome = () => {
    try {
      // Professional navigation without session destruction
      window.location.replace('/');
    } catch (error) {
      console.warn('Navigation error, using history fallback:', error);
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Navigation Error
          </h2>
          
          <Alert className="bg-red-50 border-red-200 mb-6">
            <AlertDescription className="text-red-700">
              There was an issue with page navigation. This might be a temporary problem.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
            
            <Button onClick={this.handleNavigateHome} className="flex-1">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
