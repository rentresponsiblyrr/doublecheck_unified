/**
 * Workflow Progress Bar Component
 * Extracted from InspectionWorkflowContainer.tsx
 */

import React from "react";
import { Progress } from "@/components/ui/progress";
import { WorkflowState } from "@/hooks/useInspectionWorkflow";

interface WorkflowProgressBarProps {
  state: WorkflowState;
}

export const WorkflowProgressBar: React.FC<WorkflowProgressBarProps> = ({
  state,
}) => {
  return (
    <Progress
      id="workflow-progress-bar"
      value={(state.currentStep / (state.inspectionSteps.length - 1)) * 100}
      className="w-full"
    />
  );
};
