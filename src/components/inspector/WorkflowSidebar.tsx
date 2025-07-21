/**
 * Workflow Sidebar Component
 * Extracted from InspectionWorkflowContainer.tsx
 */

import React from 'react';
import { InspectionStepsSidebar } from './InspectionStepsSidebar';
import { InspectionStep } from '@/hooks/useInspectionWorkflow';

interface WorkflowSidebarProps {
  steps: InspectionStep[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
  isOnline: boolean;
}

export const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({
  steps,
  currentStep,
  onStepClick,
  isOnline
}) => {
  return (
    <div id="workflow-sidebar" className="lg:col-span-1">
      <InspectionStepsSidebar
        steps={steps}
        currentStep={currentStep}
        onStepClick={onStepClick}
        isOnline={isOnline}
      />
    </div>
  );
};