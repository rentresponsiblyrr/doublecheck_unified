
import { supabase } from "@/integrations/supabase/client";
import { log } from "@/lib/logging/enterprise-logger";

export class InspectionValidationService {
  static async validatePropertyAccess(propertyId: string): Promise<boolean> {
    try {
      log.info('Validating property access', {
        component: 'InspectionValidationService',
        action: 'validatePropertyAccess',
        propertyId
      }, 'PROPERTY_ACCESS_VALIDATION');
      
      const { data, error } = await supabase
        .from('properties')
        .select('id, added_by')
        .eq('id', propertyId)
        .single();

      if (error) {
        log.error('Property validation error', error, {
          component: 'InspectionValidationService',
          action: 'validatePropertyAccess',
          propertyId
        }, 'PROPERTY_VALIDATION_ERROR');
        return false;
      }

      log.info('Property access validated successfully', {
        component: 'InspectionValidationService',
        action: 'validatePropertyAccess',
        propertyId,
        foundPropertyId: data?.id
      }, 'PROPERTY_ACCESS_VALIDATED');
      return !!data;
    } catch (error) {
      log.error('Property access validation failed', error as Error, {
        component: 'InspectionValidationService',
        action: 'validatePropertyAccess',
        propertyId
      }, 'PROPERTY_ACCESS_VALIDATION_FAILED');
      return false;
    }
  }

  static async verifyChecklistItemsCreated(inspectionId: string): Promise<number> {
    try {
      log.info('Verifying checklist items creation', {
        component: 'InspectionValidationService',
        action: 'verifyChecklistItemsCreated',
        inspectionId
      }, 'CHECKLIST_ITEMS_VERIFICATION');
      
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // First get the property_id from the inspection (logs table uses property_id, not inspection_id)
      const { data: inspectionData, error: inspectionError } = await supabase
        .from('inspections')
        .select('property_id')
        .eq('id', inspectionId)
        .single();

      if (inspectionError) {
        log.error('Error getting inspection for checklist verification', inspectionError, {
          component: 'InspectionValidationService',
          action: 'verifyChecklistItemsCreated',
          inspectionId
        }, 'INSPECTION_LOOKUP_ERROR');
        return 0;
      }

      if (!inspectionData) {
        log.error('Inspection not found for checklist verification', null, {
          component: 'InspectionValidationService',
          action: 'verifyChecklistItemsCreated',
          inspectionId
        }, 'INSPECTION_NOT_FOUND');
        return 0;
      }
      
      // Now get checklist items using property_id (verified schema approach)
      const { data, error } = await supabase
        .from('logs')
        .select('id')
        .eq('property_id', inspectionData.property_id);

      if (error) {
        log.error('Error verifying checklist items', error, {
          component: 'InspectionValidationService',
          action: 'verifyChecklistItemsCreated',
          inspectionId,
          propertyId: inspectionData.property_id
        }, 'CHECKLIST_VERIFICATION_ERROR');
        return 0;
      }

      const count = data?.length || 0;
      log.info('Checklist items verification completed', {
        component: 'InspectionValidationService',
        action: 'verifyChecklistItemsCreated',
        inspectionId,
        itemsCount: count
      }, 'CHECKLIST_ITEMS_VERIFIED');
      
      if (count === 0) {
        log.warn('No checklist items found - trigger may have failed', {
          component: 'InspectionValidationService',
          action: 'verifyChecklistItemsCreated',
          inspectionId,
          itemsCount: count
        }, 'CHECKLIST_ITEMS_NOT_FOUND');
      }
      
      return count;
    } catch (error) {
      log.error('Failed to verify checklist items', error as Error, {
        component: 'InspectionValidationService',
        action: 'verifyChecklistItemsCreated',
        inspectionId
      }, 'CHECKLIST_VERIFICATION_FAILED');
      return 0;
    }
  }
}
