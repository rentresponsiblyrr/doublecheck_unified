/**
 * PROFESSIONAL ERROR BOUNDARY - ZERO TOLERANCE STANDARDS
 * 
 * World-class error boundary that replaces amateur nuclear error handling.
 * NO window.location manipulation, NO page reloads, NO amateur shortcuts.
 * 
 * This is a compatibility wrapper that redirects to the professional implementation.
 * @deprecated Use ProfessionalErrorBoundary directly for new code.
 */

import React from 'react';
import { ProfessionalErrorBoundary } from '@/components/error/ProfessionalErrorBoundary';
import type { ReactNode, ErrorInfo } from 'react';

/**
 * PROFESSIONAL ERROR BOUNDARY COMPATIBILITY WRAPPER
 * 
 * Maintains API compatibility while using professional implementation.
 * All nuclear error handling has been eliminated.
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  showDetails?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: string[];
  componentName?: string;
  level?: 'component' | 'page' | 'application';
}

/**
 * Professional Error Boundary - Compatibility Wrapper
 * 
 * @deprecated Use ProfessionalErrorBoundary directly for new code
 */
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback,
  onError,
  showRetry = true,
  showDetails = false,
  maxRetries = 3,
  componentName,
  level = 'component',
  ...props
}) => {
  return (
    <ProfessionalErrorBoundary
      level={level}
      fallbackStrategy="retry"
      customFallback={fallback}
      onError={onError}
      maxRetries={maxRetries}
      componentName={componentName}
      showErrorDetails={showDetails}
      allowReportBug={true}
      enableMonitoring={true}
    >
      {children}
    </ProfessionalErrorBoundary>
  );
};

/**
 * Professional Error Handler Hook
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

/**
 * Professional HOC for Error Boundary wrapping
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundary {...errorBoundaryProps} componentName={Component.displayName || Component.name}>
      <Component {...props} ref={ref} />
    </ErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary;