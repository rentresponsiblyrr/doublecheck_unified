
import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Home, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface ErrorRecoveryProps {
  error: Error | string;
  onRetry: () => void;
  onNavigateHome: () => void;
  onDismiss?: () => void;
  maxRetries?: number;
  currentRetry?: number;
  context?: string;
}

export const EnhancedErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onRetry,
  onNavigateHome,
  onDismiss,
  maxRetries = 3,
  currentRetry = 0,
  context = 'operation'
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  
  if (isDismissed && onDismiss) {
    return null;
  }

  const errorMessage = error instanceof Error ? error.message : error;
  const canRetry = currentRetry < maxRetries;
  
  // Categorize error types
  const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                        errorMessage.toLowerCase().includes('fetch') ||
                        errorMessage.toLowerCase().includes('connection');
  
  const isAuthError = errorMessage.toLowerCase().includes('auth') ||
                     errorMessage.toLowerCase().includes('unauthorized') ||
                     errorMessage.toLowerCase().includes('forbidden');
  
  const isValidationError = errorMessage.toLowerCase().includes('validation') ||
                           errorMessage.toLowerCase().includes('invalid') ||
                           errorMessage.toLowerCase().includes('required');

  const getErrorCategory = () => {
    if (isNetworkError) return { type: 'Network', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' };
    if (isAuthError) return { type: 'Authentication', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    if (isValidationError) return { type: 'Validation', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
    return { type: 'System', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
  };

  const errorCategory = getErrorCategory();

  const getRecoveryTips = () => {
    if (isNetworkError) {
      return [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      ];
    }
    if (isAuthError) {
      return [
        'Sign out and sign back in',
        'Clear your browser cache',
        'Contact support if issue persists'
      ];
    }
    if (isValidationError) {
      return [
        'Check all required fields',
        'Verify data format is correct',
        'Review any error messages above'
      ];
    }
    return [
      'Try refreshing the page',
      'Clear browser cache if needed',
      'Contact support if issue continues'
    ];
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center relative">
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="absolute top-2 right-2 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          
          <CardTitle className="text-xl text-gray-900 flex items-center justify-center gap-2">
            {context} Failed
            <Badge variant="outline" className={errorCategory.color}>
              {errorCategory.type}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert className={errorCategory.bg}>
            <AlertDescription className={errorCategory.color}>
              {errorMessage}
            </AlertDescription>
          </Alert>

          {/* Retry Status */}
          {maxRetries > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Attempt {currentRetry + 1} of {maxRetries + 1}</span>
              <div className="flex gap-1">
                {Array.from({ length: maxRetries + 1 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i <= currentRetry 
                        ? i === currentRetry && !canRetry
                          ? 'bg-red-400'
                          : 'bg-gray-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recovery Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Try these steps:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {getRecoveryTips().map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {canRetry && (
              <Button
                onClick={onRetry}
                className="w-full"
                disabled={!navigator.onLine && isNetworkError}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again ({maxRetries - currentRetry} left)
              </Button>
            )}
            
            <div className="flex gap-3">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
              
              <Button
                onClick={onNavigateHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-100 p-3 rounded-md text-sm">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                Error Details (Development)
              </summary>
              <pre className="whitespace-pre-wrap text-red-600 text-xs">
                {error instanceof Error ? error.stack : errorMessage}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
