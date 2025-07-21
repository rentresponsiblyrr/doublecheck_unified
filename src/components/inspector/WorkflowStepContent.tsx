/**
 * Workflow Step Content Component
 * Extracted from InspectionWorkflowContainer.tsx
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { PropertySelectionStep } from './PropertySelectionStep';
import { ChecklistGenerationStep } from './ChecklistGenerationStep';
import { PhotoCaptureStep } from './PhotoCaptureStep';
import { VideoRecordingStep } from './VideoRecordingStep';
import { UploadSyncStep } from './UploadSyncStep';
import { WorkflowState, Property, ChecklistData } from '@/hooks/useInspectionWorkflow';

interface WorkflowStepContentProps {
  state: WorkflowState;
  error: Error | null;
  onPropertySelect: (property: Property) => Promise<void>;
  onChecklistGenerated: (checklist: ChecklistData) => Promise<void>;
  onStepNavigation: (direction: 'next' | 'back') => void;
  navigate: (path: string) => void;
}

export const WorkflowStepContent: React.FC<WorkflowStepContentProps> = ({
  state,
  error,
  onPropertySelect,
  onChecklistGenerated,
  onStepNavigation,
  navigate
}) => {
  const currentStepData = state.inspectionSteps[state.currentStep];
  
  switch (currentStepData?.id) {
    case 'property_selection':
      return (
        <PropertySelectionStep
          selectedProperty={state.selectedProperty}
          onPropertySelect={onPropertySelect}
          onNext={() => onStepNavigation('next')}
          error={error}
        />
      );
    
    case 'checklist_generation':
      return state.selectedProperty ? (
        <ChecklistGenerationStep
          property={state.selectedProperty}
          generatedChecklist={state.generatedChecklist}
          onChecklistGenerated={onChecklistGenerated}
          onNext={() => onStepNavigation('next')}
          onBack={() => onStepNavigation('back')}
          isGenerating={state.isGeneratingChecklist}
          error={error}
        />
      ) : null;
    
    case 'photo_capture':
      return state.selectedProperty && state.generatedChecklist ? (
        <PhotoCaptureStep
          property={state.selectedProperty}
          checklist={state.generatedChecklist}
          inspectionId={state.currentInspectionId}
          onPhotoCapture={async () => ({ photo: new File([], ''), analysis: { score: 0, issues: [], suggestions: [] } })}
          onAllPhotosComplete={() => onStepNavigation('next')}
          onPhotoStored={() => {}}
        />
      ) : null;
    
    case 'video_walkthrough':
      return state.selectedProperty ? (
        <VideoRecordingStep
          propertyId={state.selectedProperty.id}
          isRecording={state.isRecording}
          onStartRecording={() => {}}
          onStopRecording={() => {}}
        />
      ) : null;
    
    case 'offline_sync':
      return (
        <UploadSyncStep
          inspectionData={state.inspectionSteps}
          propertyId={state.selectedProperty?.id || ''}
          progress={state.syncProgress}
          onSyncComplete={() => navigate('/properties')}
        />
      );
    
    default:
      return (
        <Alert id="unknown-step-alert" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unknown Step</AlertTitle>
          <AlertDescription>
            The current step "{currentStepData?.id}" is not recognized.
          </AlertDescription>
        </Alert>
      );
  }
};