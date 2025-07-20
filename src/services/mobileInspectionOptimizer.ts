
import { supabase } from "@/integrations/supabase/client";
import { mobileCache, MOBILE_CACHE_KEYS } from "@/utils/mobileCache";
// Removed IdConverter import - database now uses UUID strings directly
import { schemaValidationService } from "./schemaValidationService";
import { log } from "@/lib/logging/enterprise-logger";
import { extractErrorInfo, formatSupabaseError } from '@/types/supabase-errors';

export interface OptimizedInspectionResult {
  inspectionId: string;
  isNew: boolean;
  checklistItemsCount: number;
  propertyName: string;
}

class MobileInspectionOptimizer {
  private static readonly TIMEOUT_MS = 8000; // 8 seconds for mobile
  private static readonly MAX_RETRIES = 2; // Reduced retries for mobile

  static async getOrCreateInspectionOptimized(propertyId: string): Promise<OptimizedInspectionResult> {
    // REMOVED: Console logging to prevent infinite loops
    // console.log('📱 Starting optimized mobile inspection flow for:', propertyId);

    try {
      // Log property ID details for debugging
      log.debug('Property ID received for inspection flow', {
        component: 'MobileInspectionOptimizer',
        action: 'getOrCreateInspectionOptimized',
        propertyId,
        propertyIdType: typeof propertyId,
        propertyIdLength: propertyId.length,
        isUUID: propertyId.includes('-'),
        isInteger: /^\d+$/.test(propertyId)
      }, 'PROPERTY_ID_DEBUG');
      // Use a single optimized query to get property info and existing inspection
      const [propertyResult, inspectionResult] = await Promise.all([
        this.getPropertyInfo(propertyId),
        this.findActiveInspectionOptimized(propertyId)
      ]);

      if (!propertyResult) {
        // More detailed error with property ID information
        const errorDetails = {
          propertyId,
          propertyIdType: typeof propertyId,
          propertyIdLength: propertyId.length,
          isUUID: propertyId.includes('-'),
          isInteger: /^\d+$/.test(propertyId),
          timestamp: new Date().toISOString()
        };
        log.error('Property not found', undefined, {
          component: 'MobileInspectionOptimizer',
          action: 'getOrCreateInspectionOptimized',
          ...errorDetails
        }, 'PROPERTY_NOT_FOUND');
        throw new Error(`Property not found or access denied. Property ID: ${propertyId} (Type: ${typeof propertyId}, Length: ${propertyId.length})`);
      }

      // If active inspection exists, return it
      if (inspectionResult) {
        // REMOVED: Console logging to prevent infinite loops
        // console.log('📋 Joining existing optimized inspection:', inspectionResult.id);
        
        const itemCount = await this.getChecklistItemCount(inspectionResult.id);
        
        return {
          inspectionId: inspectionResult.id,
          isNew: false,
          checklistItemsCount: itemCount,
          propertyName: propertyResult.name
        };
      }

      // Create new inspection
      // REMOVED: Console logging to prevent infinite loops
      // console.log('🆕 Creating new optimized inspection for property:', propertyId);
      const newInspectionId = await this.createInspectionOptimized(propertyId);
      
      const itemCount = await this.getChecklistItemCount(newInspectionId);
      
      // Clear related cache entries
      mobileCache.delete(MOBILE_CACHE_KEYS.PROPERTY_STATUS(propertyId));
      
      return {
        inspectionId: newInspectionId,
        isNew: true,
        checklistItemsCount: itemCount,
        propertyName: propertyResult.name
      };

    } catch (error) {
      log.error('Optimized mobile inspection flow error', error as Error, {
        component: 'MobileInspectionOptimizer',
        action: 'getOrCreateInspectionOptimized',
        propertyId
      }, 'INSPECTION_FLOW_ERROR');
      throw error;
    }
  }

