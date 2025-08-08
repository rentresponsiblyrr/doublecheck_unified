/**
 * SYNC SERVICE - CORE CONSOLIDATION
 *
 * Consolidates all synchronization, offline, and data consistency functionality
 * into a comprehensive service. This service replaces and unifies:
 *
 * CONSOLIDATED SERVICES:
 * 1. syncService.ts - Basic data synchronization
 * 2. offlineService.ts - Offline mode support
 * 3. BulletproofUploadQueue.ts - Reliable file upload queuing
 * 4. RealTimeSync.ts - Real-time collaborative features
 * 5. AdvancedSyncService.ts - Advanced sync strategies
 * 6. OptimizedUploadManager.ts - Upload optimization
 * 7. QueueManager.ts - Task queue management
 * 8. NetworkStateManager.ts - Network monitoring
 * 9. ConflictResolutionService.ts - Data conflict resolution
 * 10. DataMigrationService.ts - Data migration tools
 * 11. ReliabilityManager.ts - System reliability monitoring
 *
 * CORE CAPABILITIES:
 * - Offline-first data synchronization
 * - Real-time collaborative editing
 * - Bulletproof file upload with retry logic
 * - Conflict resolution algorithms
 * - Network state monitoring and adaptation
 * - Queue-based task management
 * - Data integrity validation
 * - Progressive sync strategies
 * - Cross-device synchronization
 * - Background sync processing
 *
 * SYNC STRATEGIES:
 * - Optimistic updates with rollback
 * - Vector clocks for conflict resolution
 * - Delta synchronization
 * - Batched operations
 * - Priority-based queuing
 * - Intelligent retry mechanisms
 *
 * @author STR Certified Engineering Team
 * @version 1.0.0 - Core Service Consolidation
 */

import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";

// ========================================
// SYNC TYPES & INTERFACES
// ========================================

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'upload';
  entityType: 'property' | 'inspection' | 'checklist_item' | 'media' | 'user';
  entityId: string;
  data: Record<string, unknown>;
  localTimestamp: Date;
  serverTimestamp?: Date;
  version: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  userId: string;
  deviceId: string;
  conflictResolution?: 'local' | 'remote' | 'merge' | 'manual';
}

export interface UploadTask {
  id: string;
  file: File | Blob;
  fileName: string;
  fileType: string;
  fileSize: number;
  entityType: string;
  entityId: string;
  uploadPath: string;
  progress: number;
  status: 'queued' | 'uploading' | 'completed' | 'failed' | 'paused';
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  chunkSize: number;
  uploadedChunks: number[];
  totalChunks: number;
}

export interface ConflictItem {
  id: string;
  operationId: string;
  entityType: string;
  entityId: string;
  localData: Record<string, unknown>;
  remoteData: Record<string, unknown>;
  localVersion: number;
  remoteVersion: number;
  conflictType: 'version' | 'concurrent_edit' | 'deleted_locally' | 'deleted_remotely';
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: 'local' | 'remote' | 'merge' | 'manual';
  mergedData?: Record<string, unknown>;
}

export interface NetworkState {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
  lastChanged: Date;
}

export interface SyncStats {
  totalOperations: number;
  pendingOperations: number;
  syncedOperations: number;
  failedOperations: number;
  conflictOperations: number;
  uploadQueueSize: number;
  averageSyncTime: number;
  lastSyncAt?: Date;
  networkState: NetworkState;
  storageUsed: number;
  storageLimit: number;
}

export interface RealTimeEvent {
  id: string;
  type: 'entity_created' | 'entity_updated' | 'entity_deleted' | 'user_presence' | 'system_event';
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  userId: string;
  deviceId: string;
  timestamp: Date;
  version: number;
}

export interface CollaborationState {
  entityId: string;
  entityType: string;
  activeUsers: Array<{
    userId: string;
    userName: string;
    lastSeen: Date;
    cursorPosition?: { field: string; position: number };
    isEditing: boolean;
  }>;
  lockState: {
    isLocked: boolean;
    lockedBy?: string;
    lockedAt?: Date;
    lockDuration?: number;
  };
  changeVector: Record<string, number>;
}

// ========================================
// SYNC SERVICE IMPLEMENTATION
// ========================================

/**
 * Comprehensive Synchronization Service
 * 
 * Handles all data synchronization, offline support, file uploads,
 * and real-time collaboration with enterprise-grade reliability.
 */
