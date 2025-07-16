// Sync Service - Handles synchronization between offline storage and database
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { offlineStorageService } from './offlineStorageService';
import { inspectionService } from './inspectionService';
import { QueueProcessor } from '@/lib/sync/queue-processor';

// Sync queue lock to prevent race conditions
class SyncQueueLock {
  private locks = new Map<string, Promise<void>>();

  async acquireLock(key: string): Promise<() => void> {
    // Wait for existing lock to release
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    // Create new lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(key, lockPromise);

    return () => {
      this.locks.delete(key);
      releaseLock!();
    };
  }
}

const syncQueueLock = new SyncQueueLock();

// Sync item type definitions
interface BaseSyncItem {
  id: string;
  type: 'inspection' | 'checklist_item' | 'media_upload';
  action: 'create' | 'update' | 'delete';
  priority: 'high' | 'medium' | 'low';
  retries: number;
  timestamp: string;
  error?: string;
  lastAttempt?: string;
}

interface InspectionSyncData {
  id: string;
  propertyId: string;
  inspectorId: string;
  status: string;
  currentStep: number;
  checklistItems: Array<{
    title: string;
    description: string;
    category: string;
    required: boolean;
    room_type?: string;
    gpt_prompt?: string;
    reference_photo?: string;
  }>;
}

interface ChecklistItemSyncData {
  id: string;
  status: string;
  notes?: string;
  aiStatus?: string;
  aiConfidence?: number;
  aiReasoning?: string;
  userOverride?: boolean;
  completedAt?: string;
  lastModified?: string;
}

interface MediaUploadSyncData {
  checklistItemId: string;
  mediaId: string;
  type: 'photo' | 'video';
}

type SyncItemData = InspectionSyncData | ChecklistItemSyncData | MediaUploadSyncData;

interface SyncItem extends BaseSyncItem {
  data: SyncItemData;
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingUploads: number;
  failedUploads: number;
  totalSyncItems: number;
  batchProgress?: BatchProgress;
}

interface SyncProgress {
  current: number;
  total: number;
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  currentOperation: string;
  errors: string[];
  batchProgress?: BatchProgress;
}

interface BatchProgress {
  currentBatch: number;
  totalBatches: number;
  batchSize: number;
  itemsInCurrentBatch: number;
  totalItems: number;
}

interface ConflictResolution<T = Record<string, unknown>> {
  strategy: 'client_wins' | 'server_wins' | 'merge' | 'manual';
  clientVersion: number;
  serverVersion: number;
  resolvedData?: T;
}

interface SyncConflict<T = Record<string, unknown>> {
  id: string;
  type: 'inspection' | 'checklist_item' | 'media_upload';
  clientData: T;
  serverData: T;
  timestamp: string;
  resolved: boolean;
  resolution?: ConflictResolution<T>;
}

export class SyncService {
  private isOnline = navigator.onLine;
  private isSyncing = false;
  private lastSyncTime: Date | null = null;
  private readonly BATCH_SIZE = 10; // Process items in batches to avoid overwhelming the server
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second base delay
  private syncProgress: SyncProgress = {
    current: 0,
    total: 0,
    status: 'idle',
    currentOperation: '',
    errors: []
  };
  private syncListeners: ((progress: SyncProgress) => void)[] = [];
  private statusListeners: ((status: SyncStatus) => void)[] = [];
  private conflictResolver: Map<string, SyncConflict<SyncItemData>> = new Map();
  private queueProcessor = new QueueProcessor<void>();

