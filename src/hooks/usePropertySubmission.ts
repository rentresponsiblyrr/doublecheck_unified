
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePropertyValidation } from "./usePropertyValidation";
import { usePropertyMutation } from "./usePropertyMutation";
import { usePropertySubmissionState } from "./usePropertySubmissionState";
import { usePropertyErrorHandler } from "@/utils/propertySubmissionErrors";
import type { PropertyFormData } from "@/types/propertySubmission";

export const usePropertySubmission = (user: any, userRole: string) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  // Use the smaller, focused hooks
  const { validateSubmission } = usePropertyValidation();
  const { executePropertyMutation } = usePropertyMutation();
  const { 
    isLoading, 
    setIsLoading, 
    submissionDebugInfo, 
    updateDebugInfo 
  } = usePropertySubmissionState();
  const { 
    handleSubmissionError, 
    handleUnexpectedError, 
    handleSuccess 
  } = usePropertyErrorHandler();

  const submitProperty = async (formData: PropertyFormData, isOnline: boolean) => {
    console.log('🚀 Starting form submission process...');
    
    // Pre-submission validation
    if (!validateSubmission(user, isOnline, formData)) {
      return false;
    }

    setIsLoading(true);
    const submitStartTime = Date.now();

    try {
      const result = await executePropertyMutation(formData, user, isEditing, editId);
      const { data, error } = result;
      const submitDuration = Date.now() - submitStartTime;

      if (error) {
        console.error(`❌ Database error during ${isEditing ? 'update' : 'insert'}:`, {
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          },
          operation: isEditing ? 'update' : 'insert',
          userId: user.id,
          duration: submitDuration,
          timestamp: new Date().toISOString()
        });

        updateDebugInfo({
          submitError: {
            operation: isEditing ? 'update' : 'insert',
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            duration: submitDuration,
            timestamp: new Date().toISOString()
          }
        });

        handleSubmissionError(error, isEditing);
        return false;
      }

      console.log(`✅ Property ${isEditing ? 'updated' : 'created'} successfully:`, {
        data,
        duration: submitDuration,
        timestamp: new Date().toISOString()
      });

      updateDebugInfo({
        submitSuccess: {
          operation: isEditing ? 'update' : 'insert',
          propertyId: data?.id,
          duration: submitDuration,
          timestamp: new Date().toISOString()
        }
      });

      handleSuccess(formData.name.trim(), isEditing);

      // Small delay to ensure UI feedback is seen
      setTimeout(() => {
        navigate('/properties');
      }, 500);

      return true;
    } catch (error) {
      const submitDuration = Date.now() - submitStartTime;
      console.error(`💥 Unexpected error during ${isEditing ? 'update' : 'create'}:`, {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : error,
        duration: submitDuration,
        timestamp: new Date().toISOString()
      });

      updateDebugInfo({
        unexpectedSubmitError: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          duration: submitDuration,
          timestamp: new Date().toISOString()
        }
      });

      handleUnexpectedError();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    submitProperty,
    submissionDebugInfo
  };
};
