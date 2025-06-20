
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEnhancedPropertySubmissionLogic } from "./useEnhancedPropertySubmissionLogic";
import type { PropertyFormData } from "@/types/propertySubmission";

export const useEnhancedPropertySubmission = (user: any, userRole: string) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const {
    isLoading,
    setIsLoading,
    submissionDebugInfo,
    validateSubmission,
    executeSubmissionWithRetry,
    startSubmissionTracking,
    completeSubmission,
    getSubmissionStats
  } = useEnhancedPropertySubmissionLogic(user, isEditing, editId);

  const submitProperty = async (formData: PropertyFormData, isOnline: boolean) => {
    console.log('🚀 Starting enhanced property submission process...');
    
    // Start monitoring
    const submissionId = startSubmissionTracking();
    
    // Pre-submission validation
    if (!validateSubmission(user, isOnline, formData)) {
      completeSubmission(false);
      return false;
    }

    setIsLoading(true);

    try {
      const success = await executeSubmissionWithRetry(formData);
      
      completeSubmission(success);

      if (success) {
        // Log success stats
        const stats = getSubmissionStats();
        console.log('📊 Current submission stats:', stats);

        // Navigate after short delay
        setTimeout(() => {
          navigate('/properties');
        }, 500);
      }

      return success;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    submitProperty,
    submissionDebugInfo,
    getSubmissionStats
  };
};
