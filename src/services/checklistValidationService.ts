
import { mapCategory, validateCategory } from "@/utils/categoryMapping";
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
    console.log(`🔄 Transforming ${staticItems.length} static items to checklist items`);
    
    const checklistItems: ChecklistItem[] = [];
    
    for (const item of staticItems) {
      try {
        // Map the category with comprehensive error handling
        const mappedCategory = mapCategory(item.category);
        
        // Double-check the category is valid before proceeding
        if (!validateCategory(mappedCategory)) {
          console.error(`❌ Invalid mapped category "${mappedCategory}" for item: ${item.label}`);
          throw new Error(`Invalid category "${mappedCategory}" after mapping from "${item.category}"`);
        }
        
        const checklistItem: ChecklistItem = {
          inspection_id: inspectionId,
          label: item.label || 'Unlabeled Item',
          category: mappedCategory,
          evidence_type: item.evidence_type || 'photo',
          static_item_id: item.id,
          created_at: new Date().toISOString()
        };
        
        console.log(`✅ Transformed item: "${item.label}" with category "${item.category}" -> "${mappedCategory}"`);
        checklistItems.push(checklistItem);
        
      } catch (error) {
        console.error(`❌ Error transforming static item "${item.label}":`, error);
        
        // Create a safe fallback item with guaranteed valid category
        const fallbackItem: ChecklistItem = {
          inspection_id: inspectionId,
          label: item.label || 'Unlabeled Item',
          category: 'safety', // Guaranteed safe category
          evidence_type: item.evidence_type || 'photo',
          static_item_id: item.id,
          created_at: new Date().toISOString()
        };
        
        console.log(`🔄 Created fallback item for "${item.label}" with safety category`);
        checklistItems.push(fallbackItem);
      }
    }
    
    console.log(`✅ Successfully transformed ${checklistItems.length} checklist items`);
    return checklistItems;
  }
}
