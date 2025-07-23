/**
 * Template Selector Component
 * Extracted from ChecklistGenerationStep.tsx
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, FileText } from "lucide-react";
import { Property } from "@/hooks/useChecklistGeneration";

interface TemplateSelectorProps {
  property: Property;
  onRegenerate: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  property,
  onRegenerate,
}) => {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Inspection Checklist Generated
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onRegenerate}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
      </div>
      <div className="text-sm text-gray-600">
        Customized checklist for {property.property_name}
      </div>
    </CardHeader>
  );
};
