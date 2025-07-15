
import { supabase } from "@/integrations/supabase/client";
import { InspectionValidationService } from "./inspectionValidationService";
import { STATUS_GROUPS, INSPECTION_STATUS } from "@/types/inspection-status";
import { IdConverter } from "@/utils/idConverter";

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

      // Convert propertyId to integer for database query
      const propertyIdInt = IdConverter.property.toDatabase(propertyId);

      const { data, error } = await supabase
        .from('inspections')
        .select('id, inspector_id, status, start_time')
        .eq('property_id', propertyIdInt)
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

  static async createInspectionWithRetry(propertyId: string, inspectorId: string): Promise<string> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔄 Creating inspection attempt ${attempt}/${this.MAX_RETRIES}`);

        // Try RPC function first, fallback to direct insert
        let data, error;
        
        // Convert propertyId string to integer for database operations
        const propertyIdInt = IdConverter.property.toDatabase(propertyId);

        try {
          console.log('🔧 Attempting RPC create_inspection_secure with:', { propertyId: propertyIdInt, inspectorId });
          
          // Try the secure RPC function first
          const rpcResult = await supabase.rpc('create_inspection_secure', {
            p_property_id: propertyIdInt,
            p_inspector_id: inspectorId
          });
          
          console.log('🔧 RPC result:', rpcResult);
          
          if (rpcResult.error) {
            console.log('🔧 RPC function failed:', rpcResult.error.message);
            throw new Error(`RPC failed: ${rpcResult.error.message}`);
          }
          
          if (!rpcResult.data) {
            throw new Error('RPC function returned no data');
          }
          
          data = rpcResult.data;
          error = null;
          
        } catch (rpcError) {
          console.log('🔧 RPC function not available or failed, using direct insert fallback:', rpcError);
          
          // Fallback to direct insert with proper RLS context
          const insertResult = await supabase
            .from('inspections')
            .insert({
              property_id: propertyIdInt,
              inspector_id: inspectorId, // Always include inspector_id for RLS
              start_time: new Date().toISOString(),
              completed: false,
              status: 'draft'
            })
            .select('id')
            .single();
            
          console.log('🔧 Direct insert result:', insertResult);
          
          if (insertResult.error) {
            throw new Error(`Direct insert failed: ${insertResult.error.message}`);
          }
          
          if (!insertResult.data?.id) {
            throw new Error('Direct insert returned no inspection ID');
          }
          
          data = insertResult.data.id;
          error = null;
        }

        if (!data) {
          throw new Error('No inspection ID returned from database operation');
        }

        console.log('✅ Inspection created successfully:', data);
        
        // Verify checklist items were created by trigger
        await InspectionValidationService.verifyChecklistItemsCreated(data);
        
        return data;

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
      
      // Try RPC function first, fallback to direct update
      try {
        const { data, error } = await supabase.rpc('assign_inspector_to_inspection', {
          p_inspection_id: inspectionId
        });

        if (error) {
          throw new Error(`RPC assign failed: ${error.message}`);
        }

        console.log('✅ Inspector assigned successfully via RPC');
        return;
      } catch (rpcError) {
        console.log('🔧 RPC assign function not available, using direct update:', rpcError);
        
        // Fallback to direct update
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated for inspector assignment');
        }

        const { error: updateError } = await supabase
          .from('inspections')
          .update({ inspector_id: user.id })
          .eq('id', inspectionId);

        if (updateError) {
          throw new Error(`Direct update failed: ${updateError.message}`);
        }

        console.log('✅ Inspector assigned successfully via direct update');
      }
    } catch (error) {
      console.error('❌ Failed to assign inspector:', error);
      // Don't throw - this is not critical for mobile flow
    }
  }
}
