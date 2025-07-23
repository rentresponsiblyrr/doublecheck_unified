/**
 * Generation Progress Component
 * Extracted from ChecklistGenerationStep.tsx
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Property } from "@/hooks/useChecklistGeneration";

interface GenerationProgressProps {
  property: Property;
  generationProgress: number;
  generationStage: string;
  className?: string;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  property,
  generationProgress,
  generationStage,
  className = "",
}) => {
  return (
    <Card id="generation-progress" className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Generating AI-Powered Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">
            {generationProgress}%
          </div>
          <Progress value={generationProgress} className="mb-4" />
          <p className="text-sm text-gray-600">{generationStage}</p>
        </div>

        <div className="flex items-center justify-center py-8">
          <LoadingSpinner className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm font-medium">
            Creating customized inspection checklist for:
          </p>
          <p className="text-lg font-semibold text-blue-600">
            {property.property_name}
          </p>
          <p className="text-sm text-gray-600">{property.street_address}</p>
        </div>
      </CardContent>
    </Card>
  );
};
