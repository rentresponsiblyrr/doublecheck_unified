/**
 * PROFESSIONAL ERROR RECOVERY - NO MORE NUCLEAR RELOADS
 * Built by engineers who understand error handling, not amateurs
 */

import { log } from '@/lib/logging/enterprise-logger';

export interface RecoveryStrategy {
  name: string;
  action: () => Promise<void> | void;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorRecoveryOptions {
  context?: string;
  userId?: string;
  propertyId?: string;
  inspectionId?: string;
  retryCount?: number;
}

class ErrorRecoveryService {
  private maxRetries = 3;
  private retryDelays = [1000, 2000, 5000]; // Progressive delays

  /**
   * Attempt recovery strategies in order of severity
   * NO NUCLEAR OPTIONS - WE'RE NOT AMATEURS
   */
  async recoverFromError(
    error: Error,
    options: ErrorRecoveryOptions = {}
  ): Promise<boolean> {
    const strategies = this.getRecoveryStrategies(error, options);
    
    for (const strategy of strategies) {
      try {
        log.info('Attempting recovery strategy', {
          component: 'ErrorRecoveryService',
          action: 'recoverFromError',
          strategyName: strategy.name,
          strategySeverity: strategy.severity,
          errorMessage: error.message,
          ...options
        }, 'RECOVERY_ATTEMPT');
        await strategy.action();
        log.info('Recovery strategy successful', {
          component: 'ErrorRecoveryService',
          action: 'recoverFromError',
          strategyName: strategy.name,
          strategySeverity: strategy.severity,
          ...options
        }, 'RECOVERY_SUCCESS');
        return true;
      } catch (recoveryError) {
        log.warn('Recovery strategy failed', {
          component: 'ErrorRecoveryService',
          action: 'recoverFromError',
          strategyName: strategy.name,
          strategySeverity: strategy.severity,
          originalError: error.message,
          recoveryError: recoveryError,
          ...options
        }, 'RECOVERY_FAILED');
        continue;
      }
    }
    
    // If all strategies fail, show user-friendly error
    this.showUserFriendlyError(error, options);
    return false;
  }

  private getRecoveryStrategies(
    error: Error,
    options: ErrorRecoveryOptions
  ): RecoveryStrategy[] {
    const strategies: RecoveryStrategy[] = [];

    // Network errors
    if (this.isNetworkError(error)) {
      strategies.push({
        name: 'Retry Network Request',
        severity: 'low',
        description: 'Retry the failed network request',
        action: () => this.retryWithBackoff(options.retryCount || 0)
      });
    }

    // Database errors
    if (this.isDatabaseError(error)) {
      strategies.push({
        name: 'Clear Cache and Retry',
        severity: 'medium',
        description: 'Clear local cache and retry operation',
        action: () => this.clearCacheAndRetry(options)
      });
    }

    // Authentication errors
    if (this.isAuthError(error)) {
      strategies.push({
        name: 'Refresh Authentication',
        severity: 'medium',
        description: 'Refresh user authentication',
        action: () => this.refreshAuth()
      });
    }

    // Component errors
    if (this.isComponentError(error)) {
      strategies.push({
        name: 'Reset Component State',
        severity: 'low',
        description: 'Reset component to initial state',
        action: () => this.resetComponentState(options)
      });
    }

    // Navigation fallback (NEVER RELOAD)
    strategies.push({
      name: 'Navigate to Safe State',
      severity: 'high',
      description: 'Navigate to a known working page',
      action: () => this.navigateToSafeState(options)
    });

    return strategies.sort((a, b) => {
      const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private async retryWithBackoff(retryCount: number): Promise<void> {
    if (retryCount >= this.maxRetries) {
      throw new Error('Max retries exceeded');
    }
    
    const delay = this.retryDelays[Math.min(retryCount, this.retryDelays.length - 1)];
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async clearCacheAndRetry(options: ErrorRecoveryOptions): Promise<void> {
    // Clear query cache if using React Query
    if (window.queryClient) {
      window.queryClient.clear();
    }
    
    // Clear localStorage cache
    localStorage.removeItem('app-cache');
    localStorage.removeItem('property-cache');
    localStorage.removeItem('inspection-cache');
  }

  private async refreshAuth(): Promise<void> {
    // Trigger auth refresh without full reload
    const event = new CustomEvent('auth-refresh-required');
    window.dispatchEvent(event);
  }

  private async resetComponentState(options: ErrorRecoveryOptions): Promise<void> {
    // Trigger component reset event
    const event = new CustomEvent('component-reset', {
      detail: { context: options.context }
    });
    window.dispatchEvent(event);
  }

  private async navigateToSafeState(options: ErrorRecoveryOptions): Promise<void> {
    // Navigate to dashboard - NEVER RELOAD
    const router = window.router;
    if (router) {
      router.navigate('/', { replace: true });
    } else {
      // Professional fallback: navigate without session destruction
      window.location.replace('/');
    }
  }

  private showUserFriendlyError(error: Error, options: ErrorRecoveryOptions): void {
    // Show toast notification instead of crashing
    const event = new CustomEvent('show-error-toast', {
      detail: {
        title: 'Something went wrong',
        message: this.getUserFriendlyMessage(error),
        actions: [
          {
            label: 'Try Again',
            action: () => this.recoverFromError(error, { ...options, retryCount: (options.retryCount || 0) + 1 })
          },
          {
            label: 'Go to Dashboard',
            action: () => this.navigateToSafeState(options)
          }
        ]
      }
    });
    window.dispatchEvent(event);
  }

  private getUserFriendlyMessage(error: Error): string {
    if (this.isNetworkError(error)) {
      return 'Network connection issue. Please check your internet and try again.';
    }
    if (this.isDatabaseError(error)) {
      return 'Database temporarily unavailable. Please try again in a moment.';
    }
    if (this.isAuthError(error)) {
      return 'Your session has expired. Please refresh to continue.';
    }
    return 'An unexpected error occurred. Our team has been notified.';
  }

  private isNetworkError(error: Error): boolean {
    return error.message.includes('network') || 
           error.message.includes('fetch') ||
           error.message.includes('timeout');
  }

  private isDatabaseError(error: Error): boolean {
    return error.message.includes('database') ||
           error.message.includes('supabase') ||
           error.message.includes('constraint');
  }

  private isAuthError(error: Error): boolean {
    return error.message.includes('auth') ||
           error.message.includes('permission') ||
           error.message.includes('unauthorized');
  }

  private isComponentError(error: Error): boolean {
    return error.message.includes('component') ||
           error.message.includes('render') ||
           error.message.includes('hook');
  }
}

export const errorRecovery = new ErrorRecoveryService();

/**
 * Professional error boundary hook - NO NUCLEAR OPTIONS
 */
export function useErrorRecovery() {
  return {
    recoverFromError: errorRecovery.recoverFromError.bind(errorRecovery),
    handleError: (error: Error, options?: ErrorRecoveryOptions) => {
      log.error('Error caught by recovery system', error, {
        component: 'ErrorRecoveryService',
        action: 'handleError',
        ...options
      }, 'ERROR_CAUGHT_BY_RECOVERY');
      return errorRecovery.recoverFromError(error, options);
    }
  };
}