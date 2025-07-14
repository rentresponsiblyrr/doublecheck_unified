import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { ErrorBoundary } from '@/lib/error/error-boundary';

interface RobustAdminWrapperProps {
  children: React.ReactNode;
  componentName: string;
  fallbackComponent?: React.ReactNode;
}

interface ComponentState {
  isLoading: boolean;
  hasError: boolean;
  error?: Error;
  retryCount: number;
  debugInfo: string[];
}

export default function RobustAdminWrapper({ 
  children, 
  componentName, 
  fallbackComponent 
}: RobustAdminWrapperProps) {
  const [state, setState] = useState<ComponentState>({
    isLoading: true,
    hasError: false,
    retryCount: 0,
    debugInfo: []
  });
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // Add debug info about component loading
    setState(prev => ({
      ...prev,
      debugInfo: [
        ...prev.debugInfo,
        `${new Date().toISOString()}: ${componentName} mounting...`,
        `Environment: ${process.env.NODE_ENV}`,
        `Current URL: ${window.location.pathname}`,
        `Supabase URL: ${import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET'}`,
        `Supabase Key: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}`
      ]
    }));

    // Simulate component load completion
    const timer = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        debugInfo: [...prev.debugInfo, `${new Date().toISOString()}: ${componentName} loaded successfully`]
      }));
    }, 1000);

    return () => clearTimeout(timer);
  }, [componentName, state.retryCount]);

  const handleRetry = () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false,
      error: undefined,
      retryCount: prev.retryCount + 1,
      debugInfo: [...prev.debugInfo, `${new Date().toISOString()}: Retrying ${componentName} (attempt ${prev.retryCount + 1})`]
    }));
  };

  const handleError = (error: Error) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      hasError: true,
      error,
      debugInfo: [...prev.debugInfo, `${new Date().toISOString()}: ERROR - ${error.message}`]
    }));
  };

  const LoadingState = () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <div>
          <h3 className="font-medium">Loading {componentName}...</h3>
          <p className="text-sm text-gray-600">Please wait while we load the component</p>
        </div>
      </div>
    </div>
  );

  const ErrorState = () => (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Component Error: {componentName}</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p><strong>Error:</strong> {state.error?.message || 'Unknown error occurred'}</p>
            <p><strong>Retry Count:</strong> {state.retryCount}</p>
            <div className="flex items-center space-x-2 mt-3">
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
                {showDebug ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showDebug ? 'Hide' : 'Show'} Debug
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {showDebug && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-xs font-mono">
              {state.debugInfo.map((info, index) => (
                <div key={index} className="p-1 bg-gray-50 rounded">
                  {info}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {fallbackComponent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fallback Component</CardTitle>
            <CardDescription>Using fallback while main component is unavailable</CardDescription>
          </CardHeader>
          <CardContent>
            {fallbackComponent}
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (state.isLoading) {
    return <LoadingState />;
  }

  if (state.hasError) {
    return <ErrorState />;
  }

  return (
    <ErrorBoundary
      level="component"
      fallback={({ error, resetError }) => {
        // Update state when error boundary catches an error
        React.useEffect(() => {
          handleError(error);
        }, [error]);

        return <ErrorState />;
      }}
    >
      <Suspense fallback={<LoadingState />}>
        <div className="relative">
          {/* Component Status Badge */}
          <div className="absolute top-0 right-0 z-10">
            <Badge variant="outline" className="bg-green-100 text-green-800">
              {componentName} Ready
            </Badge>
          </div>
          
          {/* Debug toggle for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-8 right-0 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs"
              >
                {showDebug ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          )}

          {/* Debug panel */}
          {showDebug && process.env.NODE_ENV === 'development' && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-sm">Debug Info: {componentName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs">
                  {state.debugInfo.slice(-5).map((info, index) => (
                    <div key={index} className="text-gray-600">{info}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main component content */}
          <div className="pt-8">
            {children}
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}