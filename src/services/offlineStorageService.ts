// Offline Storage Service - IndexedDB management for offline-first functionality
import { logger } from '@/utils/logger';

// AI Analysis result interface
interface AIAnalysisResult {
  score: number;
  confidence: number;
  reasoning: string;
  issues: string[];
  suggestions: string[];
  qualityMetrics?: {
    sharpness: number;
    lighting: number;
    composition: number;
    completeness: number;
  };
  timestamp: string;
}

interface OfflineInspection {
  id: string;
  propertyId: string;
  inspectorId: string;
  status: 'draft' | 'in_progress' | 'completed';
  currentStep: number;
  startTime: string;
  endTime?: string;
  checklistItems: OfflineChecklistItem[];
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  lastModified: string;
  version: number;
}

interface OfflineChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  required: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  roomType?: string;
  gptPrompt?: string;
  referencePhoto?: string;
  photos: OfflineMedia[];
  videos: OfflineMedia[];
  notes?: string;
  aiAnalysis?: AIAnalysisResult;
  lastModified: string;
}

interface OfflineMedia {
  id: string;
  file: File;
  url: string; // blob URL for preview
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploaded: boolean;
  uploadRetries: number;
  timestamp: string;
}

interface SyncQueue {
  id: string;
  type: 'inspection' | 'checklist_item' | 'media_upload';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
  priority: 'high' | 'medium' | 'low';
  retries: number;
  lastAttempt?: string;
  error?: string;
  timestamp: string;
}

