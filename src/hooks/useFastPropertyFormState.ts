
import { useFastAuth } from "./useFastAuth";
import { usePropertyLoader } from "./usePropertyLoader";
import { useEnhancedPropertySubmission } from "./useEnhancedPropertySubmission";
import { useDebugInfoCombiner } from "./useDebugInfoCombiner";

export const useFastPropertyFormState = () => {
  // Get fast authentication state
  const { 
    user, 
    userRole, 
    authDebugInfo, 
    loadUserRole
  } = useFastAuth();

  // Get property loading functionality
  const { isEditing, isLoadingProperty, loadProperty, loadDebugInfo } = usePropertyLoader(user);

  // Get enhanced property submission functionality
  const { isLoading, submitProperty, submissionDebugInfo, getSubmissionStats } = useEnhancedPropertySubmission(user, userRole || '');

  // Combine all debug info
  const debugInfo = useDebugInfoCombiner(authDebugInfo, loadDebugInfo, submissionDebugInfo);

  return {
    isEditing,
    isLoading,
    isLoadingProperty,
    debugInfo,
    loadProperty,
    submitProperty,
    getSubmissionStats,
    loadUserRole
  };
};
