/**
 * Photo Workflow Data Manager - Enterprise Grade
 * 
 * Handles photo workflow state management and data operations
 * following enterprise render props pattern for clean component separation
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { PropertyData } from '@/types/ai-interfaces';
import type { DynamicChecklistItem } from '@/lib/ai/dynamic-checklist-generator';
import type { AIAnalysisResult, PhotoAnalysis, UploadResult } from '../../types/business-logic';
import { logger } from '@/utils/logger';
import { useOptimizedScreenReaderAnnouncements } from '@/hooks/useBatchedScreenReaderAnnouncements';

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

interface PhotoWorkflowManagerProps {
  checklistItem: DynamicChecklistItem;
  propertyData: PropertyData;
  inspectionId: string;
  onPhotoComplete: (itemId: string, result: CompletionResult) => void;
  onVideoWalkthroughRequired: () => void;
  onError: (error: Error) => void;
  children: (workflowData: {
    workflowState: WorkflowState;
    isLoading: boolean;
    error: string | null;
    onPhotoCapture: (photoBlob: Blob) => Promise<void>;
    onFileProcessed: (processedFile: File) => Promise<void>;
    onAnalysisComplete: (analysisResult: PhotoAnalysis) => void;
    onUploadComplete: (itemId: string, uploadResult: any) => void;
    onCameraError: (error: Error) => void;
    onProcessingError: (error: Error) => void;
    onAnalysisError: (error: Error) => void;
    onUploadError: (error: Error) => void;
    resetWorkflow: () => void;
    toggleExpanded: () => void;
    getStepStatus: (step: WorkflowState['currentStep']) => string;
    getStepBadgeVariant: (status: string) => 'default' | 'secondary' | 'outline';
  }) => React.ReactNode;
}

export const PhotoWorkflowManager: React.FC<PhotoWorkflowManagerProps> = ({
  checklistItem,
  propertyData,
  inspectionId,
  onPhotoComplete,
  onVideoWalkthroughRequired,
  onError,
  children
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

  const [isLoading, setIsLoading] = useState(false);
  const { announceToScreenReader } = useOptimizedScreenReaderAnnouncements();
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle photo capture from camera
  const handlePhotoCapture = useCallback(async (photoBlob: Blob) => {
    if (!mountedRef.current) return;
    
    try {
      setIsLoading(true);
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
      
      if (mountedRef.current) {
        setWorkflowState(prev => ({
          ...prev,
          error: errorMessage
        }));
      }
      
      onError(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [checklistItem.id, announceToScreenReader, onError]);

  // Handle file processing completion
  const handleFileProcessed = useCallback(async (processedFile: File) => {
    if (!mountedRef.current) return;
    
    try {
      setIsLoading(true);
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
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [announceToScreenReader, onError]);

  // Handle analysis completion
  const handleAnalysisComplete = useCallback((analysisResult: PhotoAnalysis) => {
    if (!mountedRef.current) return;
    
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
    if (!mountedRef.current) return;
    
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

  // Error handlers
  const handleCameraError = useCallback((error: Error) => {
    if (!mountedRef.current) return;
    setWorkflowState(prev => ({
      ...prev,
      error: `Camera error: ${error.message}`
    }));
    onError(error);
  }, [onError]);

  const handleProcessingError = useCallback((error: Error) => {
    if (!mountedRef.current) return;
    setWorkflowState(prev => ({
      ...prev,
      error: `Processing error: ${error.message}`
    }));
    onError(error);
  }, [onError]);

  const handleAnalysisError = useCallback((error: Error) => {
    if (!mountedRef.current) return;
    setWorkflowState(prev => ({
      ...prev,
      error: `Analysis error: ${error.message}`
    }));
    onError(error);
  }, [onError]);

  const handleUploadError = useCallback((error: Error) => {
    if (!mountedRef.current) return;
    setWorkflowState(prev => ({
      ...prev,
      error: `Upload error: ${error.message}`
    }));
    onError(error);
  }, [onError]);

  // Reset workflow to start over
  const resetWorkflow = useCallback(() => {
    if (!mountedRef.current) return;
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
    if (!mountedRef.current) return;
    setWorkflowState(prev => ({
      ...prev,
      isExpanded: !prev.isExpanded
    }));
  }, []);

  const getStepStatus = useCallback((step: WorkflowState['currentStep']) => {
    const currentStepIndex = ['capture', 'processing', 'analysis', 'upload', 'complete'].indexOf(workflowState.currentStep);
    const stepIndex = ['capture', 'processing', 'analysis', 'upload', 'complete'].indexOf(step);
    
    if (stepIndex < currentStepIndex) return 'complete';
    if (stepIndex === currentStepIndex) return 'active';
    return 'pending';
  }, [workflowState.currentStep]);

  const getStepBadgeVariant = useCallback((status: string): 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'complete': return 'default';
      case 'active': return 'secondary';
      default: return 'outline';
    }
  }, []);

  return (
    <>
      {children({
        workflowState,
        isLoading,
        error: workflowState.error,
        onPhotoCapture: handlePhotoCapture,
        onFileProcessed: handleFileProcessed,
        onAnalysisComplete: handleAnalysisComplete,
        onUploadComplete: handleUploadComplete,
        onCameraError: handleCameraError,
        onProcessingError: handleProcessingError,
        onAnalysisError: handleAnalysisError,
        onUploadError: handleUploadError,
        resetWorkflow,
        toggleExpanded,
        getStepStatus,
        getStepBadgeVariant
      })}
    </>
  );
};