
import { usePropertyFormAuth } from "./usePropertyFormAuth";
import { usePropertyLoader } from "./usePropertyLoader";
import { useEnhancedPropertySubmission } from "./useEnhancedPropertySubmission";
import { useDebugInfoCombiner } from "./useDebugInfoCombiner";

export const usePropertyFormState = () => {
  // Get enhanced authentication state with recovery
  const { 
    user, 
    userRole, 
    authDebugInfo, 
    recoveryState, 
    attemptRecovery, 
    canRecover 
  } = usePropertyFormAuth();

  // Get property loading functionality
  const { isEditing, isLoadingProperty, loadProperty, loadDebugInfo } = usePropertyLoader(user);

  // Get enhanced property submission functionality
  const { isLoading, submitProperty, submissionDebugInfo, getSubmissionStats } = useEnhancedPropertySubmission(user, userRole || '');

  // Combine all debug info including recovery state
  const debugInfo = useDebugInfoCombiner(authDebugInfo, loadDebugInfo, submissionDebugInfo);

  return {
    isEditing,
    isLoading,
    isLoadingProperty,
    debugInfo: {
      ...debugInfo,
      recoveryState,
      canRecover
    },
    loadProperty,
    submitProperty,
    getSubmissionStats,
    attemptRecovery,
    canRecover
  };
};
