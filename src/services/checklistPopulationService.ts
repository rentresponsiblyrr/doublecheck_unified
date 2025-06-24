
import { supabase } from "@/integrations/supabase/client";
import { mapCategory } from "@/utils/categoryMapping";

export interface ChecklistItem {
  inspection_id: string;
  label: string;
  category: string;
  evidence_type: string;
  static_item_id: string;
  created_at: string;
}

export class ChecklistPopulationService {
  async populateChecklistItems(inspectionId: string): Promise<void> {
    try {
      console.log('📋 Manually populating checklist items for inspection:', inspectionId);
      
      // Get static safety items
      const { data: staticItems, error: fetchError } = await supabase
        .from('static_safety_items')
        .select('*')
        .eq('deleted', false)
        .eq('required', true);

      if (fetchError) {
        console.error('❌ Error fetching static safety items:', fetchError);
        throw fetchError;
      }

      if (!staticItems || staticItems.length === 0) {
        console.warn('⚠️ No static safety items found');
        return;
      }

      // Prepare checklist items with mapped categories
      const checklistItems: ChecklistItem[] = staticItems.map(item => {
        const mappedCategory = mapCategory(item.category);
        
        return {
          inspection_id: inspectionId,
          label: item.label,
          category: mappedCategory,
          evidence_type: item.evidence_type,
          static_item_id: item.id,
          created_at: new Date().toISOString()
        };
      });

      console.log('📝 Inserting checklist items:', checklistItems.length);

      // Insert checklist items
      const { error: insertError } = await supabase
        .from('checklist_items')
        .insert(checklistItems);

      if (insertError) {
        console.error('❌ Error inserting checklist items:', insertError);
        throw insertError;
      }

      // Log successful population
      await this.logPopulationAudit(inspectionId, checklistItems, staticItems);

      console.log('✅ Successfully populated checklist items manually');
      
    } catch (error) {
      console.error('💥 Error in manual checklist population:', error);
      throw error;
    }
  }

  private async logPopulationAudit(
    inspectionId: string, 
    checklistItems: ChecklistItem[], 
    staticItems: any[]
  ): Promise<void> {
    await supabase
      .from('checklist_operations_audit')
      .insert({
        inspection_id: inspectionId,
        operation_type: 'manual_populate',
        items_affected: checklistItems.length,
        metadata: { 
          manual_insertion: true, 
          category_mapping_applied: true,
          mapped_categories: checklistItems.map(item => ({
            label: item.label,
            original_category: staticItems.find(si => si.id === item.static_item_id)?.category,
            mapped_category: item.category
          }))
        }
      });
  }
}
