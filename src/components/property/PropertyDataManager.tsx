/**
 * PROPERTY DATA MANAGER - ENTERPRISE EXCELLENCE
 * 
 * Service layer for PropertyCard with render props pattern:
 * - Active inspection detection and management
 * - Offline change detection with state persistence
 * - Network status monitoring for sync capabilities
 * - Professional error handling and recovery
 * - Clean separation of data operations from UI concerns
 * 
 * Extracted from PropertyCard.tsx as part of architectural excellence
 * 
 * @author STR Certified Engineering Team
 * @version 2.0.0 - Phase 1C Excellence
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { supabase } from '@/integrations/supabase/client';
import { workflowStatePersistence } from '@/services/WorkflowStatePersistence';
import { logger } from '@/utils/logger';

/**
 * Active inspection data structure
 */
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

/**
 * Property inspection context data
 */
export interface PropertyInspectionData {
  activeInspection: ActiveInspection | null;
  loading: boolean;
  hasOfflineChanges: boolean;
  lastWorkTime: Date | null;
  isOnline: boolean;
  error: string | null;
}

/**
 * Data manager actions
 */
export interface PropertyDataActions {
  checkForActiveInspection: () => Promise<void>;
  checkForOfflineChanges: () => Promise<void>;
  refreshInspectionData: () => Promise<void>;
  clearError: () => void;
}

/**
 * Render props interface
 */
export interface PropertyDataManagerRenderProps extends PropertyInspectionData, PropertyDataActions {}

/**
 * Component props
 */
export interface PropertyDataManagerProps {
  propertyId: string;
  enableInspectionTracking?: boolean;
  children: (props: PropertyDataManagerRenderProps) => React.ReactNode;
}

/**
 * Property Data Service Class - Encapsulated business logic
 */
class PropertyInspectionService {
  /**
   * Get active inspection for property and user
   */
  async getActiveInspection(
    propertyId: string, 
    userId: string
  ): Promise<ActiveInspection | null> {
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
        .eq('property_id', propertyId.toString())
        .eq('inspector_id', userId)
        .in('status', ['draft', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        logger.warn('Error fetching active inspection', { error, propertyId, userId }, 'PROPERTY_SERVICE');
        return null;
      }

      if (!inspection || inspection.length === 0) {
        return null;
      }

      const inspectionData = inspection[0];
      const checklistItems = inspectionData.logs || [];
      
      const completedItems = checklistItems.filter((item: any) => 
        item.status === 'completed' || item.status === 'failed' || item.status === 'not_applicable'
      ).length;

      const photosRequired = checklistItems.filter((item: any) => 
        item.static_safety_items?.evidence_type === 'photo'
      ).length;

      const activeInspectionData: ActiveInspection = {
        id: inspectionData.id,
        status: inspectionData.status as ActiveInspection['status'],
        created_at: inspectionData.created_at,
        updated_at: inspectionData.updated_at,
        completed_items: completedItems,
        total_items: checklistItems.length,
        last_step: Math.floor((completedItems / checklistItems.length) * 5),
        total_steps: 5,
        photos_captured: 0,
        photos_required: photosRequired
      };

      logger.info('Active inspection loaded', {
        inspectionId: activeInspectionData.id,
        completedItems,
        totalItems: checklistItems.length,
        progressPercentage: Math.round((completedItems / checklistItems.length) * 100)
      }, 'PROPERTY_SERVICE');

      return activeInspectionData;
      
    } catch (error) {
      logger.error('Unexpected error fetching active inspection', { error, propertyId, userId }, 'PROPERTY_SERVICE');
      throw error;
    }
  }

  /**
   * Check for offline changes in workflow state persistence
   */
  async checkOfflineChanges(propertyId: string): Promise<boolean> {
    try {
      const recoveryResult = await workflowStatePersistence.recoverState(`property_${propertyId}`);
      if (recoveryResult.recovered) {
        logger.info('Offline changes detected', { propertyId }, 'PROPERTY_SERVICE');
        return true;
      }
      return false;
    } catch (error) {
      logger.warn('Error checking offline changes', { error, propertyId }, 'PROPERTY_SERVICE');
      return false;
    }
  }
}

/**
 * Property Data Manager Component with Render Props Pattern
 */
export const PropertyDataManager: React.FC<PropertyDataManagerProps> = ({
  propertyId,
  enableInspectionTracking = false,
  children
}) => {
  const [activeInspection, setActiveInspection] = useState<ActiveInspection | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasOfflineChanges, setHasOfflineChanges] = useState(false);
  const [lastWorkTime, setLastWorkTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const service = new PropertyInspectionService();

  /**
   * Check for active inspection
   */
  const checkForActiveInspection = useCallback(async () => {
    if (!user || !enableInspectionTracking) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const inspection = await service.getActiveInspection(propertyId, user.id);
      
      if (inspection) {
        setActiveInspection(inspection);
        setLastWorkTime(new Date(inspection.updated_at));
      } else {
        setActiveInspection(null);
        setLastWorkTime(null);
      }
      
    } catch (error) {
      const errorMessage = 'Failed to load inspection data';
      setError(errorMessage);
      logger.error('checkForActiveInspection failed', { error, propertyId, userId: user.id }, 'PROPERTY_DATA_MANAGER');
    } finally {
      setLoading(false);
    }
  }, [user, propertyId, enableInspectionTracking, service]);

  /**
   * Check for offline changes
   */
  const checkForOfflineChanges = useCallback(async () => {
    try {
      const hasChanges = await service.checkOfflineChanges(propertyId);
      setHasOfflineChanges(hasChanges);
    } catch (error) {
      logger.warn('checkForOfflineChanges failed', { error, propertyId }, 'PROPERTY_DATA_MANAGER');
    }
  }, [propertyId, service]);

  /**
   * Refresh all inspection data
   */
  const refreshInspectionData = useCallback(async () => {
    await Promise.all([
      checkForActiveInspection(),
      checkForOfflineChanges()
    ]);
  }, [checkForActiveInspection, checkForOfflineChanges]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Initialize data on mount and property change
   */
  useEffect(() => {
    if (enableInspectionTracking) {
      refreshInspectionData();
    }
  }, [propertyId, user, enableInspectionTracking, refreshInspectionData]);

  /**
   * Provide all data and actions through render props
   */
  return (
    <>
      {children({
        // Data
        activeInspection,
        loading,
        hasOfflineChanges,
        lastWorkTime,
        isOnline,
        error,
        // Actions
        checkForActiveInspection,
        checkForOfflineChanges,
        refreshInspectionData,
        clearError
      })}
    </>
  );
};
