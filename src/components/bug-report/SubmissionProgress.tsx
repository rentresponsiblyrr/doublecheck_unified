/**
 * Submission Progress Component - Temporary Stub
 * TODO: Implement full submission progress tracking
 */

import React from "react";
import { Progress } from "@/components/ui/progress";

export interface SubmissionProgressProps {
  currentStep?: string;
  progress?: number;
  isSubmitting?: boolean;
}

export const SubmissionProgress: React.FC<SubmissionProgressProps> = ({
  currentStep = "Preparing submission...",
  progress = 0,
  isSubmitting = false,
}) => {
  if (!isSubmitting) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">{currentStep}</p>
      <Progress value={progress} className="w-full" />
    </div>
  );
};
