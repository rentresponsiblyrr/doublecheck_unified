
import { mapCategory, validateCategory, ensureValidCategory, updateValidCategories } from "@/utils/categoryMapping";
import { supabase } from "@/integrations/supabase/client";
import { StaticSafetyItem, ChecklistItem } from "./checklistDataService";

export class ChecklistValidationService {
  
  async initializeValidCategories(): Promise<void> {
    try {
      console.log('🔄 Fetching valid categories from database...');
      
      const { data: categories, error } = await supabase
        .from('categories')
        .select('name')
        .eq('is_active', true);
      
      if (error) {
        console.error('❌ Error fetching categories:', error);
        return;
      }
      
      const validCategories = categories?.map(c => c.name) || ['safety'];
      updateValidCategories(validCategories);
      
      console.log('✅ Updated valid categories:', validCategories);
    } catch (error) {
      console.error('❌ Error initializing valid categories:', error);
    }
  }

  validateStaticItems(staticItems: StaticSafetyItem[]): void {
    if (!staticItems || staticItems.length === 0) {
      throw new Error('No valid static safety items found for checklist population');
    }
    
    console.log(`🔍 Validating ${staticItems.length} static items...`);
    
    // Check for any items with invalid categories
    const invalidItems = staticItems.filter(item => 
      !validateCategory(ensureValidCategory(item.category))
    );
    
    if (invalidItems.length > 0) {
      console.warn(`⚠️ Found ${invalidItems.length} items with potentially invalid categories:`, 
        invalidItems.map(item => ({ id: item.id, label: item.label, category: item.category }))
      );
    }
  }

  transformToChecklistItems(
    staticItems: StaticSafetyItem[], 
    inspectionId: string
  ): ChecklistItem[] {
    console.log(`🔄 Transforming ${staticItems.length} static items to checklist items`);
    
    const checklistItems: ChecklistItem[] = [];
    const errors: string[] = [];
    
    for (const item of staticItems) {
      try {
        // Use the enhanced category validation with auto-correction
        const safeCategory = ensureValidCategory(item.category);
        
        // Double-check the category is valid before proceeding
        if (!validateCategory(safeCategory)) {
          const error = `Critical error: Category "${safeCategory}" is still invalid after mapping from "${item.category}"`;
          console.error(`❌ ${error}`);
          errors.push(error);
          continue;
        }
        
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
        const errorMessage = `Error transforming static item "${item.label}": ${error}`;
        console.error(`❌ ${errorMessage}`);
        errors.push(errorMessage);
        
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
    
    if (errors.length > 0) {
      console.warn(`⚠️ Encountered ${errors.length} errors during transformation:`, errors);
    }
    
    console.log(`✅ Successfully transformed ${checklistItems.length} checklist items`);
    
    // Final validation of all items
    const finalValidation = checklistItems.every(item => validateCategory(item.category));
    if (!finalValidation) {
      throw new Error('Critical validation failure: Some items still have invalid categories after transformation');
    }
    
    return checklistItems;
  }
  
  async validateChecklistCreation(checklistItems: ChecklistItem[]): Promise<void> {
    console.log('🔍 Performing final validation before database insertion...');
    
    // Initialize categories if not done yet
    await this.initializeValidCategories();
    
    const invalidItems = checklistItems.filter(item => !validateCategory(item.category));
    
    if (invalidItems.length > 0) {
      const errorMessage = `Found ${invalidItems.length} items with invalid categories: ${
        invalidItems.map(item => `"${item.label}" (${item.category})`).join(', ')
      }`;
      console.error(`❌ ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    console.log('✅ All checklist items passed final validation');
  }
}
