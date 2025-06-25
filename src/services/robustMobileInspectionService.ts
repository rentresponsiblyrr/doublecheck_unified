
import { supabase } from "@/integrations/supabase/client";

export interface RobustInspectionResult {
  inspectionId: string;
  isNew: boolean;
  checklistItemsCount: number;
}

export class RobustMobileInspectionService {
  private static readonly TIMEOUT_MS = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 3;

  static async validatePropertyAccess(propertyId: string): Promise<boolean> {
    try {
      console.log('🔍 Validating property access:', propertyId);
      
      const { data, error } = await supabase
        .from('properties')
        .select('id, added_by')
        .eq('id', propertyId)
        .single();

      if (error) {
        console.error('❌ Property validation error:', error);
        return false;
      }

      console.log('✅ Property access validated:', data?.id);
      return !!data;
    } catch (error) {
      console.error('❌ Property access validation failed:', error);
      return false;
    }
  }

  static async findActiveInspectionSecure(propertyId: string): Promise<string | null> {
    try {
      console.log('🔍 Finding active inspection for property:', propertyId);

      const { data, error } = await supabase
        .from('inspections')
        .select('id, inspector_id, status')
        .eq('property_id', propertyId)
        .eq('completed', false)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Active inspection query error:', error);
        return null;
      }

      if (data) {
        console.log('📋 Found active inspection:', data.id, 'Status:', data.status);
        return data.id;
      }

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
            status: 'available',
            inspector_id: null // Will be assigned when inspector starts
          })
          .select('id')
          .single();

        if (error) {
          throw error;
        }

        if (!data?.id) {
          throw new Error('No inspection ID returned from database');
        }

        console.log('✅ Inspection created successfully:', data.id);
        
        // Verify checklist items were created by trigger
        await this.verifyChecklistItemsCreated(data.id);
        
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

  static async verifyChecklistItemsCreated(inspectionId: string): Promise<number> {
    try {
      console.log('🔍 Verifying checklist items for inspection:', inspectionId);
      
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase
        .from('checklist_items')
        .select('id')
        .eq('inspection_id', inspectionId);

      if (error) {
        console.error('❌ Error verifying checklist items:', error);
        return 0;
      }

      const count = data?.length || 0;
      console.log(`📋 Verified ${count} checklist items created`);
      
      if (count === 0) {
        console.warn('⚠️ No checklist items found - trigger may have failed');
        // Could potentially try to manually populate here if needed
      }
      
      return count;
    } catch (error) {
      console.error('❌ Failed to verify checklist items:', error);
      return 0;
    }
  }

  static async getOrCreateInspectionRobust(propertyId: string): Promise<RobustInspectionResult> {
    console.log('🚀 Starting robust mobile inspection flow for property:', propertyId);

    // Step 1: Validate property access with RLS
    const hasAccess = await this.validatePropertyAccess(propertyId);
    if (!hasAccess) {
      throw new Error('Property not found or access denied. Please check if the property exists and you have permission to inspect it.');
    }

    // Step 2: Check for existing active inspection
    const activeInspectionId = await this.findActiveInspectionSecure(propertyId);
    if (activeInspectionId) {
      console.log('📋 Joining existing inspection:', activeInspectionId);
      
      // Verify checklist items exist
      const itemCount = await this.verifyChecklistItemsCreated(activeInspectionId);
      
      return {
        inspectionId: activeInspectionId,
        isNew: false,
        checklistItemsCount: itemCount
      };
    }

    // Step 3: Create new inspection with retry logic
    console.log('🆕 Creating new inspection for property:', propertyId);
    const newInspectionId = await this.createInspectionWithRetry(propertyId);
    
    // Step 4: Verify checklist items were created
    const itemCount = await this.verifyChecklistItemsCreated(newInspectionId);
    
    return {
      inspectionId: newInspectionId,
      isNew: true,
      checklistItemsCount: itemCount
    };
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
