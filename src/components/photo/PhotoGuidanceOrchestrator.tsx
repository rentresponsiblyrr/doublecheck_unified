import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Camera, 
  CheckCircle, 
  X, 
  AlertTriangle,
  Video,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import type { PropertyData } from '@/types/ai-interfaces';
import type { DynamicChecklistItem } from '@/lib/ai/dynamic-checklist-generator';
import { CameraController } from './CameraController';
import { MediaProcessor } from './MediaProcessor';
import { QualityAnalyzer } from './QualityAnalyzer';
import { UploadManager } from './UploadManager';
import { VideoWalkthroughPrompt } from '@/components/inspection/VideoWalkthroughPrompt';
import { useOptimizedScreenReaderAnnouncements } from '@/hooks/useBatchedScreenReaderAnnouncements';
import { logger } from '@/utils/logger';

interface PhotoGuidanceOrchestratorProps {
  checklistItem: DynamicChecklistItem;
  propertyData: PropertyData;
  inspectionId: string;
  onPhotoComplete: (itemId: string, result: CompletionResult) => void;
  onVideoWalkthroughRequired: () => void;
  onError: (error: Error) => void;
}

import type { AIAnalysisResult, PhotoAnalysis, UploadResult } from '../../types/business-logic';

interface CompletionResult {
  photoUrl: string;
  mediaId: string;
  qualityScore: number;
  aiAnalysis: AIAnalysisResult;
  uploadedAt: string;
}

interface WorkflowState {
  currentStep: 'capture' | 'processing' | 'analysis' | 'upload' | 'complete';
  capturedFile: File | null;
  processedFile: File | null;
  analysisResult: PhotoAnalysis | null;
  uploadResult: UploadResult | null;
  error: string | null;
  isExpanded: boolean;
}

