/**
 * PROFESSIONAL ERROR BOUNDARY WITH RECOVERY - ZERO TOLERANCE STANDARDS
 * 
 * REPLACES AMATEUR ERROR BOUNDARY WITH NUCLEAR PATTERNS
 * This is a compatibility wrapper that uses the professional implementation.
 * 
 * @deprecated Use ProfessionalErrorBoundary directly for new code
 */

import React from 'react';
import { ProfessionalErrorBoundary } from '@/components/error/ProfessionalErrorBoundary';
import type { ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryWithRecoveryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  componentName?: string;
}

/**
 * Professional Error Boundary with Recovery Capabilities
 * 
 * NO nuclear options, NO window.location manipulation, NO amateur shortcuts.
 * Graceful degradation and professional error handling only.
 */
export class ErrorBoundaryWithRecovery extends React.Component<ErrorBoundaryWithRecoveryProps> {
  render() {
    const { 
      children, 
      fallback, 
      onError, 
      maxRetries = 3, 
      componentName 
    } = this.props;

    return (
      <ProfessionalErrorBoundary
        level="component"
        fallbackStrategy="retry"
        customFallback={fallback}
        onError={onError}
        maxRetries={maxRetries}
        componentName={componentName || 'ErrorBoundaryWithRecovery'}
        showErrorDetails={process.env.NODE_ENV === 'development'}
        allowReportBug={true}
        enableMonitoring={true}
      >
        {children}
      </ProfessionalErrorBoundary>
    );
  }
}

export default ErrorBoundaryWithRecovery;