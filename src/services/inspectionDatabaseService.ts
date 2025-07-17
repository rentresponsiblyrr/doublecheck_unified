
import { supabase } from "@/integrations/supabase/client";

export class InspectionDatabaseService {
  async createInspectionRecord(propertyId: string): Promise<string> {
    const { data: newInspection, error: createError } = await supabase
      .from('inspections_fixed')
      .insert([{
        property_id: propertyId,
        start_time: new Date().toISOString(),
        status: 'available',
        completed: false
      }])
      .select()
      .single();

    if (createError) {
      console.error('❌ Database inspection creation failed:', createError);
      throw createError;
    }

    console.log('✅ Inspection record created successfully:', newInspection.id);
    return newInspection.id;
  }
}
