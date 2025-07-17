
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
    console.log('📱 Starting optimized mobile inspection flow for:', propertyId);

    try {
      // Use a single optimized query to get property info and existing inspection
      const [propertyResult, inspectionResult] = await Promise.all([
        this.getPropertyInfo(propertyId),
        this.findActiveInspectionOptimized(propertyId)
      ]);

      if (!propertyResult) {
        throw new Error('Property not found or access denied');
      }

      // If active inspection exists, return it
      if (inspectionResult) {
        console.log('📋 Joining existing optimized inspection:', inspectionResult.id);
        
        const itemCount = await this.getChecklistItemCount(inspectionResult.id);
        
        return {
          inspectionId: inspectionResult.id,
          isNew: false,
          checklistItemsCount: itemCount,
          propertyName: propertyResult.name
        };
      }

      // Create new inspection
      console.log('🆕 Creating new optimized inspection for property:', propertyId);
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
      // Use propertyId as UUID string (no conversion needed)
      const propertyIdUuid = IdConverter.property.toDatabase(propertyId);

      // Convert property ID to integer for database query
      const propertyIdInt = parseInt(propertyId, 10);
      
      const { data, error } = await supabase
        .from('properties')
        .select('property_name')
        .eq('property_id', propertyIdInt)
        .single();

      if (error || !data) {
        console.error('❌ Property not found:', error);
        return null;
      }

      return { name: data.property_name || 'Property' };
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
        console.log(`🔄 Creating optimized inspection attempt ${attempt}/${this.MAX_RETRIES}`);

        // Try RPC function first, fallback to direct insert
        let data, error;
        
        try {
          // Use propertyId as UUID string for the database function
          const propertyIdUuid = IdConverter.property.toDatabase(propertyId);

          // Get current user for the secure function
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }

          // Use available RPC function instead of removed create_inspection_secure
          const rpcResult = await supabase.rpc('create_inspection_compatibility', {
            property_id: propertyId, // Pass as string
            inspector_id: user.id
          });
          data = rpcResult.data;
          error = rpcResult.error;
        } catch (rpcError) {
          console.log('RPC function not available, using direct insert');
          // Get current user from Supabase auth
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }
          
          // Use propertyId as string for direct insert (production schema)
          const insertResult = await supabase
            .from('inspections')
            .insert({
              property_id: propertyId, // Property ID as string in inspections table
              start_time: new Date().toISOString(),
              completed: false,
              status: 'draft',
              inspector_id: user.id
            })
            .select('id')
            .single();
          data = insertResult.data?.id;
          error = insertResult.error;
        }

        if (error || !data) {
          throw error || new Error('No inspection ID returned');
        }

        console.log('✅ Optimized inspection created:', data);
        
        // Brief wait for trigger to populate checklist items
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return data;

      } catch (error) {
        console.error(`❌ Optimized inspection creation attempt ${attempt} failed:`, error);
        
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
      console.log(`📋 Fetching checklist item count for inspection:`, inspectionId);
      
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
        console.log(`📋 Using static safety items count as fallback: ${fallbackCount}`);
        return fallbackCount;
      }

      const actualCount = count || 0;
      console.log(`📋 Found ${actualCount} inspection checklist items for inspection ${inspectionId}`);
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
        console.log('✅ Inspector assigned to optimized inspection');
      }
    } catch (error) {
      console.warn('⚠️ Inspector assignment error (non-critical):', error);
    }
  }
}

export { MobileInspectionOptimizer };
