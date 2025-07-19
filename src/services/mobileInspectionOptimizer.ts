
import { supabase } from "@/integrations/supabase/client";
import { mobileCache, MOBILE_CACHE_KEYS } from "@/utils/mobileCache";
import { IdConverter } from "@/utils/idConverter";

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
      // Add detailed debugging for the property ID type issue
      console.error('🔍 DEBUG: Property ID received:', { 
        propertyId, 
        type: typeof propertyId, 
        length: propertyId.length,
        isUUID: propertyId.includes('-'),
        isInteger: /^\d+$/.test(propertyId)
      });
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
        console.error('🔍 DETAILED ERROR: Property not found:', errorDetails);
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
      console.error('💥 Optimized mobile inspection flow error:', error);
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
      console.log('🔍 Getting property info for UUID property_id:', propertyId);
      
      const { data: propertiesData, error: propertiesError } = await supabase
        .rpc('get_properties_with_inspections');
      
      if (propertiesError) {
        console.error('❌ Error fetching properties for lookup:', propertiesError);
        throw propertiesError;
      }
      
      // Find the property with matching property_id
      const property = propertiesData?.find(p => p.property_id === propertyId);
      
      if (!property) {
        console.error('❌ Property not found with ID:', propertyId);
        return null;
      }
      
      return { name: property.property_name || 'Property' };
    } catch (error) {
      console.error('❌ Property info query failed:', error);
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
        console.error('❌ Active inspection query error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to find active inspection:', error);
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

        let data, error;
        
        // Since we're receiving UUID property_id values from the database function,
        // we need to handle this properly in inspection creation
        
        try {
          // Try the RPC function with UUID property_id
          console.log('🔄 Attempting inspection creation with UUID property_id:', propertyId);
          
          const rpcResult = await supabase.rpc('create_inspection_compatibility', {
            property_id: propertyId, // Pass UUID as string
            inspector_id: user.id
          });
          data = rpcResult.data;
          error = rpcResult.error;
          
          if (!error && data) {
            console.log('✅ RPC function succeeded with UUID property_id');
          }
        } catch (rpcError) {
          console.log('⚠️ RPC function failed, trying direct insert with UUID property_id');
          
          // Try direct insert with UUID property_id
          // The inspections table may actually accept UUID property_id values
          const insertResult = await supabase
            .from('inspections')
            .insert({
              property_id: propertyId, // Use UUID property_id directly
              start_time: new Date().toISOString(),
              completed: false,
              status: 'draft',
              inspector_id: user.id
            })
            .select('id')
            .single();
          data = insertResult.data?.id;
          error = insertResult.error;
          
          if (!error && data) {
            console.log('✅ Direct insert succeeded with UUID property_id');
          }
        }

        if (error || !data) {
          throw error || new Error('No inspection ID returned');
        }

        // REMOVED: Console logging to prevent infinite loops
        // console.log('✅ Optimized inspection created:', data);
        
        // Brief wait for trigger to populate checklist items
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return data;

      } catch (error) {
        console.error(`❌ Optimized inspection creation attempt ${attempt} failed:`, error);
        
        // Log detailed error information for debugging
        const errorDetails = {
          attempt,
          propertyId,
          propertyIdType: typeof propertyId,
          propertyIdLength: propertyId.length,
          isUUID: propertyId.includes('-'),
          errorMessage: error instanceof Error ? error.message : String(error),
          errorCode: (error as any)?.code,
          errorDetails: (error as any)?.details,
          errorHint: (error as any)?.hint,
          timestamp: new Date().toISOString()
        };
        console.error('🔍 Detailed mobile error information:', errorDetails);
        
        if (attempt === this.MAX_RETRIES) {
          // Provide more detailed error message with context
          const detailedMessage = error instanceof Error 
            ? `${error.message}${(error as any)?.code ? ` (Code: ${(error as any).code})` : ''}`
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
      
      // Query actual logs table for this inspection
      const { count, error } = await supabase
        .from('logs')
        .select('*', { count: 'exact', head: true })
        .eq('inspection_id', inspectionId);

      if (error) {
        console.error('❌ Error counting inspection checklist items:', error);
        // Fall back to static_safety_items count if logs query fails
        const { count: staticCount, error: staticError } = await supabase
          .from('static_safety_items')
          .select('*', { count: 'exact', head: true });
        
        if (staticError) {
          console.error('❌ Error counting static safety items:', staticError);
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
      console.error('❌ Failed to count inspection checklist items:', error);
      return 8; // Fallback to default
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
        console.warn('⚠️ Inspector assignment failed (non-critical):', error);
      } else {
        // REMOVED: Console logging to prevent infinite loops
        // console.log('✅ Inspector assigned to optimized inspection');
      }
    } catch (error) {
      console.warn('⚠️ Inspector assignment error (non-critical):', error);
    }
  }
}

export { MobileInspectionOptimizer };
