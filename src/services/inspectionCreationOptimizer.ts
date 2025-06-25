
import { supabase } from "@/integrations/supabase/client";
import { InspectionValidationService } from "./inspectionValidationService";

export class InspectionCreationOptimizer {
  private static readonly MAX_RETRIES = 3;

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
            inspector_id: null
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
