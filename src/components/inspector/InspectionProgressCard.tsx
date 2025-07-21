/**
 * Inspection Progress Card Component
 * Extracted from ProductionInspectionWorkflow.tsx
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface InspectionProgressCardProps {
  currentStep: 'property-selection' | 'inspection-active' | 'checklist-completion' | 'submission';
}

export const InspectionProgressCard: React.FC<InspectionProgressCardProps> = ({
  currentStep
}) => {
  const steps = ['Property Selection', 'Inspection Setup', 'Checklist Completion', 'Submission'];
  const stepKeys = ['property-selection', 'inspection-active', 'checklist-completion', 'submission'];
  const currentStepIndex = stepKeys.indexOf(currentStep);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Inspection Progress</span>
          <span className="text-sm text-gray-600">
            Step {currentStepIndex + 1} of 4
          </span>
        </div>
        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded ${
                index <= currentStepIndex ? 'bg-blue-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};