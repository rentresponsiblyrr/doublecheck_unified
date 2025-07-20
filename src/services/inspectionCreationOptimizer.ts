
import { supabase } from "@/integrations/supabase/client";
import { InspectionValidationService } from "./inspectionValidationService";
import { STATUS_GROUPS, INSPECTION_STATUS } from "@/types/inspection-status";
// Removed IdConverter import - database now uses UUID strings directly
import { log } from '@/lib/logging/enterprise-logger';
import { extractErrorInfo, formatSupabaseError } from '@/types/supabase-errors';

export class InspectionCreationOptimizer {
  private static readonly MAX_RETRIES = 3;

  static async findActiveInspectionSecure(propertyId: string): Promise<string | null> {
    try {
      log.info('Finding active inspection for property', {
        component: 'InspectionCreationOptimizer',
        action: 'findActiveInspectionSecure',
        propertyId
      }, 'ACTIVE_INSPECTION_SEARCH_STARTED');

      // Define which statuses should prevent creating a new inspection
      // ACTIVE: draft, in_progress  
      // REVIEW_PIPELINE: completed, pending_review, in_review
      // NEEDS_REVISION: needs_revision (inspector must continue this one)
      const activeStatuses = [
        ...STATUS_GROUPS.ACTIVE,
        ...STATUS_GROUPS.REVIEW_PIPELINE, 
        INSPECTION_STATUS.NEEDS_REVISION
      ];

      log.debug('Looking for inspections with active statuses', {
        component: 'InspectionCreationOptimizer',
        action: 'findActiveInspectionSecure',
        propertyId,
        activeStatuses,
        statusCount: activeStatuses.length
      }, 'ACTIVE_STATUSES_QUERY');

      // Use propertyId directly - it's already in the correct format from get_properties_with_inspections
      // The database function returns property_id as UUID strings, so no conversion needed
      const { data, error } = await supabase
        .from('inspections')
        .select('id, inspector_id, status, start_time')
        .eq('property_id', propertyId)
        .in('status', activeStatuses)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        log.error('Active inspection query error', error, {
          component: 'InspectionCreationOptimizer',
          action: 'findActiveInspectionSecure',
          propertyId
        }, 'ACTIVE_INSPECTION_QUERY_ERROR');
        return null;
      }

      if (data) {
        log.info('Found active inspection that should be resumed', {
          component: 'InspectionCreationOptimizer',
          action: 'findActiveInspectionSecure',
          propertyId,
          inspectionId: data.id,
          status: data.status,
          startTime: data.start_time,
          inspectorId: data.inspector_id
        }, 'ACTIVE_INSPECTION_FOUND');
        return data.id;
      }

      log.info('No active inspection found - safe to create new one', {
        component: 'InspectionCreationOptimizer',
        action: 'findActiveInspectionSecure',
        propertyId,
        checkedStatuses: activeStatuses.length
      }, 'NO_ACTIVE_INSPECTION_FOUND');
      return null;
    } catch (error) {
      log.error('Failed to find active inspection', error as Error, {
        component: 'InspectionCreationOptimizer',
        action: 'findActiveInspectionSecure',
        propertyId
      }, 'ACTIVE_INSPECTION_SEARCH_FAILED');
      return null;
    }
  }

  static async createInspectionWithRetry(propertyId: string, inspectorId: string): Promise<string> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        log.info('Creating inspection attempt', {
          component: 'InspectionCreationOptimizer',
          action: 'createInspectionWithRetry',
          attempt,
          maxRetries: this.MAX_RETRIES,
          propertyId,
          inspectorId
        }, 'INSPECTION_CREATION_ATTEMPT');

        // Try RPC function first, fallback to direct insert
        let data, error;
        
        // Use propertyId directly - it's already in the correct format from get_properties_with_inspections
        // The database function returns property_id as UUID strings, so no conversion needed

        try {
          log.debug('Attempting RPC create_inspection_compatibility', {
            component: 'InspectionCreationOptimizer',
            action: 'createInspectionWithRetry',
            attempt,
            propertyId,
            inspectorId,
            rpcFunction: 'create_inspection_compatibility'
          }, 'RPC_INSPECTION_CREATE_ATTEMPT');
          
          // Use available compatibility RPC function
          const rpcResult = await supabase.rpc('create_inspection_compatibility', {
            property_id: propertyId, // Pass as string
            inspector_id: inspectorId
          });
          
          log.debug('RPC result received', {
            component: 'InspectionCreationOptimizer',
            action: 'createInspectionWithRetry',
            attempt,
            hasData: !!rpcResult.data,
            hasError: !!rpcResult.error,
            errorCode: rpcResult.error?.code
          }, 'RPC_INSPECTION_CREATE_RESULT');
          
          if (rpcResult.error) {
            log.warn('RPC function failed, will use fallback', {
              component: 'InspectionCreationOptimizer',
              action: 'createInspectionWithRetry',
              attempt,
              errorCode: rpcResult.error.code,
              errorMessage: rpcResult.error.message
            }, 'RPC_INSPECTION_CREATE_FAILED');
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
          log.info('RPC function not available, using direct insert fallback', {
            component: 'InspectionCreationOptimizer',
            action: 'createInspectionWithRetry',
            attempt,
            rpcError: rpcError instanceof Error ? rpcError.message : String(rpcError)
          }, 'RPC_FALLBACK_TO_DIRECT_INSERT');
          
          // Fallback to direct insert with proper RLS context
          const insertResult = await supabase
            .from('inspections')
            .insert({
              property_id: propertyId, // Use propertyId directly - already in correct format
              inspector_id: inspectorId, // Always include inspector_id for RLS
              start_time: new Date().toISOString(),
              completed: false,
              status: 'draft'
            })
            .select('id')
            .single();
            
          log.debug('Direct insert result', {
            component: 'InspectionCreationOptimizer',
            action: 'createInspectionWithRetry',
            attempt,
            hasData: !!insertResult.data,
            hasError: !!insertResult.error,
            errorCode: insertResult.error?.code,
            inspectionId: insertResult.data?.id
          }, 'DIRECT_INSERT_RESULT');
          
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

        log.info('Inspection created successfully', {
          component: 'InspectionCreationOptimizer',
          action: 'createInspectionWithRetry',
          attempt,
          propertyId,
          inspectorId,
          inspectionId: data
        }, 'INSPECTION_CREATED_SUCCESS');
        
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
        log.error('Inspection creation attempt failed', error as Error, {
          component: 'InspectionCreationOptimizer',
          action: 'createInspectionWithRetry',
          attempt,
          maxRetries: this.MAX_RETRIES,
          propertyId,
          inspectorId,
          ...extractErrorInfo(error)
        }, 'INSPECTION_CREATION_ATTEMPT_FAILED');
        
        // Log detailed error information for debugging
        const errorDetails = {
          attempt,
          propertyId,
          errorMessage: error instanceof Error ? error.message : String(error),
          ...extractErrorInfo(error),
          timestamp: new Date().toISOString()
        };
        log.error('Detailed error information for inspection creation', undefined, {
          component: 'InspectionCreationOptimizer',
          action: 'createInspectionWithRetry',
          ...errorDetails
        }, 'INSPECTION_CREATION_DETAILED_ERROR');
        
        if (attempt === this.MAX_RETRIES) {
          // Provide more detailed error message
          const detailedMessage = error instanceof Error 
            ? formatSupabaseError(error)
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
