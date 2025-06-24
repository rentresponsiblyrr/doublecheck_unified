
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  onReset?: () => void;
  formType?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class FormErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('📝 Form Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onRetry?.();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isValidationError = this.state.error?.message?.includes('validation') || 
                             this.state.error?.message?.includes('required');
    
    return (
      <Card className="max-w-md w-full mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="mx-auto w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <CardTitle className="text-lg text-gray-900">
            {this.props.formType ? `${this.props.formType} Form Error` : 'Form Error'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-700">
              {isValidationError 
                ? "There was a validation error with your form data. Please check all fields."
                : "An unexpected error occurred while processing the form."
              }
            </AlertDescription>
          </Alert>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Try these steps:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check all required fields</li>
              <li>• Verify data format is correct</li>
              <li>• Try refreshing the form</li>
              <li>• Reset and start over</li>
            </ul>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            
            <Button onClick={this.handleReset} variant="outline" className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Form
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}
