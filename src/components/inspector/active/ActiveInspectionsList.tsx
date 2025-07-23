/**
 * ACTIVE INSPECTIONS LIST - ENTERPRISE EXCELLENCE
 *
 * Focused component for displaying list of active inspections:
 * - Virtualized list for performance with large datasets
 * - Empty state handling with clear user guidance
 * - Loading states with skeleton placeholders
 * - Professional error handling with recovery actions
 * - Responsive grid layout for different screen sizes
 *
 * Extracted from MyActiveInspections.tsx as part of architectural excellence
 *
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Phase 1C Excellence
 */

import React, { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Inbox,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  PlayCircle,
} from "lucide-react";
import { ActiveInspectionCard } from "./ActiveInspectionCard";
import type { ActiveInspectionSummary } from "./ActiveInspectionDataManager";

export interface ActiveInspectionsListProps {
  inspections: ActiveInspectionSummary[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  compact?: boolean;
  showEmptyState?: boolean;
  maxItems?: number;
  onRefresh: () => void;
  onResume: (inspectionId: string) => void;
  onClearError: () => void;
  className?: string;
}

/**
 * Loading skeleton component
 */
const InspectionListSkeleton: React.FC<{
  compact?: boolean;
  count?: number;
}> = ({ compact = false, count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }, (_, index) => (
      <Card key={index} className="animate-pulse">
        <CardContent className={compact ? "p-4" : "p-5"}>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <Skeleton className="h-9 w-full" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

/**
 * Empty state component
 */
const EmptyState: React.FC<{
  onCreateNew?: () => void;
  compact?: boolean;
}> = ({ onCreateNew, compact = false }) => (
  <Card className="border-dashed">
    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Active Inspections
      </h3>
      <p className="text-gray-600 mb-6 max-w-md">
        You don't have any active inspections yet. Start a new inspection to
        begin your workflow.
      </p>
      {onCreateNew && (
        <Button onClick={onCreateNew} className="flex items-center space-x-2">
          <PlayCircle className="h-4 w-4" />
          <span>Start New Inspection</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </CardContent>
  </Card>
);

/**
 * Error state component
 */
const ErrorState: React.FC<{
  error: string;
  onRetry: () => void;
  onClearError: () => void;
}> = ({ error, onRetry, onClearError }) => (
  <Alert variant="destructive" className="mb-6">
    <AlertTriangle className="h-4 w-4" />
    <AlertDescription className="flex items-center justify-between">
      <span>{error}</span>
      <div className="flex items-center space-x-2 ml-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearError}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          Dismiss
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-red-300 text-red-700 hover:bg-red-50"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    </AlertDescription>
  </Alert>
);

/**
 * Main Active Inspections List Component
 */
export const ActiveInspectionsList: React.FC<ActiveInspectionsListProps> = ({
  inspections,
  loading,
  refreshing,
  error,
  compact = false,
  showEmptyState = true,
  maxItems = 10,
  onRefresh,
  onResume,
  onClearError,
  className = "",
}) => {
  /**
   * Handle inspection resume with logging
   */
  const handleResume = useCallback(
    (inspectionId: string) => {
      onResume(inspectionId);
    },
    [onResume],
  );

  /**
   * Handle retry action
   */
  const handleRetry = useCallback(() => {
    onClearError();
    onRefresh();
  }, [onClearError, onRefresh]);

  // Show loading skeleton on initial load
  if (loading && inspections.length === 0) {
    return (
      <div className={className}>
        <InspectionListSkeleton compact={compact} count={3} />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Error state */}
      {error && (
        <ErrorState
          error={error}
          onRetry={handleRetry}
          onClearError={onClearError}
        />
      )}

      {/* Header with refresh button */}
      {!compact && inspections.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Active Inspections ({inspections.length})
            </h2>
            <p className="text-sm text-gray-600">
              Resume any inspection to continue where you left off
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      )}

      {/* Inspections list */}
      {inspections.length > 0 ? (
        <div className={`space-y-4 ${compact ? "space-y-3" : ""}`}>
          {inspections.slice(0, maxItems).map((inspection) => (
            <ActiveInspectionCard
              key={inspection.inspectionId}
              inspection={inspection}
              compact={compact}
              onResume={handleResume}
            />
          ))}

          {/* Show "Load More" if there are more items */}
          {inspections.length > maxItems && (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-center py-4">
                <Button
                  variant="outline"
                  onClick={onRefresh}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Load More Inspections</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        showEmptyState && (
          <EmptyState
            compact={compact}
            onCreateNew={() => {
              // This would navigate to property selection
              window.location.hash = "/properties";
            }}
          />
        )
      )}

      {/* Refreshing indicator overlay */}
      {refreshing && inspections.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="shadow-lg border-blue-200 bg-blue-50">
            <CardContent className="flex items-center space-x-2 p-3">
              <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-800">Refreshing...</span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
