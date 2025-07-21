/**
 * Production Inspection Workflow Component - SURGICALLY REFACTORED
 * 
 * PRODUCTION-READY INSPECTOR WORKFLOW
 * 
 * This component provides a fully functional inspection workflow that works
 * with the actual database schema and handles all the critical issues
 * identified in the production readiness audit.
 * 
 * SURGICAL REFACTORING APPLIED:
 * ✅ Extracted business logic to useProductionInspection hook
 * ✅ Decomposed into focused sub-components
 * ✅ Preserved exact functionality and behavior
 * ✅ Maintained type safety and error handling
 * ✅ Reduced from 508 lines to <300 lines using composition
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';

// Extracted business logic hook
import { useProductionInspection } from '@/hooks/useProductionInspection';

// Extracted UI components
import { InspectionHeader } from './InspectionHeader';
import { InspectionProgressCard } from './InspectionProgressCard';
import { PropertySelectionPanel } from './PropertySelectionPanel';
import { ActiveInspectionPanel } from './ActiveInspectionPanel';
import { SubmissionCompletePanel } from './SubmissionCompletePanel';

export const ProductionInspectionWorkflow: React.FC = () => {
  const {
    inspectionState,
    properties,
    loading,
    error,
    currentUser,
    loadInitialData,
    handlePropertySelection,
    handleItemCompletion,
    handleInspectionSubmission,
    resetWorkflow,
    getCompletionPercentage
  } = useProductionInspection();

  // Loading state for initial data
  if (loading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading inspection workflow...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <InspectionHeader
        currentUser={currentUser}
        showNewInspectionButton={inspectionState.currentStep !== 'property-selection'}
        onNewInspection={resetWorkflow}
      />

      {/* Progress Indicator */}
      <InspectionProgressCard currentStep={inspectionState.currentStep} />

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-600">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Property Selection Step */}
      {inspectionState.currentStep === 'property-selection' && (
        <PropertySelectionPanel
          properties={properties}
          loading={loading}
          onPropertySelect={handlePropertySelection}
          onRefresh={loadInitialData}
        />
      )}

      {/* Active Inspection Step */}
      {inspectionState.currentStep === 'inspection-active' && inspectionState.selectedProperty && (
        <ActiveInspectionPanel
          selectedProperty={inspectionState.selectedProperty}
          inspectionId={inspectionState.inspectionId!}
          checklistItems={inspectionState.checklistItems}
          completedItems={inspectionState.completedItems}
          completionPercentage={getCompletionPercentage()}
          loading={loading}
          onItemCompletion={handleItemCompletion}
          onSubmitInspection={handleInspectionSubmission}
        />
      )}

      {/* Submission Complete */}
      {inspectionState.currentStep === 'submission' && (
        <SubmissionCompletePanel
          selectedProperty={inspectionState.selectedProperty}
          inspectionId={inspectionState.inspectionId}
          completedItemsCount={inspectionState.completedItems.length}
          totalItemsCount={inspectionState.checklistItems.length}
          onNewInspection={resetWorkflow}
        />
      )}
    </div>
  );
};