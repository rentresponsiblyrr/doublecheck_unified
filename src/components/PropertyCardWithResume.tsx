/**
 * PROPERTY CARD WITH RESUME - ELITE LEVEL INSPECTION CONTINUITY
 * 
 * Enhanced property card that clearly shows inspection status and resume capability.
 * Provides seamless user experience for starting new vs continuing existing inspections.
 * 
 * Features:
 * - Visual distinction between "Start New" vs "Continue" actions
 * - Progress indicators showing completion status
 * - "Last worked on" timestamps for context
 * - Smart resume with state validation
 * - Offline progress indication
 * - Cross-device resume capability
 * 
 * @author STR Certified Engineering Team
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  PlayCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Wifi,
  WifiOff,
  MapPin,
  Camera,
  FileText,
  MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabase } from '@/integrations/supabase/client';
import { workflowStatePersistence } from '@/services/WorkflowStatePersistence';
import { logger } from '@/utils/logger';

export interface Property {
  property_id: number;
  property_name: string;
  street_address: string;
  vrbo_url?: string;
  airbnb_url?: string;
  created_at: string;
}

export interface ActiveInspection {
  id: string;
  status: 'draft' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  completed_items: number;
  total_items: number;
  last_step: number;
  total_steps: number;
  photos_captured: number;
  photos_required: number;
  inspector_name?: string;
  offline_changes?: boolean;
}

interface PropertyCardWithResumeProps {
  property: Property;
  onInspectionStart?: (propertyId: string, isResume: boolean) => void;
  showActions?: boolean;
  className?: string;
}

export const PropertyCardWithResume = ({
  property,
  onInspectionStart,
  showActions = true,
  className = ''
}: PropertyCardWithResumeProps) => {
  const [activeInspection, setActiveInspection] = useState<ActiveInspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasOfflineChanges, setHasOfflineChanges] = useState(false);
  const [lastWorkTime, setLastWorkTime] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    checkForActiveInspection();
    checkForOfflineChanges();
  }, [property.property_id, user, checkForActiveInspection, checkForOfflineChanges]);

  /**
   * Check for active inspection on this property
   */
  const checkForActiveInspection = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: inspection, error } = await supabase
        .from('inspections')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          logs!inner (
            id,
            status,
            static_safety_items!inner (
              id,
              label,
              evidence_type
            )
          )
        `)
        .eq('property_id', property.property_id.toString())
        .eq('inspector_id', user.id)
        .in('status', ['draft', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        logger.warn('Error checking for active inspection', { error, propertyId: property.property_id }, 'PROPERTY_CARD');
        setLoading(false);
        return;
      }

      if (inspection && inspection.length > 0) {
        const inspectionData = inspection[0];
        const checklistItems = inspectionData.logs || [];
        
        const completedItems = checklistItems.filter((item: { status: string }) => 
          item.status === 'completed' || item.status === 'failed' || item.status === 'not_applicable'
        ).length;

        const photosRequired = checklistItems.filter((item: { static_safety_items?: { evidence_type: string } }) => 
          item.static_safety_items?.evidence_type === 'photo'
        ).length;

        const activeInspectionData: ActiveInspection = {
          id: inspectionData.id,
          status: inspectionData.status as ActiveInspection['status'],
          created_at: inspectionData.created_at,
          updated_at: inspectionData.updated_at,
          completed_items: completedItems,
          total_items: checklistItems.length,
          last_step: Math.floor((completedItems / checklistItems.length) * 5), // Assume 5 total steps
          total_steps: 5,
          photos_captured: 0, // This would need to be calculated from media table
          photos_required: photosRequired
        };

        setActiveInspection(activeInspectionData);
        setLastWorkTime(new Date(inspectionData.updated_at));
        
        logger.info('Active inspection found', {
          inspectionId: activeInspectionData.id,
          completedItems,
          totalItems: checklistItems.length
        }, 'PROPERTY_CARD');
      }

      setLoading(false);

    } catch (error) {
      logger.error('Unexpected error checking for active inspection', { error, propertyId: property.property_id }, 'PROPERTY_CARD');
      setLoading(false);
    }
  }, [user, property.property_id]);

  /**
   * Check for offline changes
   */
  const checkForOfflineChanges = useCallback(async () => {
    try {
      const recoveryResult = await workflowStatePersistence.recoverState(`property_${property.property_id}`);
      if (recoveryResult.recovered) {
        setHasOfflineChanges(true);
        logger.info('Offline changes detected for property', { propertyId: property.property_id }, 'PROPERTY_CARD');
      }
    } catch (error) {
      logger.warn('Error checking for offline changes', { error, propertyId: property.property_id }, 'PROPERTY_CARD');
    }
  }, [property.property_id]);

  /**
   * Handle starting new or resuming inspection
   */
  const handleInspectionAction = async (isResume: boolean) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start or resume inspections.",
        variant: "destructive",
      });
      return;
    }

    if (onInspectionStart) {
      onInspectionStart(property.property_id.toString(), isResume);
      return;
    }

    // Default navigation behavior
    if (isResume && activeInspection) {
      logger.info('Resuming inspection', { 
        inspectionId: activeInspection.id,
        propertyId: property.property_id 
      }, 'PROPERTY_CARD');
      
      navigate(`/inspection/${activeInspection.id}`);
      
      toast({
        title: "Resuming inspection",
        description: `Continuing where you left off - ${activeInspection.completed_items}/${activeInspection.total_items} items completed.`,
      });
    } else {
      logger.info('Starting new inspection', { propertyId: property.property_id }, 'PROPERTY_CARD');
      
      // This will be handled by the existing usePropertyActions.startInspection logic
      // which will detect if there's an existing inspection and navigate accordingly
      navigate(`/property-selection?property=${property.property_id}&start=true`);
    }
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  /**
   * Get status badge variant
   */
  const getStatusBadge = () => {
    if (!activeInspection) return null;

    switch (activeInspection.status) {
      case 'draft':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Draft</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-700">In Progress</Badge>;
      default:
        return null;
    }
  };

  /**
   * Calculate progress percentage
   */
  const getProgressPercentage = (): number => {
    if (!activeInspection || activeInspection.total_items === 0) return 0;
    return Math.round((activeInspection.completed_items / activeInspection.total_items) * 100);
  };

  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative transition-all duration-200 hover:shadow-md ${className}`} id={`property-card-${property.property_id}`}>
      {/* Offline indicator */}
      {hasOfflineChanges && (
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
            <WifiOff className="w-3 h-3 mr-1" />
            Offline Changes
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              {property.property_name}
            </CardTitle>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{property.street_address}</span>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Active inspection status */}
        {activeInspection && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <PlayCircle className="w-4 h-4 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Inspection In Progress</span>
              </div>
              {lastWorkTime && (
                <div className="flex items-center text-xs text-blue-600">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>{formatTimeAgo(lastWorkTime)}</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                <span>Checklist Progress</span>
                <span>{activeInspection.completed_items}/{activeInspection.total_items} items</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2 bg-blue-100" />
            </div>

            {/* Additional stats */}
            <div className="flex items-center justify-between text-xs text-blue-600">
              <div className="flex items-center">
                <FileText className="w-3 h-3 mr-1" />
                <span>Step {activeInspection.last_step}/{activeInspection.total_steps}</span>
              </div>
              <div className="flex items-center">
                <Camera className="w-3 h-3 mr-1" />
                <span>{activeInspection.photos_captured}/{activeInspection.photos_required} photos</span>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      {showActions && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {activeInspection ? (
              <>
                {/* Continue inspection button */}
                <Button
                  onClick={() => handleInspectionAction(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Continue Inspection ({getProgressPercentage()}% complete)
                </Button>
                
                {/* Secondary action - start new */}
                <Button
                  onClick={() => handleInspectionAction(false)}
                  variant="outline"
                  className="w-full h-10 text-sm"
                >
                  Start New Inspection Instead
                </Button>
              </>
            ) : (
              <>
                {/* Start new inspection button */}
                <Button
                  onClick={() => handleInspectionAction(false)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Start New Inspection
                </Button>
              </>
            )}

            {/* Network status indicator */}
            <div className="flex items-center justify-center pt-2">
              {isOnline ? (
                <div className="flex items-center text-green-600 text-xs">
                  <Wifi className="w-3 h-3 mr-1" />
                  <span>Ready to sync</span>
                </div>
              ) : (
                <div className="flex items-center text-amber-600 text-xs">
                  <WifiOff className="w-3 h-3 mr-1" />
                  <span>Will sync when online</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};