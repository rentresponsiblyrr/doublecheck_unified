
import { supabase } from "@/integrations/supabase/client";
import { validateCategory, ensureValidCategory } from "@/utils/categoryMapping";

export interface StaticSafetyItem {
  id: string;
  label: string;
  category: string;
  evidence_type: string;
}

export interface ChecklistItem {
  inspection_id: string;
  label: string;
  category: string;
  evidence_type: string;
  static_item_id: string;
  created_at: string;
}

export class ChecklistDataService {
  async fetchStaticSafetyItems(): Promise<StaticSafetyItem[]> {
    console.log('📋 Fetching static safety items from database with enhanced validation');
    
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
      return [];
    }

    console.log(`✅ Found ${staticItems.length} static safety items`);
    
    // Validate and clean categories on fetch
    const validatedItems = staticItems.map(item => ({
      ...item,
      category: ensureValidCategory(item.category)
    }));

    const categoryStats = validatedItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 Category distribution in static items:', categoryStats);
    
    return validatedItems;
  }

  async insertChecklistItems(checklistItems: ChecklistItem[]): Promise<void> {
    console.log('📝 Inserting checklist items with enhanced validation:', checklistItems.length);

    // Final validation before insertion with enhanced error handling
    const validatedItems = checklistItems.map((item, index) => {
      const safeCategory = ensureValidCategory(item.category);
      
      if (!validateCategory(safeCategory)) {
        const error = `Invalid category "${safeCategory}" detected for item at index ${index}: ${item.label}`;
        console.error(`❌ ${error}`);
        throw new Error(error);
      }
      
      return {
        ...item,
        category: safeCategory
      };
    });

    // Log final category distribution
    const finalCategoryStats = validatedItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📊 Final category distribution for insertion:', finalCategoryStats);

    try {
      const { error: insertError } = await supabase
        .from('checklist_items')
        .insert(validatedItems);

      if (insertError) {
        console.error('❌ Database insertion error:', insertError);
        
        // Enhanced error analysis
        if (insertError.message.includes('category_check') || insertError.message.includes('foreign key')) {
          console.error('🔍 Category constraint violation detected');
          console.error('📋 Items causing issues:', validatedItems.map(item => ({ 
            label: item.label, 
            category: item.category 
          })));
          
          // Try to identify the specific problematic categories
          const uniqueCategories = [...new Set(validatedItems.map(item => item.category))];
          console.error('🏷️ Unique categories in this batch:', uniqueCategories);
        }
        
        throw insertError;
      }

      console.log('✅ Successfully inserted checklist items with enhanced validation');
    } catch (error) {
      console.error('💥 Enhanced insertion error handling:', error);
      throw error;
    }
  }
}
