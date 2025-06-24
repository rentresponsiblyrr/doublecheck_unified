
import { supabase } from "@/integrations/supabase/client";

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

    const { error: insertError } = await supabase
      .from('checklist_items')
      .insert(checklistItems);

    if (insertError) {
      console.error('❌ Error inserting checklist items:', insertError);
      throw insertError;
    }

    console.log('✅ Successfully inserted checklist items');
  }
}
