/**
 * Reliable Submission Service
 * Ensures all inspection data is properly submitted with retry logic
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { offlineService } from './offlineService';
import { dataValidation } from './dataValidationService';
import { errorRecovery } from './errorRecoveryService';

interface SubmissionItem {
  id: string;
  type: 'inspection' | 'checklist' | 'media' | 'property';
  data: any;
  status: 'pending' | 'submitting' | 'completed' | 'failed';
  attempts: number;
  lastError?: string;
  timestamp: Date;
}

interface SubmissionResult {
  success: boolean;
  id?: string;
  error?: string;
  retryable: boolean;
}

export class ReliableSubmissionService {
  private static instance: ReliableSubmissionService;
  private submissionQueue: Map<string, SubmissionItem> = new Map();
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startProcessingQueue();
    this.loadPendingSubmissions();
  }

  static getInstance(): ReliableSubmissionService {
    if (!ReliableSubmissionService.instance) {
      ReliableSubmissionService.instance = new ReliableSubmissionService();
    }
    return ReliableSubmissionService.instance;
  }

  /**
   * Submit inspection with reliability guarantees
   */
  async submitInspection(inspectionId: string): Promise<SubmissionResult> {
    try {
      // Validate inspection exists and is complete
      const { data: inspection, error: fetchError } = await supabase
        .from('inspections')
        .select(`
          *,
          checklist_items (
            *,
            media (*)
          )
        `)
        .eq('id', inspectionId)
        .single();

      if (fetchError || !inspection) {
        throw new Error('Inspection not found');
      }

      // Validate all required checklist items are completed
      const incompleteItems = inspection.checklist_items.filter(
        item => !item.status || item.status === 'pending'
      );

      if (incompleteItems.length > 0) {
        logger.warn('Inspection has incomplete items', {
          inspectionId,
          incompleteCount: incompleteItems.length
        });

        // Queue for later submission
        return this.queueSubmission({
          id: inspectionId,
          type: 'inspection',
          data: inspection,
          status: 'pending',
          attempts: 0,
          timestamp: new Date()
        });
      }

      // Mark inspection as completed
      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectionId);

      if (updateError) {
        throw updateError;
      }

      logger.info('Inspection submitted successfully', { inspectionId });

      return {
        success: true,
        id: inspectionId,
        retryable: false
      };
    } catch (error) {
      logger.error('Failed to submit inspection', { inspectionId, error });

      // Queue for retry
      const queueResult = await this.queueSubmission({
        id: inspectionId,
        type: 'inspection',
        data: { inspectionId },
        status: 'pending',
        attempts: 0,
        timestamp: new Date(),
        lastError: error instanceof Error ? error.message : 'Unknown error'
      });

      return queueResult;
    }
  }

  /**
   * Submit checklist item update reliably
   */
  async submitChecklistItem(
    itemId: string, 
    updates: any
  ): Promise<SubmissionResult> {
    try {
      // Validate updates
      const validation = dataValidation.validateChecklistItemUpdate(updates);
      if (!validation.success) {
        throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
      }

      // Apply update with retry logic
      const result = await errorRecovery.handleError(
        async () => {
          const { data, error } = await supabase
            .from('checklist_items')
            .update(validation.data)
            .eq('id', itemId)
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        {
          operation: 'update_checklist',
          data: { id: itemId, updates },
          timestamp: new Date()
        }
      );

      logger.info('Checklist item submitted successfully', { itemId });

      return {
        success: true,
        id: itemId,
        retryable: false
      };
    } catch (error) {
      logger.error('Failed to submit checklist item', { itemId, error });

      // Queue for retry if online
      if (navigator.onLine) {
        return this.queueSubmission({
          id: itemId,
          type: 'checklist',
          data: { itemId, updates },
          status: 'pending',
          attempts: 0,
          timestamp: new Date(),
          lastError: error instanceof Error ? error.message : 'Unknown error'
        });
      } else {
        // Use offline service for offline queue
        await offlineService.updateChecklistItem(itemId, updates);
        return {
          success: false,
          error: 'Queued for offline sync',
          retryable: true
        };
      }
    }
  }

  /**
   * Submit media upload reliably
   */
  async submitMedia(
    file: File,
    checklistItemId: string,
    inspectionId: string
  ): Promise<SubmissionResult> {
    try {
      // Validate file
      const validation = dataValidation.validatePhotoUpload({
        file,
        checklist_item_id: checklistItemId,
        inspection_id: inspectionId
      });

      if (!validation.success) {
        throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
      }

      // Generate unique file path
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `inspections/${inspectionId}/${fileName}`;

      // Upload with retry logic
      const uploadResult = await errorRecovery.handleError(
        async () => {
          const { data, error } = await supabase.storage
            .from('inspection-photos')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;
          return data;
        },
        {
          operation: 'upload_photo',
          data: { file, path: filePath },
          timestamp: new Date()
        }
      );

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(filePath);

      // Create media record
      const { data: mediaRecord, error: mediaError } = await supabase
        .from('media')
        .insert({
          checklist_item_id: checklistItemId,
          type: 'photo',
          url: publicUrl,
          file_path: filePath,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      logger.info('Media submitted successfully', { 
        mediaId: mediaRecord.id,
        checklistItemId 
      });

      return {
        success: true,
        id: mediaRecord.id,
        retryable: false
      };
    } catch (error) {
      logger.error('Failed to submit media', { checklistItemId, error });

      // Queue for retry
      if (navigator.onLine) {
        // Store file in IndexedDB for later retry
        const fileData = await this.fileToBase64(file);
        
        return this.queueSubmission({
          id: `media_${checklistItemId}_${Date.now()}`,
          type: 'media',
          data: {
            fileData,
            fileName: file.name,
            fileType: file.type,
            checklistItemId,
            inspectionId
          },
          status: 'pending',
          attempts: 0,
          timestamp: new Date(),
          lastError: error instanceof Error ? error.message : 'Unknown error'
        });
      } else {
        // Use offline service
        const localUrl = await offlineService.queuePhotoUpload(file, checklistItemId);
        return {
          success: false,
          error: 'Queued for offline sync',
          retryable: true
        };
      }
    }
  }

  /**
   * Queue submission for retry
   */
  private async queueSubmission(item: SubmissionItem): Promise<SubmissionResult> {
    this.submissionQueue.set(item.id, item);
    this.savePendingSubmissions();

    logger.info('Submission queued for retry', {
      id: item.id,
      type: item.type,
      attempts: item.attempts
    });

    return {
      success: false,
      error: 'Queued for retry',
      retryable: true
    };
  }

  /**
   * Process submission queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;

    this.isProcessing = true;
    const pendingItems = Array.from(this.submissionQueue.values())
      .filter(item => item.status === 'pending' || item.status === 'failed')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (const item of pendingItems) {
      if (item.attempts >= 5) {
        // Max retries reached
        item.status = 'failed';
        logger.error('Submission failed after max retries', {
          id: item.id,
          type: item.type
        });
        continue;
      }

      item.status = 'submitting';
      item.attempts++;

      try {
        let result: SubmissionResult;

        switch (item.type) {
          case 'inspection':
            result = await this.retryInspectionSubmission(item.data);
            break;
          case 'checklist':
            result = await this.retryChecklistSubmission(item.data);
            break;
          case 'media':
            result = await this.retryMediaSubmission(item.data);
            break;
          default:
            throw new Error(`Unknown submission type: ${item.type}`);
        }

        if (result.success) {
          this.submissionQueue.delete(item.id);
          logger.info('Queued submission successful', {
            id: item.id,
            type: item.type
          });
        } else {
          item.status = 'failed';
          item.lastError = result.error;
        }
      } catch (error) {
        item.status = 'failed';
        item.lastError = error instanceof Error ? error.message : 'Unknown error';
        
        logger.error('Failed to process queued submission', {
          id: item.id,
          type: item.type,
          error
        });
      }

      // Wait between retries
      await this.sleep(2000);
    }

    this.isProcessing = false;
    this.savePendingSubmissions();
  }

  /**
   * Retry submission operations
   */
  private async retryInspectionSubmission(data: any): Promise<SubmissionResult> {
    return this.submitInspection(data.inspectionId);
  }

  private async retryChecklistSubmission(data: any): Promise<SubmissionResult> {
    return this.submitChecklistItem(data.itemId, data.updates);
  }

  private async retryMediaSubmission(data: any): Promise<SubmissionResult> {
    // Reconstruct file from base64
    const file = await this.base64ToFile(
      data.fileData,
      data.fileName,
      data.fileType
    );

    // Create a minimal submission without full retry logic
    const filePath = `inspections/${data.inspectionId}/${Date.now()}_${data.fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('inspection-photos')
      .upload(filePath, file);

    if (uploadError) {
      return { success: false, error: uploadError.message, retryable: true };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('inspection-photos')
      .getPublicUrl(filePath);

    const { error: mediaError } = await supabase
      .from('media')
      .insert({
        checklist_item_id: data.checklistItemId,
        type: 'photo',
        url: publicUrl,
        file_path: filePath
      });

    if (mediaError) {
      return { success: false, error: mediaError.message, retryable: true };
    }

    return { success: true, retryable: false };
  }

  /**
   * Start processing queue interval
   */
  private startProcessingQueue(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 30000); // Process every 30 seconds

    // Also process when coming online
    window.addEventListener('online', () => {
      setTimeout(() => this.processQueue(), 5000);
    });
  }

  /**
   * Save/load pending submissions
   */
  private savePendingSubmissions(): void {
    try {
      const items = Array.from(this.submissionQueue.values());
      localStorage.setItem('pending_submissions', JSON.stringify(items));
    } catch (error) {
      logger.error('Failed to save pending submissions', error);
    }
  }

  private loadPendingSubmissions(): void {
    try {
      const saved = localStorage.getItem('pending_submissions');
      if (saved) {
        const items = JSON.parse(saved);
        items.forEach((item: any) => {
          this.submissionQueue.set(item.id, {
            ...item,
            timestamp: new Date(item.timestamp)
          });
        });
      }
    } catch (error) {
      logger.error('Failed to load pending submissions', error);
    }
  }

  /**
   * Utility functions
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private async base64ToFile(
    base64: string,
    fileName: string,
    mimeType: string
  ): Promise<File> {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], fileName, { type: mimeType });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get submission status
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    failed: number;
    items: SubmissionItem[];
  } {
    const items = Array.from(this.submissionQueue.values());
    
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      failed: items.filter(i => i.status === 'failed').length,
      items
    };
  }

  /**
   * Clear failed submissions
   */
  clearFailedSubmissions(): void {
    const failed = Array.from(this.submissionQueue.entries())
      .filter(([_, item]) => item.status === 'failed')
      .map(([id]) => id);

    failed.forEach(id => this.submissionQueue.delete(id));
    this.savePendingSubmissions();

    logger.info('Cleared failed submissions', { count: failed.length });
  }

  /**
   * Force retry all pending
   */
  async forceRetryAll(): Promise<void> {
    const items = Array.from(this.submissionQueue.values());
    
    items.forEach(item => {
      item.status = 'pending';
      item.attempts = 0;
    });

    await this.processQueue();
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

// Export singleton instance
export const reliableSubmission = ReliableSubmissionService.getInstance();