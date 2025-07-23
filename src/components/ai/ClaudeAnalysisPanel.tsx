import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PhotoAnalysisSection } from "./claude/PhotoAnalysisSection";
import { TextGenerationSection } from "./claude/TextGenerationSection";
import { CodeReviewSection } from "./claude/CodeReviewSection";
import { ResultsDisplay } from "./claude/ResultsDisplay";

interface ClaudeAnalysisResult {
  confidence: number;
  issues: Array<{
    severity: "low" | "medium" | "high";
    description: string;
    location?: string;
    suggestions: string[];
  }>;
  recommendations: string[];
  processingTime: number;
  status: "success" | "error" | "processing";
}

interface ClaudeTextResult {
  text: string;
  metadata?: Record<string, unknown>;
  processingTime: number;
}

interface ClaudeCodeReview {
  overallRating: number;
  issues: Array<{
    severity: "low" | "medium" | "high" | "critical";
    category:
      | "security"
      | "performance"
      | "accessibility"
      | "type-safety"
      | "style";
    description: string;
    line?: number;
    suggestion?: string;
  }>;
  summary: string;
  processingTime: number;
}

type ClaudeResult = ClaudeAnalysisResult | ClaudeTextResult | ClaudeCodeReview;

interface ClaudeAnalysisPanelProps {
  inspectionId?: string;
  checklistItemId?: string;
  onAnalysisComplete?: (result: ClaudeResult) => void;
}

export function ClaudeAnalysisPanel({
  inspectionId,
  checklistItemId,
  onAnalysisComplete,
}: ClaudeAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<"photo" | "text" | "code">(
    "photo",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ClaudeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setResult(null);
  }, []);

  const handleAnalysisComplete = useCallback(
    (analysisResult: ClaudeResult) => {
      setResult(analysisResult);
      setIsLoading(false);
      onAnalysisComplete?.(analysisResult);
    },
    [onAnalysisComplete],
  );

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  const tabs = [
    { id: "photo" as const, label: "Photo Analysis" },
    { id: "text" as const, label: "Text Generation" },
    { id: "code" as const, label: "Code Review" },
  ];

  return (
    <div id="claude-analysis-panel" className="space-y-6">
      <div className="flex space-x-1 border-b">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            className="px-4 py-2"
            onClick={() => setActiveTab(tab.id)}
            id={`tab-${tab.id}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div id="tab-content">
        {activeTab === "photo" && (
          <PhotoAnalysisSection
            inspectionId={inspectionId}
            checklistItemId={checklistItemId}
            isLoading={isLoading}
            error={error}
            result={result as ClaudeAnalysisResult}
            onAnalysisStart={handleAnalysisStart}
            onAnalysisComplete={handleAnalysisComplete}
            onError={handleError}
          />
        )}

        {activeTab === "text" && (
          <TextGenerationSection
            isLoading={isLoading}
            error={error}
            result={result as ClaudeTextResult}
            onGenerationStart={handleAnalysisStart}
            onGenerationComplete={handleAnalysisComplete}
            onError={handleError}
          />
        )}

        {activeTab === "code" && (
          <CodeReviewSection
            isLoading={isLoading}
            error={error}
            result={result as ClaudeCodeReview}
            onReviewStart={handleAnalysisStart}
            onReviewComplete={handleAnalysisComplete}
            onError={handleError}
          />
        )}
      </div>

      <ResultsDisplay result={result} activeTab={activeTab} />
    </div>
  );
}
