
import { usePropertyFormValidation } from "./usePropertyFormValidation";
import { usePropertyMutation } from "./usePropertyMutation";
import { usePropertySubmissionState } from "./usePropertySubmissionState";
import { usePropertySubmissionMonitoring } from "./usePropertySubmissionMonitoring";
import { usePropertySubmissionRetry } from "./usePropertySubmissionRetry";
import { usePropertyErrorHandler } from "@/utils/propertySubmissionErrors";
import type { PropertyFormData } from "@/types/propertySubmission";

export const useEnhancedPropertySubmissionLogic = (user: any, isEditing: boolean, editId: string | null) => {
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
    isRetryable,
    showRetryToast,
    createBackoffDelay
  } = usePropertySubmissionRetry();
  const { 
    handleSubmissionError, 
    handleUnexpectedError, 
    handleSuccess 
  } = usePropertyErrorHandler();

  const executeSubmissionWithRetry = async (formData: PropertyFormData): Promise<boolean> => {
    const submitStartTime = Date.now();
    let retryCount = 0;
    const maxRetries = 2;

    // Retry logic with exponential backoff
    while (retryCount <= maxRetries) {
      try {
        if (retryCount > 0) {
          recordRetry();
          console.log(`🔄 Retry attempt ${retryCount}/${maxRetries}`);
          
          // Exponential backoff delay
          const backoffDelay = createBackoffDelay(retryCount);
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
          const canRetry = isRetryable(error);
          
          if (canRetry && retryCount < maxRetries) {
            retryCount++;
            showRetryToast(retryCount, maxRetries);
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
            return false;
          }
        }

        // Success!
        const submitDuration = Date.now() - submitStartTime;
        console.log(`✅ Property ${isEditing ? 'updated' : 'created'} successfully:`, {
          data,
          attempts: retryCount + 1
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
          showRetryToast(retryCount, maxRetries, true);
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
          return false;
        }
      }
    }

    return false;
  };

  return {
    isLoading,
    setIsLoading,
    submissionDebugInfo,
    validateSubmission,
    executeSubmissionWithRetry,
    startSubmissionTracking,
    completeSubmission,
    getSubmissionStats
  };
};
