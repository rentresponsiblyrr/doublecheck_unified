
import { mapCategory } from "@/utils/categoryMapping";
import { StaticSafetyItem, ChecklistItem } from "./checklistDataService";

export class ChecklistValidationService {
  validateStaticItems(staticItems: StaticSafetyItem[]): void {
    if (!staticItems || staticItems.length === 0) {
      throw new Error('No valid static safety items found for checklist population');
    }
  }

  transformToChecklistItems(
    staticItems: StaticSafetyItem[], 
    inspectionId: string
  ): ChecklistItem[] {
    return staticItems.map(item => {
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
  }
}