export class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'STRCertifiedOffline';
  private readonly DB_VERSION = 1;

  constructor() {
    this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        logger.error('Failed to open IndexedDB', request.error, 'OFFLINE_STORAGE');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB initialized successfully', {}, 'OFFLINE_STORAGE');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create inspections store
        if (!db.objectStoreNames.contains('inspections')) {
          const inspectionStore = db.createObjectStore('inspections', { keyPath: 'id' });
          inspectionStore.createIndex('propertyId', 'propertyId', { unique: false });
          inspectionStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          inspectionStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('priority', 'priority', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create media store for blob storage
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
          mediaStore.createIndex('checklistItemId', 'checklistItemId', { unique: false });
          mediaStore.createIndex('uploaded', 'uploaded', { unique: false });
        }

        logger.info('IndexedDB schema created', {}, 'OFFLINE_STORAGE');
      };
    });
  }

  /**
   * Store inspection data offline
   */
  async storeInspectionOffline(inspection: OfflineInspection): Promise<boolean> {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db!.transaction(['inspections'], 'readwrite');
      const store = transaction.objectStore('inspections');
      
      inspection.lastModified = new Date().toISOString();
      inspection.version = (inspection.version || 0) + 1;

      await new Promise((resolve, reject) => {
        const request = store.put(inspection);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Add to sync queue if not already synced
      if (inspection.syncStatus !== 'synced') {
        await this.addToSyncQueue({
          id: `inspection_${inspection.id}_${Date.now()}`,
          type: 'inspection',
          action: 'create',
          data: inspection,
          priority: 'high',
          retries: 0,
          timestamp: new Date().toISOString()
        });
      }

      logger.info('Inspection stored offline', { inspectionId: inspection.id }, 'OFFLINE_STORAGE');
      return true;
    } catch (error) {
      logger.error('Failed to store inspection offline', error, 'OFFLINE_STORAGE');
      return false;
    }
  }

  /**
   * Store media file offline
   */
  async storeMediaOffline(checklistItemId: string, file: File, type: 'photo' | 'video'): Promise<string | null> {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const mediaId = `${checklistItemId}_${type}_${Date.now()}`;
      const blobUrl = URL.createObjectURL(file);

      const mediaData: OfflineMedia = {
        id: mediaId,
        file,
        url: blobUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploaded: false,
        uploadRetries: 0,
        timestamp: new Date().toISOString()
      };

      const transaction = this.db!.transaction(['media'], 'readwrite');
      const store = transaction.objectStore('media');

      await new Promise((resolve, reject) => {
        const request = store.put({
          id: mediaId,
          checklistItemId,
          type,
          ...mediaData
        });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      // Add to sync queue
      await this.addToSyncQueue({
        id: `media_${mediaId}`,
        type: 'media_upload',
        action: 'create',
        data: { checklistItemId, mediaId, type },
        priority: 'medium',
        retries: 0,
        timestamp: new Date().toISOString()
      });

      logger.info('Media stored offline', { mediaId, checklistItemId, type }, 'OFFLINE_STORAGE');
      return mediaId;
    } catch (error) {
      logger.error('Failed to store media offline', error, 'OFFLINE_STORAGE');
      return null;
    }
  }

  /**
   * Get offline inspection by ID
   */
  async getOfflineInspection(inspectionId: string): Promise<OfflineInspection | null> {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db!.transaction(['inspections'], 'readonly');
      const store = transaction.objectStore('inspections');

      const result = await new Promise<OfflineInspection | null>((resolve, reject) => {
        const request = store.get(inspectionId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      return result;
    } catch (error) {
      logger.error('Failed to get offline inspection', error, 'OFFLINE_STORAGE');
      return null;
    }
  }

  /**
   * Get all offline inspections
   */
  async getAllOfflineInspections(): Promise<OfflineInspection[]> {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db!.transaction(['inspections'], 'readonly');
      const store = transaction.objectStore('inspections');

      const result = await new Promise<OfflineInspection[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      return result;
    } catch (error) {
      logger.error('Failed to get all offline inspections', error, 'OFFLINE_STORAGE');
      return [];
    }
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item: SyncQueue): Promise<boolean> {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      await new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return true;
    } catch (error) {
      logger.error('Failed to add to sync queue', error, 'OFFLINE_STORAGE');
      return false;
    }
  }

  /**
   * Get sync queue items
   */
  async getSyncQueue(): Promise<SyncQueue[]> {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');

      const result = await new Promise<SyncQueue[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      // Sort by priority and timestamp
      return result.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
    } catch (error) {
      logger.error('Failed to get sync queue', error, 'OFFLINE_STORAGE');
      return [];
    }
  }

  /**
   * Update sync queue item
   */
  async updateSyncQueueItem(id: string, updates: Partial<SyncQueue>): Promise<boolean> {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      // Get existing item
      const existingItem = await new Promise<SyncQueue>((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!existingItem) {
        return false;
      }

      // Update item
      const updatedItem = { ...existingItem, ...updates };
      await new Promise((resolve, reject) => {
        const request = store.put(updatedItem);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return true;
    } catch (error) {
      logger.error('Failed to update sync queue item', error, 'OFFLINE_STORAGE');
      return false;
    }
  }

  /**
   * Remove sync queue item
   */
  async removeSyncQueueItem(id: string): Promise<boolean> {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');

      await new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return true;
    } catch (error) {
      logger.error('Failed to remove sync queue item', error, 'OFFLINE_STORAGE');
      return false;
    }
  }

  /**
   * Get media file by ID
   */
  async getMediaFile(mediaId: string): Promise<{ file: File; url: string } | null> {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db!.transaction(['media'], 'readonly');
      const store = transaction.objectStore('media');

      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(mediaId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!result) {
        return null;
      }

      return {
        file: result.file,
        url: result.url
      };
    } catch (error) {
      logger.error('Failed to get media file', error, 'OFFLINE_STORAGE');
      return null;
    }
  }

  /**
   * Clear all offline data (useful for testing/cleanup)
   */
  async clearAllData(): Promise<boolean> {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db!.transaction(['inspections', 'syncQueue', 'media'], 'readwrite');
      
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore('inspections').clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore('syncQueue').clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        }),
        new Promise<void>((resolve, reject) => {
          const request = transaction.objectStore('media').clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
      ]);

      logger.info('All offline data cleared', {}, 'OFFLINE_STORAGE');
      return true;
    } catch (error) {
      logger.error('Failed to clear offline data', error, 'OFFLINE_STORAGE');
      return false;
    }
  }

  /**
   * Get storage stats
   */
  async getStorageStats(): Promise<{
    inspections: number;
    syncQueue: number;
    media: number;
    totalSize: number;
  }> {
    try {
      if (!this.db) {
        await this.initDB();
      }

      const transaction = this.db!.transaction(['inspections', 'syncQueue', 'media'], 'readonly');
      
      const [inspections, syncQueue, media] = await Promise.all([
        new Promise<any[]>((resolve, reject) => {
          const request = transaction.objectStore('inspections').getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        }),
        new Promise<any[]>((resolve, reject) => {
          const request = transaction.objectStore('syncQueue').getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        }),
        new Promise<any[]>((resolve, reject) => {
          const request = transaction.objectStore('media').getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        })
      ]);

      const totalSize = media.reduce((sum, item) => sum + (item.fileSize || 0), 0);

      return {
        inspections: inspections.length,
        syncQueue: syncQueue.length,
        media: media.length,
        totalSize
      };
    } catch (error) {
      logger.error('Failed to get storage stats', error, 'OFFLINE_STORAGE');
      return { inspections: 0, syncQueue: 0, media: 0, totalSize: 0 };
    }
  }
}

// Export singleton instance
export const offlineStorageService = new OfflineStorageService();