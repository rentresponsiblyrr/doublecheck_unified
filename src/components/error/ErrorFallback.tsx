import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail, Bug, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ApiError } from '@/lib/error/api-error-handler';
import { env } from '@/lib/config/environment';
import { useNavigate } from 'react-router-dom';

export interface ErrorFallbackProps {
  error: Error | ApiError;
  errorInfo?: React.ErrorInfo;
  resetError?: () => void;
  errorId?: string;
  minimal?: boolean;
  showDetails?: boolean;
  customActions?: React.ReactNode;
}

export function ErrorFallback({
  error,
  errorInfo,
  resetError,
  errorId,
  minimal = false,
  showDetails = env.isDevelopment(),
  customActions,
}: ErrorFallbackProps) {
  const navigate = useNavigate();
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const isApiError = 'category' in error;
  const isNetworkError = isApiError && error.category === 'network';
  const isAuthError = isApiError && (error.category === 'authentication' || error.category === 'authorization');

  // Get error title and description based on error type
  const getErrorContent = () => {
    if (isNetworkError) {
      return {
        title: 'Connection Problem',
        description: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.',
        icon: <WifiOff className="h-6 w-6" />,
      };
    }

    if (isAuthError) {
      return {
        title: 'Authentication Required',
        description: 'You need to sign in to access this content. Please log in and try again.',
        icon: <AlertTriangle className="h-6 w-6" />,
      };
    }

    if (isApiError && error.status === 404) {
      return {
        title: 'Page Not Found',
        description: 'The page you\'re looking for doesn\'t exist or has been moved.',
        icon: <AlertTriangle className="h-6 w-6" />,
      };
    }

    return {
      title: 'Something went wrong',
      description: 'An unexpected error occurred. We\'ve been notified and are working on a fix.',
      icon: <Bug className="h-6 w-6" />,
    };
  };

  const { title, description, icon } = getErrorContent();

  // Minimal error display for inline errors
  if (minimal) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{error.message}</p>
          {resetError && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetError}
              className="mt-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <div className="text-red-600 dark:text-red-400">
              {icon}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription className="mt-2 text-base">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error ID for support */}
          {errorId && (
            <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Error ID: <code className="font-mono text-xs">{errorId}</code>
              </p>
            </div>
          )}

          {/* Specific error message if available */}
          {isApiError && error.userMessage && error.userMessage !== description && (
            <Alert>
              <AlertDescription>{error.userMessage}</AlertDescription>
            </Alert>
          )}

          {/* Recovery suggestions */}
          {isApiError && error.category && (
            <RecoverySuggestions error={error} />
          )}

          {/* Error details (collapsible) */}
          {showDetails && (
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full">
                  {detailsOpen ? 'Hide' : 'Show'} technical details
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-4 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Error Message:
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                      {error.message}
                    </p>
                  </div>
                  
                  {isApiError && error.status && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Status Code:
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {error.status}
                      </p>
                    </div>
                  )}

                  {error.stack && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Stack Trace:
                      </p>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono overflow-auto max-h-40 mt-1">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Component Stack:
                      </p>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono overflow-auto max-h-40 mt-1">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2">
          {/* Custom actions */}
          {customActions}

          {/* Default actions */}
          {!customActions && (
            <>
              {resetError && (
                <Button
                  onClick={resetError}
                  className="w-full sm:w-auto"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>

              {isAuthError && (
                <Button
                  onClick={() => navigate('/auth/signin')}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Sign In
                </Button>
              )}
            </>
          )}
        </CardFooter>

        {/* Contact support */}
        <div className="px-6 pb-6">
          <div className="border-t pt-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Need help?{' '}
              <a
                href="mailto:support@strcertified.com"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                <Mail className="inline h-3 w-3 mr-1" />
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Recovery suggestions component
 */
function RecoverySuggestions({ error }: { error: ApiError }) {
  const suggestions = getRecoverySuggestionsForError(error);

  if (suggestions.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="text-sm font-semibold mb-2">Try these solutions:</h4>
      <ul className="space-y-1">
        {suggestions.map((suggestion, index) => (
          <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
            <span className="mr-2">•</span>
            <span>{suggestion}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Get recovery suggestions based on error type
 */
function getRecoverySuggestionsForError(error: ApiError): string[] {
  const suggestions: string[] = [];

  switch (error.category) {
    case 'network':
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
      suggestions.push('Disable any VPN or proxy');
      suggestions.push('Check if the service is down');
      break;

    case 'authentication':
      suggestions.push('Make sure you\'re signed in');
      suggestions.push('Try signing out and back in');
      suggestions.push('Check if your session has expired');
      break;

    case 'authorization':
      suggestions.push('Verify you have the necessary permissions');
      suggestions.push('Contact your administrator for access');
      suggestions.push('Check your subscription status');
      break;

    case 'validation':
      suggestions.push('Review all form fields for errors');
      suggestions.push('Check for required fields');
      suggestions.push('Ensure data is in the correct format');
      break;

    case 'server':
      if (error.status === 503) {
        suggestions.push('The service is temporarily unavailable');
        suggestions.push('Wait a few minutes and try again');
      } else {
        suggestions.push('Try again in a few moments');
        suggestions.push('If the problem persists, contact support');
      }
      break;

    default:
      suggestions.push('Refresh the page and try again');
      suggestions.push('Clear your browser cache');
      suggestions.push('Try using a different browser');
  }

  return suggestions;
}

/**
 * Error page component for full-page errors
 */
export function ErrorPage({
  title = 'Page Not Found',
  description = 'The page you\'re looking for doesn\'t exist.',
  showHomeButton = true,
  showBackButton = true,
}: {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <AlertTriangle className="h-10 w-10 text-gray-600 dark:text-gray-400" />
        </div>
        
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{description}</p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {showBackButton && (
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
            >
              Go Back
            </Button>
          )}
          
          {showHomeButton && (
            <Button
              onClick={() => navigate('/')}
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;