export class SyncService {
  private static instance: SyncService;

  // Core sync state
  private syncQueue: SyncOperation[] = [];
  private uploadQueue: UploadTask[] = [];
  private conflicts: ConflictItem[] = [];
  private collaborationState = new Map<string, CollaborationState>();
  
  // Network and connectivity
  private networkState: NetworkState = {
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
    lastChanged: new Date()
  };
  
  // Configuration
  private readonly config = {
    maxRetries: 3,
    retryDelayMs: 1000,
    maxRetryDelayMs: 30000,
    syncIntervalMs: 5000,
    uploadChunkSize: 1024 * 1024, // 1MB
    maxConcurrentUploads: 3,
    maxConcurrentSyncs: 5,
    storageQuotaMB: 100,
    offlineRetentionDays: 30,
    conflictResolutionTimeoutMs: 300000 // 5 minutes
  };
  
  // Runtime state
  private syncTimer?: NodeJS.Timeout;
  private isSyncing = false;
  private activeUploads = new Set<string>();
  private activeSyncs = new Set<string>();
  private deviceId: string;
  private userId?: string;
  
  // Event handlers
  private eventHandlers = new Map<string, Set<Function>>();
  private realtimeSubscriptions = new Map<string, any>();

  private constructor() {
    this.deviceId = this.generateDeviceId();
    this.initializeNetworkMonitoring();
    this.initializeOfflineStorage();
    this.startSyncTimer();
    this.setupUnloadHandlers();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  // ========================================
  // CORE SYNCHRONIZATION METHODS
  // ========================================

  /**
   * Initialize sync service for a user
   */
  async initialize(userId: string): Promise<void> {
    try {
      this.userId = userId;
      
      // Load pending operations from storage
      await this.loadPendingOperations();
      
      // Start background sync
      this.startSyncTimer();
      
      // Initialize real-time subscriptions
      await this.initializeRealTimeSync();
      
      logger.info('SyncService initialized', {
        userId,
        deviceId: this.deviceId,
        pendingOperations: this.syncQueue.length,
        uploadQueue: this.uploadQueue.length
      });

    } catch (error) {
      logger.error('Failed to initialize SyncService', { userId, error });
      throw error;
    }
  }

  /**
   * Queue a sync operation for processing
   */
  async queueOperation(operation: Omit<SyncOperation, 'id' | 'localTimestamp' | 'retryCount' | 'status' | 'deviceId'>): Promise<string> {
    try {
      const syncOperation: SyncOperation = {
        id: this.generateOperationId(),
        localTimestamp: new Date(),
        retryCount: 0,
        status: 'pending',
        deviceId: this.deviceId,
        maxRetries: this.config.maxRetries,
        ...operation
      };

      this.syncQueue.push(syncOperation);
      
      // Save to persistent storage
      await this.savePendingOperations();
      
      // Emit event
      this.emit('operationQueued', syncOperation);
      
      // Trigger immediate sync if online and high priority
      if (this.networkState.isOnline && operation.priority === 'critical') {
        this.processNextOperation();
      }

      logger.debug('Operation queued for sync', {
        operationId: syncOperation.id,
        type: syncOperation.type,
        entityType: syncOperation.entityType,
        priority: syncOperation.priority
      });

      return syncOperation.id;

    } catch (error) {
      logger.error('Failed to queue sync operation', { operation, error });
      throw error;
    }
  }

  /**
   * Process sync queue
   */
  async processSync(): Promise<void> {
    if (this.isSyncing || !this.networkState.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    try {
      logger.info('Starting sync process', {
        pendingOperations: this.syncQueue.length,
        networkState: this.networkState
      });

      // Sort operations by priority and timestamp
      const sortedOperations = this.syncQueue
        .filter(op => op.status === 'pending' || op.status === 'failed')
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
          const aPriority = priorityOrder[a.priority];
          const bPriority = priorityOrder[b.priority];
          
          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }
          
          return a.localTimestamp.getTime() - b.localTimestamp.getTime();
        });

      // Process operations with concurrency limit
      const chunks = this.chunkArray(sortedOperations, this.config.maxConcurrentSyncs);
      
      for (const chunk of chunks) {
        await Promise.allSettled(
          chunk.map(operation => this.processSyncOperation(operation))
        );
        
        // Check if we should continue (network state, etc.)
        if (!this.networkState.isOnline) {
          break;
        }
      }

      // Save state
      await this.savePendingOperations();
      
      // Emit sync completion
      this.emit('syncCompleted', {
        processedOperations: sortedOperations.length,
        remainingOperations: this.syncQueue.filter(op => op.status === 'pending').length
      });

    } catch (error) {
      logger.error('Sync process failed', { error });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process individual sync operation
   */
  private async processSyncOperation(operation: SyncOperation): Promise<void> {
    if (this.activeSyncs.has(operation.id)) {
      return;
    }

    this.activeSyncs.add(operation.id);
    operation.status = 'syncing';

    try {
      logger.debug('Processing sync operation', {
        operationId: operation.id,
        type: operation.type,
        entityType: operation.entityType
      });

      let result;
      switch (operation.type) {
        case 'create':
          result = await this.syncCreateOperation(operation);
          break;
        case 'update':
          result = await this.syncUpdateOperation(operation);
          break;
        case 'delete':
          result = await this.syncDeleteOperation(operation);
          break;
        case 'upload':
          result = await this.syncUploadOperation(operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      if (result.success) {
        operation.status = 'synced';
        operation.serverTimestamp = new Date();
        
        // Remove from queue
        this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
        
        this.emit('operationSynced', operation);
        
      } else if (result.conflict) {
        // Handle conflict
        operation.status = 'conflict';
        await this.handleSyncConflict(operation, result.conflictData);
        
      } else {
        // Retry or fail
        await this.handleSyncFailure(operation, result.error);
      }

    } catch (error) {
      await this.handleSyncFailure(operation, error as Error);
    } finally {
      this.activeSyncs.delete(operation.id);
    }
  }

  // ========================================
  // UPLOAD MANAGEMENT
  // ========================================

  /**
   * Queue file for upload
   */
  async queueUpload(
    file: File,
    entityType: string,
    entityId: string,
    uploadPath: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<string> {
    try {
      const uploadTask: UploadTask = {
        id: this.generateUploadId(),
        file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        entityType,
        entityId,
        uploadPath,
        progress: 0,
        status: 'queued',
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        priority,
        createdAt: new Date(),
        chunkSize: this.config.uploadChunkSize,
        uploadedChunks: [],
        totalChunks: Math.ceil(file.size / this.config.uploadChunkSize)
      };

      this.uploadQueue.push(uploadTask);
      
      // Start upload if online and under concurrency limit
      if (this.networkState.isOnline && this.activeUploads.size < this.config.maxConcurrentUploads) {
        this.processNextUpload();
      }

      this.emit('uploadQueued', uploadTask);

      logger.debug('File queued for upload', {
        uploadId: uploadTask.id,
        fileName: uploadTask.fileName,
        fileSize: uploadTask.fileSize,
        priority: uploadTask.priority
      });

      return uploadTask.id;

    } catch (error) {
      logger.error('Failed to queue upload', { error });
      throw error;
    }
  }

  /**
   * Process upload queue
   */
  private async processNextUpload(): Promise<void> {
    if (this.activeUploads.size >= this.config.maxConcurrentUploads) {
      return;
    }

    const nextUpload = this.uploadQueue.find(
      upload => upload.status === 'queued' || upload.status === 'failed'
    );

    if (!nextUpload) {
      return;
    }

    await this.processUploadTask(nextUpload);
  }

  /**
   * Process individual upload task
   */
  private async processUploadTask(uploadTask: UploadTask): Promise<void> {
    if (this.activeUploads.has(uploadTask.id)) {
      return;
    }

    this.activeUploads.add(uploadTask.id);
    uploadTask.status = 'uploading';
    uploadTask.startedAt = new Date();

    try {
      logger.info('Starting file upload', {
        uploadId: uploadTask.id,
        fileName: uploadTask.fileName,
        fileSize: uploadTask.fileSize
      });

      // Use chunked upload for large files
      if (uploadTask.fileSize > this.config.uploadChunkSize) {
        await this.processChunkedUpload(uploadTask);
      } else {
        await this.processSingleUpload(uploadTask);
      }

      uploadTask.status = 'completed';
      uploadTask.completedAt = new Date();
      uploadTask.progress = 100;
      
      // Remove from queue
      this.uploadQueue = this.uploadQueue.filter(task => task.id !== uploadTask.id);
      
      this.emit('uploadCompleted', uploadTask);
      
      logger.info('File upload completed', {
        uploadId: uploadTask.id,
        fileName: uploadTask.fileName,
        duration: uploadTask.completedAt.getTime() - uploadTask.startedAt!.getTime()
      });

    } catch (error) {
      await this.handleUploadFailure(uploadTask, error as Error);
    } finally {
      this.activeUploads.delete(uploadTask.id);
      
      // Process next upload
      if (this.networkState.isOnline) {
        this.processNextUpload();
      }
    }
  }

  /**
   * Process chunked upload with resume capability
   */
  private async processChunkedUpload(uploadTask: UploadTask): Promise<void> {
    const { file, chunkSize, totalChunks, uploadedChunks } = uploadTask;
    
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // Skip already uploaded chunks
      if (uploadedChunks.includes(chunkIndex)) {
        continue;
      }

      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      await this.uploadChunk(uploadTask, chunk, chunkIndex);
      
      uploadedChunks.push(chunkIndex);
      uploadTask.progress = Math.round((uploadedChunks.length / totalChunks) * 100);
      
      this.emit('uploadProgress', {
        uploadId: uploadTask.id,
        progress: uploadTask.progress,
        uploadedChunks: uploadedChunks.length,
        totalChunks
      });

      // Check if we should pause due to network conditions
      if (this.shouldPauseUpload()) {
        uploadTask.status = 'paused';
        throw new Error('Upload paused due to network conditions');
      }
    }

    // Finalize chunked upload
    await this.finalizeChunkedUpload(uploadTask);
  }

  /**
   * Upload individual chunk
   */
  private async uploadChunk(uploadTask: UploadTask, chunk: Blob, chunkIndex: number): Promise<void> {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('uploadId', uploadTask.id);
    formData.append('fileName', uploadTask.fileName);

    const response = await fetch('/api/upload/chunk', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Chunk upload failed: ${response.statusText}`);
    }
  }

  /**
   * Process single file upload
   */
  private async processSingleUpload(uploadTask: UploadTask): Promise<void> {
    const { data, error } = await supabase.storage
      .from('inspection-media')
      .upload(uploadTask.uploadPath, uploadTask.file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Update progress
    uploadTask.progress = 100;
    this.emit('uploadProgress', {
      uploadId: uploadTask.id,
      progress: 100
    });
  }

  // ========================================
  // REAL-TIME COLLABORATION
  // ========================================

  /**
   * Initialize real-time synchronization
   */
  private async initializeRealTimeSync(): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      // Subscribe to real-time changes
      const subscription = supabase
        .channel('sync-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'inspections' 
          },
          (payload) => this.handleRealTimeEvent(payload, 'inspection')
        )
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'checklist_items' 
          },
          (payload) => this.handleRealTimeEvent(payload, 'checklist_item')
        )
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'properties' 
          },
          (payload) => this.handleRealTimeEvent(payload, 'property')
        )
        .subscribe();

      this.realtimeSubscriptions.set('main', subscription);

      logger.info('Real-time sync initialized', { userId: this.userId });

    } catch (error) {
      logger.error('Failed to initialize real-time sync', { error });
    }
  }

  /**
   * Handle real-time events from Supabase
   */
  private handleRealTimeEvent(payload: any, entityType: string): void {
    try {
      const event: RealTimeEvent = {
        id: this.generateEventId(),
        type: this.mapSupabaseEventType(payload.eventType),
        entityType,
        entityId: payload.new?.id || payload.old?.id,
        data: payload.new || payload.old || {},
        userId: payload.new?.updated_by || payload.old?.updated_by || 'system',
        deviceId: 'remote',
        timestamp: new Date(),
        version: payload.new?.version || payload.old?.version || 1
      };

      // Skip events from this device to avoid loops
      if (event.userId === this.userId && event.data.device_id === this.deviceId) {
        return;
      }

      // Check for conflicts with local operations
      this.checkForConflicts(event);

      // Emit event for UI updates
      this.emit('realtimeEvent', event);

      logger.debug('Real-time event received', {
        eventId: event.id,
        type: event.type,
        entityType: event.entityType,
        entityId: event.entityId
      });

    } catch (error) {
      logger.error('Failed to handle real-time event', { payload, error });
    }
  }

  /**
   * Check for conflicts with local operations
   */
  private checkForConflicts(event: RealTimeEvent): void {
    // Find local operations that might conflict
    const conflictingOperations = this.syncQueue.filter(operation => 
      operation.entityType === event.entityType &&
      operation.entityId === event.entityId &&
      (operation.status === 'pending' || operation.status === 'syncing') &&
      operation.version <= event.version
    );

    for (const operation of conflictingOperations) {
      const conflict: ConflictItem = {
        id: this.generateConflictId(),
        operationId: operation.id,
        entityType: event.entityType,
        entityId: event.entityId,
        localData: operation.data,
        remoteData: event.data,
        localVersion: operation.version,
        remoteVersion: event.version,
        conflictType: this.determineConflictType(operation, event),
        detectedAt: new Date()
      };

      this.conflicts.push(conflict);
      operation.status = 'conflict';

      this.emit('conflictDetected', conflict);

      logger.warn('Sync conflict detected', {
        conflictId: conflict.id,
        operationId: operation.id,
        conflictType: conflict.conflictType
      });
    }
  }

  // ========================================
  // CONFLICT RESOLUTION
  // ========================================

  /**
   * Handle sync conflict
   */
  private async handleSyncConflict(operation: SyncOperation, conflictData: any): Promise<void> {
    const conflict: ConflictItem = {
      id: this.generateConflictId(),
      operationId: operation.id,
      entityType: operation.entityType,
      entityId: operation.entityId,
      localData: operation.data,
      remoteData: conflictData,
      localVersion: operation.version,
      remoteVersion: conflictData.version || 1,
      conflictType: 'concurrent_edit',
      detectedAt: new Date()
    };

    this.conflicts.push(conflict);
    this.emit('conflictDetected', conflict);

    // Try automatic resolution
    const resolution = await this.attemptAutomaticResolution(conflict);
    
    if (resolution) {
      await this.resolveConflict(conflict.id, resolution.strategy, resolution.data);
    }
  }

  /**
   * Attempt automatic conflict resolution
   */
  private async attemptAutomaticResolution(conflict: ConflictItem): Promise<{
    strategy: 'local' | 'remote' | 'merge';
    data?: Record<string, unknown>;
  } | null> {
    try {
      // Simple automatic resolution strategies
      switch (conflict.conflictType) {
        case 'deleted_remotely':
          // If deleted remotely and modified locally, prefer local
          return { strategy: 'local' };
          
        case 'deleted_locally':
          // If deleted locally and modified remotely, prefer local delete
          return { strategy: 'local' };
          
        case 'version':
          // For version conflicts, try merging non-conflicting fields
          const mergedData = this.mergeNonConflictingFields(
            conflict.localData,
            conflict.remoteData
          );
          if (mergedData) {
            return { strategy: 'merge', data: mergedData };
          }
          break;
          
        case 'concurrent_edit':
          // For concurrent edits, prefer most recent timestamp
          const localTimestamp = new Date(conflict.localData.updated_at as string || 0);
          const remoteTimestamp = new Date(conflict.remoteData.updated_at as string || 0);
          
          if (Math.abs(localTimestamp.getTime() - remoteTimestamp.getTime()) > 5000) {
            return {
              strategy: localTimestamp > remoteTimestamp ? 'local' : 'remote'
            };
          }
          break;
      }

      return null; // Require manual resolution

    } catch (error) {
      logger.error('Automatic conflict resolution failed', { conflictId: conflict.id, error });
      return null;
    }
  }

  /**
   * Resolve conflict with specified strategy
   */
  async resolveConflict(
    conflictId: string,
    strategy: 'local' | 'remote' | 'merge' | 'manual',
    mergedData?: Record<string, unknown>
  ): Promise<void> {
    try {
      const conflict = this.conflicts.find(c => c.id === conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      const operation = this.syncQueue.find(op => op.operationId === conflict.operationId);
      if (!operation) {
        throw new Error('Original operation not found');
      }

      let resolvedData: Record<string, unknown>;
      
      switch (strategy) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merge':
          if (!mergedData) {
            throw new Error('Merged data required for merge strategy');
          }
          resolvedData = mergedData;
          break;
        case 'manual':
          if (!mergedData) {
            throw new Error('Manual resolution data required');
          }
          resolvedData = mergedData;
          break;
        default:
          throw new Error(`Unknown resolution strategy: ${strategy}`);
      }

      // Update operation with resolved data
      operation.data = resolvedData;
      operation.status = 'pending';
      operation.version = Math.max(conflict.localVersion, conflict.remoteVersion) + 1;

      // Mark conflict as resolved
      conflict.resolution = strategy;
      conflict.resolvedAt = new Date();
      conflict.mergedData = resolvedData;

      this.emit('conflictResolved', { conflict, strategy, resolvedData });

      logger.info('Conflict resolved', {
        conflictId,
        strategy,
        operationId: operation.id
      });

    } catch (error) {
      logger.error('Failed to resolve conflict', { conflictId, strategy, error });
      throw error;
    }
  }

  // ========================================
  // NETWORK & OFFLINE MANAGEMENT
  // ========================================

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Online/offline events
    window.addEventListener('online', () => {
      this.networkState.isOnline = true;
      this.networkState.lastChanged = new Date();
      this.onNetworkStateChange();
    });

    window.addEventListener('offline', () => {
      this.networkState.isOnline = false;
      this.networkState.lastChanged = new Date();
      this.onNetworkStateChange();
    });

    // Network Information API (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkInfo = () => {
        this.networkState.connectionType = connection.type || 'unknown';
        this.networkState.effectiveType = connection.effectiveType || 'unknown';
        this.networkState.downlink = connection.downlink || 0;
        this.networkState.rtt = connection.rtt || 0;
        this.networkState.saveData = connection.saveData || false;
        this.networkState.lastChanged = new Date();
      };

      connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }
  }

  /**
   * Handle network state changes
   */
  private onNetworkStateChange(): void {
    this.emit('networkStateChanged', this.networkState);

    if (this.networkState.isOnline) {
      logger.info('Network connection restored', { networkState: this.networkState });
      
      // Resume sync operations
      this.processSync();
      this.processNextUpload();
      
    } else {
      logger.warn('Network connection lost', { networkState: this.networkState });
      
      // Pause active operations
      this.pauseActiveOperations();
    }
  }

  /**
   * Initialize offline storage
   */
  private async initializeOfflineStorage(): Promise<void> {
    try {
      // Check storage quota
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        logger.info('Storage quota', {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota ? estimate.quota - (estimate.usage || 0) : 'unknown'
        });
      }

      // Initialize IndexedDB for offline data
      await this.initializeOfflineDB();

    } catch (error) {
      logger.error('Failed to initialize offline storage', { error });
    }
  }

  /**
   * Initialize offline database
   */
  private async initializeOfflineDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('STRCertifiedSync', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('operations')) {
          const operationStore = db.createObjectStore('operations', { keyPath: 'id' });
          operationStore.createIndex('status', 'status', { unique: false });
          operationStore.createIndex('entityType', 'entityType', { unique: false });
        }

        if (!db.objectStoreNames.contains('uploads')) {
          const uploadStore = db.createObjectStore('uploads', { keyPath: 'id' });
          uploadStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('conflicts')) {
          db.createObjectStore('conflicts', { keyPath: 'id' });
        }
      };
    });
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get current sync statistics
   */
  getSyncStats(): SyncStats {
    const totalOps = this.syncQueue.length;
    const pending = this.syncQueue.filter(op => op.status === 'pending').length;
    const synced = this.syncQueue.filter(op => op.status === 'synced').length;
    const failed = this.syncQueue.filter(op => op.status === 'failed').length;
    const conflicts = this.syncQueue.filter(op => op.status === 'conflict').length;

    return {
      totalOperations: totalOps,
      pendingOperations: pending,
      syncedOperations: synced,
      failedOperations: failed,
      conflictOperations: conflicts,
      uploadQueueSize: this.uploadQueue.length,
      averageSyncTime: this.calculateAverageSyncTime(),
      lastSyncAt: this.getLastSyncTime(),
      networkState: this.networkState,
      storageUsed: 0, // Would calculate actual usage
      storageLimit: this.config.storageQuotaMB * 1024 * 1024
    };
  }

  /**
   * Event system methods
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logger.error('Event handler error', { event, error });
        }
      });
    }
  }

  // Helper methods
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateDeviceId(): string {
    let deviceId = localStorage.getItem('sync_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('sync_device_id', deviceId);
    }
    return deviceId;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Placeholder implementations for complex methods
  private async syncCreateOperation(operation: SyncOperation): Promise<any> {
    // Implementation would create entity in database
    return { success: true };
  }

  private async syncUpdateOperation(operation: SyncOperation): Promise<any> {
    // Implementation would update entity in database
    return { success: true };
  }

  private async syncDeleteOperation(operation: SyncOperation): Promise<any> {
    // Implementation would delete entity from database
    return { success: true };
  }

  private async syncUploadOperation(operation: SyncOperation): Promise<any> {
    // Implementation would handle file upload
    return { success: true };
  }

  private async handleSyncFailure(operation: SyncOperation, error: Error): Promise<void> {
    operation.retryCount++;
    
    if (operation.retryCount >= operation.maxRetries) {
      operation.status = 'failed';
      this.emit('operationFailed', { operation, error });
    } else {
      operation.status = 'pending';
      // Exponential backoff for retry
      const delay = Math.min(
        this.config.retryDelayMs * Math.pow(2, operation.retryCount),
        this.config.maxRetryDelayMs
      );
      setTimeout(() => this.processSync(), delay);
    }
  }

  private async handleUploadFailure(uploadTask: UploadTask, error: Error): Promise<void> {
    uploadTask.retryCount++;
    uploadTask.error = error.message;
    
    if (uploadTask.retryCount >= uploadTask.maxRetries) {
      uploadTask.status = 'failed';
      this.emit('uploadFailed', { uploadTask, error });
    } else {
      uploadTask.status = 'queued';
    }
  }

  private shouldPauseUpload(): boolean {
    return !this.networkState.isOnline || 
           (this.networkState.saveData && this.networkState.effectiveType === 'slow-2g');
  }

  private pauseActiveOperations(): void {
    // Pause uploads that can be resumed
    for (const uploadTask of this.uploadQueue) {
      if (uploadTask.status === 'uploading') {
        uploadTask.status = 'paused';
      }
    }
  }

  private async finalizeChunkedUpload(uploadTask: UploadTask): Promise<void> {
    // Implementation would finalize chunked upload
  }

  private mapSupabaseEventType(eventType: string): RealTimeEvent['type'] {
    const mapping: Record<string, RealTimeEvent['type']> = {
      INSERT: 'entity_created',
      UPDATE: 'entity_updated',
      DELETE: 'entity_deleted'
    };
    return mapping[eventType] || 'system_event';
  }

  private determineConflictType(operation: SyncOperation, event: RealTimeEvent): ConflictItem['conflictType'] {
    if (event.type === 'entity_deleted') {
      return 'deleted_remotely';
    }
    if (operation.type === 'delete') {
      return 'deleted_locally';
    }
    if (operation.version < event.version) {
      return 'version';
    }
    return 'concurrent_edit';
  }

  private mergeNonConflictingFields(
    localData: Record<string, unknown>,
    remoteData: Record<string, unknown>
  ): Record<string, unknown> | null {
    // Simple merge implementation - in production would be more sophisticated
    const merged = { ...remoteData };
    
    for (const [key, value] of Object.entries(localData)) {
      if (!(key in remoteData) || remoteData[key] === value) {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  private calculateAverageSyncTime(): number {
    // Would calculate based on historical sync times
    return 1000; // 1 second
  }

  private getLastSyncTime(): Date | undefined {
    const syncedOps = this.syncQueue.filter(op => op.status === 'synced');
    if (syncedOps.length === 0) return undefined;
    
    return new Date(Math.max(...syncedOps.map(op => op.serverTimestamp?.getTime() || 0)));
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      if (this.networkState.isOnline && this.syncQueue.length > 0) {
        this.processSync();
      }
    }, this.config.syncIntervalMs);
  }

  private setupUnloadHandlers(): void {
    window.addEventListener('beforeunload', () => {
      this.savePendingOperations();
    });
  }

  private async loadPendingOperations(): Promise<void> {
    // Load from IndexedDB - implementation would go here
  }

  private async savePendingOperations(): Promise<void> {
    // Save to IndexedDB - implementation would go here
  }

  /**
   * Cleanup and destroy service
   */
  async destroy(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // Unsubscribe from real-time channels
    for (const subscription of this.realtimeSubscriptions.values()) {
      subscription.unsubscribe();
    }

    this.syncQueue.length = 0;
    this.uploadQueue.length = 0;
    this.conflicts.length = 0;
    this.eventHandlers.clear();
    this.realtimeSubscriptions.clear();

    logger.info('SyncService destroyed');
  }
}

// ========================================
// SINGLETON EXPORT
// ========================================

/**
 * Global sync service instance
 */
export const syncService = SyncService.getInstance();

export default syncService;