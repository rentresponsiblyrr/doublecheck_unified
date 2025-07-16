
import { supabase } from "@/integrations/supabase/client";

export class InspectionValidationService {
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

  static async verifyChecklistItemsCreated(inspectionId: string): Promise<number> {
    try {
      console.log('🔍 Verifying checklist items for inspection:', inspectionId);
      
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase
        .from('inspection_checklist_items')
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
      }
      
      return count;
    } catch (error) {
      console.error('❌ Failed to verify checklist items:', error);
      return 0;
    }
  }
}
