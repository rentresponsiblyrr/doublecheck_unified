
import { supabase } from "@/integrations/supabase/client";

export class InspectionValidationService {
  async checkForExistingInspection(propertyId: string): Promise<string | null> {
    const { data: existingInspections, error: checkError } = await supabase
      .from('inspections')
      .select('id, completed')
      .eq('property_id', propertyId)
      .eq('completed', false);

    if (checkError) {
      console.error('❌ Error checking existing inspections:', checkError);
      throw checkError;
    }

    if (existingInspections && existingInspections.length > 0) {
      console.log('📋 Found existing active inspection:', existingInspections[0].id);
      return existingInspections[0].id;
    }

    return null;
  }

  async verifyChecklistItems(inspectionId: string): Promise<void> {
    const { data: checklistItems, error: checklistError } = await supabase
      .from('checklist_items')
      .select('id')
      .eq('inspection_id', inspectionId);

    if (checklistError) {
      console.error('❌ Error checking checklist items:', checklistError);
    } else {
      console.log(`📋 Verified ${checklistItems?.length || 0} checklist items created`);
    }
  }
}
