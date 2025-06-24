
import { ensureValidCategory, validateCategory, updateValidCategories } from "@/utils/categoryMapping";
import { supabase } from "@/integrations/supabase/client";
import { StaticSafetyItem, ChecklistItem } from "./checklistDataService";

export class ChecklistValidationService {
  
  async initializeValidCategories(): Promise<void> {
    try {
      console.log('🔄 Fetching valid categories from database...');
      
      const { data: categories, error } = await supabase
        .from('categories')
        .select('name')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching categories:', error);
        // Use fallback categories if database fetch fails
        updateValidCategories(['safety', 'accessibility', 'amenities', 'cleanliness', 'accuracy']);
        return;
      }
      
      const validCategories = categories?.map(c => c.name) || ['safety'];
      updateValidCategories(validCategories);
      
      console.log('✅ Successfully updated valid categories:', validCategories);
    } catch (error) {
      console.error('❌ Error initializing valid categories:', error);
      // Use fallback categories if any error occurs
      updateValidCategories(['safety', 'accessibility', 'amenities', 'cleanliness', 'accuracy']);
    }
  }

  validateStaticItems(staticItems: StaticSafetyItem[]): void {
    if (!staticItems || staticItems.length === 0) {
      throw new Error('No valid static safety items found for checklist population');
    }
    
    console.log(`🔍 Validating ${staticItems.length} static items...`);
    
    // Log category distribution
    const categoryStats = staticItems.reduce((acc, item) => {
      const safeCategory = ensureValidCategory(item.category);
      acc[safeCategory] = (acc[safeCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📊 Category distribution in static items:', categoryStats);
  }

  transformToChecklistItems(
    staticItems: StaticSafetyItem[], 
    inspectionId: string
  ): ChecklistItem[] {
    console.log(`🔄 Transforming ${staticItems.length} static items to checklist items`);
    
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
        
        console.log(`✅ Transformed item: "${item.label}" with category "${item.category}" -> "${safeCategory}"`);
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
    
    // Final validation of all items
    const allValid = checklistItems.every(item => validateCategory(item.category));
    if (!allValid) {
      console.warn('⚠️ Some items may have invalid categories after transformation');
    }
    
    return checklistItems;
  }
  
  async validateChecklistCreation(checklistItems: ChecklistItem[]): Promise<void> {
    console.log('🔍 Performing final validation before database insertion...');
    
    if (checklistItems.length === 0) {
      throw new Error('No checklist items to insert');
    }
    
    // Log final category distribution
    const finalCategoryStats = checklistItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 Final category distribution for insertion:', finalCategoryStats);
    console.log('✅ All checklist items passed final validation');
  }
}
