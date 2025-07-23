import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { OptimizationHeader } from "./OptimizationHeader";
import { OptimizationScore } from "./OptimizationScore";
import { SuggestionTabs } from "./SuggestionTabs";
import { OptimizationService } from "./optimizationService";
import { OptimizationSuggestion, ListingScore } from "./types";

interface ListingOptimizationSuggestionsProps {
  propertyId: string;
  className?: string;
}

export const ListingOptimizationSuggestions: React.FC<
  ListingOptimizationSuggestionsProps
> = ({ propertyId, className = "" }) => {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [score, setScore] = useState<ListingScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOptimizationData();
  }, [propertyId]);

  const loadOptimizationData = async () => {
    try {
      setIsLoading(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const generatedSuggestions =
        OptimizationService.generateSuggestions(propertyId);
      const calculatedScore = OptimizationService.calculateScore(propertyId);

      setSuggestions(generatedSuggestions);
      setScore(calculatedScore);

      logger.logInfo("Optimization suggestions loaded", {
        propertyId,
        suggestionCount: generatedSuggestions.length,
        overallScore: calculatedScore.overall,
      });
    } catch (error) {
      logger.logError("Failed to load optimization suggestions", {
        propertyId,
        error,
      });
      toast({
        title: "Error",
        description:
          "Failed to load optimization suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);

      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Report Generated",
        description: "Optimization report has been generated and saved.",
      });

      logger.logInfo("Optimization report generated", { propertyId });
    } catch (error) {
      logger.logError("Failed to generate report", { propertyId, error });
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading || !score) {
    return (
      <Card className={className}>
        <OptimizationHeader
          onGenerateReport={handleGenerateReport}
          isGeneratingReport={isGeneratingReport}
        />
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="listing-optimization-suggestions" className={className}>
      <OptimizationHeader
        onGenerateReport={handleGenerateReport}
        isGeneratingReport={isGeneratingReport}
      />

      <CardContent className="space-y-6">
        <OptimizationScore score={score} />
        <SuggestionTabs suggestions={suggestions} />

        <div className="mt-6 pt-4 border-t text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>
              Suggestions generated based on inspection results and industry
              best practices.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ListingOptimizationSuggestions;
