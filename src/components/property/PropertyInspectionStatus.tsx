/**
 * PROPERTY INSPECTION STATUS - ENTERPRISE EXCELLENCE
 *
 * Focused component for displaying active inspection status:
 * - Progress indicators with completion percentage
 * - Time tracking and last activity display
 * - Step and photo completion metrics
 * - Professional visual hierarchy and accessibility
 * - Mobile-optimized layout with clear status indicators
 *
 * Extracted from PropertyCard.tsx as part of architectural excellence
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Phase 1C Excellence
 */

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, Clock, FileText, Camera } from "lucide-react";
import type { ActiveInspection } from "./PropertyDataManager";

export interface PropertyInspectionStatusProps {
  activeInspection: ActiveInspection;
  lastWorkTime: Date | null;
  className?: string;
}

/**
 * Format time ago display
 */
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

/**
 * Get status badge based on inspection status
 */
const getStatusBadge = (status: ActiveInspection["status"]) => {
  switch (status) {
    case "draft":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          Draft
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-700">
          In Progress
        </Badge>
      );
    default:
      return null;
  }
};

/**
 * Calculate progress percentage
 */
const getProgressPercentage = (activeInspection: ActiveInspection): number => {
  if (activeInspection.total_items === 0) return 0;
  return Math.round(
    (activeInspection.completed_items / activeInspection.total_items) * 100,
  );
};

/**
 * Property Inspection Status Component
 */
export const PropertyInspectionStatus: React.FC<
  PropertyInspectionStatusProps
> = ({ activeInspection, lastWorkTime, className = "" }) => {
  const progressPercentage = getProgressPercentage(activeInspection);

  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}
      id={`inspection-status-${activeInspection.id}`}
    >
      {/* Header with status and timing */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <PlayCircle
            className="w-4 h-4 text-blue-600 mr-2"
            aria-hidden="true"
          />
          <span className="font-medium text-blue-900">
            Inspection In Progress
          </span>
          <div className="ml-2">{getStatusBadge(activeInspection.status)}</div>
        </div>
        {lastWorkTime && (
          <div className="flex items-center text-xs text-blue-600">
            <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
            <span>{formatTimeAgo(lastWorkTime)}</span>
          </div>
        )}
      </div>

      {/* Progress section */}
      <div className="mb-2" id={`progress-section-${activeInspection.id}`}>
        <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
          <span>Checklist Progress</span>
          <span>
            {activeInspection.completed_items}/{activeInspection.total_items}{" "}
            items
          </span>
        </div>
        <Progress
          value={progressPercentage}
          className="h-2 bg-blue-100"
          aria-label={`Inspection progress: ${progressPercentage}% complete`}
        />
      </div>

      {/* Additional statistics */}
      <div className="flex items-center justify-between text-xs text-blue-600">
        <div className="flex items-center">
          <FileText className="w-3 h-3 mr-1" aria-hidden="true" />
          <span>
            Step {activeInspection.last_step}/{activeInspection.total_steps}
          </span>
        </div>
        <div className="flex items-center">
          <Camera className="w-3 h-3 mr-1" aria-hidden="true" />
          <span>
            {activeInspection.photos_captured}/
            {activeInspection.photos_required} photos
          </span>
        </div>
      </div>
    </div>
  );
};
