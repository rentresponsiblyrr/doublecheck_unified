/**
 * INSPECTION STEPS LIST - ENTERPRISE EXCELLENCE
 *
 * Focused component for displaying inspection steps with progress:
 * - Visual step progression with connecting lines
 * - Interactive step navigation with click handlers
 * - Status indicators and completion badges
 * - Professional accessibility and keyboard navigation
 * - Mobile-optimized layout with clear visual hierarchy
 *
 * Extracted from InspectionStepsSidebar.tsx as part of architectural excellence
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Phase 1C Excellence
 */

import React, { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, ArrowRight } from "lucide-react";

/**
 * Inspection step interface
 */
export interface InspectionStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "active" | "pending" | "skipped";
  required: boolean;
  estimatedTime?: string;
}

export interface InspectionStepsListProps {
  steps: InspectionStep[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

/**
 * Get status icon based on step status
 */
const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <CheckCircle
          className="w-4 h-4 text-green-500"
          aria-label="Completed"
        />
      );
    case "active":
      return (
        <ArrowRight className="w-4 h-4 text-blue-500" aria-label="Active" />
      );
    case "skipped":
      return (
        <AlertTriangle
          className="w-4 h-4 text-yellow-500"
          aria-label="Skipped"
        />
      );
    default:
      return <Clock className="w-4 h-4 text-gray-400" aria-label="Pending" />;
  }
};

/**
 * Get step container styling based on status
 */
const getStatusColor = (status: string, isActive: boolean) => {
  if (isActive) return "border-blue-500 bg-blue-50";

  switch (status) {
    case "completed":
      return "border-green-200 bg-green-50";
    case "skipped":
      return "border-yellow-200 bg-yellow-50";
    case "pending":
      return "border-gray-200 bg-gray-50";
    default:
      return "border-gray-200 bg-white";
  }
};

/**
 * Get step number or completion indicator
 */
const getStepNumber = (index: number, status: string) => {
  if (status === "completed") {
    return (
      <CheckCircle
        className="w-5 h-5 text-green-500"
        aria-label={`Step ${index + 1} completed`}
      />
    );
  }

  return (
    <div
      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
        status === "active"
          ? "bg-blue-500 text-white"
          : status === "pending"
            ? "bg-gray-300 text-gray-600"
            : "bg-yellow-500 text-white"
      }`}
      aria-label={`Step ${index + 1} ${status}`}
    >
      {index + 1}
    </div>
  );
};

/**
 * Inspection Steps List Component
 */
export const InspectionStepsList: React.FC<InspectionStepsListProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = "",
}) => {
  /**
   * Handle step click with accessibility support
   */
  const handleStepClick = useCallback(
    (step: InspectionStep) => {
      if (
        onStepClick &&
        (step.status === "completed" || step.status === "active")
      ) {
        onStepClick(step.id);
      }
    },
    [onStepClick],
  );

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, step: InspectionStep) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleStepClick(step);
      }
    },
    [handleStepClick],
  );

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-1">
          <h4 className="font-medium text-gray-900 mb-4">Inspection Steps</h4>

          <div className="space-y-3" role="list" aria-label="Inspection steps">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isClickable =
                step.status === "completed" || step.status === "active";

              return (
                <div key={step.id} className="relative" role="listitem">
                  {/* Connecting Line */}
                  {index < steps.length - 1 && (
                    <div
                      className="absolute left-2.5 top-8 bottom-0 w-px bg-gray-200"
                      aria-hidden="true"
                    />
                  )}

                  <div
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      isClickable
                        ? "cursor-pointer hover:shadow-sm focus:ring-2 focus:ring-blue-500"
                        : "cursor-default opacity-75"
                    } ${getStatusColor(step.status, isActive)}`}
                    onClick={() => handleStepClick(step)}
                    onKeyDown={(e) => handleKeyDown(e, step)}
                    tabIndex={isClickable ? 0 : -1}
                    role="button"
                    aria-pressed={isActive}
                    aria-disabled={!isClickable}
                    id={`step-${step.id}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Step Number/Status */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getStepNumber(index, step.status)}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex-shrink-0" aria-hidden="true">
                            {step.icon}
                          </div>
                          <h5 className="font-medium text-sm text-gray-900 truncate">
                            {step.title}
                          </h5>
                          {step.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 mb-2">
                          {step.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(step.status)}
                            <span className="text-xs font-medium capitalize text-gray-600">
                              {step.status}
                            </span>
                          </div>

                          {step.estimatedTime && step.status === "pending" && (
                            <span className="text-xs text-gray-500">
                              ~{step.estimatedTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Active Step Indicator */}
                    {isActive && (
                      <div
                        className="absolute right-2 top-2"
                        aria-hidden="true"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
