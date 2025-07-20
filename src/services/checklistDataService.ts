
import { supabase } from "@/integrations/supabase/client";
import { ensureValidCategory } from "@/utils/categoryMapping";
import { log } from '@/lib/logging/enterprise-logger';

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
    log.info('Fetching static safety items from database', {
      component: 'ChecklistDataService',
      action: 'fetchStaticSafetyItems'
    }, 'STATIC_SAFETY_ITEMS_FETCH_STARTED');
    
    const { data: staticItems, error: fetchError } = await supabase
      .from('static_safety_items')
      .select('*')
      .eq('deleted', false)
      .eq('required', true);

    if (fetchError) {
      log.error('Error fetching static safety items', fetchError, {
        component: 'ChecklistDataService',
        action: 'fetchStaticSafetyItems'
      }, 'STATIC_SAFETY_ITEMS_FETCH_ERROR');
      throw fetchError;
    }

    if (!staticItems || staticItems.length === 0) {
      log.warn('No static safety items found', {
        component: 'ChecklistDataService',
        action: 'fetchStaticSafetyItems',
        filters: { deleted: false, required: true }
      }, 'NO_STATIC_SAFETY_ITEMS_FOUND');
      return [];
    }

    log.info('Found static safety items', {
      component: 'ChecklistDataService',
      action: 'fetchStaticSafetyItems',
      itemCount: staticItems.length,
      filters: { deleted: false, required: true }
    }, 'STATIC_SAFETY_ITEMS_FOUND');
    
    // Apply category normalization
    const normalizedItems = staticItems.map(item => ({
      ...item,
      category: ensureValidCategory(item.category)
    }));

    return normalizedItems;
  }

  async insertChecklistItems(checklistItems: ChecklistItem[]): Promise<void> {
    log.info('Inserting checklist items', {
      component: 'ChecklistDataService',
      action: 'insertChecklistItems',
      itemCount: checklistItems.length
    }, 'CHECKLIST_ITEMS_INSERT_STARTED');

    if (checklistItems.length === 0) {
      log.warn('No checklist items to insert', {
        component: 'ChecklistDataService',
        action: 'insertChecklistItems',
        itemCount: 0
      }, 'NO_CHECKLIST_ITEMS_TO_INSERT');
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
      
      log.warn('Checklist data service needs redesign - current table is for templates only', {
        component: 'ChecklistDataService',
        action: 'insertChecklistItems',
        normalizedItemCount: normalizedItems.length,
        issue: 'TABLE_STRUCTURE_MISMATCH'
      }, 'CHECKLIST_SERVICE_REDESIGN_NEEDED');
      
      // TODO: Implement proper inspection-specific checklist item creation
      // This should either:
      // 1. Create a new table for inspection-specific checklist items
      // 2. Use the existing checklist table with inspection_id foreign key
      // 3. Use a junction table to link inspections to checklist templates
      
      return; // Skip actual insertion until table structure is clarified

      log.info('Successfully inserted checklist items', {
        component: 'ChecklistDataService',
        action: 'insertChecklistItems',
        itemCount: normalizedItems.length
      }, 'CHECKLIST_ITEMS_INSERTED');
    } catch (error) {
      log.error('Checklist items insertion error', error as Error, {
        component: 'ChecklistDataService',
        action: 'insertChecklistItems',
        itemCount: normalizedItems.length
      }, 'CHECKLIST_ITEMS_INSERT_ERROR');
      throw error;
    }
  }
}
