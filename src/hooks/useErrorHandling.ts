import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { apiErrorHandler, ApiError, ApiErrorContext } from '@/lib/error/api-error-handler';
import { errorReporter } from '@/lib/monitoring/error-reporter';
import { env } from '@/lib/config/environment';

export interface ErrorState {
  error: Error | ApiError | null;
  isError: boolean;
  errorMessage: string | null;
  errorDetails: Record<string, any> | null;
  errorId: string | null;
  retryCount: number;
  isRetrying: boolean;
}

export interface UseErrorHandlingOptions {
  showToast?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error | ApiError) => void;
  onRetry?: () => void;
  onSuccess?: () => void;
  context?: Record<string, any>;
  resetOnUnmount?: boolean;
}

export interface ErrorHandlingUtils {
  error: ErrorState;
  setError: (error: Error | ApiError | string | null) => void;
  clearError: () => void;
  handleError: (error: any, context?: ApiErrorContext | Record<string, any>) => void;
  handleApiError: (error: any, apiContext: ApiErrorContext) => Promise<void>;
  retry: () => Promise<void>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  withErrorHandling: <T>(
    asyncFn: () => Promise<T>,
    options?: { showLoading?: boolean; context?: Record<string, any> }
  ) => Promise<T | null>;
}

const DEFAULT_OPTIONS: UseErrorHandlingOptions = {
  showToast: true,
  autoRetry: false,
  maxRetries: 3,
  retryDelay: 1000,
  resetOnUnmount: true,
};

export function useErrorHandling(options?: UseErrorHandlingOptions): ErrorHandlingUtils {
  const { toast } = useToast();
  const config = { ...DEFAULT_OPTIONS, ...options };
  const retryFnRef = useRef<(() => Promise<void>) | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
    errorMessage: null,
    errorDetails: null,
    errorId: null,
    retryCount: 0,
    isRetrying: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (config.resetOnUnmount) {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
      }
    };
  }, [config.resetOnUnmount]);

  /**
   * Set error state
   */
  const setError = useCallback((error: Error | ApiError | string | null) => {
    if (!error) {
      clearError();
      return;
    }

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const errorId = errorReporter.reportError(errorObj, {
      ...config.context,
      source: 'useErrorHandling',
    });

    const errorMessage = 'userMessage' in errorObj && errorObj.userMessage
      ? errorObj.userMessage
      : errorObj.message;

    setErrorState({
      error: errorObj,
      isError: true,
      errorMessage,
      errorDetails: 'details' in errorObj ? errorObj.details : null,
      errorId,
      retryCount: 0,
      isRetrying: false,
    });

    // Show toast if enabled
    if (config.showToast) {
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }

    // Call error callback
    config.onError?.(errorObj);

    // Log in development
    if (env.isDevelopment()) {
      console.error('[useErrorHandling]', errorObj);
    }
  }, [config, toast]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
      errorMessage: null,
      errorDetails: null,
      errorId: null,
      retryCount: 0,
      isRetrying: false,
    });

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handle generic errors
   */
  const handleError = useCallback((
    error: any,
    context?: ApiErrorContext | Record<string, any>
  ) => {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Add context to error reporting
    errorReporter.reportError(errorObj, {
      ...config.context,
      ...context,
      source: 'useErrorHandling',
    });

    setError(errorObj);

    // Auto-retry logic
    if (config.autoRetry && errorState.retryCount < (config.maxRetries || 3)) {
      const delay = config.retryDelay || 1000;
      retryTimeoutRef.current = setTimeout(() => {
        retry();
      }, delay * Math.pow(2, errorState.retryCount)); // Exponential backoff
    }
  }, [config, errorState.retryCount, setError]);

  /**
   * Handle API errors specifically
   */
  const handleApiError = useCallback(async (
    error: any,
    apiContext: ApiErrorContext
  ) => {
    try {
      const apiError = await apiErrorHandler.handleError(error, apiContext);
      setError(apiError);

      // Auto-retry for retryable API errors
      if (config.autoRetry && apiError.retry && errorState.retryCount < (config.maxRetries || 3)) {
        const delay = config.retryDelay || 1000;
        retryTimeoutRef.current = setTimeout(() => {
          retry();
        }, delay * Math.pow(2, errorState.retryCount));
      }
    } catch (err) {
      // Fallback if error handler fails
      handleError(err, apiContext);
    }
  }, [config, errorState.retryCount, handleError, setError]);

  /**
   * Retry the last failed operation
   */
  const retry = useCallback(async () => {
    if (!retryFnRef.current || errorState.isRetrying) return;

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    config.onRetry?.();

    try {
      await retryFnRef.current();
      
      // Success - clear error
      clearError();
      config.onSuccess?.();
      
      toast({
        title: 'Success',
        description: 'Operation completed successfully',
      });
    } catch (error) {
      // Retry failed
      setErrorState(prev => ({
        ...prev,
        isRetrying: false,
      }));

      // Update error with new retry count
      if (error instanceof Error || (error && typeof error === 'object' && 'message' in error)) {
        handleError(error, { retry: true, attempt: errorState.retryCount + 1 });
      }
    }
  }, [errorState.isRetrying, errorState.retryCount, config, clearError, handleError, toast]);

  /**
   * Wrapper function for async operations with error handling
   */
  const withErrorHandling = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    options?: { showLoading?: boolean; context?: Record<string, any> }
  ): Promise<T | null> => {
    // Store the function for potential retry
    retryFnRef.current = async () => {
      await asyncFn();
    };

    if (options?.showLoading) {
      setIsLoading(true);
    }

    try {
      clearError();
      const result = await asyncFn();
      
      config.onSuccess?.();
      
      if (options?.showLoading) {
        setIsLoading(false);
      }
      
      return result;
    } catch (error) {
      if (options?.showLoading) {
        setIsLoading(false);
      }

      // Check if it's an API error
      if (options?.context && 'url' in options.context && 'method' in options.context) {
        await handleApiError(error, options.context as ApiErrorContext);
      } else {
        handleError(error, options?.context);
      }

      return null;
    }
  }, [clearError, config, handleApiError, handleError]);

  return {
    error: errorState,
    setError,
    clearError,
    handleError,
    handleApiError,
    retry,
    isLoading,
    setIsLoading,
    withErrorHandling,
  };
}

/**
 * Hook for handling form errors
 */
export function useFormErrorHandling<T extends Record<string, any>>() {
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof T, string>>>({});
  const { toast } = useToast();

  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setFieldErrors(prev => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
    });
  }, []);

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const handleValidationError = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setFieldErrors(errors);
    
    // Show first error in toast
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      toast({
        title: 'Validation Error',
        description: firstError as string,
        variant: 'destructive',
      });
    }
  }, [toast]);

  return {
    fieldErrors,
    setFieldError,
    clearFieldErrors,
    handleValidationError,
    hasErrors: Object.keys(fieldErrors).length > 0,
  };
}

/**
 * Hook for handling async operations with loading and error states
 */
export function useAsyncError() {
  const [state, setState] = useState<{
    loading: boolean;
    error: Error | null;
    data: any;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(async (asyncFunction: () => Promise<any>) => {
    setState({ loading: true, error: null, data: null });

    try {
      const data = await asyncFunction();
      setState({ loading: false, error: null, data });
      return data;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState({ loading: false, error: errorObj, data: null });
      throw errorObj;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}