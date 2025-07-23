/**
 * Checklist Generation Step - Surgically Refactored
 * Decomposed from 433→<300 lines using component composition
 * Business logic extracted to useChecklistGeneration hook
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  useChecklistGeneration,
  Property,
  ChecklistItem,
} from "@/hooks/useChecklistGeneration";
import { GenerationProgress } from "./checklist/GenerationProgress";
import { TemplateSelector } from "./checklist/TemplateSelector";
import { ChecklistPreview } from "./checklist/ChecklistPreview";
import { GenerationControls } from "./checklist/GenerationControls";

interface ChecklistGenerationStepProps {
  property: Property;
  onChecklistGenerated: (checklist: ChecklistItem[]) => void;
  generatedChecklist?: ChecklistItem[];
  className?: string;
}

const ChecklistGenerationStep: React.FC<ChecklistGenerationStepProps> = ({
  property,
  onChecklistGenerated,
  generatedChecklist,
  className = "",
}) => {
  const {
    // State
    isGenerating,
    generationProgress,
    generationStage,
    staticItems,
    aiItems,
    totalItems,

    // Actions
    handleRegenerateChecklist,

    // Utilities
    getCategoryColor,
  } = useChecklistGeneration({
    property,
    generatedChecklist,
    onChecklistGenerated,
  });

  if (isGenerating) {
    return (
      <GenerationProgress
        property={property}
        generationProgress={generationProgress}
        generationStage={generationStage}
        className={className}
      />
    );
  }

  return (
    <Card id="checklist-generation-step" className={className}>
      <TemplateSelector
        property={property}
        onRegenerate={handleRegenerateChecklist}
      />

      <CardContent className="space-y-6">
        <ChecklistPreview
          staticItems={staticItems}
          aiItems={aiItems}
          totalItems={totalItems}
          getCategoryColor={getCategoryColor}
        />

        <GenerationControls totalItems={totalItems} aiItems={aiItems} />
      </CardContent>
    </Card>
  );
};

export default ChecklistGenerationStep;
export { ChecklistGenerationStep };
