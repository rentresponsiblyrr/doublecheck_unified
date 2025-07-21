
import { ensureValidCategory, validateCategory, updateValidCategories } from "@/utils/categoryMapping";
import { supabase } from "@/integrations/supabase/client";
import { StaticSafetyItem, ChecklistItem } from "./checklistDataService";

export class ChecklistValidationService {
  
  async initializeValidCategories(): Promise<void> {
    try {
      
      const { data: categories, error } = await supabase
        .from('categories')
        .select('name')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) {
        // Use fallback categories if database fetch fails
        updateValidCategories(['safety', 'accessibility', 'amenities', 'cleanliness', 'accuracy']);
        return;
      }
      
      const validCategories = categories?.map(c => c.name) || ['safety'];
      updateValidCategories(validCategories);
      
    } catch (error) {
      // Use fallback categories if any error occurs
      updateValidCategories(['safety', 'accessibility', 'amenities', 'cleanliness', 'accuracy']);
    }
  }

  validateStaticItems(staticItems: StaticSafetyItem[]): void {
    if (!staticItems || staticItems.length === 0) {
      throw new Error('No valid static safety items found for checklist population');
    }
    
    
    // Log category distribution
    const categoryStats = staticItems.reduce((acc, item) => {
      const safeCategory = ensureValidCategory(item.category);
      acc[safeCategory] = (acc[safeCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
  }

  transformToChecklistItems(
    staticItems: StaticSafetyItem[], 
    inspectionId: string
  ): ChecklistItem[] {
    
    const checklistItems: ChecklistItem[] = [];
    
    for (const item of staticItems) {
      try {
        // Use the enhanced category validation with auto-correction
        const safeCategory = ensureValidCategory(item.category);
        
        const checklistItem: ChecklistItem = {
          inspection_id: inspectionId,
          label: item.label || 'Unlabeled Item',
          category: safeCategory,
          evidence_type: item.evidence_type || 'photo',
          static_item_id: item.id,
          created_at: new Date().toISOString()
        };
        
        checklistItems.push(checklistItem);
        
      } catch (error) {
        
        // Create a safe fallback item with guaranteed valid category
        const fallbackItem: ChecklistItem = {
          inspection_id: inspectionId,
          label: item.label || 'Unlabeled Item',
          category: 'safety', // Guaranteed safe category
          evidence_type: item.evidence_type || 'photo',
          static_item_id: item.id,
          created_at: new Date().toISOString()
        };
        
        checklistItems.push(fallbackItem);
      }
    }
    
    
    // Final validation of all items
    const allValid = checklistItems.every(item => validateCategory(item.category));
    if (!allValid) {
    }
    
    return checklistItems;
  }
  
  async validateChecklistCreation(checklistItems: ChecklistItem[]): Promise<void> {
    
    if (checklistItems.length === 0) {
      throw new Error('No checklist items to insert');
    }
    
    // Log final category distribution
    const finalCategoryStats = checklistItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  }
}
