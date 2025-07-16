
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

      // Use propertyId as UUID string (no conversion needed)
      const propertyIdUuid = IdConverter.property.toDatabase(propertyId);

      const { data, error } = await supabase
        .from('inspections')
        .select('id, inspector_id, status, start_time')
        .eq('property_id', propertyIdUuid)
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
        
        // Use propertyId as UUID string for database operations
        const propertyIdUuid = IdConverter.property.toDatabase(propertyId);

        try {
          console.log('🔧 Attempting RPC create_inspection_secure with:', { propertyId: propertyIdUuid, inspectorId });
          
          // Try the secure RPC function first
          const rpcResult = await supabase.rpc('create_inspection_secure', {
            p_property_id: propertyIdUuid,
            p_inspector_id: inspectorId
          });
          
          console.log('🔧 RPC result:', rpcResult);
          
          if (rpcResult.error) {
            console.log('🔧 RPC function failed:', rpcResult.error.message);
            // Provide specific error messages for common constraint violations  
            if (rpcResult.error.code === '23514') {
              throw new Error('Database constraint violation: The inspection status value is not allowed. Please contact support.');
            } else if (rpcResult.error.code === '23503') {
              throw new Error('Invalid property or inspector ID. Please refresh the page and try again.');
            } else if (rpcResult.error.code === '23505') {
              throw new Error('An inspection already exists for this property. Please check existing inspections.');
            } else {
              throw new Error(`RPC function failed (${rpcResult.error.code}): ${rpcResult.error.message}`);
            }
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
              property_id: propertyIdUuid,
              inspector_id: inspectorId, // Always include inspector_id for RLS
              start_time: new Date().toISOString(),
              completed: false,
              status: 'draft'
            })
            .select('id')
            .single();
            
          console.log('🔧 Direct insert result:', insertResult);
          
          if (insertResult.error) {
            // Provide specific error messages for common constraint violations
            if (insertResult.error.code === '23514') {
              throw new Error('Database constraint violation: The inspection status value is not allowed. Please contact support.');
            } else if (insertResult.error.code === '23503') {
              throw new Error('Invalid property or inspector ID. Please refresh the page and try again.');
            } else if (insertResult.error.code === '23505') {
              throw new Error('An inspection already exists for this property. Please check existing inspections.');
            } else {
              throw new Error(`Database error (${insertResult.error.code}): ${insertResult.error.message}`);
            }
          }
          
          if (!insertResult.data?.id) {
            throw new Error('Database returned no inspection ID - please try again');
          }
          
          data = insertResult.data.id;
          error = null;
        }

        if (!data) {
          throw new Error('No inspection ID returned from database operation');
        }

        console.log('✅ Inspection created successfully:', data);
        
        // Verify checklist items were created by trigger
        try {
          await InspectionValidationService.verifyChecklistItemsCreated(data);
        } catch (verificationError) {
          // If checklist verification fails, check if static_safety_items is empty
          const { count } = await supabase
            .from('static_safety_items')
            .select('*', { count: 'exact', head: true })
            .eq('deleted', false)
            .eq('required', true);
            
          if (count === 0) {
            throw new Error('No static safety items found in database. Contact admin to populate static_safety_items table.');
          }
          throw verificationError;
        }
        
        return data;

      } catch (error) {
        console.error(`❌ Inspection creation attempt ${attempt} failed:`, error);
        
        // Log detailed error information for debugging
        const errorDetails = {
          attempt,
          propertyId,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorCode: (error as any)?.code,
          errorDetails: (error as any)?.details,
          errorHint: (error as any)?.hint,
          timestamp: new Date().toISOString()
        };
        console.error('🔍 Detailed error information:', errorDetails);
        
        if (attempt === this.MAX_RETRIES) {
          // Provide more detailed error message
          const detailedMessage = error instanceof Error 
            ? `${error.message}${(error as any)?.code ? ` (Code: ${(error as any).code})` : ''}`
            : 'Unknown error';
          throw new Error(`Failed to create inspection after ${this.MAX_RETRIES} attempts: ${detailedMessage}`);
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
