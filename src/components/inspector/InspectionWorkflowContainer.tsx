/**
 * Inspection Workflow Container - Surgically Refactored
 * Decomposed from 462→<300 lines using component composition
 * Business logic extracted to useInspectionWorkflow hook
 */

import React from "react";
import { useInspectionWorkflow } from "@/hooks/useInspectionWorkflow";
import { WorkflowErrorBoundary } from "./WorkflowErrorBoundary";
import { WorkflowSidebar } from "./WorkflowSidebar";
import { WorkflowActions } from "./WorkflowActions";
import { WorkflowStepContent } from "./WorkflowStepContent";

export const InspectionWorkflowContainer: React.FC = () => {
  const {
    // State
    state,
    dispatch,
    isOnline,
    error,

    // Actions
    handleSafeReturn,
    handlePropertySelect,
    handleChecklistGenerated,
    handleStepNavigation,
    clearError,

    // Navigation
    navigate,
  } = useInspectionWorkflow();

  // Professional Error Boundary
  if (error) {
    return (
      <WorkflowErrorBoundary
        error={error}
        onClearError={clearError}
        onSafeReturn={handleSafeReturn}
      />
    );
  }

  return (
    <div id="inspection-workflow-container" className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <WorkflowSidebar
            steps={state.inspectionSteps}
            currentStep={state.currentStep}
            onStepClick={(stepIndex) =>
              dispatch({ type: "SET_CURRENT_STEP", payload: stepIndex })
            }
            isOnline={isOnline}
          />

          <div className="lg:col-span-3">
            <div className="space-y-6">
              <WorkflowActions state={state} onSafeReturn={handleSafeReturn} />

              <WorkflowStepContent
                state={state}
                error={error}
                onPropertySelect={handlePropertySelect}
                onChecklistGenerated={handleChecklistGenerated}
                onStepNavigation={handleStepNavigation}
                navigate={navigate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InspectionWorkflowContainer;
