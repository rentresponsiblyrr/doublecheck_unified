import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  componentName?: string;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export default class AdminErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 AdminErrorBoundary caught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
{this.props.componentName || 'Admin Component'} Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Component Failed to Load</h3>
                  <p className="text-red-700">
                    There was an error loading this admin component. This could be due to:
                  </p>
                  <ul className="mt-2 text-red-700 text-sm space-y-1">
                    <li>• Import/export issues in the component</li>
                    <li>• TypeScript compilation errors</li>
                    <li>• Missing dependencies or props</li>
                    <li>• Runtime JavaScript errors</li>
                  </ul>
                </div>

                {this.state.error && (
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Error Details:</h4>
                    <pre className="text-xs text-gray-700 overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                    className="flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.replace(window.location.pathname)}
                  >
                    Reload Page
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}