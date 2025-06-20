
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePropertyFormValidation } from "./usePropertyFormValidation";
import { usePropertyMutation } from "./usePropertyMutation";
import { usePropertySubmissionState } from "./usePropertySubmissionState";
import { usePropertySubmissionMonitoring } from "./usePropertySubmissionMonitoring";
import { usePropertyErrorHandler } from "@/utils/propertySubmissionErrors";
import { useToast } from "@/hooks/use-toast";
import type { PropertyFormData } from "@/types/propertySubmission";

export const useEnhancedPropertySubmission = (user: any, userRole: string) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;
  const { toast } = useToast();

  // Enhanced hooks
  const { validateSubmission } = usePropertyFormValidation();
  const { executePropertyMutation } = usePropertyMutation();
  const { 
    isLoading, 
    setIsLoading, 
    submissionDebugInfo, 
    updateDebugInfo 
  } = usePropertySubmissionState();
  const {
    startSubmissionTracking,
    recordError,
    recordRetry,
    completeSubmission,
    getSubmissionStats
  } = usePropertySubmissionMonitoring();
  const { 
    handleSubmissionError, 
    handleUnexpectedError, 
    handleSuccess 
  } = usePropertyErrorHandler();

  const submitProperty = async (formData: PropertyFormData, isOnline: boolean) => {
    console.log('🚀 Starting enhanced property submission process...');
    
    // Start monitoring
    const submissionId = startSubmissionTracking();
    const submitStartTime = Date.now();
    
    // Pre-submission validation
    if (!validateSubmission(user, isOnline, formData)) {
      completeSubmission(false);
      return false;
    }

    setIsLoading(true);
    let retryCount = 0;
    const maxRetries = 2;

    // Retry logic with exponential backoff
    while (retryCount <= maxRetries) {
      try {
        if (retryCount > 0) {
          recordRetry();
          console.log(`🔄 Retry attempt ${retryCount}/${maxRetries}`);
          
          // Exponential backoff: 1s, 2s
          const backoffDelay = Math.pow(2, retryCount - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }

        const result = await executePropertyMutation(formData, user, isEditing, editId);
        const { data, error } = result;

        if (error) {
          const submitDuration = Date.now() - submitStartTime;
          console.error(`❌ Database error on attempt ${retryCount + 1}:`, {
            error: {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint
            },
            operation: isEditing ? 'update' : 'insert',
            userId: user.id,
            attempt: retryCount + 1
          });

          recordError(error);
          
          // Check if error is retryable
          const isRetryableError = isRetryable(error);
          
          if (isRetryableError && retryCount < maxRetries) {
            retryCount++;
            
            toast({
              title: "Connection Issue",
              description: `Retrying... (${retryCount}/${maxRetries})`,
            });
            
            continue; // Retry
          } else {
            // Non-retryable error or max retries exceeded
            updateDebugInfo({
              submitError: {
                operation: isEditing ? 'update' : 'insert',
                error: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                attempts: retryCount + 1,
                duration: submitDuration,
                timestamp: new Date().toISOString()
              }
            });

            handleSubmissionError(error, isEditing);
            completeSubmission(false);
            return false;
          }
        }

        // Success!
        const submitDuration = Date.now() - submitStartTime;
        console.log(`✅ Property ${isEditing ? 'updated' : 'created'} successfully:`, {
          data,
          attempts: retryCount + 1,
          submissionId
        });

        updateDebugInfo({
          submitSuccess: {
            operation: isEditing ? 'update' : 'insert',
            propertyId: data?.id,
            attempts: retryCount + 1,
            duration: submitDuration,
            timestamp: new Date().toISOString()
          }
        });

        handleSuccess(formData.name.trim(), isEditing);
        completeSubmission(true);

        // Log success stats
        const stats = getSubmissionStats();
        console.log('📊 Current submission stats:', stats);

        // Navigate after short delay
        setTimeout(() => {
          navigate('/properties');
        }, 500);

        return true;

      } catch (error) {
        const submitDuration = Date.now() - submitStartTime;
        console.error(`💥 Unexpected error on attempt ${retryCount + 1}:`, {
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error,
          attempt: retryCount + 1
        });

        recordError(error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          toast({
            title: "Unexpected Error",
            description: `Retrying... (${retryCount}/${maxRetries})`,
          });
          continue; // Retry
        } else {
          updateDebugInfo({
            unexpectedSubmitError: {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              attempts: retryCount + 1,
              duration: submitDuration,
              timestamp: new Date().toISOString()
            }
          });

          handleUnexpectedError();
          completeSubmission(false);
          return false;
        }
      } finally {
        if (retryCount === maxRetries || retryCount === 0) {
          setIsLoading(false);
        }
      }
    }

    return false;
  };

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

  return {
    isLoading,
    submitProperty,
    submissionDebugInfo,
    getSubmissionStats
  };
};
