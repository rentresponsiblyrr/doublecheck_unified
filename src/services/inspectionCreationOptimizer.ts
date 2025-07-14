
import { supabase } from "@/integrations/supabase/client";
import { InspectionValidationService } from "./inspectionValidationService";
import { STATUS_GROUPS, INSPECTION_STATUS } from "@/types/inspection-status";

export class InspectionCreationOptimizer {
  private static readonly MAX_RETRIES = 3;

  static async findActiveInspectionSecure(propertyId: string): Promise<string | null> {
    try {
      console.log('🔍 Finding active inspection for property:', propertyId);

      // Define which statuses should prevent creating a new inspection
      // ACTIVE: draft, in_progress  
      // REVIEW_PIPELINE: completed, pending_review, in_review
      // NEEDS_REVISION: needs_revision (inspector must continue this one)
      const activeStatuses = [
        ...STATUS_GROUPS.ACTIVE,
        ...STATUS_GROUPS.REVIEW_PIPELINE, 
        INSPECTION_STATUS.NEEDS_REVISION
      ];

      console.log('🔍 Looking for inspections with active statuses:', activeStatuses);

      const { data, error } = await supabase
        .from('inspections')
        .select('id, inspector_id, status, start_time')
        .eq('property_id', propertyId)
        .in('status', activeStatuses)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Active inspection query error:', error);
        return null;
      }

      if (data) {
        console.log('📋 Found active inspection that should be resumed:', {
          id: data.id,
          status: data.status,
          start_time: data.start_time
        });
        return data.id;
      }

      console.log('✅ No active inspection found - safe to create new one');
      return null;
    } catch (error) {
      console.error('❌ Failed to find active inspection:', error);
      return null;
    }
  }

  static async createInspectionWithRetry(propertyId: string): Promise<string> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Creating inspection attempt ${attempt}/${this.MAX_RETRIES}`);

        const { data, error } = await supabase
          .from('inspections')
          .insert({
            property_id: propertyId,
            start_time: new Date().toISOString(),
            completed: false,
            status: 'draft',
            inspector_id: null
          })
          .select('id')
          .single();

        if (error) {
          console.error('❌ Database error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        if (!data?.id) {
          throw new Error('No inspection ID returned from database');
        }

        console.log('✅ Inspection created successfully:', data.id);
        
        // Verify checklist items were created by trigger
        await InspectionValidationService.verifyChecklistItemsCreated(data.id);
        
        return data.id;

      } catch (error) {
        console.error(`❌ Inspection creation attempt ${attempt} failed:`, error);
        
        if (attempt === this.MAX_RETRIES) {
          throw new Error(`Failed to create inspection after ${this.MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }

  static async assignInspectorToInspection(inspectionId: string): Promise<void> {
    try {
      console.log('👤 Assigning current user to inspection:', inspectionId);
      
      const { data, error } = await supabase.rpc('assign_inspector_to_inspection', {
        p_inspection_id: inspectionId
      });

      if (error) {
        throw error;
      }

      console.log('✅ Inspector assigned successfully');
    } catch (error) {
      console.error('❌ Failed to assign inspector:', error);
      // Don't throw - this is not critical for mobile flow
    }
  }
}
