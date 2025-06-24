
import { supabase } from "@/integrations/supabase/client";
import { validateCategory } from "@/utils/categoryMapping";

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
    console.log('📋 Fetching static safety items from database');
    
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
    return staticItems;
  }

  async insertChecklistItems(checklistItems: ChecklistItem[]): Promise<void> {
    console.log('📝 Inserting checklist items:', checklistItems.length);

    // Final validation before insertion
    const validatedItems = checklistItems.map((item, index) => {
      if (!validateCategory(item.category)) {
        console.error(`❌ Invalid category "${item.category}" detected for item at index ${index}: ${item.label}`);
        // Force to safety category as last resort
        return {
          ...item,
          category: 'safety'
        };
      }
      return item;
    });

    console.log('📊 Category distribution:', 
      validatedItems.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    );

    const { error: insertError } = await supabase
      .from('checklist_items')
      .insert(validatedItems);

    if (insertError) {
      console.error('❌ Error inserting checklist items:', insertError);
      throw insertError;
    }

    console.log('✅ Successfully inserted checklist items');
  }
}
