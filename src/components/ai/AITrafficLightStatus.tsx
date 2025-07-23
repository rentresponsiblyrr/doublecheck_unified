/**
 * AI Traffic Light Status - Focused Component
 *
 * Displays decision confidence with traffic light system (Green/Yellow/Red)
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { ReliabilityAnalysis } from "@/services/AIReliabilityOrchestrator";

interface AITrafficLightStatusProps {
  status: "green" | "yellow" | "red";
  reliabilityResult: ReliabilityAnalysis | null;
  analysisState: "idle" | "analyzing" | "complete" | "error";
  className?: string;
}

export const AITrafficLightStatus: React.FC<AITrafficLightStatusProps> = ({
  status,
  reliabilityResult,
  analysisState,
  className,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "green":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          label: "High Confidence",
          description: "AI analysis is reliable and ready to proceed",
          badgeVariant: "default" as const,
          bgColor: "bg-green-50",
          textColor: "text-green-800",
          borderColor: "border-green-200",
        };
      case "yellow":
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          label: "Review Recommended",
          description:
            "AI analysis shows moderate confidence - human review suggested",
          badgeVariant: "secondary" as const,
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-800",
          borderColor: "border-yellow-200",
        };
      case "red":
        return {
          icon: <XCircle className="w-5 h-5" />,
          label: "Human Review Required",
          description:
            "AI analysis shows low confidence - human review mandatory",
          badgeVariant: "destructive" as const,
          bgColor: "bg-red-50",
          textColor: "text-red-800",
          borderColor: "border-red-200",
        };
    }
  };

  const config = getStatusConfig();

  if (analysisState !== "complete") {
    return null;
  }

  return (
    <div
      className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}
      id="ai-traffic-light-status"
    >
      <div className="flex items-start gap-3">
        <div className={config.textColor}>{config.icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-medium ${config.textColor}`}>
              {config.label}
            </h3>
            <Badge variant={config.badgeVariant} className="text-xs">
              {reliabilityResult
                ? `${Math.round(reliabilityResult.overallScore * 100)}%`
                : "N/A"}
            </Badge>
          </div>
          <p className={`text-sm ${config.textColor.replace("800", "700")}`}>
            {config.description}
          </p>
          {reliabilityResult && (
            <div className="mt-2 text-xs text-gray-600">
              Risk Level: {reliabilityResult.failureRiskLevel} • Mitigations:{" "}
              {reliabilityResult.appliedMitigations.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
