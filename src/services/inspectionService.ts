// Inspection Service - Real database operations for inspections
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  createInspectionAtomic,
  updateChecklistItemWithMediaAtomic,
  deleteInspectionAtomic
} from '@/lib/database/atomic-operations';
import { 
  inspectionCreationService,
  InspectionCreationRequest,
  createFrontendPropertyId,
  createInspectorId
} from '@/lib/database/inspection-creation-service';
import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type InspectionRecord = Tables['inspections']['Row'];
type InspectionInsert = Tables['inspections']['Insert'];
type InspectionUpdate = Tables['inspections']['Update'];
type ChecklistItemRecord = Tables['logs']['Row'];
type ChecklistItemInsert = Tables['logs']['Insert'];
type ChecklistItemUpdate = Tables['logs']['Update'];
type MediaRecord = Tables['media']['Row'];

export interface InspectionWithDetails extends InspectionRecord {
  properties: {
    property_id: number;
    name: string | null;
    address: string | null;
    vrbo_url: string | null;
    airbnb_url: string | null;
  } | null;
  logs: Array<ChecklistItemRecord & {
    static_safety_items: {
      label: string;
      category: string;
    } | null;
    media: MediaRecord[];
  }>;
}

export interface CreateInspectionData {
  propertyId: string;
  inspectorId: string;
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

export interface UpdateInspectionProgress {
  inspectionId: string;
  currentStep: number;
  status: 'draft' | 'in_progress' | 'completed';
  checklistItemUpdates?: Array<{
    id: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    photos?: File[];
    videos?: File[];
    notes?: string;
  }>;
}

export class InspectionService {
  /**
   * Create a new inspection using enterprise-grade inspection creation service
   * PHASE 1 CRITICAL FIX: Uses EnterpriseInspectionCreationService to eliminate "Unknown error" failures
   */
  async createInspection(data: CreateInspectionData): Promise<{ success: boolean; data?: InspectionWithDetails; error?: string }> {
    try {
      logger.info('Creating inspection with enterprise service', { 
        propertyId: data.propertyId, 
        itemCount: data.checklistItems.length 
      }, 'INSPECTION_SERVICE');

      // Convert to enterprise service request format
      const request: InspectionCreationRequest = {
        propertyId: createFrontendPropertyId(data.propertyId),
        inspectorId: data.inspectorId ? createInspectorId(data.inspectorId) : undefined,
        status: 'draft'
      };

      // Use enterprise-grade inspection creation service
      const result = await inspectionCreationService.createInspection(request);

      if (!result.success || !result.data) {
        const errorMessage = result.error?.userMessage || result.error?.message || 'Inspection creation failed';
        logger.error('Enterprise inspection creation failed', {
          error: result.error,
          propertyId: data.propertyId
        }, 'INSPECTION_SERVICE');
        return { success: false, error: errorMessage };
      }

      const { inspectionId } = result.data;
      
      logger.info('Enterprise inspection created successfully', {
        inspectionId,
        propertyId: data.propertyId,
        processingTime: result.performance?.processingTime
      }, 'INSPECTION_SERVICE');

      // Note: Checklist items are automatically populated by the RPC function's trigger
      // No need to manually create checklist items - the database handles this
      
      // Fetch the complete inspection with relations
      const fullInspection = await this.getInspectionById(inspectionId);
      if (!fullInspection.success) {
        logger.warn('Inspection created but failed to fetch details', { inspectionId }, 'INSPECTION_SERVICE');
        // Return partial success - inspection was created but we can't fetch details
        return { 
          success: true, 
          data: {
            id: inspectionId,
            property_id: result.data.propertyId,
            inspector_id: data.inspectorId,
            status: result.data.status,
            created_at: result.data.createdAt,
            properties: null,
            logs: []
          } as InspectionWithDetails
        };
      }

      logger.info('Successfully created and fetched inspection', { 
        inspectionId,
        checklistItemCount: fullInspection.data?.logs.length || 0
      }, 'INSPECTION_SERVICE');

      return { success: true, data: fullInspection.data };
    } catch (error) {
      logger.error('Unexpected error in inspection creation', error, 'INSPECTION_SERVICE');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unexpected error occurred' 
      };
    }
  }

