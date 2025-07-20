/**
 * PROFESSIONAL LOADING SPINNER - META/NETFLIX STANDARDS
 * 
 * High-performance loading component with smooth animations and accessibility.
 * Optimized for 60fps and minimal CPU usage.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ProfessionalLoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'skeleton';
}

export const ProfessionalLoadingSpinner: React.FC<ProfessionalLoadingSpinnerProps> = ({
  size = 'md',
  message,
  className,
  variant = 'default',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center space-x-2', className)}>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
        {message && (
          <span className="text-sm text-muted-foreground ml-3" role="status" aria-live="polite">
            {message}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
        <div className={cn('bg-primary rounded-full animate-pulse', sizeClasses[size])}></div>
        {message && (
          <span className="text-sm text-muted-foreground text-center" role="status" aria-live="polite">
            {message}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
        {message && (
          <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
            {message}
          </span>
        )}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted border-t-primary',
          sizeClasses[size]
        )}
        role="status"
        aria-label={message || 'Loading'}
      >
        <span className="sr-only">{message || 'Loading...'}</span>
      </div>
      {message && (
        <span className="text-sm text-muted-foreground text-center" aria-live="polite">
          {message}
        </span>
      )}
    </div>
  );
};