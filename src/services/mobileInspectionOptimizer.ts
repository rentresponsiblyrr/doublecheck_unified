
import { supabase } from "@/integrations/supabase/client";
import { mobileCache, MOBILE_CACHE_KEYS } from "@/utils/mobileCache";

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
      const { data, error } = await supabase
        .from('properties')
        .select('name')
        .eq('id', propertyId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        console.error('❌ Property not found:', error);
        return null;
      }

      return { name: data.name || 'Property' };
    } catch (error) {
      console.error('❌ Property info query failed:', error);
      return null;
    }
  }

  private static async findActiveInspectionOptimized(propertyId: string): Promise<{ id: string } | null> {
    try {
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
          const rpcResult = await supabase.rpc('create_inspection_for_current_user', {
            p_property_id: propertyId
          });
          data = rpcResult.data;
          error = rpcResult.error;
        } catch (rpcError) {
          console.log('RPC function not available, using direct insert with auth.uid()');
          // Get current user from Supabase auth
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('User not authenticated');
          }
          
          const insertResult = await supabase
            .from('inspections')
            .insert({
              property_id: propertyId,
              start_time: new Date().toISOString(),
              completed: false,
              status: 'available',
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
        
        if (attempt === this.MAX_RETRIES) {
          throw new Error(`Failed to create inspection after ${this.MAX_RETRIES} attempts`);
        }
        
        // Shorter wait for mobile
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }

  private static async getChecklistItemCount(inspectionId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('checklist_items')
        .select('*', { count: 'exact', head: true })
        .eq('inspection_id', inspectionId);

      if (error) {
        console.error('❌ Error counting checklist items:', error);
        return 0;
      }

      const itemCount = count || 0;
      console.log(`📋 Verified ${itemCount} checklist items for inspection:`, inspectionId);
      
      return itemCount;
    } catch (error) {
      console.error('❌ Failed to count checklist items:', error);
      return 0;
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
