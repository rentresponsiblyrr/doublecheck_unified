
import { supabase } from "@/integrations/supabase/client";

export const deletePropertyData = async (propertyId: string): Promise<void> => {
  console.log('🗑️ Starting comprehensive property deletion for:', propertyId);

  try {
    // Step 1: Get all inspections for this property
    const { data: inspections, error: inspectionsQueryError } = await supabase
      .from('inspections')
      .select('id')
      .eq('property_id', propertyId);

    if (inspectionsQueryError) {
      console.error('❌ Error querying inspections:', inspectionsQueryError);
      throw new Error(`Failed to query inspections: ${inspectionsQueryError.message}`);
    }

    console.log('📋 Found inspections to delete:', inspections?.length || 0);

    if (inspections && inspections.length > 0) {
      const inspectionIds = inspections.map(inspection => inspection.id);
      
      // Step 2: Get all checklist items for these inspections
      const { data: checklistItems, error: checklistQueryError } = await supabase
        .from('checklist_items')
        .select('id')
        .in('inspection_id', inspectionIds);

      if (checklistQueryError) {
        console.error('❌ Error querying checklist items:', checklistQueryError);
        throw new Error(`Failed to query checklist items: ${checklistQueryError.message}`);
      }

      console.log('📝 Found checklist items to delete:', checklistItems?.length || 0);

      if (checklistItems && checklistItems.length > 0) {
        const checklistItemIds = checklistItems.map(item => item.id);
        
        // Step 3: Delete checklist item change logs (foreign key to checklist_items)
        console.log('📋 Deleting checklist item change logs...');
        const { error: changeLogError } = await supabase
          .from('checklist_item_change_log')
          .delete()
          .in('checklist_item_id', checklistItemIds);

        if (changeLogError) {
          console.error('❌ Error deleting checklist item change logs:', changeLogError);
          throw new Error(`Failed to delete checklist item change logs: ${changeLogError.message}`);
        }
        console.log('✅ Checklist item change logs deleted successfully');

        // Step 4: Delete checklist audit logs (foreign key to checklist_items)
        console.log('📋 Deleting checklist audit logs...');
        const { error: auditLogError } = await supabase
          .from('checklist_audit_log')
          .delete()
          .in('checklist_item_id', checklistItemIds);

        if (auditLogError) {
          console.error('❌ Error deleting checklist audit logs:', auditLogError);
          throw new Error(`Failed to delete checklist audit logs: ${auditLogError.message}`);
        }
        console.log('✅ Checklist audit logs deleted successfully');
        
        // Step 5: Delete media files for checklist items
        console.log('🎬 Deleting media for checklist items...');
        const { error: mediaError } = await supabase
          .from('media')
          .delete()
          .in('checklist_item_id', checklistItemIds);

        if (mediaError) {
          console.error('❌ Error deleting media:', mediaError);
          throw new Error(`Failed to delete media: ${mediaError.message}`);
        }
        console.log('✅ Media deleted successfully');
      }

      // Step 6: Delete collaboration conflicts for these inspections
      console.log('🤝 Deleting collaboration conflicts...');
      const { error: conflictsError } = await supabase
        .from('collaboration_conflicts')
        .delete()
        .in('inspection_id', inspectionIds);

      if (conflictsError) {
        console.error('❌ Error deleting collaboration conflicts:', conflictsError);
        throw new Error(`Failed to delete collaboration conflicts: ${conflictsError.message}`);
      }
      console.log('✅ Collaboration conflicts deleted successfully');

      // Step 7: Delete inspector assignments for these inspections
      console.log('👨‍🔧 Deleting inspector assignments...');
      const { error: assignmentsError } = await supabase
        .from('inspector_assignments')
        .delete()
        .in('inspection_id', inspectionIds);

      if (assignmentsError) {
        console.error('❌ Error deleting inspector assignments:', assignmentsError);
        throw new Error(`Failed to delete inspector assignments: ${assignmentsError.message}`);
      }
      console.log('✅ Inspector assignments deleted successfully');

      // Step 8: Delete inspector presence for these inspections
      console.log('👀 Deleting inspector presence...');
      const { error: presenceError } = await supabase
        .from('inspector_presence')
        .delete()
        .in('inspection_id', inspectionIds);

      if (presenceError) {
        console.error('❌ Error deleting inspector presence:', presenceError);
        throw new Error(`Failed to delete inspector presence: ${presenceError.message}`);
      }
      console.log('✅ Inspector presence deleted successfully');

      // Step 9: Delete checklist operations audit for these inspections
      console.log('📊 Deleting checklist operations audit...');
      const { error: operationsAuditError } = await supabase
        .from('checklist_operations_audit')
        .delete()
        .in('inspection_id', inspectionIds);

      if (operationsAuditError) {
        console.error('❌ Error deleting checklist operations audit:', operationsAuditError);
        throw new Error(`Failed to delete checklist operations audit: ${operationsAuditError.message}`);
      }
      console.log('✅ Checklist operations audit deleted successfully');

      // Step 10: Delete checklist items
      console.log('🗂️ Deleting checklist items...');
      const { error: checklistItemsError } = await supabase
        .from('checklist_items')
        .delete()
        .in('inspection_id', inspectionIds);

      if (checklistItemsError) {
        console.error('❌ Error deleting checklist items:', checklistItemsError);
        throw new Error(`Failed to delete checklist items: ${checklistItemsError.message}`);
      }
      console.log('✅ Checklist items deleted successfully');
    }

    // Step 11: Delete listing photos for this property
    console.log('📸 Deleting listing photos...');
    const { error: listingPhotosError } = await supabase
      .from('listing_photos')
      .delete()
      .eq('property_id', propertyId);

    if (listingPhotosError) {
      console.error('❌ Error deleting listing photos:', listingPhotosError);
      throw new Error(`Failed to delete listing photos: ${listingPhotosError.message}`);
    }
    console.log('✅ Listing photos deleted successfully');

    // Step 12: Delete webhook notifications for this property
    console.log('🔔 Deleting webhook notifications...');
    const { error: webhookError } = await supabase
      .from('webhook_notifications')
      .delete()
      .eq('property_id', propertyId);

    if (webhookError) {
      console.error('❌ Error deleting webhook notifications:', webhookError);
      throw new Error(`Failed to delete webhook notifications: ${webhookError.message}`);
    }
    console.log('✅ Webhook notifications deleted successfully');

    // Step 13: Delete all inspections for this property
    console.log('🔍 Deleting inspections...');
    const { error: inspectionsError } = await supabase
      .from('inspections')
      .delete()
      .eq('property_id', propertyId);

    if (inspectionsError) {
      console.error('❌ Error deleting inspections:', inspectionsError);
      throw new Error(`Failed to delete inspections: ${inspectionsError.message}`);
    }
    console.log('✅ Inspections deleted successfully');

    // Step 14: Finally, delete the property itself
    console.log('🏠 Deleting property...');
    const { error: propertyError } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (propertyError) {
      console.error('❌ Error deleting property:', propertyError);
      
      // Provide better error messages for common RLS issues
      if (propertyError.message.includes('violates row-level security')) {
        throw new Error('You can only delete properties you created or you need admin permissions.');
      }
      
      throw new Error(`Failed to delete property: ${propertyError.message}`);
    }

    console.log('✅ Property deleted successfully!');
  } catch (error) {
    console.error('💥 Comprehensive deletion failed:', error);
    throw error;
  }
};