  private static async getPropertyInfo(propertyId: string): Promise<{ name: string } | null> {
    try {
      // The database function now returns UUID property_id values
      // We need to handle this correctly in the application layer
      
      if (!propertyId || propertyId.length === 0) {
        throw new Error('Empty property ID provided');
      }
      
      // Since we're getting UUID property_id from get_properties_with_inspections,
      // we need to find the property by this UUID
      
      // The property_id we receive is actually a UUID that represents the property
      // Let's try to get property info using the same function that lists properties
      log.debug('Getting property info', {
        component: 'MobileInspectionOptimizer',
        action: 'getPropertyInfo',
        propertyId,
        propertyIdType: typeof propertyId
      }, 'PROPERTY_INFO_LOOKUP');
      
      const { data: propertiesData, error: propertiesError } = await supabase
        .rpc('get_properties_with_inspections');
      
      if (propertiesError) {
        log.error('Error fetching properties for lookup', propertiesError, {
          component: 'MobileInspectionOptimizer',
          action: 'getPropertyInfo',
          propertyId
        }, 'PROPERTIES_FETCH_ERROR');
        throw propertiesError;
      }
      
      // Debug: Log what we're comparing
      log.debug('Property ID comparison', {
        component: 'MobileInspectionOptimizer',
        action: 'getPropertyInfo',
        searchingFor: propertyId,
        availableIds: propertiesData?.map(p => p.property_id),
        totalProperties: propertiesData?.length
      }, 'PROPERTY_ID_COMPARISON');
      
      // Find the property with matching property_id (ensure string comparison)
      const property = propertiesData?.find(p => p.property_id.toString() === propertyId.toString());
      
      if (!property) {
        log.error('Property not found in available properties', undefined, {
          component: 'MobileInspectionOptimizer',
          action: 'getPropertyInfo',
          propertyId,
          availableProperties: propertiesData?.map(p => ({ 
            id: p.property_id, 
            name: p.property_name,
            type: typeof p.property_id 
          }))
        }, 'PROPERTY_NOT_FOUND_IN_LIST');
        return null;
      }
      
      return { name: property.property_name || 'Property' };
    } catch (error) {
      log.error('Property info query failed', error as Error, {
        component: 'MobileInspectionOptimizer',
        action: 'getPropertyInfo',
        propertyId
      }, 'PROPERTY_INFO_QUERY_FAILED');
      return null;
    }
  }

