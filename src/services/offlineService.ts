/**
 * Offline Service for Inspector Mobile Operations
 * Provides robust offline-first data management with automatic sync
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface OfflineQueueItem {
  id: string;
  type: 'checklist_update' | 'photo_upload' | 'inspection_complete' | 'property_add';
  data: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  error?: string;
}

interface OfflineInspection {
  id: string;
  propertyId: string;
  checklistItems: Map<string, any>;
  photos: Map<string, { file: File; itemId: string; url?: string }>;
  lastModified: number;
  synced: boolean;
}

export class OfflineService {
  private static instance: OfflineService;
  private queue: Map<string, OfflineQueueItem> = new Map();
  private inspections: Map<string, OfflineInspection> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;

  private constructor() {
    this.initializeOfflineSupport();
    this.loadFromLocalStorage();
    this.startSyncInterval();
  }

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private initializeOfflineSupport() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      logger.info('Device is online - starting sync');
      this.isOnline = true;
      this.syncQueue();
    });

    window.addEventListener('offline', () => {
      logger.info('Device is offline - enabling offline mode');
      this.isOnline = false;
    });

    // Service Worker registration for better offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        logger.warn('Service worker registration failed', err);
      });
    }
  }

  private loadFromLocalStorage() {
    try {
      // Load queue
      const savedQueue = localStorage.getItem('offline_queue');
      if (savedQueue) {
        const items = JSON.parse(savedQueue);
        items.forEach((item: OfflineQueueItem) => {
          this.queue.set(item.id, item);
        });
      }

      // Load inspections
      const savedInspections = localStorage.getItem('offline_inspections');
      if (savedInspections) {
        const inspections = JSON.parse(savedInspections);
        Object.entries(inspections).forEach(([id, data]: [string, any]) => {
          this.inspections.set(id, {
            ...data,
            checklistItems: new Map(data.checklistItems),
            photos: new Map(data.photos)
          });
        });
      }
    } catch (error) {
      logger.error('Failed to load offline data', error);
    }
  }

  private saveToLocalStorage() {
    try {
      // Save queue
      const queueArray = Array.from(this.queue.values());
      localStorage.setItem('offline_queue', JSON.stringify(queueArray));

      // Save inspections (convert Maps to arrays for serialization)
      const inspectionsObj: any = {};
      this.inspections.forEach((inspection, id) => {
        inspectionsObj[id] = {
          ...inspection,
          checklistItems: Array.from(inspection.checklistItems.entries()),
          photos: Array.from(inspection.photos.entries())
        };
      });
      localStorage.setItem('offline_inspections', JSON.stringify(inspectionsObj));
    } catch (error) {
      logger.error('Failed to save offline data', error);
    }
  }

  private startSyncInterval() {
    // Try to sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncQueue();
      }
    }, 30000);
  }

  /**
   * Queue a checklist item update for offline sync
   */
  async updateChecklistItem(itemId: string, updates: any): Promise<void> {
    const queueItem: OfflineQueueItem = {
      id: `checklist_${itemId}_${Date.now()}`,
      type: 'checklist_update',
      data: { itemId, updates },
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };

    this.queue.set(queueItem.id, queueItem);
    this.saveToLocalStorage();

    // Try immediate sync if online
    if (this.isOnline) {
      this.syncQueueItem(queueItem);
    }
  }

  /**
   * Queue a photo upload for offline sync
   */
  async queuePhotoUpload(file: File, checklistItemId: string): Promise<string> {
    const localUrl = URL.createObjectURL(file);
    const photoId = `photo_${checklistItemId}_${Date.now()}`;

    const queueItem: OfflineQueueItem = {
      id: photoId,
      type: 'photo_upload',
      data: { 
        checklistItemId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        localUrl
      },
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };

    // Store the actual file in IndexedDB for larger storage capacity
    await this.storeFileInIndexedDB(photoId, file);

    this.queue.set(queueItem.id, queueItem);
    this.saveToLocalStorage();

    // Return local URL for immediate display
    return localUrl;
  }

  /**
   * Store file in IndexedDB for offline access
   */
  private async storeFileInIndexedDB(id: string, file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OfflinePhotos', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['photos'], 'readwrite');
        const store = transaction.objectStore('photos');
        store.put({ id, file, timestamp: Date.now() });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve file from IndexedDB
   */
  private async getFileFromIndexedDB(id: string): Promise<File | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OfflinePhotos', 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['photos'], 'readonly');
        const store = transaction.objectStore('photos');
        const getRequest = store.get(id);
        
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(result ? result.file : null);
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync all pending queue items
   */
  async syncQueue(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    logger.info('Starting offline queue sync', { 
      queueSize: this.queue.size 
    });

    const pendingItems = Array.from(this.queue.values())
      .filter(item => item.status === 'pending' || item.status === 'failed')
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const item of pendingItems) {
      await this.syncQueueItem(item);
    }

    this.isSyncing = false;
    this.saveToLocalStorage();
  }

  /**
   * Sync a single queue item
   */
  private async syncQueueItem(item: OfflineQueueItem): Promise<void> {
    if (!this.isOnline) return;

    item.status = 'syncing';
    
    try {
      switch (item.type) {
        case 'checklist_update':
          await this.syncChecklistUpdate(item);
          break;
        case 'photo_upload':
          await this.syncPhotoUpload(item);
          break;
        case 'inspection_complete':
          await this.syncInspectionComplete(item);
          break;
        case 'property_add':
          await this.syncPropertyAdd(item);
          break;
      }

      item.status = 'completed';
      this.queue.delete(item.id);
      logger.info('Successfully synced offline item', { 
        type: item.type, 
        id: item.id 
      });
    } catch (error) {
      item.status = 'failed';
      item.retries++;
      item.error = error instanceof Error ? error.message : 'Sync failed';
      
      logger.error('Failed to sync offline item', {
        type: item.type,
        id: item.id,
        error,
        retries: item.retries
      });

      // Remove from queue after 5 retries
      if (item.retries >= 5) {
        this.queue.delete(item.id);
        logger.error('Removed item from queue after max retries', {
          type: item.type,
          id: item.id
        });
      }
    }
  }

  /**
   * Sync checklist update to database
   */
  private async syncChecklistUpdate(item: OfflineQueueItem): Promise<void> {
    const { itemId, updates } = item.data;
    
    const { error } = await supabase
      .from('checklist_items')
      .update({
        ...updates,
        last_modified_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (error) throw error;
  }

  /**
   * Sync photo upload to storage
   */
  private async syncPhotoUpload(item: OfflineQueueItem): Promise<void> {
    const { checklistItemId, fileName } = item.data;
    
    // Retrieve file from IndexedDB
    const file = await this.getFileFromIndexedDB(item.id);
    if (!file) {
      throw new Error('File not found in offline storage');
    }

    // Upload to Supabase storage
    const filePath = `inspections/${checklistItemId}/${Date.now()}_${fileName}`;
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

    // Clean up IndexedDB
    await this.removeFileFromIndexedDB(item.id);
  }

  /**
   * Remove file from IndexedDB after successful sync
   */
  private async removeFileFromIndexedDB(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('OfflinePhotos', 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['photos'], 'readwrite');
        const store = transaction.objectStore('photos');
        store.delete(id);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync inspection completion
   */
  private async syncInspectionComplete(item: OfflineQueueItem): Promise<void> {
    const { inspectionId } = item.data;
    
    const { error } = await supabase
      .from('inspections')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', inspectionId);

    if (error) throw error;
  }

  /**
   * Sync property addition
   */
  private async syncPropertyAdd(item: OfflineQueueItem): Promise<void> {
    const { propertyData } = item.data;
    
    const { error } = await supabase
      .from('properties')
      .insert(propertyData);

    if (error) throw error;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isOnline: boolean;
    isSyncing: boolean;
    queueSize: number;
    pendingItems: number;
  } {
    const pendingItems = Array.from(this.queue.values())
      .filter(item => item.status === 'pending').length;

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueSize: this.queue.size,
      pendingItems
    };
  }

  /**
   * Clear all offline data
   */
  clearOfflineData(): void {
    this.queue.clear();
    this.inspections.clear();
    localStorage.removeItem('offline_queue');
    localStorage.removeItem('offline_inspections');
    
    // Clear IndexedDB
    indexedDB.deleteDatabase('OfflinePhotos');
    
    logger.info('Cleared all offline data');
  }

  /**
   * Cleanup old data
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Export singleton instance
export const offlineService = OfflineService.getInstance();