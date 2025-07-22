/**
 * ACTIVE INSPECTION CARD - ENTERPRISE EXCELLENCE
 * 
 * Focused component for displaying individual active inspection information:
 * - Clean visual hierarchy with progress indicators
 * - Offline sync status with clear indicators
 * - One-click resume functionality
 * - Professional accessibility compliance
 * - Optimized for mobile and desktop usage
 * 
 * Extracted from MyActiveInspections.tsx as part of architectural excellence
 * 
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Phase 1C Excellence
 */

import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  PlayCircle, 
  Clock, 
  MapPin,
  Camera,
  WifiOff,
  TrendingUp
} from 'lucide-react';
import type { ActiveInspectionSummary } from './ActiveInspectionDataManager';

export interface ActiveInspectionCardProps {
  inspection: ActiveInspectionSummary;
  compact?: boolean;
  onResume: (inspectionId: string) => void;
  className?: string;
}

/**
 * Get status badge color based on inspection status
 */
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'draft': return 'secondary';
    case 'in_progress': return 'default';
    case 'completed': return 'success';
    default: return 'secondary';
  }
};

/**
 * Get status display text
 */
const getStatusText = (status: string) => {
  switch (status) {
    case 'draft': return 'Draft';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    default: return status;
  }
};

/**
 * Format time ago display
 */
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  return date.toLocaleDateString();
};

/**
 * Active Inspection Card Component
 */
export const ActiveInspectionCard: React.FC<ActiveInspectionCardProps> = ({
  inspection,
  compact = false,
  onResume,
  className = ''
}) => {
  const {
    inspectionId,
    propertyName,
    propertyAddress,
    status,
    completedItems,
    totalItems,
    progressPercentage,
    lastActivity,
    hasOfflineChanges
  } = inspection;

  /**
   * Handle resume button click
   */
  const handleResume = useCallback(() => {
    onResume(inspectionId);
  }, [inspectionId, onResume]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleResume();
    }
  }, [handleResume]);

  const cardContent = (
    <>
      {/* Header with property info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 
            className="font-semibold text-gray-900 truncate"
            id={`property-name-${inspectionId}`}
          >
            {propertyName}
          </h3>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{propertyAddress}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-3">
          <Badge 
            variant={getStatusBadgeVariant(status) as any}
            className="text-xs"
          >
            {getStatusText(status)}
          </Badge>
          {hasOfflineChanges && (
            <Badge 
              variant="outline" 
              className="text-xs border-orange-300 text-orange-700 bg-orange-50"
              title="Has offline changes"
            >
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Progress section */}
      <div className="space-y-3">
        {/* Progress bar and percentage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-900">
              {completedItems}/{totalItems} items ({progressPercentage}%)
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
            aria-labelledby={`property-name-${inspectionId}`}
          />
        </div>

        {/* Activity info */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Last activity: {getTimeAgo(lastActivity)}</span>
          </div>
          {progressPercentage > 0 && (
            <div className="flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              <span className="text-green-600">{progressPercentage}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <Button
          onClick={handleResume}
          className="w-full flex items-center justify-center space-x-2 focus:ring-2 focus:ring-blue-500"
          size={compact ? "sm" : "default"}
          aria-describedby={`resume-${inspectionId}`}
        >
          <PlayCircle className="h-4 w-4" />
          <span>Resume Inspection</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div id={`resume-${inspectionId}`} className="sr-only">
          Resume inspection for {propertyName} at {progressPercentage}% completion
        </div>
      </div>
    </>
  );

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 ${className} ${
        hasOfflineChanges ? 'border-orange-300 bg-orange-50/30' : ''
      }`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label={`Resume inspection for ${propertyName}`}
      id={`inspection-card-${inspectionId}`}
    >
      <CardContent className={compact ? "p-4" : "p-5"}>
        {cardContent}
      </CardContent>
    </Card>
  );
};