  constructor() {
    this.setupNetworkListeners();
    this.startPeriodicSync();
    this.startAdaptivePeriodicSync();
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      logger.info('Network connection restored', {}, 'SYNC_SERVICE');
      this.triggerSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      logger.info('Network connection lost', {}, 'SYNC_SERVICE');
      this.notifyStatusListeners();
    });
  }

  /**
   * Start periodic sync every 30 seconds when online
   */
  private startPeriodicSync() {
    setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.triggerSync();
      }
    }, 30000);
  }

  /**
   * Enhanced background sync with adaptive intervals
   */
  private startAdaptivePeriodicSync() {
    let syncInterval = 30000; // Start with 30 seconds
    const maxInterval = 300000; // Max 5 minutes
    const minInterval = 10000; // Min 10 seconds
    
    const adaptiveSync = async () => {
      if (this.isOnline && !this.isSyncing) {
        const syncQueue = await offlineStorageService.getSyncQueue();
        
        if (syncQueue.length > 0) {
          await this.triggerSync();
          
          // Decrease interval if there are items to sync
          syncInterval = Math.max(minInterval, syncInterval * 0.8);
        } else {
          // Increase interval if no items to sync
          syncInterval = Math.min(maxInterval, syncInterval * 1.2);
        }
      }
      
      setTimeout(adaptiveSync, syncInterval);
    };
    
    adaptiveSync();
  }

  /**
   * Add sync progress listener
   */
  addSyncListener(listener: (progress: SyncProgress) => void) {
    this.syncListeners.push(listener);
  }

  /**
   * Add sync status listener
   */
  addStatusListener(listener: (status: SyncStatus) => void) {
    this.statusListeners.push(listener);
  }

  /**
   * Remove sync progress listener
   */
  removeSyncListener(listener: (progress: SyncProgress) => void) {
    this.syncListeners = this.syncListeners.filter(l => l !== listener);
  }

  /**
   * Remove sync status listener
   */
  removeStatusListener(listener: (status: SyncStatus) => void) {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }

  /**
   * Notify sync progress listeners
   */
  private notifySyncListeners() {
    this.syncListeners.forEach(listener => listener(this.syncProgress));
  }

  /**
   * Notify status listeners
   */
  private async notifyStatusListeners() {
    const status = await this.getSyncStatus();
    this.statusListeners.forEach(listener => listener(status));
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const syncQueue = await offlineStorageService.getSyncQueue();
    const pendingUploads = syncQueue.filter(item => item.type === 'media_upload').length;
    const failedUploads = syncQueue.filter(item => item.error).length;

    return {
      isOnline: this.isOnline,
      lastSync: this.lastSyncTime,
      pendingUploads,
      failedUploads,
      totalSyncItems: syncQueue.length,
      batchProgress: this.syncProgress.batchProgress
    };
  }

  /**
   * Trigger sync if online and not already syncing
   */
  async triggerSync(): Promise<boolean> {
    if (!this.isOnline || this.isSyncing) {
      return false;
    }

    // Acquire lock to prevent concurrent sync operations
    const releaseLock = await syncQueueLock.acquireLock('sync-operation');

    try {
      logger.info('Starting sync operation', {}, 'SYNC_SERVICE');
      this.isSyncing = true;
      this.syncProgress = {
        current: 0,
        total: 0,
        status: 'syncing',
        currentOperation: 'Preparing sync...',
        errors: []
      };

      // Get a snapshot of the sync queue at this moment
      const syncQueue = await offlineStorageService.getSyncQueue();
      this.syncProgress.total = syncQueue.length;

      if (syncQueue.length === 0) {
        logger.info('No items to sync', {}, 'SYNC_SERVICE');
        this.syncProgress.status = 'completed';
        this.lastSyncTime = new Date();
        this.notifySyncListeners();
        return true;
      }

      // Create atomic snapshot of sync queue for processing
      // This prevents race conditions where items are added/removed during sync
      const queueSnapshot = [...syncQueue]; // Create immutable copy
      const batches = this.createBatches(queueSnapshot, this.BATCH_SIZE);
      this.syncProgress.batchProgress = {
        currentBatch: 0,
        totalBatches: batches.length,
        batchSize: this.BATCH_SIZE,
        itemsInCurrentBatch: 0,
        totalItems: syncQueue.length
      };

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        this.syncProgress.batchProgress.currentBatch = batchIndex + 1;
        this.syncProgress.batchProgress.itemsInCurrentBatch = batch.length;
        this.syncProgress.currentOperation = `Processing batch ${batchIndex + 1} of ${batches.length} (${batch.length} items)...`;
        this.notifySyncListeners();

        // Process batch items using queue processor to prevent race conditions
        const batchItems = batch.map(item => ({
          id: item.id,
          processor: async () => {
            await this.processSyncItemWithRetry(item);
            this.syncProgress.current++;
            this.notifySyncListeners();
          }
        }));

        const results = await this.queueProcessor.processBatch(batchItems, 3);

        // Handle failed items
        for (const result of results) {
          if (!result.success && result.error) {
            const item = batch.find(b => b.id === result.id);
            if (item) {
              logger.error('Failed to process sync item after retries', result.error, 'SYNC_SERVICE');
              this.syncProgress.errors.push(`Failed to sync ${item.type}: ${result.error}`);
              
              // Update sync queue item with error
              await offlineStorageService.updateSyncQueueItem(item.id, {
                error: result.error,
                retries: item.retries + 1,
                lastAttempt: new Date().toISOString()
              });
            }
          }
        }

        // Add delay between batches to prevent rate limiting
        if (batchIndex < batches.length - 1) {
          await this.delay(500);
        }
      }

      this.syncProgress.status = 'completed';
      this.syncProgress.currentOperation = 'Sync completed';
      this.lastSyncTime = new Date();
      
      logger.info('Sync operation completed', {
        processed: this.syncProgress.current,
        total: this.syncProgress.total,
        errors: this.syncProgress.errors.length,
        batches: batches.length
      }, 'SYNC_SERVICE');

      return true;
    } catch (error) {
      logger.error('Sync operation failed', error, 'SYNC_SERVICE');
      this.syncProgress.status = 'failed';
      this.syncProgress.currentOperation = `Sync failed: ${error.message}`;
      this.syncProgress.errors.push(error.message);
      return false;
    } finally {
      this.isSyncing = false;
      this.notifySyncListeners();
      this.notifyStatusListeners();
      releaseLock();
    }
  }

  /**
   * Create batches from sync queue items
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Delay execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process individual sync item with retry logic
   */
  private async processSyncItemWithRetry(item: SyncItem): Promise<void> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        await this.processSyncItem(item);
        return; // Success - exit retry loop
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Sync item failed (attempt ${attempt + 1}/${this.MAX_RETRIES})`, {
          itemId: item.id,
          type: item.type,
          error: error.message
        }, 'SYNC_SERVICE');
        
        // Wait before retrying with exponential backoff
        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }
    
    // All retries failed
    throw lastError || new Error('Sync item failed after all retries');
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: SyncItem): Promise<void> {
    this.syncProgress.currentOperation = `Syncing ${item.type}...`;
    this.notifySyncListeners();

    // Check for conflicts before processing
    const conflictResolution = await this.checkForConflicts(item);
    if (conflictResolution && !conflictResolution.resolved) {
      throw new Error(`Sync conflict detected for ${item.type} ${item.id}`);
    }

    switch (item.type) {
      case 'inspection':
        await this.syncInspection(item);
        break;
      case 'checklist_item':
        await this.syncChecklistItem(item);
        break;
      case 'media_upload':
        await this.syncMediaUpload(item);
        break;
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }

    // Remove successful item from queue
    await offlineStorageService.removeSyncQueueItem(item.id);
  }

  /**
   * Sync inspection data
   */
  private async syncInspection(item: SyncItem): Promise<void> {
    const inspectionData = item.data as InspectionSyncData;
    
    if (item.action === 'create') {
      // Create inspection in database
      const result = await inspectionService.createInspection({
        propertyId: inspectionData.propertyId,
        inspectorId: inspectionData.inspectorId,
        checklistItems: inspectionData.checklistItems.map(item => ({
          title: item.title,
          description: item.description,
          category: item.category,
          required: item.required,
          room_type: item.roomType,
          gpt_prompt: item.gptPrompt,
          reference_photo: item.referencePhoto
        }))
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create inspection');
      }

      // Update offline inspection with server ID
      inspectionData.syncStatus = 'synced';
      await offlineStorageService.storeInspectionOffline(inspectionData);
    } else if (item.action === 'update') {
      // Update inspection progress
      const result = await inspectionService.updateInspectionProgress({
        inspectionId: inspectionData.id,
        currentStep: inspectionData.currentStep,
        status: inspectionData.status,
        checklistItemUpdates: inspectionData.checklistItems.map(item => ({
          id: item.id,
          status: item.status,
          notes: item.notes
        }))
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update inspection');
      }
    }
  }

  /**
   * Sync checklist item data with conflict resolution
   */
  private async syncChecklistItem(item: SyncItem): Promise<void> {
    let checklistData = item.data as ChecklistItemSyncData;
    
    // Check for server-side changes first
    const { data: serverData, error: fetchError } = await supabase
      .from('inspection_checklist_items')
      .select('*')
      .eq('id', checklistData.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to fetch checklist item: ${fetchError.message}`);
    }

    // If server data exists, check for conflicts
    if (serverData) {
      const serverUpdateTime = new Date(serverData.updated_at);
      const clientUpdateTime = new Date(checklistData.completedAt || checklistData.lastModified);
      
      if (serverUpdateTime > clientUpdateTime) {
        // Server has newer data - potential conflict
        const conflict: SyncConflict = {
          id: `checklist_${checklistData.id}`,
          type: 'checklist_item',
          clientData: checklistData,
          serverData,
          timestamp: new Date().toISOString(),
          resolved: false
        };
        
        this.conflictResolver.set(conflict.id, conflict);
        
        // Auto-resolve based on completion status
        if (checklistData.status === 'completed' && serverData.status !== 'completed') {
          // Client completion wins
          conflict.resolution = {
            strategy: 'client_wins',
            clientVersion: 1,
            serverVersion: 1,
            resolvedData: checklistData
          };
        } else if (serverData.status === 'completed' && checklistData.status !== 'completed') {
          // Server completion wins
          conflict.resolution = {
            strategy: 'server_wins',
            clientVersion: 1,
            serverVersion: 1,
            resolvedData: serverData
          };
          
          // Update offline data with server data
          await this.updateOfflineWithServerData(checklistData.id, serverData);
          return;
        } else {
          // Merge approach - combine data
          conflict.resolution = {
            strategy: 'merge',
            clientVersion: 1,
            serverVersion: 1,
            resolvedData: {
              ...serverData,
              ...checklistData,
              // Preserve server completion if it exists
              status: serverData.status === 'completed' ? 'completed' : checklistData.status,
              // Combine notes
              notes: serverData.notes && checklistData.notes ? 
                `${serverData.notes}\n\n${checklistData.notes}` : 
                checklistData.notes || serverData.notes
            }
          };
        }
        
        conflict.resolved = true;
        checklistData = conflict.resolution.resolvedData;
      }
    }
    
    // Update checklist item in database
    const { error } = await supabase
      .from('inspection_checklist_items')
      .update({
        status: checklistData.status,
        notes: checklistData.notes,
        ai_status: checklistData.aiStatus,
        ai_confidence: checklistData.aiConfidence,
        ai_reasoning: checklistData.aiReasoning,
        user_override: checklistData.userOverride,
        completed_at: checklistData.completedAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', checklistData.id);

    if (error) {
      throw new Error(`Failed to update checklist item: ${error.message}`);
    }
  }

  /**
   * Sync media upload
   */
  private async syncMediaUpload(item: SyncItem): Promise<void> {
    const { checklistItemId, mediaId, type } = item.data as MediaUploadSyncData;
    
    // Get media file from offline storage
    const mediaFile = await offlineStorageService.getMediaFile(mediaId);
    if (!mediaFile) {
      throw new Error(`Media file not found: ${mediaId}`);
    }

    // Upload to Supabase storage
    const fileName = `${checklistItemId}/${type}s/${Date.now()}-${mediaFile.file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, mediaFile.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload media: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(fileName);

    // Create media record in database
    const { error: recordError } = await supabase
      .from('media')
      .insert({
        checklist_item_id: checklistItemId,
        type: type as 'photo' | 'video',
        url: publicUrl,
        file_path: fileName,
        created_at: new Date().toISOString()
      });

    if (recordError) {
      throw new Error(`Failed to create media record: ${recordError.message}`);
    }

    logger.info('Media uploaded successfully', {
      mediaId,
      checklistItemId,
      type,
      url: publicUrl
    }, 'SYNC_SERVICE');
  }

  /**
   * Force sync now (called by user action)
   */
  async forceSyncNow(): Promise<boolean> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    logger.info('Force sync requested', {}, 'SYNC_SERVICE');
    return await this.triggerSync();
  }

  /**
   * Get sync progress
   */
  getSyncProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  /**
   * Queue inspection for sync
   */
  async queueInspectionSync(inspectionData: InspectionSyncData, action: 'create' | 'update' = 'create'): Promise<void> {
    const syncItem = {
      id: `inspection_${inspectionData.id}_${Date.now()}`,
      type: 'inspection' as const,
      action,
      data: inspectionData,
      priority: 'high' as const,
      retries: 0,
      timestamp: new Date().toISOString()
    };

    await offlineStorageService.addToSyncQueue(syncItem);
    
    // Trigger sync if online
    if (this.isOnline) {
      setTimeout(() => this.triggerSync(), 1000);
    }
  }

  /**
   * Queue media upload for sync
   */
  async queueMediaUpload(checklistItemId: string, mediaId: string, type: 'photo' | 'video'): Promise<void> {
    const syncItem = {
      id: `media_${mediaId}`,
      type: 'media_upload' as const,
      action: 'create' as const,
      data: { checklistItemId, mediaId, type },
      priority: 'medium' as const,
      retries: 0,
      timestamp: new Date().toISOString()
    };

    await offlineStorageService.addToSyncQueue(syncItem);
    
    // Trigger sync if online
    if (this.isOnline) {
      setTimeout(() => this.triggerSync(), 2000);
    }
  }

  /**
   * Clear failed sync items
   */
  async clearFailedSyncItems(): Promise<void> {
    const syncQueue = await offlineStorageService.getSyncQueue();
    const failedItems = syncQueue.filter(item => item.error);
    
    for (const item of failedItems) {
      await offlineStorageService.removeSyncQueueItem(item.id);
    }
    
    logger.info('Cleared failed sync items', { count: failedItems.length }, 'SYNC_SERVICE');
    this.notifyStatusListeners();
  }

  /**
   * Check for sync conflicts
   */
  private async checkForConflicts(item: SyncItem): Promise<SyncConflict<SyncItemData> | null> {
    const conflictId = `${item.type}_${item.data.id || item.id}`;
    return this.conflictResolver.get(conflictId) || null;
  }

  /**
   * Update offline data with server data
   */
  private async updateOfflineWithServerData(itemId: string, serverData: Record<string, unknown>): Promise<void> {
    // Update offline storage with server data
    // This is a simplified implementation - in practice, you'd update the specific offline record
    logger.info('Updating offline data with server data', { itemId }, 'SYNC_SERVICE');
  }

  /**
   * Get sync conflicts
   */
  getSyncConflicts(): SyncConflict<SyncItemData>[] {
    return Array.from(this.conflictResolver.values());
  }

  /**
   * Resolve sync conflict manually
   */
  async resolveSyncConflict(conflictId: string, resolution: ConflictResolution<SyncItemData>): Promise<boolean> {
    const conflict = this.conflictResolver.get(conflictId);
    if (!conflict) {
      return false;
    }

    conflict.resolution = resolution;
    conflict.resolved = true;

    logger.info('Sync conflict resolved', {
      conflictId,
      strategy: resolution.strategy
    }, 'SYNC_SERVICE');

    // Re-queue the item for sync
    await offlineStorageService.addToSyncQueue({
      id: `resolved_${conflictId}_${Date.now()}`,
      type: conflict.type as any,
      action: 'update',
      data: resolution.resolvedData,
      priority: 'high',
      retries: 0,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  /**
   * Retry failed sync items
   */
  async retryFailedSyncItems(): Promise<void> {
    const syncQueue = await offlineStorageService.getSyncQueue();
    const failedItems = syncQueue.filter(item => item.error && item.retries < this.MAX_RETRIES);
    
    for (const item of failedItems) {
      await offlineStorageService.updateSyncQueueItem(item.id, {
        error: undefined,
        lastAttempt: undefined
      });
    }
    
    logger.info('Reset failed sync items for retry', { count: failedItems.length }, 'SYNC_SERVICE');
    
    // Trigger sync if online
    if (this.isOnline) {
      setTimeout(() => this.triggerSync(), 1000);
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();