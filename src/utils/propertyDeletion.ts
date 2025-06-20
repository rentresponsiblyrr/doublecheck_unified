
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

      // Step 3: Delete media files for checklist items
      if (checklistItems && checklistItems.length > 0) {
        const checklistItemIds = checklistItems.map(item => item.id);
        
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

      // Step 4: Delete checklist items
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

    // Step 5: Delete listing photos for this property
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

    // Step 6: Delete webhook notifications for this property
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

    // Step 7: Delete all inspections for this property
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

    // Step 8: Finally, delete the property itself
    console.log('🏠 Deleting property...');
    const { error: propertyError } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (propertyError) {
      console.error('❌ Error deleting property:', propertyError);
      throw new Error(`Failed to delete property: ${propertyError.message}`);
    }

    console.log('✅ Property deleted successfully!');
  } catch (error) {
    console.error('💥 Comprehensive deletion failed:', error);
    throw error;
  }
};
