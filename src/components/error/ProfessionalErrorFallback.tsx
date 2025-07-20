/**
 * PROFESSIONAL ERROR FALLBACK - META/NETFLIX STANDARDS
 * 
 * Production-grade error fallback component with recovery options,
 * error reporting, and user-friendly messaging.
 */

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfessionalErrorFallbackProps {
  error: Error;
  onRetry?: () => void;
  title?: string;
  description?: string;
  showDetails?: boolean;
  showHomeButton?: boolean;
  className?: string;
}

export const ProfessionalErrorFallback: React.FC<ProfessionalErrorFallbackProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  showDetails = false,
  showHomeButton = true,
  className,
}) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX
      onRetry();
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry]);

  const handleGoHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  const handleReportError = useCallback(() => {
    // Create error report
    const errorReport = {
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Copy to clipboard for easy reporting
    navigator.clipboard?.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please share with support.');
      })
      .catch(() => {
        // REMOVED: console.error('Failed to copy error details');
      });
  }, [error]);

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center p-4 bg-background',
      className
    )}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold">
            {title}
          </CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            {onRetry && (
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full"
                variant="default"
              >
                <RefreshCw className={cn(
                  'mr-2 h-4 w-4',
                  isRetrying && 'animate-spin'
                )} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>
            )}

            {showHomeButton && (
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            )}
          </div>

          {/* Error Details Toggle */}
          {showDetails && (
            <div className="space-y-2">
              <Button
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
              >
                <Bug className="mr-2 h-3 w-3" />
                {showErrorDetails ? 'Hide' : 'Show'} Error Details
              </Button>

              {showErrorDetails && (
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-xs font-mono break-all text-muted-foreground">
                      <strong>Error:</strong> {error.message}
                    </p>
                    {error.stack && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                          Stack Trace
                        </summary>
                        <pre className="text-xs mt-2 whitespace-pre-wrap break-all text-muted-foreground">
                          {error.stack}
                        </pre>
                      </details>
                    )}
                  </div>

                  <Button
                    onClick={handleReportError}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    Copy Error Details
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Additional Help */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              If this issue persists, please contact support with the error details above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};