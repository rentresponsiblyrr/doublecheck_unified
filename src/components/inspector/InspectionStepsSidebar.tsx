/**
 * PROFESSIONAL COMPONENT - SINGLE RESPONSIBILITY PRINCIPLE
 * Inspection Steps Sidebar - Does ONE thing well
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface InspectionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  required: boolean;
  data?: unknown;
}

interface InspectionStepsSidebarProps {
  steps: InspectionStep[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

export function InspectionStepsSidebar({
  steps,
  currentStep,
  onStepClick
}: InspectionStepsSidebarProps) {
  const getStepIcon = (step: InspectionStep, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (step.status === 'in_progress' || currentStep === index) {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
    if (step.status === 'error') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
  };

  const getStepClasses = (step: InspectionStep, index: number) => {
    const baseClasses = "p-3 rounded-lg border cursor-pointer transition-colors";
    
    if (currentStep === index) {
      return `${baseClasses} border-blue-500 bg-blue-50 dark:bg-blue-900/20`;
    }
    if (step.status === 'completed') {
      return `${baseClasses} border-green-500 bg-green-50 dark:bg-green-900/20`;
    }
    if (step.status === 'error') {
      return `${baseClasses} border-red-500 bg-red-50 dark:bg-red-900/20`;
    }
    return `${baseClasses} border-gray-200 hover:border-gray-300`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Inspection Steps</CardTitle>
        <CardDescription>
          Complete each step to finish the inspection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={getStepClasses(step, index)}
            onClick={() => onStepClick(index)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStepIcon(step, index)}
                <span className="text-sm font-medium">{step.title}</span>
              </div>
              {step.required && (
                <Badge variant="secondary" className="text-xs">Required</Badge>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1 ml-6">
              {step.description}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}