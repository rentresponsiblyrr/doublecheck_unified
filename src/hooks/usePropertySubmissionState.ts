
import { useState } from "react";
import type { SubmissionDebugInfo } from "@/types/propertySubmission";

export const usePropertySubmissionState = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submissionDebugInfo, setSubmissionDebugInfo] = useState<SubmissionDebugInfo>({});

  const updateDebugInfo = (update: Partial<SubmissionDebugInfo>) => {
    setSubmissionDebugInfo(prev => ({ ...prev, ...update }));
  };

  const clearDebugInfo = () => {
    setSubmissionDebugInfo({});
  };

  return {
    isLoading,
    setIsLoading,
    submissionDebugInfo,
    updateDebugInfo,
    clearDebugInfo
  };
};
