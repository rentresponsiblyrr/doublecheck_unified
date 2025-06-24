
import { supabase } from "@/integrations/supabase/client";
import { ChecklistPopulationService } from "./checklistPopulationService";

export class InspectionCreationService {
  private checklistService: ChecklistPopulationService;

  constructor() {
    this.checklistService = new ChecklistPopulationService();
  }

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

  async createNewInspection(propertyId: string): Promise<string> {
    let attempts = 0;
    const maxAttempts = 3;
    let inspectionId = null;

    while (attempts < maxAttempts && !inspectionId) {
      attempts++;
      console.log(`📝 Creating inspection attempt ${attempts}/${maxAttempts}`);

      try {
        const { data: newInspection, error: createError } = await supabase
          .from('inspections')
          .insert([{
            property_id: propertyId,
            start_time: new Date().toISOString(),
            status: 'available',
            completed: false
          }])
          .select()
          .single();

        if (createError) {
          console.error(`❌ Attempt ${attempts} failed:`, createError);
          if (attempts === maxAttempts) {
            throw createError;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          continue;
        }

        inspectionId = newInspection.id;
        console.log('✅ Inspection created successfully:', inspectionId);

        // Populate checklist items
        await this.checklistService.populateChecklistItems(inspectionId);

        // Verify checklist items were created
        await this.verifyChecklistItems(inspectionId);

      } catch (attemptError) {
        console.error(`💥 Attempt ${attempts} exception:`, attemptError);
        if (attempts === maxAttempts) {
          throw attemptError;
        }
      }
    }

    if (!inspectionId) {
      throw new Error('Failed to create inspection after multiple attempts');
    }

    return inspectionId;
  }

  private async verifyChecklistItems(inspectionId: string): Promise<void> {
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
