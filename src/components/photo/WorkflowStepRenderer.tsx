/**
 * Workflow Step Renderer - Enterprise Grade
 * 
 * Renders different workflow steps with proper error handling and state management
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Video } from 'lucide-react';
import { CameraController } from './CameraController';
import { MediaProcessor } from './MediaProcessor';
import { QualityAnalyzer } from './QualityAnalyzer';
import { UploadManager } from './UploadManager';
import { VideoWalkthroughPrompt } from '@/components/inspection/VideoWalkthroughPrompt';
import type { PropertyData } from '@/types/ai-interfaces';
import type { DynamicChecklistItem } from '@/lib/ai/dynamic-checklist-generator';
import type { PhotoAnalysis, UploadResult } from '../../types/business-logic';

interface WorkflowState {
  currentStep: 'capture' | 'processing' | 'analysis' | 'upload' | 'complete';
  capturedFile: File | null;
  processedFile: File | null;
  analysisResult: PhotoAnalysis | null;
  uploadResult: UploadResult | null;
  error: string | null;
  isExpanded: boolean;
}

interface WorkflowStepRendererProps {
  workflowState: WorkflowState;
  checklistItem: DynamicChecklistItem;
  propertyData: PropertyData;
  inspectionId: string;
  onPhotoCapture: (photoBlob: Blob) => Promise<void>;
  onFileProcessed: (processedFile: File) => Promise<void>;
  onAnalysisComplete: (analysisResult: PhotoAnalysis) => void;
  onUploadComplete: (itemId: string, uploadResult: any) => void;
  onCameraError: (error: Error) => void;
  onProcessingError: (error: Error) => void;
  onAnalysisError: (error: Error) => void;
  onUploadError: (error: Error) => void;
  onVideoWalkthroughRequired: () => void;
  resetWorkflow: () => void;
}

export const WorkflowStepRenderer: React.FC<WorkflowStepRendererProps> = ({
  workflowState,
  checklistItem,
  propertyData,
  inspectionId,
  onPhotoCapture,
  onFileProcessed,
  onAnalysisComplete,
  onUploadComplete,
  onCameraError,
  onProcessingError,
  onAnalysisError,
  onUploadError,
  onVideoWalkthroughRequired,
  resetWorkflow
}) => {
  if (!workflowState.isExpanded) {
    return null;
  }

  return (
    <div id="workflow-step-renderer" className="space-y-6">
      {/* Error Display */}
      {workflowState.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>{workflowState.error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={resetWorkflow}
                className="focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Start Over
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Camera Capture */}
      {workflowState.currentStep === 'capture' && (
        <CameraController
          onPhotoCapture={onPhotoCapture}
          onCameraError={onCameraError}
          isEnabled={true}
        />
      )}

      {/* Step 2: Media Processing */}
      {workflowState.currentStep === 'processing' && workflowState.capturedFile && (
        <MediaProcessor
          file={workflowState.capturedFile}
          onFileProcessed={onFileProcessed}
          onProcessingError={onProcessingError}
        />
      )}

      {/* Step 3: Quality Analysis */}
      {workflowState.currentStep === 'analysis' && workflowState.processedFile && (
        <QualityAnalyzer
          file={workflowState.processedFile}
          checklistItem={checklistItem}
          propertyData={propertyData}
          onAnalysisComplete={onAnalysisComplete}
          onAnalysisError={onAnalysisError}
        />
      )}

      {/* Step 4: Upload */}
      {workflowState.currentStep === 'upload' && workflowState.processedFile && (
        <UploadManager
          file={workflowState.processedFile}
          inspectionId={inspectionId}
          checklistItemId={checklistItem.id}
          onUploadComplete={onUploadComplete}
          onUploadError={onUploadError}
        />
      )}

      {/* Step 5: Completion */}
      {workflowState.currentStep === 'complete' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-medium">Photo inspection completed successfully!</p>
              {workflowState.analysisResult && (
                <p className="text-sm">
                  Quality Score: {workflowState.analysisResult.qualityScore}% | 
                  Confidence: {Math.round(workflowState.analysisResult.confidence * 100)}%
                </p>
              )}
              <div className="flex space-x-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetWorkflow}
                  className="focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Take Another Photo
                </Button>
                {checklistItem.evidence_type?.includes('video') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onVideoWalkthroughRequired}
                    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Video className="h-4 w-4 mr-1" />
                    Record Video
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Video Walkthrough Integration */}
      {checklistItem.evidence_type?.includes('video') && workflowState.currentStep === 'complete' && (
        <VideoWalkthroughPrompt
          checklistItem={checklistItem}
          onComplete={onVideoWalkthroughRequired}
        />
      )}
    </div>
  );
};