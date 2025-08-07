/**
 * Offline Inspection Hook
 * Provides offline-first inspection functionality for mobile inspectors
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '@/services/offlineService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

interface UseOfflineInspectionProps {
  inspectionId?: string;
  propertyId?: string;
}

interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncTime: Date | null;
}

export const useOfflineInspection = ({ 
  inspectionId, 
  propertyId 
}: UseOfflineInspectionProps) => {
  const { toast } = useToast();
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingChanges: 0,
    lastSyncTime: null
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      toast({
        title: "Back Online",
        description: "Your changes will be synced automatically",
        variant: "default"
      });
      
      // Trigger sync when coming back online
      offlineService.syncQueue();
    };

    const handleOffline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: false }));
      toast({
        title: "Working Offline",
        description: "Your changes will be saved and synced when connection is restored",
        variant: "default"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Update sync status periodically
  useEffect(() => {
    const updateSyncStatus = () => {
      const status = offlineService.getSyncStatus();
      setOfflineState(prev => ({
        ...prev,
        isSyncing: status.isSyncing,
        pendingChanges: status.pendingItems
      }));
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Update checklist item with offline support
   */
  const updateChecklistItem = useCallback(async (
    itemId: string,
    updates: {
      status?: string;
      notes?: string;
      ai_status?: string;
    }
  ) => {
    try {
      if (offlineState.isOnline) {
        // Try online update first
        const { error } = await supabase
          .from('checklist_items')
          .update({
            ...updates,
            last_modified_at: new Date().toISOString()
          })
          .eq('id', itemId);

        if (error) throw error;

        logger.info('Checklist item updated online', { itemId });
      } else {
        // Queue for offline sync
        await offlineService.updateChecklistItem(itemId, updates);
        
        logger.info('Checklist item queued for offline sync', { itemId });
        
        toast({
          title: "Saved Offline",
          description: "Will sync when connection is restored",
          variant: "default"
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to update checklist item', error);
      
      // Fallback to offline mode on error
      if (offlineState.isOnline) {
        await offlineService.updateChecklistItem(itemId, updates);
        
        toast({
          title: "Saved Locally",
          description: "Update will be synced when possible",
          variant: "default"
        });
      }
      
      return { success: false, error };
    }
  }, [offlineState.isOnline, toast]);

  /**
   * Upload photo with offline support
   */
  const uploadPhoto = useCallback(async (
    file: File,
    checklistItemId: string
  ): Promise<{ url: string; isLocal: boolean }> => {
    try {
      if (offlineState.isOnline) {
        // Try online upload first
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `inspections/${inspectionId}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('inspection-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(filePath);

        // Create media record
        const { error: mediaError } = await supabase
          .from('media')
          .insert({
            checklist_item_id: checklistItemId,
            type: 'photo',
            url: publicUrl,
            file_path: filePath
          });

        if (mediaError) throw mediaError;

        logger.info('Photo uploaded online', { 
          checklistItemId, 
          url: publicUrl 
        });

        return { url: publicUrl, isLocal: false };
      } else {
        // Queue for offline upload
        const localUrl = await offlineService.queuePhotoUpload(
          file, 
          checklistItemId
        );
        
        logger.info('Photo queued for offline upload', { 
          checklistItemId,
          localUrl 
        });
        
        toast({
          title: "Photo Saved Offline",
          description: "Will upload when connection is restored",
          variant: "default"
        });

        return { url: localUrl, isLocal: true };
      }
    } catch (error) {
      logger.error('Failed to upload photo', error);
      
      // Fallback to offline mode on error
      if (offlineState.isOnline) {
        const localUrl = await offlineService.queuePhotoUpload(
          file, 
          checklistItemId
        );
        
        toast({
          title: "Photo Saved Locally",
          description: "Upload will complete when possible",
          variant: "default"
        });
        
        return { url: localUrl, isLocal: true };
      }
      
      throw error;
    }
  }, [offlineState.isOnline, inspectionId, toast]);

  /**
   * Complete inspection with offline support
   */
  const completeInspection = useCallback(async () => {
    if (!inspectionId) return { success: false, error: 'No inspection ID' };

    try {
      if (offlineState.isOnline) {
        // Try online completion first
        const { error } = await supabase
          .from('inspections')
          .update({
            status: 'completed',
            end_time: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', inspectionId);

        if (error) throw error;

        logger.info('Inspection completed online', { inspectionId });
        
        toast({
          title: "Inspection Completed",
          description: "Successfully submitted for review",
          variant: "default"
        });
      } else {
        // Queue for offline sync
        await offlineService.updateChecklistItem(inspectionId, {
          status: 'completed',
          end_time: new Date().toISOString()
        });
        
        logger.info('Inspection completion queued for offline sync', { 
          inspectionId 
        });
        
        toast({
          title: "Inspection Saved",
          description: "Will submit when connection is restored",
          variant: "default"
        });
      }

      return { success: true };
    } catch (error) {
      logger.error('Failed to complete inspection', error);
      
      // Fallback to offline mode on error
      if (offlineState.isOnline) {
        await offlineService.updateChecklistItem(inspectionId, {
          status: 'completed',
          end_time: new Date().toISOString()
        });
        
        toast({
          title: "Saved for Later",
          description: "Inspection will be submitted when possible",
          variant: "default"
        });
      }
      
      return { success: false, error };
    }
  }, [inspectionId, offlineState.isOnline, toast]);

  /**
   * Force sync all pending changes
   */
  const forceSync = useCallback(async () => {
    if (!offlineState.isOnline) {
      toast({
        title: "No Connection",
        description: "Cannot sync while offline",
        variant: "destructive"
      });
      return;
    }

    try {
      setOfflineState(prev => ({ ...prev, isSyncing: true }));
      await offlineService.syncQueue();
      
      setOfflineState(prev => ({ 
        ...prev, 
        isSyncing: false,
        lastSyncTime: new Date()
      }));
      
      toast({
        title: "Sync Complete",
        description: "All changes have been uploaded",
        variant: "default"
      });
    } catch (error) {
      logger.error('Manual sync failed', error);
      
      setOfflineState(prev => ({ ...prev, isSyncing: false }));
      
      toast({
        title: "Sync Failed",
        description: "Some changes could not be synced",
        variant: "destructive"
      });
    }
  }, [offlineState.isOnline, toast]);

  /**
   * Clear all offline data
   */
  const clearOfflineData = useCallback(() => {
    offlineService.clearOfflineData();
    
    setOfflineState(prev => ({
      ...prev,
      pendingChanges: 0,
      lastSyncTime: null
    }));
    
    toast({
      title: "Offline Data Cleared",
      description: "All cached data has been removed",
      variant: "default"
    });
  }, [toast]);

  return {
    // State
    isOnline: offlineState.isOnline,
    isSyncing: offlineState.isSyncing,
    pendingChanges: offlineState.pendingChanges,
    lastSyncTime: offlineState.lastSyncTime,
    
    // Actions
    updateChecklistItem,
    uploadPhoto,
    completeInspection,
    forceSync,
    clearOfflineData
  };
};