  private static async findActiveInspectionOptimized(propertyId: string): Promise<{ id: string } | null> {
    try {
      // Use propertyId as string (production schema)
      const { data, error } = await supabase
        .from('inspections')
        .select('id')
        .eq('property_id', propertyId)
        .eq('completed', false)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        log.error('Active inspection query error', error, {
          component: 'MobileInspectionOptimizer',
          action: 'findActiveInspectionOptimized',
          propertyId
        }, 'ACTIVE_INSPECTION_QUERY_ERROR');
        return null;
      }

      return data;
    } catch (error) {
      log.error('Failed to find active inspection', error as Error, {
        component: 'MobileInspectionOptimizer',
        action: 'findActiveInspectionOptimized',
        propertyId
      }, 'FIND_ACTIVE_INSPECTION_FAILED');
      return null;
    }
  }

  private static async createInspectionOptimized(propertyId: string): Promise<string> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        // REMOVED: Console logging to prevent infinite loops
        // console.log(`🔄 Creating optimized inspection attempt ${attempt}/${this.MAX_RETRIES}`);

        // Get current user for the secure function
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Validate data before insertion
        const validationData = {
          property_id: propertyId,
          status: 'in_progress',
          inspector_id: user.id
        };

        const validation = await schemaValidationService.validateInspectionData(validationData);
        if (!validation.isValid) {
          log.error('Schema validation failed for inspection data', undefined, {
            component: 'MobileInspectionOptimizer',
            action: 'createInspectionOptimized',
            validationErrors: validation.errors,
            validationData
          }, 'SCHEMA_VALIDATION_FAILED');
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        if (validation.warnings.length > 0) {
          log.warn('Schema validation warnings for inspection data', {
            component: 'MobileInspectionOptimizer',
            action: 'createInspectionOptimized',
            validationWarnings: validation.warnings,
            validationData
          }, 'SCHEMA_VALIDATION_WARNINGS');
        }

        let data, error;
        
        // Since we're receiving UUID property_id values from the database function,
        // we need to handle this properly in inspection creation
        
        // Skip RPC function (doesn't exist) and use direct insert
        log.info('Creating inspection via direct insert', {
          component: 'MobileInspectionOptimizer',
          action: 'createInspectionOptimized',
          propertyId,
          attempt
        }, 'INSPECTION_DIRECT_INSERT');
        
        try {
          // Try multiple valid status values to find what works
          const inspectionData = {
            property_id: propertyId, // Use property_id directly
            start_time: new Date().toISOString(),
            completed: false,
            inspector_id: user.id
          };

          log.debug('Attempting inspection creation', {
            component: 'MobileInspectionOptimizer',
            action: 'createInspectionOptimized',
            inspectionData,
            attempt
          }, 'INSPECTION_CREATION_ATTEMPT');

          // Try 'draft' first (most common initial status)
          let insertResult = await supabase
            .from('inspections')
            .insert({
              ...inspectionData,
              status: 'draft'
            })
            .select('id')
            .single();

          // If draft fails, try in_progress
          if (insertResult.error) {
            log.warn('Draft status failed, trying in_progress', {
              component: 'MobileInspectionOptimizer',
              action: 'createInspectionOptimized',
              error: insertResult.error,
              attempt
            }, 'DRAFT_STATUS_FAILED');
            insertResult = await supabase
              .from('inspections')
              .insert({
                ...inspectionData,
                status: 'in_progress'
              })
              .select('id')
              .single();
          }

          // If both fail, try pending_review
          if (insertResult.error) {
            log.warn('in_progress status failed, trying pending_review', {
              component: 'MobileInspectionOptimizer',
              action: 'createInspectionOptimized',
              error: insertResult.error,
              attempt
            }, 'IN_PROGRESS_STATUS_FAILED');
            insertResult = await supabase
              .from('inspections')
              .insert({
                ...inspectionData,
                status: 'pending_review'
              })
              .select('id')
              .single();
          }
          data = insertResult.data?.id;
          error = insertResult.error;
          
          if (!error && data) {
            log.info('Direct insert succeeded', {
              component: 'MobileInspectionOptimizer',
              action: 'createInspectionOptimized',
              propertyId,
              inspectionId: data,
              attempt
            }, 'INSPECTION_INSERT_SUCCEEDED');
          }
        } catch (insertError) {
          log.error('Direct insert failed', insertError as Error, {
            component: 'MobileInspectionOptimizer',
            action: 'createInspectionOptimized',
            propertyId,
            attempt
          }, 'INSPECTION_INSERT_FAILED');
          error = insertError;
        }

        if (error || !data) {
          throw error || new Error('No inspection ID returned');
        }

        // REMOVED: Console logging to prevent infinite loops
        // console.log('✅ Optimized inspection created:', data);
        
        // Ensure checklist items are populated
        await this.ensureChecklistItemsPopulated(data);
        
        return data;

      } catch (error) {
        const errorDetails = {
          attempt,
          propertyId,
          propertyIdType: typeof propertyId,
          propertyIdLength: propertyId.length,
          isUUID: propertyId.includes('-'),
          errorMessage: error instanceof Error ? error.message : String(error),
          ...extractErrorInfo(error),
          timestamp: new Date().toISOString()
        };
        
        log.error(`Optimized inspection creation attempt ${attempt} failed`, error as Error, {
          component: 'MobileInspectionOptimizer',
          action: 'createInspectionOptimized',
          ...errorDetails
        }, 'INSPECTION_CREATION_ATTEMPT_FAILED');
        
        if (attempt === this.MAX_RETRIES) {
          // Provide more detailed error message with context
          const detailedMessage = error instanceof Error 
            ? formatSupabaseError(error)
            : 'Unknown error';
          throw new Error(`Failed to create inspection after ${this.MAX_RETRIES} attempts: ${detailedMessage}`);
        }
        
        // Shorter wait for mobile
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }

  private static async getChecklistItemCount(inspectionId: string): Promise<number> {
    try {
      // REMOVED: Console logging to prevent infinite loops
      // console.log(`📋 Fetching checklist item count for inspection:`, inspectionId);
      
      // Try logs table first (production schema)
      let count, error;
      
      // ✅ CORRECTED: logs table links via inspection_session_id, not property_id directly
      // First get the inspection to find its property_id for proper relationship
      const { data: inspection } = await supabase
        .from('inspections')
        .select('property_id')
        .eq('id', inspectionId)
        .single();

      if (!inspection) {
        log.warn('Inspection not found for counting items', {
          component: 'MobileInspectionOptimizer',
          action: 'getChecklistItemCount',
          inspectionId
        }, 'INSPECTION_NOT_FOUND_FOR_COUNT');
        return 8; // fallback
      }

      const logsResult = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', inspection.property_id);
      
      count = logsResult.count;
      error = logsResult.error;

      // If logs table doesn't exist, try checklist_items table
      if (error && (error.code === 'PGRST116' || error.message?.includes('does not exist'))) {
        log.info('logs table not found, trying checklist_items table', {
          component: 'MobileInspectionOptimizer',
          action: 'getChecklistItemCount',
          inspectionId,
          errorCode: error.code
        }, 'LOGS_TABLE_FALLBACK');
        
        const checklistResult = await supabase
          .from('checklist_items')
          .select('*', { count: 'exact', head: true })
          .eq('inspection_id', inspectionId);
          
        count = checklistResult.count;
        error = checklistResult.error;
      }

      if (error) {
        log.error('Error counting inspection checklist items', error, {
          component: 'MobileInspectionOptimizer',
          action: 'getChecklistItemCount',
          inspectionId
        }, 'CHECKLIST_COUNT_ERROR');
        // Fall back to static_safety_items count if both queries fail
        const { count: staticCount, error: staticError } = await supabase
          .from('static_safety_items')
          .select('*', { count: 'exact', head: true });
        
        if (staticError) {
          log.error('Error counting static safety items', staticError, {
            component: 'MobileInspectionOptimizer',
            action: 'getChecklistItemCount',
            inspectionId
          }, 'STATIC_SAFETY_ITEMS_COUNT_ERROR');
          return 8; // Final fallback
        }
        
        const fallbackCount = staticCount || 8;
        // REMOVED: Console logging to prevent infinite loops
        // console.log(`📋 Using static safety items count as fallback: ${fallbackCount}`);
        return fallbackCount;
      }

      const actualCount = count || 0;
      // REMOVED: Console logging to prevent infinite loops
      // console.log(`📋 Found ${actualCount} inspection checklist items for inspection ${inspectionId}`);
      return actualCount;
    } catch (error) {
      log.error('Failed to count inspection checklist items', error as Error, {
        component: 'MobileInspectionOptimizer',
        action: 'getChecklistItemCount',
        inspectionId
      }, 'CHECKLIST_COUNT_FAILED');
      return 8; // Fallback to default
    }
  }

  private static async ensureChecklistItemsPopulated(inspectionId: string): Promise<void> {
    try {
      // Determine which table to use for checklist items
      let useLogsTable = true;
      let targetTable = 'logs';
      
      // Check if checklist items already exist in logs table
      // logs table links via inspection_session_id and property_id, not inspection_id directly
      const { data: inspection } = await supabase
        .from('inspections')
        .select('property_id')
        .eq('id', inspectionId)
        .single();

      if (!inspection) {
        log.warn('Inspection not found for populating items', {
          component: 'MobileInspectionOptimizer',
          action: 'ensureChecklistItemsPopulated',
          inspectionId
        }, 'INSPECTION_NOT_FOUND_FOR_POPULATE');
        return;
      }

      const logsResult = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', inspection.property_id);

      // If logs table doesn't exist, try checklist_items
      if (logsResult.error && (logsResult.error.code === 'PGRST116' || logsResult.error.message?.includes('does not exist'))) {
        log.info('logs table not accessible, using checklist_items table', {
          component: 'MobileInspectionOptimizer',
          action: 'ensureChecklistItemsPopulated',
          inspectionId,
          errorCode: logsResult.error.code
        }, 'LOGS_TABLE_NOT_ACCESSIBLE');
        useLogsTable = false;
        targetTable = 'checklist_items';
        
        const checklistResult = await supabase
          .from('checklist_items')
          .select('*', { count: 'exact', head: true })
          .eq('inspection_id', inspectionId);
          
        if (checklistResult.count && checklistResult.count > 0) {
          return; // Items already exist in checklist_items
        }
      } else if (logsResult.count && logsResult.count > 0) {
        return; // Items already exist in logs
      }

      // Items don't exist, populate manually
      log.info('Populating checklist items manually', {
        component: 'MobileInspectionOptimizer',
        action: 'ensureChecklistItemsPopulated',
        inspectionId,
        targetTable
      }, 'POPULATING_CHECKLIST_ITEMS');
      
      // Get template items from static_safety_items
      const { data: templateItems, error: templateError } = await supabase
        .from('static_safety_items')
        .select('id, title, category, evidence_type, required');

      if (templateError) {
        log.error('Error fetching template items', templateError, {
          component: 'MobileInspectionOptimizer',
          action: 'ensureChecklistItemsPopulated',
          inspectionId
        }, 'TEMPLATE_ITEMS_FETCH_ERROR');
        return;
      }

      if (!templateItems || templateItems.length === 0) {
        log.warn('No template items found in static_safety_items', {
          component: 'MobileInspectionOptimizer',
          action: 'ensureChecklistItemsPopulated',
          inspectionId
        }, 'NO_TEMPLATE_ITEMS_FOUND');
        return;
      }

      // Create checklist items with appropriate schema
      const checklistItems = templateItems.map(item => {
        const baseItem = {
          inspection_id: inspectionId,
          status: 'pending',
          label: item.title,
          category: item.category,
          evidence_type: item.evidence_type,
          required: item.required
        };

        // Add the correct foreign key field based on table and verified schema
        if (useLogsTable) {
          return {
            ...baseItem,
            property_id: inspection.property_id, // ✅ VERIFIED: logs links to properties via property_id
            checklist_id: item.id  // ✅ VERIFIED: logs.checklist_id references checklist.checklist_id
          };
        } else {
          return {
            ...baseItem,
            safety_item_id: item.id  // checklist_items might use different field name
          };
        }
      });

      const { error: insertError } = await supabase
        .from(targetTable)
        .insert(checklistItems);

      if (insertError) {
        log.error(`Error creating checklist items in ${targetTable}`, insertError, {
          component: 'MobileInspectionOptimizer',
          action: 'ensureChecklistItemsPopulated',
          inspectionId,
          targetTable,
          itemsCount: checklistItems.length
        }, 'CHECKLIST_ITEMS_INSERT_ERROR');
        
        // If the insert failed due to field mismatch, try with basic fields only
        if (insertError.message?.includes('column') && !useLogsTable) {
          log.info('Retrying with minimal checklist item structure', {
            component: 'MobileInspectionOptimizer',
            action: 'ensureChecklistItemsPopulated',
            inspectionId,
            targetTable
          }, 'CHECKLIST_ITEMS_RETRY');
          const minimalItems = templateItems.map(item => ({
            inspection_id: inspectionId,
            status: 'pending',
            title: item.title,
            category: item.category
          }));
          
          const { error: retryError } = await supabase
            .from(targetTable)
            .insert(minimalItems);
            
          if (!retryError) {
            log.info('Successfully populated minimal checklist items', {
              component: 'MobileInspectionOptimizer',
              action: 'ensureChecklistItemsPopulated',
              inspectionId,
              itemsCount: minimalItems.length,
              targetTable
            }, 'MINIMAL_CHECKLIST_ITEMS_SUCCESS');
          } else {
            log.error('Retry also failed', retryError, {
              component: 'MobileInspectionOptimizer',
              action: 'ensureChecklistItemsPopulated',
              inspectionId,
              targetTable
            }, 'CHECKLIST_ITEMS_RETRY_FAILED');
          }
        }
      } else {
        log.info('Successfully populated checklist items', {
          component: 'MobileInspectionOptimizer',
          action: 'ensureChecklistItemsPopulated',
          inspectionId,
          itemsCount: checklistItems.length,
          targetTable
        }, 'CHECKLIST_ITEMS_SUCCESS');
      }
    } catch (error) {
      log.error('Error ensuring checklist items', error as Error, {
        component: 'MobileInspectionOptimizer',
        action: 'ensureChecklistItemsPopulated',
        inspectionId
      }, 'ENSURE_CHECKLIST_ITEMS_ERROR');
    }
  }

  static async assignInspectorOptimized(inspectionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('inspections')
        .update({ 
          inspector_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'in_progress'
        })
        .eq('id', inspectionId);

      if (error) {
        log.warn('Inspector assignment failed (non-critical)', {
          component: 'MobileInspectionOptimizer',
          action: 'assignInspectorOptimized',
          inspectionId,
          error: error
        }, 'INSPECTOR_ASSIGNMENT_FAILED');
      } else {
        log.info('Inspector assigned to optimized inspection', {
          component: 'MobileInspectionOptimizer',
          action: 'assignInspectorOptimized',
          inspectionId
        }, 'INSPECTOR_ASSIGNMENT_SUCCESS');
      }
    } catch (error) {
      log.warn('Inspector assignment error (non-critical)', {
        component: 'MobileInspectionOptimizer',
        action: 'assignInspectorOptimized',
        inspectionId,
        error: error
      }, 'INSPECTOR_ASSIGNMENT_ERROR');
    }
  }
}

export { MobileInspectionOptimizer };