  /**
   * Get inspection by ID with all related data
   */
  async getInspectionById(inspectionId: string): Promise<{ success: boolean; data?: InspectionWithDetails; error?: string }> {
    try {
      logger.info('Fetching inspection by ID', { inspectionId }, 'INSPECTION_SERVICE');

      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          properties!inner (
            id,
            name,
            address,
            vrbo_url,
            airbnb_url
          ),
          checklist_items!inner (
            *,
            static_safety_items!static_item_id (
              label,
              category,
              evidence_type
            ),
            media (*)
          )
        `)
        .eq('id', inspectionId)
        .single();

      if (error) {
        logger.error('Failed to fetch inspection', error, 'INSPECTION_SERVICE');
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'Inspection not found' };
      }

      return { success: true, data: data as InspectionWithDetails };
    } catch (error) {
      logger.error('Unexpected error fetching inspection', error, 'INSPECTION_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update inspection progress and checklist items
   */
  async updateInspectionProgress(update: UpdateInspectionProgress): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Updating inspection progress', { 
        inspectionId: update.inspectionId, 
        status: update.status,
        step: update.currentStep 
      }, 'INSPECTION_SERVICE');

      // Update inspection status
      const { error: inspectionError } = await supabase
        .from('inspections')
        .update({
          status: update.status,
          completed: update.status === 'completed',
          end_time: update.status === 'completed' ? new Date().toISOString() : null
        } as InspectionUpdate)
        .eq('id', update.inspectionId);

      if (inspectionError) {
        logger.error('Failed to update inspection', inspectionError, 'INSPECTION_SERVICE');
        return { success: false, error: inspectionError.message };
      }

      // Update checklist items if provided
      if (update.checklistItemUpdates) {
        for (const itemUpdate of update.checklistItemUpdates) {
          const { error: itemError } = await supabase
            .from('checklist_items')
            .update({
              status: itemUpdate.status,
              notes: itemUpdate.notes,
              updated_at: new Date().toISOString()
            } as ChecklistItemUpdate)
            .eq('id', itemUpdate.id);

          if (itemError) {
            logger.error('Failed to update checklist item', itemError, 'INSPECTION_SERVICE');
            return { success: false, error: itemError.message };
          }

          // Handle photo uploads
          if (itemUpdate.photos?.length) {
            await this.uploadMediaFiles(itemUpdate.id, itemUpdate.photos, 'photo');
          }

          // Handle video uploads
          if (itemUpdate.videos?.length) {
            await this.uploadMediaFiles(itemUpdate.id, itemUpdate.videos, 'video');
          }
        }
      }

      logger.info('Successfully updated inspection progress', { inspectionId: update.inspectionId }, 'INSPECTION_SERVICE');
      return { success: true };
    } catch (error) {
      logger.error('Unexpected error updating inspection', error, 'INSPECTION_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Upload media files for a checklist item
   */
  private async uploadMediaFiles(checklistItemId: string, files: File[], type: 'photo' | 'video'): Promise<boolean> {
    try {
      for (const file of files) {
        const fileName = `${checklistItemId}/${type}s/${Date.now()}-${file.name}`;
        
        // Upload to Supabase storage - Fixed bucket name
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('inspection-media')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          logger.error('Failed to upload media file', uploadError, 'INSPECTION_SERVICE');
          continue;
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
            file_path: fileName,
            created_at: new Date().toISOString()
          });

        if (mediaError) {
          logger.error('Failed to save media file record', mediaError, 'INSPECTION_SERVICE');
          continue;
        }
      }

      return true;
    } catch (error) {
      logger.error('Unexpected error uploading media files', error, 'INSPECTION_SERVICE');
      return false;
    }
  }

  /**
   * Get inspections for a property
   */
  async getInspectionsByProperty(propertyId: string): Promise<{ success: boolean; data?: InspectionWithDetails[]; error?: string }> {
    try {
      logger.info('Fetching inspections for property', { propertyId }, 'INSPECTION_SERVICE');

      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          properties!inner (
            id,
            name,
            address,
            vrbo_url,
            airbnb_url
          ),
          checklist_items!inner (
            *,
            static_safety_items!static_item_id (
              label,
              category,
              evidence_type
            ),
            media (*)
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch property inspections', error, 'INSPECTION_SERVICE');
        return { success: false, error: error.message };
      }

      return { success: true, data: data as InspectionWithDetails[] };
    } catch (error) {
      logger.error('Unexpected error fetching property inspections', error, 'INSPECTION_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get all inspections for auditor review
   */
  async getInspectionsForReview(): Promise<{ success: boolean; data?: InspectionWithDetails[]; error?: string }> {
    try {
      logger.info('Fetching inspections for review', {}, 'INSPECTION_SERVICE');

      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          properties!inner (
            id,
            name,
            address,
            vrbo_url,
            airbnb_url
          ),
          checklist_items!inner (
            *,
            static_safety_items!static_item_id (
              label,
              category,
              evidence_type
            ),
            media (*)
          )
        `)
        .eq('completed', true)
        .is('certification_status', null)
        .order('end_time', { ascending: true });

      if (error) {
        logger.error('Failed to fetch inspections for review', error, 'INSPECTION_SERVICE');
        return { success: false, error: error.message };
      }

      return { success: true, data: data as InspectionWithDetails[] };
    } catch (error) {
      logger.error('Unexpected error fetching inspections for review', error, 'INSPECTION_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update inspection certification status (for auditors)
   */
  async updateCertificationStatus(
    inspectionId: string, 
    status: 'approved' | 'rejected' | 'needs_revision',
    auditorId: string,
    feedback?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Updating certification status', { 
        inspectionId, 
        status, 
        auditorId 
      }, 'INSPECTION_SERVICE');

      // Prepare update object with only existing fields
      const updateData: Partial<InspectionUpdate> = {
        certification_status: status
      };

      const { error } = await supabase
        .from('inspections')
        .update(updateData)
        .eq('id', inspectionId);

      // Store auditor feedback in audit log if provided
      if (feedback && auditorId) {
        await supabase.from('security_audit_log').insert({
          event_type: 'inspection_certification_updated',
          user_id: auditorId,
          timestamp: new Date().toISOString(),
          metadata: {
            inspection_id: inspectionId,
            certification_status: status,
            auditor_feedback: feedback
          }
        });
      }

      if (error) {
        logger.error('Failed to update certification status', error, 'INSPECTION_SERVICE');
        return { success: false, error: error.message };
      }

      logger.info('Successfully updated certification status', { inspectionId, status }, 'INSPECTION_SERVICE');
      return { success: true };
    } catch (error) {
      logger.error('Unexpected error updating certification status', error, 'INSPECTION_SERVICE');
      return { success: false, error: 'Unexpected error occurred' };
    }
  }
}

// Export singleton instance
export const inspectionService = new InspectionService();