/**
 * PROPERTY INSPECTION ACTIONS - ENTERPRISE EXCELLENCE
 * 
 * Focused component for inspection action buttons:
 * - Continue/resume inspection functionality
 * - Start new inspection with clear CTAs
 * - Network status indicators for sync reliability
 * - Professional error handling and user feedback
 * - Accessible keyboard navigation and ARIA labels
 * 
 * Extracted from PropertyCard.tsx as part of architectural excellence
 * 
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Phase 1C Excellence
 */

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/logger';
import { 
  ArrowRight, 
  PlayCircle, 
  Wifi,
  WifiOff
} from 'lucide-react';
import type { ActiveInspection } from './PropertyDataManager';

export interface PropertyInspectionActionsProps {
  propertyId: string;
  activeInspection: ActiveInspection | null;
  isOnline: boolean;
  userId?: string;
  onInspectionStart?: (propertyId: string, isResume: boolean) => void;
  className?: string;
}

/**
 * Calculate progress percentage for display
 */
const getProgressPercentage = (activeInspection: ActiveInspection | null): number => {
  if (!activeInspection || activeInspection.total_items === 0) return 0;
  return Math.round((activeInspection.completed_items / activeInspection.total_items) * 100);
};

/**
 * Property Inspection Actions Component
 */
export const PropertyInspectionActions: React.FC<PropertyInspectionActionsProps> = ({
  propertyId,
  activeInspection,
  isOnline,
  userId,
  onInspectionStart,
  className = ''
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const progressPercentage = getProgressPercentage(activeInspection);

  /**
   * Handle inspection action with comprehensive error handling
   */
  const handleInspectionAction = useCallback(async (isResume: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Authentication check
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start or resume inspections.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Custom callback if provided
      if (onInspectionStart) {
        onInspectionStart(propertyId, isResume);
        return;
      }

      // Default navigation behavior
      if (isResume && activeInspection) {
        logger.info('Resuming inspection via PropertyInspectionActions', { 
          inspectionId: activeInspection.id,
          propertyId,
          progressPercentage
        }, 'PROPERTY_ACTIONS');
        
        navigate(`/inspection/${activeInspection.id}`);
        
        toast({
          title: "Resuming inspection",
          description: `Continuing where you left off - ${activeInspection.completed_items}/${activeInspection.total_items} items completed.`,
        });
      } else {
        logger.info('Starting new inspection via PropertyInspectionActions', { 
          propertyId 
        }, 'PROPERTY_ACTIONS');
        
        navigate(`/property-selection?property=${propertyId}&start=true`);
        
        toast({
          title: "Starting new inspection",
          description: "Initializing inspection workflow...",
        });
      }
      
    } catch (error) {
      logger.error('Inspection action failed', { 
        error, 
        propertyId, 
        isResume, 
        activeInspectionId: activeInspection?.id 
      }, 'PROPERTY_ACTIONS');
      
      toast({
        title: "Action failed",
        description: "Could not start inspection. Please try again.",
        variant: "destructive"
      });
    }
  }, [propertyId, activeInspection, userId, onInspectionStart, navigate, toast, progressPercentage]);

  return (
    <div className={`space-y-2 ${className}`} id={`inspection-actions-${propertyId}`}>
      {activeInspection ? (
        <>
          {/* Continue inspection - Primary action */}
          <Button
            onClick={(e) => handleInspectionAction(true, e)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 focus:ring-2 focus:ring-blue-500"
            aria-describedby={`continue-description-${propertyId}`}
          >
            <ArrowRight className="w-5 h-5 mr-2" aria-hidden="true" />
            Continue Inspection ({progressPercentage}% complete)
          </Button>
          <div id={`continue-description-${propertyId}`} className="sr-only">
            Resume inspection with {activeInspection.completed_items} of {activeInspection.total_items} items completed
          </div>
          
          {/* Start new - Secondary action */}
          <Button
            onClick={(e) => handleInspectionAction(false, e)}
            variant="outline"
            className="w-full h-10 text-sm focus:ring-2 focus:ring-blue-500"
            aria-describedby={`new-inspection-description-${propertyId}`}
          >
            Start New Inspection Instead
          </Button>
          <div id={`new-inspection-description-${propertyId}`} className="sr-only">
            Start a completely new inspection, discarding current progress
          </div>
        </>
      ) : (
        <>
          {/* Start new inspection - Primary action when no active inspection */}
          <Button
            onClick={(e) => handleInspectionAction(false, e)}
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 focus:ring-2 focus:ring-green-500"
            aria-describedby={`start-description-${propertyId}`}
          >
            <PlayCircle className="w-5 h-5 mr-2" aria-hidden="true" />
            Start New Inspection
          </Button>
          <div id={`start-description-${propertyId}`} className="sr-only">
            Begin a new inspection for this property
          </div>
        </>
      )}

      {/* Network status indicator */}
      <div className="flex items-center justify-center pt-2">
        {isOnline ? (
          <div className="flex items-center text-green-600 text-xs">
            <Wifi className="w-3 h-3 mr-1" aria-hidden="true" />
            <span>Ready to sync</span>
          </div>
        ) : (
          <div className="flex items-center text-amber-600 text-xs">
            <WifiOff className="w-3 h-3 mr-1" aria-hidden="true" />
            <span>Will sync when online</span>
          </div>
        )}
      </div>
    </div>
  );
};
