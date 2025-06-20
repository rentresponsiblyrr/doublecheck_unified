
import { useToast } from "@/hooks/use-toast";

export const usePropertySubmissionRetry = () => {
  const { toast } = useToast();

  const isRetryable = (error: any): boolean => {
    // Network/timeout errors are retryable
    if (error.code === 'PGRST301' || // Network error
        error.code === 'PGRST504' || // Gateway timeout
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('connection')) {
      return true;
    }
    
    // Authentication errors might be retryable (token refresh)
    if (error.code === '42501' || error.message?.includes('JWT')) {
      return true;
    }
    
    // Business logic errors are not retryable
    if (error.code === '23505' || // Unique constraint
        error.code === 'PGRST116' || // Not found
        error.message?.includes('violates')) {
      return false;
    }
    
    // Default to retryable for unknown errors
    return true;
  };

  const showRetryToast = (attempt: number, maxRetries: number, isUnexpected: boolean = false) => {
    const title = isUnexpected ? "Unexpected Error" : "Connection Issue";
    toast({
      title,
      description: `Retrying... (${attempt}/${maxRetries})`,
    });
  };

  const createBackoffDelay = (attempt: number): number => {
    // Exponential backoff: 1s, 2s
    return Math.pow(2, attempt - 1) * 1000;
  };

  return {
    isRetryable,
    showRetryToast,
    createBackoffDelay
  };
};
