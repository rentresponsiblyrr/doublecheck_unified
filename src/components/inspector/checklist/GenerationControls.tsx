/**
 * Generation Controls Component
 * Extracted from ChecklistGenerationStep.tsx
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Zap } from 'lucide-react';

interface GenerationControlsProps {
  totalItems: number;
  aiItems: { length: number };
}

export const GenerationControls: React.FC<GenerationControlsProps> = ({
  totalItems,
  aiItems
}) => {
  return (
    <div id="generation-controls" className="space-y-6">
      {/* Generation Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">AI Enhancement Details</span>
        </div>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Analyzed property type and location characteristics</p>
          <p>• Added {aiItems.length} property-specific inspection items</p>
          <p>• Optimized checklist for maximum coverage and efficiency</p>
        </div>
      </div>

      {/* Action Button */}
      <Button className="w-full" size="lg">
        <ArrowRight className="w-4 h-4 mr-2" />
        Begin Inspection with This Checklist
      </Button>

      {/* Timing Info */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>Estimated inspection time: {Math.ceil(totalItems * 2.5)} minutes</span>
      </div>
    </div>
  );
};