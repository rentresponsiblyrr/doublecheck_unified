
import { supabase } from "@/integrations/supabase/client";

export interface InspectionResult {
  inspectionId: string;
  isNew: boolean;
  property?: any;
}

export class MobileInspectionService {
  private static readonly TIMEOUT_MS = 8000; // 8 seconds for mobile
  private static readonly MAX_RETRIES = 2;

  static async validatePropertyExists(propertyId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id')
        .eq('id', propertyId)
        .single();

      if (error) {
        console.error('❌ Property validation error:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Property validation failed:', error);
      return false;
    }
  }

  static async findActiveInspection(propertyId: string): Promise<string | null> {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), this.TIMEOUT_MS);
      });

      const queryPromise = supabase
        .from('inspections')
        .select('id')
        .eq('property_id', propertyId)
        .eq('completed', false)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Active inspection query error:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('❌ Failed to find active inspection:', error);
      return null;
    }
  }

  static async createNewInspection(propertyId: string): Promise<string> {
    // Validate property exists first
    const propertyExists = await this.validatePropertyExists(propertyId);
    if (!propertyExists) {
      throw new Error('Property not found or access denied');
    }

    let attempt = 0;
    while (attempt < this.MAX_RETRIES) {
      try {
        const { data, error } = await supabase
          .from('inspections')
          .insert({
            property_id: propertyId,
            start_time: new Date().toISOString(),
            completed: false,
            status: 'available'
          })
          .select('id')
          .single();

        if (error) {
          throw error;
        }

        if (!data?.id) {
          throw new Error('No inspection ID returned from database');
        }

        console.log('✅ Created inspection:', data.id);
        return data.id;

      } catch (error) {
        attempt++;
        console.error(`❌ Inspection creation attempt ${attempt} failed:`, error);
        
        if (attempt >= this.MAX_RETRIES) {
          throw new Error(`Failed to create inspection after ${this.MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }

  static async getOrCreateInspection(propertyId: string): Promise<InspectionResult> {
    console.log('🔍 Getting or creating inspection for property:', propertyId);

    // Step 1: Validate property exists
    const propertyExists = await this.validatePropertyExists(propertyId);
    if (!propertyExists) {
      throw new Error('Property not found. Please check if the property still exists.');
    }

    // Step 2: Check for active inspection
    const activeInspectionId = await this.findActiveInspection(propertyId);
    if (activeInspectionId) {
      console.log('📋 Found active inspection:', activeInspectionId);
      return {
        inspectionId: activeInspectionId,
        isNew: false
      };
    }

    // Step 3: Create new inspection
    console.log('🆕 Creating new inspection for property:', propertyId);
    const newInspectionId = await this.createNewInspection(propertyId);
    
    return {
      inspectionId: newInspectionId,
      isNew: true
    };
  }
}
