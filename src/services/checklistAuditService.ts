
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItem, StaticSafetyItem } from "./checklistDataService";

export class ChecklistAuditService {
  async logPopulationAudit(
    inspectionId: string, 
    checklistItems: ChecklistItem[], 
    staticItems: StaticSafetyItem[]
  ): Promise<void> {
    try {
      const categoryMappings = checklistItems.map(item => ({
        label: item.label,
        original_category: staticItems.find(si => si.id === item.static_item_id)?.category,
        mapped_category: item.category
      }));

      await supabase
        .from('checklist_operations_audit')
        .insert({
          inspection_id: inspectionId,
          operation_type: 'manual_populate',
          items_affected: checklistItems.length,
          metadata: { 
            manual_insertion: true, 
            category_mapping_applied: true,
            mapped_categories: categoryMappings
          }
        });

      console.log('📊 Audit log entry created for checklist population');
    } catch (error) {
      console.error('⚠️ Failed to log audit entry:', error);
      // Don't throw here - audit logging failure shouldn't break the main operation
    }
  }
}
