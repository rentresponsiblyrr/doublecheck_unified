/**
 * INSPECTION PROGRESS HEADER - ENTERPRISE EXCELLENCE
 *
 * Focused component for displaying inspection progress overview:
 * - Property information and current inspection status
 * - Overall progress indicator with completion percentage
 * - Visual progress bar with accessibility support
 * - Clean typography and mobile-optimized layout
 *
 * Extracted from InspectionStepsSidebar.tsx as part of architectural excellence
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Phase 1C Excellence
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MapPin } from "lucide-react";
import type { InspectionStep } from "./InspectionStepsList";

export interface InspectionProgressHeaderProps {
  propertyName?: string;
  steps: InspectionStep[];
  overallProgress?: number;
  className?: string;
}

/**
 * Calculate progress based on completed steps
 */
const calculateProgress = (
  steps: InspectionStep[],
  overallProgress?: number,
): number => {
  if (overallProgress && overallProgress > 0) {
    return overallProgress;
  }

  const completedSteps = steps.filter(
    (step) => step.status === "completed",
  ).length;
  const totalSteps = steps.length;
  return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
};

/**
 * Inspection Progress Header Component
 */
export const InspectionProgressHeader: React.FC<
  InspectionProgressHeaderProps
> = ({ propertyName, steps, overallProgress, className = "" }) => {
  const completedSteps = steps.filter(
    (step) => step.status === "completed",
  ).length;
  const totalSteps = steps.length;
  const displayProgress = calculateProgress(steps, overallProgress);

  return (
    <Card className={`mb-4 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-500" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-600">
              Current Property
            </span>
          </div>

          {propertyName && (
            <div>
              <h3 className="font-semibold text-gray-900 truncate">
                {propertyName}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Active Inspection</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{displayProgress}%</span>
            </div>
            <Progress
              value={displayProgress}
              className="h-2"
              aria-label={`Inspection progress: ${displayProgress}% complete`}
            />
            <div className="text-xs text-gray-500">
              {completedSteps} of {totalSteps} steps completed
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
