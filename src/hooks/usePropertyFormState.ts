
import { useState } from "react";
import { usePropertyFormAuth } from "./usePropertyFormAuth";
import { usePropertyLoader } from "./usePropertyLoader";
import { usePropertySubmission } from "./usePropertySubmission";

interface DebugInfo {
  [key: string]: any;
}

export const usePropertyFormState = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});

  // Get authentication state
  const { user, userRole, authDebugInfo } = usePropertyFormAuth();

  // Get property loading functionality
  const { isEditing, isLoadingProperty, loadProperty, loadDebugInfo } = usePropertyLoader(user);

  // Get property submission functionality
  const { isLoading, submitProperty, submissionDebugInfo } = usePropertySubmission(user, userRole || '');

  // Combine all debug info
  const combinedDebugInfo = {
    ...debugInfo,
    ...authDebugInfo,
    ...loadDebugInfo,
    ...submissionDebugInfo
  };

  return {
    isEditing,
    isLoading,
    isLoadingProperty,
    debugInfo: combinedDebugInfo,
    loadProperty,
    submitProperty,
    setDebugInfo
  };
};
