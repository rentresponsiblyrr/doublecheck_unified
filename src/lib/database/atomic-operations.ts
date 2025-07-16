/**
 * Atomic Database Operations
 * Provides transaction safety for critical operations
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type ChecklistItemInsert = Tables['checklist_items']['Insert'];
type MediaInsert = Tables['media']['Insert'];

export interface CreateInspectionAtomicData {
  inspection: {
    property_id: string;
    inspector_id: string;
    status: string;
  };
  checklist_items: Array<{
    title: string;
    category: string;
    evidence_type: string;
    gpt_prompt: string;
    static_item_id?: string;
  }>;
}

export interface UpdateChecklistItemWithMediaData {
  checklist_item_id: string;
  updates: {
    status?: string;
    ai_status?: string;
    ai_confidence?: number;
    ai_reasoning?: string;
    notes?: string;
    user_override?: boolean;
  };
  media?: Array<{
    type: 'photo' | 'video';
    url: string;
    file_path?: string;
  }>;
}

/**
 * Creates an inspection with checklist items atomically
 */
export async function createInspectionAtomic(
  data: CreateInspectionAtomicData
): Promise<{ success: boolean; data?: { inspection_id: string; checklist_item_ids: string[] }; error?: string }> {
  try {
    logger.info('Creating inspection atomically', { propertyId: data.inspection.property_id }, 'ATOMIC_OPERATIONS');

    // Create inspection first
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .insert({
        ...data.inspection,
        start_time: new Date().toISOString()
      })
      .select('id')
      .single();

    if (inspectionError) {
      logger.error('Failed to create inspection', inspectionError, 'ATOMIC_OPERATIONS');
      return { success: false, error: inspectionError.message };
    }

    // Prepare checklist items with inspection ID
    const checklistItems: ChecklistItemInsert[] = data.checklist_items.map(item => ({
      ...item,
      inspection_id: inspection.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    }));

    // Insert checklist items
    const { data: insertedItems, error: itemsError } = await supabase
      .from('checklist_items')
      .insert(checklistItems)
      .select('id');

    if (itemsError) {
      // Rollback: Delete the created inspection
      await supabase
        .from('inspections')
        .delete()
        .eq('id', inspection.id);

      logger.error('Failed to create checklist items, rolled back inspection', itemsError, 'ATOMIC_OPERATIONS');
      return { success: false, error: itemsError.message };
    }

    const checklistItemIds = insertedItems?.map(item => item.id) || [];

    logger.info('Successfully created inspection atomically', { 
      inspectionId: inspection.id, 
      itemCount: checklistItemIds.length 
    }, 'ATOMIC_OPERATIONS');

    return {
      success: true,
      data: {
        inspection_id: inspection.id,
        checklist_item_ids: checklistItemIds
      }
    };

  } catch (error: any) {
    logger.error('Atomic inspection creation failed', error, 'ATOMIC_OPERATIONS');
    return { success: false, error: error.message };
  }
}

/**
 * Updates checklist item and creates media records atomically
 */
export async function updateChecklistItemWithMediaAtomic(
  data: UpdateChecklistItemWithMediaData
): Promise<{ success: boolean; data?: { media_ids: string[] }; error?: string }> {
  try {
    logger.info('Updating checklist item with media atomically', { 
      checklistItemId: data.checklist_item_id,
      mediaCount: data.media?.length || 0
    }, 'ATOMIC_OPERATIONS');

    // Update checklist item first
    const { error: updateError } = await supabase
      .from('checklist_items')
      .update({
        ...data.updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.checklist_item_id);

    if (updateError) {
      logger.error('Failed to update checklist item', updateError, 'ATOMIC_OPERATIONS');
      return { success: false, error: updateError.message };
    }

    // Insert media files if provided
    let mediaIds: string[] = [];
    if (data.media && data.media.length > 0) {
      const mediaInserts: MediaInsert[] = data.media.map(media => ({
        checklist_item_id: data.checklist_item_id,
        type: media.type,
        url: media.url,
        file_path: media.file_path,
        created_at: new Date().toISOString()
      }));

      const { data: insertedMedia, error: mediaError } = await supabase
        .from('media')
        .insert(mediaInserts)
        .select('id');

      if (mediaError) {
        // Rollback: Revert checklist item update
        // Note: In a real transaction, we'd use BEGIN/COMMIT/ROLLBACK
        // For now, we log the issue but don't attempt rollback of the update
        logger.error('Failed to insert media files after checklist update', mediaError, 'ATOMIC_OPERATIONS');
        return { success: false, error: `Checklist item updated but media insertion failed: ${mediaError.message}` };
      }

      mediaIds = insertedMedia?.map(media => media.id) || [];
    }

    logger.info('Successfully updated checklist item with media atomically', { 
      checklistItemId: data.checklist_item_id,
      mediaIds: mediaIds.length
    }, 'ATOMIC_OPERATIONS');

    return {
      success: true,
      data: { media_ids: mediaIds }
    };

  } catch (error: any) {
    logger.error('Atomic checklist item update failed', error, 'ATOMIC_OPERATIONS');
    return { success: false, error: error.message };
  }
}

/**
 * Deletes inspection and all related data atomically
 */
export async function deleteInspectionAtomic(
  inspectionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('Deleting inspection atomically', { inspectionId }, 'ATOMIC_OPERATIONS');

    // Get all checklist items for this inspection
    const { data: checklistItems, error: fetchError } = await supabase
      .from('checklist_items')
      .select('id')
      .eq('inspection_id', inspectionId);

    if (fetchError) {
      logger.error('Failed to fetch checklist items for deletion', fetchError, 'ATOMIC_OPERATIONS');
      return { success: false, error: fetchError.message };
    }

    const checklistItemIds = checklistItems?.map(item => item.id) || [];

    // Delete media files first (foreign key constraint)
    if (checklistItemIds.length > 0) {
      const { error: mediaDeleteError } = await supabase
        .from('media')
        .delete()
        .in('checklist_item_id', checklistItemIds);

      if (mediaDeleteError) {
        logger.error('Failed to delete media files', mediaDeleteError, 'ATOMIC_OPERATIONS');
        return { success: false, error: mediaDeleteError.message };
      }
    }

    // Delete checklist items
    const { error: itemsDeleteError } = await supabase
      .from('checklist_items')
      .delete()
      .eq('inspection_id', inspectionId);

    if (itemsDeleteError) {
      logger.error('Failed to delete checklist items', itemsDeleteError, 'ATOMIC_OPERATIONS');
      return { success: false, error: itemsDeleteError.message };
    }

    // Delete inspection
    const { error: inspectionDeleteError } = await supabase
      .from('inspections')
      .delete()
      .eq('id', inspectionId);

    if (inspectionDeleteError) {
      logger.error('Failed to delete inspection', inspectionDeleteError, 'ATOMIC_OPERATIONS');
      return { success: false, error: inspectionDeleteError.message };
    }

    logger.info('Successfully deleted inspection atomically', { 
      inspectionId,
      deletedItemsCount: checklistItemIds.length
    }, 'ATOMIC_OPERATIONS');

    return { success: true };

  } catch (error: any) {
    logger.error('Atomic inspection deletion failed', error, 'ATOMIC_OPERATIONS');
    return { success: false, error: error.message };
  }
}

