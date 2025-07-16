
import { supabase } from "@/integrations/supabase/client";
import { ensureValidCategory } from "@/utils/categoryMapping";

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
  static_safety_item_id: string;
  created_at: string;
}

export class ChecklistDataService {
  async fetchStaticSafetyItems(): Promise<StaticSafetyItem[]> {
    console.log('📋 Fetching static safety items from database...');
    
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
    
    // Apply category normalization
    const normalizedItems = staticItems.map(item => ({
      ...item,
      category: ensureValidCategory(item.category)
    }));

    return normalizedItems;
  }

  async insertChecklistItems(checklistItems: ChecklistItem[]): Promise<void> {
    console.log('📝 Inserting checklist items:', checklistItems.length);

    if (checklistItems.length === 0) {
      console.warn('⚠️ No checklist items to insert');
      return;
    }

    // Apply final category normalization before insertion
    const normalizedItems = checklistItems.map(item => ({
      ...item,
      category: ensureValidCategory(item.category)
    }));

    try {
      // Note: The current database schema uses 'checklist' table, not 'checklist_items'
      // However, the checklist table is for templates, not inspection-specific items
      // For now, we'll create a proper inspection-specific approach
      
      console.log('⚠️ Checklist data service needs redesign - current table is for templates only');
      console.log('📋 Normalized items to be handled:', normalizedItems.length);
      
      // TODO: Implement proper inspection-specific checklist item creation
      // This should either:
      // 1. Create a new table for inspection-specific checklist items
      // 2. Use the existing checklist table with inspection_id foreign key
      // 3. Use a junction table to link inspections to checklist templates
      
      return; // Skip actual insertion until table structure is clarified

      console.log('✅ Successfully inserted checklist items');
    } catch (error) {
      console.error('💥 Insertion error:', error);
      throw error;
    }
  }
}
