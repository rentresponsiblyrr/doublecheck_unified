
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  inspectionId?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class InspectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // REMOVED: console.error('📋 Inspection Error Boundary caught an error:', error, errorInfo);
    
    // Track specific error types for better recovery
    const errorType = this.categorizeError(error);
    // REMOVED: console.log('🔍 Error categorized as:', errorType);
    
    this.setState({ error, errorInfo });
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('handleretry') || message.includes('initialization')) {
      return 'component_initialization';
    }
    if (message.includes('404') || message.includes('not found')) {
      return 'data_access';
    }
    if (message.includes('constraint') || message.includes('check constraint')) {
      return 'database_constraint';
    }
    if (message.includes('media') || message.includes('upload')) {
      return 'media_error';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'network_error';
    }
    return 'unknown';
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onRetry?.();
  };

  private handleNavigateHome = () => {
    try {
      // Professional navigation with state preservation
      const url = new URL('/properties', window.location.origin);
      window.history.pushState(null, '', url.href);
      window.dispatchEvent(new PopStateEvent('popstate'));
      
      // Graceful fallback if navigation doesn't work
      setTimeout(() => {
        if (!window.location.pathname.includes('properties')) {
          window.location.assign('/properties');
        }
      }, 100);
    } catch (error) {
      console.warn('Navigation error, using fallback:', error);
      window.location.assign('/properties');
    }
  };

  private handleRestartInspection = () => {
    if (this.props.inspectionId) {
      try {
        // Professional navigation with inspection context preservation
        const url = new URL(`/inspection/${this.props.inspectionId}`, window.location.origin);
        window.history.pushState(null, '', url.href);
        window.dispatchEvent(new PopStateEvent('popstate'));
        
        // Graceful fallback verification
        setTimeout(() => {
          if (!window.location.pathname.includes(`inspection/${this.props.inspectionId}`)) {
            window.location.assign(`/inspection/${this.props.inspectionId}`);
          }
        }, 100);
      } catch (error) {
        console.warn('Inspection navigation error, using fallback:', error);
        window.location.assign(`/inspection/${this.props.inspectionId}`);
      }
    }
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isMediaError = this.state.error?.message?.includes('media') || 
                        this.state.error?.message?.includes('upload');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">
              Inspection Error
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-700">
                {isMediaError 
                  ? "There was an issue with media upload. Your progress is saved."
                  : "An error occurred during the inspection. Your progress should be preserved."
                }
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Try these steps:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Check your internet connection</li>
                <li>• Restart the inspection</li>
                <li>• Try uploading media again</li>
                <li>• Return to property list</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <div className="flex gap-3">
                {this.props.inspectionId && (
                  <Button
                    onClick={this.handleRestartInspection}
                    variant="outline"
                    className="flex-1"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    Restart Inspection
                  </Button>
                )}
                
                <Button
                  onClick={this.handleNavigateHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Property List
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