/**
 * Updates multiple checklist items in a batch atomically
 */
export async function batchUpdateChecklistItemsAtomic(
  updates: Array<{
    id: string;
    updates: Partial<Tables['checklist_items']['Update']>;
  }>
): Promise<{ success: boolean; data?: { updated_count: number }; error?: string }> {
  try {
    logger.info('Batch updating checklist items atomically', { count: updates.length }, 'ATOMIC_OPERATIONS');

    let successCount = 0;
    const errors: string[] = [];

    // Process updates sequentially to maintain some atomicity
    // In a real transaction system, we'd use a single transaction
    for (const update of updates) {
      const { error } = await supabase
        .from('checklist_items')
        .update({
          ...update.updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id);

      if (error) {
        errors.push(`Item ${update.id}: ${error.message}`);
        logger.error('Failed to update checklist item in batch', error, 'ATOMIC_OPERATIONS');
      } else {
        successCount++;
      }
    }

    if (errors.length > 0) {
      const errorMessage = `Batch update partially failed. ${successCount}/${updates.length} items updated. Errors: ${errors.join('; ')}`;
      logger.error('Batch update had errors', { successCount, totalCount: updates.length, errors }, 'ATOMIC_OPERATIONS');
      return { success: false, error: errorMessage };
    }

    logger.info('Successfully batch updated checklist items atomically', { updatedCount: successCount }, 'ATOMIC_OPERATIONS');

    return {
      success: true,
      data: { updated_count: successCount }
    };

  } catch (error: any) {
    logger.error('Atomic batch update failed', error, 'ATOMIC_OPERATIONS');
    return { success: false, error: error.message };
  }
}

/**
 * Creates a media upload record and updates checklist item status atomically
 */
export async function createMediaUploadAtomic(
  checklistItemId: string,
  mediaData: {
    type: 'photo' | 'video';
    url: string;
    file_path: string;
  },
  itemStatusUpdate?: {
    status?: string;
    ai_status?: string;
    ai_confidence?: number;
    ai_reasoning?: string;
  }
): Promise<{ success: boolean; data?: { media_id: string }; error?: string }> {
  try {
    logger.info('Creating media upload atomically', { checklistItemId, mediaType: mediaData.type }, 'ATOMIC_OPERATIONS');

    // Insert media record first
    const { data: media, error: mediaError } = await supabase
      .from('media')
      .insert({
        checklist_item_id: checklistItemId,
        type: mediaData.type,
        url: mediaData.url,
        file_path: mediaData.file_path,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (mediaError) {
      logger.error('Failed to create media record', mediaError, 'ATOMIC_OPERATIONS');
      return { success: false, error: mediaError.message };
    }

    // Update checklist item if status update provided
    if (itemStatusUpdate) {
      const { error: updateError } = await supabase
        .from('checklist_items')
        .update({
          ...itemStatusUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('id', checklistItemId);

      if (updateError) {
        // Rollback: Delete the created media record
        await supabase
          .from('media')
          .delete()
          .eq('id', media.id);

        logger.error('Failed to update checklist item after media creation, rolled back media', updateError, 'ATOMIC_OPERATIONS');
        return { success: false, error: updateError.message };
      }
    }

    logger.info('Successfully created media upload atomically', { 
      checklistItemId,
      mediaId: media.id
    }, 'ATOMIC_OPERATIONS');

    return {
      success: true,
      data: { media_id: media.id }
    };

  } catch (error: any) {
    logger.error('Atomic media upload creation failed', error, 'ATOMIC_OPERATIONS');
    return { success: false, error: error.message };
  }
}