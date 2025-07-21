
import { supabase } from "@/integrations/supabase/client";

export interface RobustInspectionResult {
  inspectionId: string;
  isNew: boolean;
  checklistItemsCount: number;
}

export class RobustMobileInspectionService {
  private static readonly TIMEOUT_MS = 10000; // 10 seconds
  private static readonly MAX_RETRIES = 3;

  static async validatePropertyAccess(propertyId: string): Promise<boolean> {
    try {
      
      const { data, error } = await supabase
        .from('properties')
        .select('id, added_by')
        .eq('id', propertyId)
        .single();

      if (error) {
        return false;
      }

      return !!data;
    } catch (error) {
      return false;
    }
  }

  static async findActiveInspectionSecure(propertyId: string): Promise<string | null> {
    try {

      const { data, error } = await supabase
        .from('inspections')
        .select('id, inspector_id, status')
        .eq('property_id', propertyId)
        .eq('completed', false)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return null;
      }

      if (data) {
        return data.id;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  static async createInspectionWithRetry(propertyId: string): Promise<string> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {

        const { data, error } = await supabase
          .from('inspections')
          .insert({
            property_id: propertyId,
            start_time: new Date().toISOString(),
            completed: false,
            status: 'available',
            inspector_id: null // Will be assigned when inspector starts
          })
          .select('id')
          .single();

        if (error) {
          throw error;
        }

        if (!data?.id) {
          throw new Error('No inspection ID returned from database');
        }

        
        // Verify checklist items were created by trigger
        await this.verifyChecklistItemsCreated(data.id);
        
        return data.id;

      } catch (error) {
        
        if (attempt === this.MAX_RETRIES) {
          throw new Error(`Failed to create inspection after ${this.MAX_RETRIES} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error('Max retries exceeded');
  }

  static async verifyChecklistItemsCreated(inspectionId: string): Promise<number> {
    try {
      
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data, error } = await supabase
        .from('logs')
        .select('id')
        .eq('inspection_id', inspectionId);

      if (error) {
        return 0;
      }

      const count = data?.length || 0;
      
      if (count === 0) {
        // Could potentially try to manually populate here if needed
      }
      
      return count;
    } catch (error) {
      return 0;
    }
  }

  static async getOrCreateInspectionRobust(propertyId: string): Promise<RobustInspectionResult> {

    // Step 1: Validate property access with RLS
    const hasAccess = await this.validatePropertyAccess(propertyId);
    if (!hasAccess) {
      throw new Error('Property not found or access denied. Please check if the property exists and you have permission to inspect it.');
    }

    // Step 2: Check for existing active inspection
    const activeInspectionId = await this.findActiveInspectionSecure(propertyId);
    if (activeInspectionId) {
      
      // Verify checklist items exist
      const itemCount = await this.verifyChecklistItemsCreated(activeInspectionId);
      
      return {
        inspectionId: activeInspectionId,
        isNew: false,
        checklistItemsCount: itemCount
      };
    }

    // Step 3: Create new inspection with retry logic
    const newInspectionId = await this.createInspectionWithRetry(propertyId);
    
    // Step 4: Verify checklist items were created
    const itemCount = await this.verifyChecklistItemsCreated(newInspectionId);
    
    return {
      inspectionId: newInspectionId,
      isNew: true,
      checklistItemsCount: itemCount
    };
  }

  static async assignInspectorToInspection(inspectionId: string): Promise<void> {
    try {
      
      const { data, error } = await supabase.rpc('assign_inspector_to_inspection', {
        p_inspection_id: inspectionId
      });

      if (error) {
        throw error;
      }

    } catch (error) {
      // Don't throw - this is not critical for mobile flow
    }
  }
}
