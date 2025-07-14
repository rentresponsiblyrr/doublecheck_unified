// Checklist Service - Real database operations for checklist items
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { offlineStorageService } from './offlineStorageService';
import { syncService } from './syncService';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type ChecklistItemRecord = Tables['checklist_items']['Row'];
type ChecklistItemInsert = Tables['checklist_items']['Insert'];
type ChecklistItemUpdate = Tables['checklist_items']['Update'];
type MediaFileRecord = Tables['media']['Row'];

export interface ChecklistItemWithMedia extends ChecklistItemRecord {
  media: MediaFileRecord[];
}

export interface ChecklistItemProgress {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  aiStatus?: 'pending' | 'pass' | 'fail' | 'needs_review';
  aiConfidence?: number;
  aiReasoning?: string;
  photos?: File[];
  videos?: File[];
  notes?: string;
  userOverride?: boolean;
  completedAt?: Date;
}

export interface ChecklistItemAnalysis {
  id: string;
  aiScore: number;
  aiConfidence: number;
  aiReasoning: string;
  suggestions: string[];
  issues: string[];
  passed: boolean;
  requiresReview: boolean;
}

export class ChecklistService {
  /**
   * Get checklist items for an inspection
   */
  async getChecklistItems(inspectionId: string): Promise<{ success: boolean; data?: ChecklistItemWithMedia[]; error?: string }> {
    try {
      logger.info('Fetching checklist items', { inspectionId }, 'CHECKLIST_SERVICE');

      const { data, error } = await supabase
        .from('checklist_items')
        .select(`
          *,
          media (*)
        `)
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Failed to fetch checklist items', error, 'CHECKLIST_SERVICE');
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ChecklistItemWithMedia[] };
    } catch (error) {
      logger.error('Unexpected error fetching checklist items', error, 'CHECKLIST_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update checklist item progress
   */
  async updateChecklistItem(update: ChecklistItemProgress): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Updating checklist item', { itemId: update.id, status: update.status }, 'CHECKLIST_SERVICE');

      const updateData: ChecklistItemUpdate = {
        status: update.status,
        ai_status: update.aiStatus,
        ai_confidence: update.aiConfidence,
        ai_reasoning: update.aiReasoning,
        notes: update.notes,
        user_override: update.userOverride,
        completed_at: update.completedAt?.toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('checklist_items')
        .update(updateData)
        .eq('id', update.id);

      if (error) {
        logger.error('Failed to update checklist item', error, 'CHECKLIST_SERVICE');
        return { success: false, error: error.message };
      }

      // Handle media uploads if provided
      if (update.photos?.length) {
        await this.uploadMediaFiles(update.id, update.photos, 'photo');
      }

      if (update.videos?.length) {
        await this.uploadMediaFiles(update.id, update.videos, 'video');
      }

      logger.info('Successfully updated checklist item', { itemId: update.id }, 'CHECKLIST_SERVICE');
      return { success: true };
    } catch (error) {
      logger.error('Unexpected error updating checklist item', error, 'CHECKLIST_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update checklist item offline and queue for sync
   */
  async updateChecklistItemOffline(update: ChecklistItemProgress): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Updating checklist item offline', { itemId: update.id, status: update.status }, 'CHECKLIST_SERVICE');

      // Store media files offline first
      const mediaIds: string[] = [];
      
      if (update.photos?.length) {
        for (const photo of update.photos) {
          const mediaId = await offlineStorageService.storeMediaOffline(update.id, photo, 'photo');
          if (mediaId) {
            mediaIds.push(mediaId);
            await syncService.queueMediaUpload(update.id, mediaId, 'photo');
          }
        }
      }

      if (update.videos?.length) {
        for (const video of update.videos) {
          const mediaId = await offlineStorageService.storeMediaOffline(update.id, video, 'video');
          if (mediaId) {
            mediaIds.push(mediaId);
            await syncService.queueMediaUpload(update.id, mediaId, 'video');
          }
        }
      }

      // Queue checklist item update for sync
      const syncItem = {
        id: `checklist_item_${update.id}_${Date.now()}`,
        type: 'checklist_item' as const,
        action: 'update' as const,
        data: {
          id: update.id,
          status: update.status,
          notes: update.notes,
          aiStatus: update.aiStatus,
          aiConfidence: update.aiConfidence,
          aiReasoning: update.aiReasoning,
          userOverride: update.userOverride,
          completedAt: update.completedAt?.toISOString(),
          mediaIds
        },
        priority: 'high' as const,
        retries: 0,
        timestamp: new Date().toISOString()
      };

      await offlineStorageService.addToSyncQueue(syncItem);

      logger.info('Successfully queued checklist item update', { itemId: update.id }, 'CHECKLIST_SERVICE');
      return { success: true };
    } catch (error) {
      logger.error('Unexpected error updating checklist item offline', error, 'CHECKLIST_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Complete checklist item with AI analysis
   */
  async completeChecklistItem(
    itemId: string,
    analysis: ChecklistItemAnalysis,
    photos?: File[],
    videos?: File[],
    notes?: string,
    userOverride?: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const update: ChecklistItemProgress = {
        id: itemId,
        status: 'completed',
        aiStatus: analysis.passed ? 'pass' : (analysis.requiresReview ? 'needs_review' : 'fail'),
        aiConfidence: analysis.aiConfidence,
        aiReasoning: analysis.aiReasoning,
        photos,
        videos,
        notes,
        userOverride,
        completedAt: new Date()
      };

      // Try online update first, fall back to offline
      const onlineResult = await this.updateChecklistItem(update);
      
      if (onlineResult.success) {
        return onlineResult;
      }

      // Fallback to offline update
      logger.info('Online update failed, falling back to offline', { itemId }, 'CHECKLIST_SERVICE');
      return await this.updateChecklistItemOffline(update);
    } catch (error) {
      logger.error('Unexpected error completing checklist item', error, 'CHECKLIST_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Bulk update checklist items
   */
  async bulkUpdateChecklistItems(updates: ChecklistItemProgress[]): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    for (const update of updates) {
      const result = await this.updateChecklistItem(update);
      if (!result.success) {
        errors.push(`Failed to update ${update.id}: ${result.error}`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Get checklist item completion statistics
   */
  async getCompletionStats(inspectionId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
    completionRate: number;
  }> {
    try {
      const result = await this.getChecklistItems(inspectionId);
      
      if (!result.success || !result.data) {
        return { total: 0, completed: 0, pending: 0, failed: 0, completionRate: 0 };
      }

      const items = result.data;
      const total = items.length;
      const completed = items.filter(item => item.status === 'completed').length;
      const pending = items.filter(item => item.status === 'pending' || item.status === 'in_progress').length;
      const failed = items.filter(item => item.status === 'failed').length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return { total, completed, pending, failed, completionRate };
    } catch (error) {
      logger.error('Failed to get completion stats', error, 'CHECKLIST_SERVICE');
      return { total: 0, completed: 0, pending: 0, failed: 0, completionRate: 0 };
    }
  }

  /**
   * Get AI analysis summary for inspection
   */
  async getAIAnalysisSummary(inspectionId: string): Promise<{
    totalItems: number;
    aiPassedItems: number;
    aiFailedItems: number;
    needsReviewItems: number;
    averageConfidence: number;
    commonIssues: string[];
  }> {
    try {
      const result = await this.getChecklistItems(inspectionId);
      
      if (!result.success || !result.data) {
        return {
          totalItems: 0,
          aiPassedItems: 0,
          aiFailedItems: 0,
          needsReviewItems: 0,
          averageConfidence: 0,
          commonIssues: []
        };
      }

      const items = result.data;
      const totalItems = items.length;
      const aiPassedItems = items.filter(item => item.ai_status === 'pass').length;
      const aiFailedItems = items.filter(item => item.ai_status === 'fail').length;
      const needsReviewItems = items.filter(item => item.ai_status === 'needs_review').length;
      
      const confidenceSum = items.reduce((sum, item) => sum + (item.ai_confidence || 0), 0);
      const averageConfidence = totalItems > 0 ? confidenceSum / totalItems : 0;
      
      // Extract common issues from AI reasoning
      const commonIssues = items
        .filter(item => item.ai_reasoning)
        .map(item => item.ai_reasoning!)
        .reduce((issues: string[], reasoning: string) => {
          // Simple keyword extraction - in production, this would be more sophisticated
          const keywords = reasoning.toLowerCase().match(/\b(missing|damaged|dirty|unsafe|broken|expired)\b/g) || [];
          return [...issues, ...keywords];
        }, [])
        .filter((issue, index, array) => array.indexOf(issue) === index)
        .slice(0, 10); // Top 10 issues

      return {
        totalItems,
        aiPassedItems,
        aiFailedItems,
        needsReviewItems,
        averageConfidence,
        commonIssues
      };
    } catch (error) {
      logger.error('Failed to get AI analysis summary', error, 'CHECKLIST_SERVICE');
      return {
        totalItems: 0,
        aiPassedItems: 0,
        aiFailedItems: 0,
        needsReviewItems: 0,
        averageConfidence: 0,
        commonIssues: []
      };
    }
  }

  /**
   * Upload media files for checklist item - OPTIMIZED FOR PERFORMANCE
   */
  private async uploadMediaFiles(checklistItemId: string, files: File[], type: 'photo' | 'video'): Promise<boolean> {
    try {
      // PERFORMANCE FIX: Upload files in parallel instead of sequentially
      const uploadPromises = files.map(async (file, index) => {
        const fileName = `${checklistItemId}/${type}s/${Date.now()}-${index}-${file.name}`;
        
        try {
          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('inspection-media')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            logger.error('Failed to upload media file', { fileName, error: uploadError }, 'CHECKLIST_SERVICE');
            throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('inspection-media')
            .getPublicUrl(fileName);

          // Save media file record
          const { error: mediaError } = await supabase
            .from('media')
            .insert({
              checklist_item_id: checklistItemId,
              type,
              url: publicUrl,
              created_at: new Date().toISOString()
            });

          if (mediaError) {
            logger.error('Failed to save media file record', { fileName, error: mediaError }, 'CHECKLIST_SERVICE');
            throw mediaError;
          }

          logger.info('Media file uploaded successfully', { 
            fileName, 
            fileSize: file.size,
            type 
          }, 'CHECKLIST_SERVICE');

          return { success: true, fileName, publicUrl };
        } catch (error) {
          logger.error('Individual file upload failed', { fileName, error }, 'CHECKLIST_SERVICE');
          return { success: false, fileName, error };
        }
      });

      // Wait for all uploads to complete in parallel
      const results = await Promise.allSettled(uploadPromises);
      
      // Count successful uploads
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
      
      const failed = results.length - successful;
      
      logger.info('Media upload batch completed', {
        total: files.length,
        successful,
        failed,
        type
      }, 'CHECKLIST_SERVICE');

      // Return true if at least 50% of uploads succeeded
      return successful > 0 && (successful / files.length) >= 0.5;
    } catch (error) {
      logger.error('Unexpected error uploading media files', error, 'CHECKLIST_SERVICE');
      return false;
    }
  }

  /**
   * Delete checklist item (soft delete)
   */
  async deleteChecklistItem(itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Deleting checklist item', { itemId }, 'CHECKLIST_SERVICE');

      const { error } = await supabase
        .from('checklist_items')
        .update({
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        logger.error('Failed to delete checklist item', error, 'CHECKLIST_SERVICE');
        return { success: false, error: error.message };
      }

      logger.info('Successfully deleted checklist item', { itemId }, 'CHECKLIST_SERVICE');
      return { success: true };
    } catch (error) {
      logger.error('Unexpected error deleting checklist item', error, 'CHECKLIST_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Restore deleted checklist item
   */
  async restoreChecklistItem(itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Restoring checklist item', { itemId }, 'CHECKLIST_SERVICE');

      const { error } = await supabase
        .from('checklist_items')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        logger.error('Failed to restore checklist item', error, 'CHECKLIST_SERVICE');
        return { success: false, error: error.message };
      }

      logger.info('Successfully restored checklist item', { itemId }, 'CHECKLIST_SERVICE');
      return { success: true };
    } catch (error) {
      logger.error('Unexpected error restoring checklist item', error, 'CHECKLIST_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }
}

// Export singleton instance
export const checklistService = new ChecklistService();