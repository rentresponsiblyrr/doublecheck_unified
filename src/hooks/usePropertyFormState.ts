
import { usePropertyFormAuth } from "./usePropertyFormAuth";
import { usePropertyLoader } from "./usePropertyLoader";
import { usePropertySubmission } from "./usePropertySubmission";
import { useDebugInfoCombiner } from "./useDebugInfoCombiner";

export const usePropertyFormState = () => {
  // Get authentication state
  const { user, userRole, authDebugInfo } = usePropertyFormAuth();

  // Get property loading functionality
  const { isEditing, isLoadingProperty, loadProperty, loadDebugInfo } = usePropertyLoader(user);

  // Get property submission functionality
  const { isLoading, submitProperty, submissionDebugInfo } = usePropertySubmission(user, userRole || '');

  // Combine all debug info
  const debugInfo = useDebugInfoCombiner(authDebugInfo, loadDebugInfo, submissionDebugInfo);

  return {
    isEditing,
    isLoading,
    isLoadingProperty,
    debugInfo,
    loadProperty,
    submitProperty
  };
};
