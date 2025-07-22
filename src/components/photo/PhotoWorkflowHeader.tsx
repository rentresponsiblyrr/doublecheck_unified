/**
 * Photo Workflow Header - Enterprise Grade
 * 
 * Header component displaying checklist item info and workflow progress
 */

import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { DynamicChecklistItem } from '@/lib/ai/dynamic-checklist-generator';

interface WorkflowState {
  currentStep: 'capture' | 'processing' | 'analysis' | 'upload' | 'complete';
  capturedFile: File | null;
  processedFile: File | null;
  analysisResult: any | null;
  uploadResult: any | null;
  error: string | null;
  isExpanded: boolean;
}

interface PhotoWorkflowHeaderProps {
  checklistItem: DynamicChecklistItem;
  workflowState: WorkflowState;
  onToggleExpanded: () => void;
  getStepStatus: (step: WorkflowState['currentStep']) => string;
  getStepBadgeVariant: (status: string) => 'default' | 'secondary' | 'outline';
}

export const PhotoWorkflowHeader: React.FC<PhotoWorkflowHeaderProps> = ({
  checklistItem,
  workflowState,
  onToggleExpanded,
  getStepStatus,
  getStepBadgeVariant
}) => {
  return (
    <>
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
            onClick={onToggleExpanded}
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
              variant={getStepBadgeVariant(getStepStatus(step as WorkflowState['currentStep']))}
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

      {/* AI Guidance - Show when expanded */}
      {workflowState.isExpanded && checklistItem.gpt_prompt && (
        <div className="px-6 pb-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>AI Guidance</AlertTitle>
            <AlertDescription className="mt-2">
              {checklistItem.gpt_prompt}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};