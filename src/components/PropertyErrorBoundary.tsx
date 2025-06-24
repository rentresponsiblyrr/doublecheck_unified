
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  onNavigateHome?: () => void;
  onAddProperty?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class PropertyErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🏠 Property Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onRetry?.();
  };

  private handleNavigateHome = () => {
    window.location.href = '/properties';
  };

  private handleAddProperty = () => {
    window.location.href = '/add-property';
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isNetworkError = this.state.error?.message?.includes('network') || 
                          this.state.error?.message?.includes('fetch');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">
              Property System Error
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">
                {isNetworkError 
                  ? "Network connection issue. Please check your internet and try again."
                  : "There was an issue loading the property system. This might be temporary."
                }
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Try these steps:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Refresh the page</li>
                <li>• Check your internet connection</li>
                <li>• Try adding a new property</li>
                <li>• Go back to the property list</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <div className="flex gap-3">
                <Button
                  onClick={this.handleNavigateHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Property List
                </Button>
                
                <Button
                  onClick={this.handleAddProperty}
                  variant="outline"
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