export const PhotoGuidanceOrchestrator: React.FC<PhotoGuidanceOrchestratorProps> = ({
  checklistItem,
  propertyData,
  inspectionId,
  onPhotoComplete,
  onVideoWalkthroughRequired,
  onError
}) => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStep: 'capture',
    capturedFile: null,
    processedFile: null,
    analysisResult: null,
    uploadResult: null,
    error: null,
    isExpanded: true
  });

  const { announceToScreenReader } = useOptimizedScreenReaderAnnouncements();

  // Handle photo capture from camera
  const handlePhotoCapture = useCallback(async (photoBlob: Blob) => {
    try {
      const file = new File([photoBlob], `inspection_${checklistItem.id}_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      setWorkflowState(prev => ({
        ...prev,
        currentStep: 'processing',
        capturedFile: file,
        error: null
      }));

      announceToScreenReader('Photo captured successfully. Processing image...');
      
    } catch (error) {
      logger.error('Photo capture handling failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process captured photo';
      
      setWorkflowState(prev => ({
        ...prev,
        error: errorMessage
      }));
      
      onError(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [checklistItem.id, announceToScreenReader, onError]);

  // Handle file processing completion
  const handleFileProcessed = useCallback(async (processedFile: File) => {
    try {
      setWorkflowState(prev => ({
        ...prev,
        currentStep: 'analysis',
        processedFile,
        error: null
      }));

      announceToScreenReader('Image processed successfully. Running quality analysis...');
      
    } catch (error) {
      logger.error('File processing handling failed:', error);
      onError(error instanceof Error ? error : new Error('Failed to handle processed file'));
    }
  }, [announceToScreenReader, onError]);

  // Handle analysis completion
  const handleAnalysisComplete = useCallback((analysisResult: any) => {
    try {
      setWorkflowState(prev => ({
        ...prev,
        currentStep: 'upload',
        analysisResult,
        error: null
      }));

      announceToScreenReader(`Analysis complete. Quality score: ${analysisResult.qualityScore}%. Starting upload...`);
      
    } catch (error) {
      logger.error('Analysis completion handling failed:', error);
      onError(error instanceof Error ? error : new Error('Failed to handle analysis results'));
    }
  }, [announceToScreenReader, onError]);

  // Handle upload completion
  const handleUploadComplete = useCallback((itemId: string, uploadResult: any) => {
    try {
      setWorkflowState(prev => ({
        ...prev,
        currentStep: 'complete',
        uploadResult,
        error: null
      }));

      const completionResult: CompletionResult = {
        photoUrl: uploadResult.url,
        mediaId: uploadResult.mediaId,
        qualityScore: workflowState.analysisResult?.qualityScore || 0,
        aiAnalysis: workflowState.analysisResult?.aiAnalysis,
        uploadedAt: uploadResult.uploadedAt
      };

      announceToScreenReader('Photo upload complete. Inspection item updated.');
      onPhotoComplete(itemId, completionResult);
      
    } catch (error) {
      logger.error('Upload completion handling failed:', error);
      onError(error instanceof Error ? error : new Error('Failed to handle upload completion'));
    }
  }, [workflowState.analysisResult, announceToScreenReader, onPhotoComplete, onError]);

  // Handle various error scenarios
  const handleCameraError = useCallback((error: Error) => {
    setWorkflowState(prev => ({
      ...prev,
      error: `Camera error: ${error.message}`
    }));
    onError(error);
  }, [onError]);

  const handleProcessingError = useCallback((error: Error) => {
    setWorkflowState(prev => ({
      ...prev,
      error: `Processing error: ${error.message}`
    }));
    onError(error);
  }, [onError]);

  const handleAnalysisError = useCallback((error: Error) => {
    setWorkflowState(prev => ({
      ...prev,
      error: `Analysis error: ${error.message}`
    }));
    onError(error);
  }, [onError]);

  const handleUploadError = useCallback((error: Error) => {
    setWorkflowState(prev => ({
      ...prev,
      error: `Upload error: ${error.message}`
    }));
    onError(error);
  }, [onError]);

  // Reset workflow to start over
  const resetWorkflow = useCallback(() => {
    setWorkflowState({
      currentStep: 'capture',
      capturedFile: null,
      processedFile: null,
      analysisResult: null,
      uploadResult: null,
      error: null,
      isExpanded: true
    });
    announceToScreenReader('Photo workflow reset. Ready to capture new photo.');
  }, [announceToScreenReader]);

  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setWorkflowState(prev => ({
      ...prev,
      isExpanded: !prev.isExpanded
    }));
  }, []);

  const getStepStatus = (step: WorkflowState['currentStep']) => {
    const currentStepIndex = ['capture', 'processing', 'analysis', 'upload', 'complete'].indexOf(workflowState.currentStep);
    const stepIndex = ['capture', 'processing', 'analysis', 'upload', 'complete'].indexOf(step);
    
    if (stepIndex < currentStepIndex) return 'complete';
    if (stepIndex === currentStepIndex) return 'active';
    return 'pending';
  };

  const getStepBadgeVariant = (status: string) => {
    switch (status) {
      case 'complete': return 'default';
      case 'active': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              {checklistItem.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {checklistItem.description}
            </CardDescription>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={workflowState.isExpanded ? 'Collapse section' : 'Expand section'}
          >
            {workflowState.isExpanded ? 
              <ChevronUp className="h-4 w-4" /> : 
              <ChevronDown className="h-4 w-4" />
            }
          </Button>
        </div>

        {/* Workflow Progress */}
        <div className="flex space-x-2 mt-3">
          {['capture', 'processing', 'analysis', 'upload', 'complete'].map((step) => (
            <Badge 
              key={step} 
              variant={getStepBadgeVariant(getStepStatus(step))}
              className="text-xs"
            >
              {step === 'capture' && 'Capture'}
              {step === 'processing' && 'Process'}
              {step === 'analysis' && 'Analyze'}
              {step === 'upload' && 'Upload'}
              {step === 'complete' && 'Complete'}
            </Badge>
          ))}
        </div>
      </CardHeader>

      {workflowState.isExpanded && (
        <CardContent className="space-y-6">
          {/* AI Guidance */}
          {checklistItem.gpt_prompt && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>AI Guidance</AlertTitle>
              <AlertDescription className="mt-2">
                {checklistItem.gpt_prompt}
              </AlertDescription>
            </Alert>
          )}

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
              onPhotoCapture={handlePhotoCapture}
              onCameraError={handleCameraError}
              isEnabled={true}
            />
          )}

          {/* Step 2: Media Processing */}
          {workflowState.currentStep === 'processing' && workflowState.capturedFile && (
            <MediaProcessor
              file={workflowState.capturedFile}
              onFileProcessed={handleFileProcessed}
              onProcessingError={handleProcessingError}
            />
          )}

          {/* Step 3: Quality Analysis */}
          {workflowState.currentStep === 'analysis' && workflowState.processedFile && (
            <QualityAnalyzer
              file={workflowState.processedFile}
              checklistItem={checklistItem}
              propertyData={propertyData}
              onAnalysisComplete={handleAnalysisComplete}
              onAnalysisError={handleAnalysisError}
            />
          )}

          {/* Step 4: Upload */}
          {workflowState.currentStep === 'upload' && workflowState.processedFile && (
            <UploadManager
              file={workflowState.processedFile}
              inspectionId={inspectionId}
              checklistItemId={checklistItem.id}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
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
        </CardContent>
      )}
    </Card>
  );
};

PhotoGuidanceOrchestrator.displayName = 'PhotoGuidanceOrchestrator';

export default PhotoGuidanceOrchestrator;