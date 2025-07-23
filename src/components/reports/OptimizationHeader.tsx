import React from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Download } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface OptimizationHeaderProps {
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
}

export const OptimizationHeader: React.FC<OptimizationHeaderProps> = ({
  onGenerateReport,
  isGeneratingReport,
}) => (
  <CardHeader id="optimization-header">
    <div className="flex items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5" />
        Listing Optimization Suggestions
      </CardTitle>
      <Button
        variant="outline"
        size="sm"
        onClick={onGenerateReport}
        disabled={isGeneratingReport}
      >
        {isGeneratingReport ? (
          <>
            <LoadingSpinner className="w-4 h-4 mr-2" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </>
        )}
      </Button>
    </div>
  </CardHeader>
);
