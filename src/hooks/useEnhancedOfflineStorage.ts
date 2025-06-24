
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface OfflinePhoto {
  id: string;
  checklistItemId: string;
  inspectionId: string;
  file: File;
  timestamp: number;
  uploaded: boolean;
  retryCount: number;
  lastError?: string;
}

interface OfflineStorageState {
  photos: OfflinePhoto[];
  syncInProgress: boolean;
  lastSyncAttempt: Date | null;
  totalPendingSize: number;
}

export const useEnhancedOfflineStorage = () => {
  const [storageState, setStorageState] = useState<OfflineStorageState>({
    photos: [],
    syncInProgress: false,
    lastSyncAttempt: null,
    totalPendingSize: 0
  });
  
  const isOnline = useNetworkStatus();
  const { toast } = useToast();

  // Calculate storage metrics
  const calculateStorageMetrics = useCallback((photos: OfflinePhoto[]) => {
    const totalSize = photos.reduce((acc, photo) => acc + photo.file.size, 0);
    return {
      totalPendingSize: totalSize,
      pendingCount: photos.filter(p => !p.uploaded).length,
      failedCount: photos.filter(p => p.retryCount > 0 && !p.uploaded).length
    };
  }, []);

  // Load offline photos on mount
  useEffect(() => {
    const loadOfflinePhotos = () => {
      try {
        const stored = localStorage.getItem('doublecheck_offline_photos_v2');
        if (stored) {
          const photos = JSON.parse(stored);
          const metrics = calculateStorageMetrics(photos);
          
          setStorageState(prev => ({
            ...prev,
            photos,
            totalPendingSize: metrics.totalPendingSize
          }));
          
          console.log('📱 Loaded offline photos:', {
            total: photos.length,
            pending: metrics.pendingCount,
            failed: metrics.failedCount,
            totalSize: `${(metrics.totalPendingSize / 1024 / 1024).toFixed(2)}MB`
          });
        }
      } catch (error) {
        console.error('📱 Error loading offline photos:', error);
        toast({
          title: "Storage Error",
          description: "Failed to load offline photos from storage.",
          variant: "destructive",
        });
      }
    };

    loadOfflinePhotos();
  }, [calculateStorageMetrics, toast]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && storageState.photos.some(p => !p.uploaded)) {
      console.log('📱 Network restored, starting auto-sync...');
      setTimeout(() => {
        syncOfflinePhotos();
      }, 2000); // Wait 2 seconds for network to stabilize
    }
  }, [isOnline]);

  const savePhotoOffline = useCallback(async (
    file: File,
    checklistItemId: string,
    inspectionId: string
  ): Promise<string> => {
    console.log('📱 Saving photo offline:', { 
      size: `${(file.size / 1024).toFixed(2)}KB`,
      type: file.type 
    });

    const photoId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlinePhoto: OfflinePhoto = {
      id: photoId,
      checklistItemId,
      inspectionId,
      file,
      timestamp: Date.now(),
      uploaded: false,
      retryCount: 0
    };

    const updatedPhotos = [...storageState.photos, offlinePhoto];
    const metrics = calculateStorageMetrics(updatedPhotos);
    
    setStorageState(prev => ({
      ...prev,
      photos: updatedPhotos,
      totalPendingSize: metrics.totalPendingSize
    }));
    
    // Save metadata to localStorage (without file data for size limits)
    try {
      const photoMetadata = updatedPhotos.map(photo => ({
        ...photo,
        file: null // Don't store file in localStorage
      }));
      
      localStorage.setItem('doublecheck_offline_photos_v2', JSON.stringify(photoMetadata));
      
      toast({
        title: "Photo saved offline",
        description: `Photo will sync when online. ${metrics.pendingCount + 1} pending.`,
      });
    } catch (error) {
      console.error('📱 Error saving to localStorage:', error);
      
      // If storage is full, try to clean up old uploaded photos
      cleanupUploadedPhotos();
      
      toast({
        title: "Storage Warning",
        description: "Local storage is getting full. Some photos may not be saved.",
        variant: "destructive",
      });
    }

    return photoId;
  }, [storageState.photos, calculateStorageMetrics, toast]);

  const syncOfflinePhotos = useCallback(async () => {
    if (storageState.syncInProgress || !isOnline) {
      console.log('📱 Sync skipped:', { 
        syncInProgress: storageState.syncInProgress, 
        isOnline 
      });
      return;
    }

    const pendingPhotos = storageState.photos.filter(p => !p.uploaded && p.retryCount < 3);
    
    if (pendingPhotos.length === 0) {
      console.log('📱 No photos to sync');
      return;
    }

    console.log(`📱 Starting sync of ${pendingPhotos.length} photos...`);
    
    setStorageState(prev => ({
      ...prev,
      syncInProgress: true,
      lastSyncAttempt: new Date()
    }));

    let successCount = 0;
    let failureCount = 0;

    for (const photo of pendingPhotos) {
      try {
        // Simulate upload - replace with actual upload logic
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mark as uploaded
        setStorageState(prev => ({
          ...prev,
          photos: prev.photos.map(p => 
            p.id === photo.id ? { ...p, uploaded: true } : p
          )
        }));
        
        successCount++;
        console.log(`📱 Uploaded photo ${photo.id}`);
        
      } catch (error) {
        console.error(`📱 Failed to upload photo ${photo.id}:`, error);
        
        // Increment retry count
        setStorageState(prev => ({
          ...prev,
          photos: prev.photos.map(p => 
            p.id === photo.id 
              ? { 
                  ...p, 
                  retryCount: p.retryCount + 1,
                  lastError: error instanceof Error ? error.message : 'Upload failed'
                } 
              : p
          )
        }));
        
        failureCount++;
      }
    }

    setStorageState(prev => ({
      ...prev,
      syncInProgress: false
    }));

    if (successCount > 0) {
      toast({
        title: "Sync Complete",
        description: `${successCount} photos uploaded successfully.`,
      });
    }

    if (failureCount > 0) {
      toast({
        title: "Sync Issues",
        description: `${failureCount} photos failed to upload. Will retry later.`,
        variant: "destructive",
      });
    }

    console.log('📱 Sync completed:', { successCount, failureCount });
  }, [storageState.syncInProgress, storageState.photos, isOnline, toast]);

  const cleanupUploadedPhotos = useCallback(() => {
    const remainingPhotos = storageState.photos.filter(p => !p.uploaded);
    const metrics = calculateStorageMetrics(remainingPhotos);
    
    setStorageState(prev => ({
      ...prev,
      photos: remainingPhotos,
      totalPendingSize: metrics.totalPendingSize
    }));
    
    localStorage.setItem('doublecheck_offline_photos_v2', JSON.stringify(
      remainingPhotos.map(photo => ({ ...photo, file: null }))
    ));
    
    console.log('📱 Cleaned up uploaded photos');
  }, [storageState.photos, calculateStorageMetrics]);

  const forceRetryFailed = useCallback(() => {
    setStorageState(prev => ({
      ...prev,
      photos: prev.photos.map(p => 
        p.retryCount > 0 && !p.uploaded 
          ? { ...p, retryCount: 0, lastError: undefined }
          : p
      )
    }));
    
    if (isOnline) {
      syncOfflinePhotos();
    }
  }, [isOnline, syncOfflinePhotos]);

  const getStorageStats = useCallback(() => {
    const metrics = calculateStorageMetrics(storageState.photos);
    return {
      ...metrics,
      isOnline,
      syncInProgress: storageState.syncInProgress,
      lastSyncAttempt: storageState.lastSyncAttempt,
      storageUsageMB: (metrics.totalPendingSize / 1024 / 1024).toFixed(2)
    };
  }, [storageState, isOnline, calculateStorageMetrics]);

  return {
    isOnline,
    photos: storageState.photos,
    syncInProgress: storageState.syncInProgress,
    savePhotoOffline,
    syncOfflinePhotos,
    cleanupUploadedPhotos,
    forceRetryFailed,
    getStorageStats
  };
};
