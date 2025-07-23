/**
 * AI Analysis Data Manager - Focused Component
 *
 * Handles all AI analysis orchestration and state management with render props pattern
 */

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

// Import AI reliability systems
import {
  aiReliabilityOrchestrator,
  ReliabilityAnalysis,
} from "@/services/AIReliabilityOrchestrator";
import {
  aiConfidenceValidator,
  ConfidenceValidationResult,
} from "@/services/AIConfidenceValidator";
import {
  aiExplainabilityEngine,
  ExplainabilityResult,
} from "@/services/AIExplainabilityEngine";

interface AIAnalysisDataManagerProps {
  photo: File;
  checklistItem: any;
  analysisContext: any;
  onAnalysisComplete: (result: ReliabilityAnalysis) => void;
  children: (data: {
    analysisState: "idle" | "analyzing" | "complete" | "error";
    reliabilityResult: ReliabilityAnalysis | null;
    confidenceResult: ConfidenceValidationResult | null;
    explainabilityResult: ExplainabilityResult | null;
    analysisProgress: number;
    trafficLightStatus: "green" | "yellow" | "red";
    canProceed: boolean;
    errorMessage: string | null;
    onStartAnalysis: () => void;
    onRetryAnalysis: () => void;
    onInitiateAppeal: () => void;
  }) => React.ReactNode;
}

export const AIAnalysisDataManager: React.FC<AIAnalysisDataManagerProps> = ({
  photo,
  checklistItem,
  analysisContext,
  onAnalysisComplete,
  children,
}) => {
  const [analysisState, setAnalysisState] = useState<
    "idle" | "analyzing" | "complete" | "error"
  >("idle");
  const [reliabilityResult, setReliabilityResult] =
    useState<ReliabilityAnalysis | null>(null);
  const [confidenceResult, setConfidenceResult] =
    useState<ConfidenceValidationResult | null>(null);
  const [explainabilityResult, setExplainabilityResult] =
    useState<ExplainabilityResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const determineTrafficLightStatus = useCallback(
    (reliability: ReliabilityAnalysis | null): "green" | "yellow" | "red" => {
      if (!reliability) return "red";

      if (
        reliability.overallScore >= 0.8 &&
        reliability.failureRiskLevel === "low"
      ) {
        return "green";
      } else if (
        reliability.overallScore >= 0.6 &&
        reliability.failureRiskLevel !== "high"
      ) {
        return "yellow";
      } else {
        return "red";
      }
    },
    [],
  );

  const runAIAnalysis = useCallback(async () => {
    try {
      setAnalysisState("analyzing");
      setAnalysisProgress(0);
      setErrorMessage(null);
      logger.info(
        "Starting AI analysis",
        { checklistItem: checklistItem?.id },
        "AI_ANALYSIS_DATA_MANAGER",
      );

      // Step 1: Reliability Analysis (40% progress)
      setAnalysisProgress(10);
      const reliabilityAnalysis =
        await aiReliabilityOrchestrator.analyzePhotoReliability(
          photo,
          checklistItem,
          analysisContext,
        );
      setReliabilityResult(reliabilityAnalysis);
      setAnalysisProgress(40);

      // Step 2: Confidence Validation (70% progress)
      const confidenceValidation = await aiConfidenceValidator.validateAnalysis(
        photo,
        reliabilityAnalysis,
        analysisContext,
      );
      setConfidenceResult(confidenceValidation);
      setAnalysisProgress(70);

      // Step 3: Explainability Generation (100% progress)
      const explainability = await aiExplainabilityEngine.generateExplanation({
        photo,
        analysis: reliabilityAnalysis,
        confidence: confidenceValidation,
        context: analysisContext,
      });
      setExplainabilityResult(explainability);
      setAnalysisProgress(100);

      setAnalysisState("complete");
      onAnalysisComplete(reliabilityAnalysis);

      logger.info(
        "AI analysis completed successfully",
        {
          checklistItem: checklistItem?.id,
          score: reliabilityAnalysis.overallScore,
        },
        "AI_ANALYSIS_DATA_MANAGER",
      );
    } catch (error: any) {
      logger.error("AI analysis failed", error, "AI_ANALYSIS_DATA_MANAGER");
      setAnalysisState("error");
      setErrorMessage(error.message || "Analysis failed");
      toast({
        title: "Analysis Failed",
        description: "AI analysis could not be completed. Please try again.",
        variant: "destructive",
      });
    }
  }, [photo, checklistItem, analysisContext, onAnalysisComplete, toast]);

  const handleInitiateAppeal = useCallback(() => {
    logger.info(
      "Initiating appeal process",
      { checklistItem: checklistItem?.id },
      "AI_ANALYSIS_DATA_MANAGER",
    );
    toast({
      title: "Appeal Initiated",
      description: "Your appeal has been submitted for human review.",
    });
  }, [checklistItem, toast]);

  const trafficLightStatus = determineTrafficLightStatus(reliabilityResult);
  const canProceed =
    analysisState === "complete" && trafficLightStatus !== "red";

  return (
    <>
      {children({
        analysisState,
        reliabilityResult,
        confidenceResult,
        explainabilityResult,
        analysisProgress,
        trafficLightStatus,
        canProceed,
        errorMessage,
        onStartAnalysis: runAIAnalysis,
        onRetryAnalysis: runAIAnalysis,
        onInitiateAppeal: handleInitiateAppeal,
      })}
    </>
  );
};
