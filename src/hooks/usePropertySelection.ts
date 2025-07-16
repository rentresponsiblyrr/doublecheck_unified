
import { useState } from "react";
import { useMobileInspectionOptimizer } from "@/hooks/useMobileInspectionOptimizer";
import { STATUS_GROUPS, INSPECTION_STATUS } from "@/types/inspection-status";

interface Inspection {
  id: string;
  property_id: string;
  completed: boolean;
  start_time: string | null;
  status?: string;
}

export const usePropertySelection = (inspections: Inspection[]) => {
  const { 
    startOrJoinInspection, 
    retryInspection, 
    isLoading: isCreatingInspection,
    error: inspectionError,
    clearError
  } = useMobileInspectionOptimizer();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const handleStartInspection = async () => {
    if (!selectedProperty) {
      console.warn('⚠️ No property selected for inspection');
      return;
    }

    console.log('🚀 Starting inspection for property:', selectedProperty);
    await startOrJoinInspection(selectedProperty);
  };

  const handleRetryInspection = async () => {
    if (!selectedProperty) {
      console.warn('⚠️ No property selected for retry');
      return;
    }

    console.log('🔄 Retrying inspection for property:', selectedProperty);
    await retryInspection(selectedProperty);
  };

  const getPropertyStatus = (propertyId: string) => {
    const propertyInspections = inspections.filter(i => i.property_id === propertyId);
    
    // Use the same comprehensive status logic as InspectionCreationOptimizer
    const activeStatuses = [
      ...STATUS_GROUPS.ACTIVE,           // draft, in_progress  
      ...STATUS_GROUPS.REVIEW_PIPELINE,  // completed, pending_review, in_review
      INSPECTION_STATUS.NEEDS_REVISION   // needs_revision
    ];

    // Find any inspection with active status (should prevent new inspection)
    const activeInspections = propertyInspections.filter(i => 
      activeStatuses.includes(i.status as any) || 
      (!i.completed && (!i.status || i.status === 'available' || i.status === 'draft'))
    );

    // Find completed and approved inspections (property should be hidden from list)
    const approvedInspections = propertyInspections.filter(i => 
      i.status === INSPECTION_STATUS.APPROVED
    );

    // Find truly completed inspections that are in review pipeline
    const completedInspections = propertyInspections.filter(i => 
      STATUS_GROUPS.REVIEW_PIPELINE.includes(i.status as any) || 
      (i.completed && i.status === INSPECTION_STATUS.COMPLETED)
    );

    // Priority order: Approved > Active > Completed > Pending
    if (approvedInspections.length > 0) {
      return { 
        status: 'approved', 
        color: 'bg-green-600', 
        text: 'Approved',
        activeInspectionId: approvedInspections[0].id,
        shouldHide: true // Property should be hidden from inspector list
      };
    }
    
    if (activeInspections.length > 0) {
      const activeInspection = activeInspections[0];
      const statusText = activeInspection.status === 'needs_revision' ? 'Needs Revision' : 'In Progress';
      return { 
        status: 'in-progress', 
        color: 'bg-yellow-500', 
        text: statusText,
        activeInspectionId: activeInspection.id
      };
    }
    
    if (completedInspections.length > 0) {
      return { 
        status: 'completed', 
        color: 'bg-blue-500', 
        text: 'Under Review',
        activeInspectionId: null,
        shouldHide: false // Still show in list but not available for new inspection
      };
    }
    
    return { 
      status: 'pending', 
      color: 'bg-gray-500', 
      text: 'Not Started',
      activeInspectionId: null
    };
  };

  const getButtonText = (propertyId: string) => {
    const status = getPropertyStatus(propertyId);
    
    if (status.shouldHide) {
      return 'Property Approved';
    }
    
    if (status.status === 'completed') {
      return 'Under Review';
    }
    
    if (status.status === 'in-progress') {
      return status.text.includes('Revision') ? 'Continue Inspection' : 'Join Inspection';
    }
    
    return 'Start Inspection';
  };

  return {
    selectedProperty,
    setSelectedProperty,
    handleStartInspection,
    handleRetryInspection,
    getPropertyStatus,
    getButtonText,
    isCreatingInspection,
    inspectionError,
    clearError
  };
};
