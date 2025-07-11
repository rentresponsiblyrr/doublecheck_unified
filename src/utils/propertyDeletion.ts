
import { supabase } from "@/integrations/supabase/client";

// Track properties currently being deleted to prevent race conditions
const deletionInProgress = new Set<string>();

export const deletePropertyData = async (propertyId: string): Promise<void> => {
  console.log('🗑️ Starting comprehensive property deletion for:', propertyId);

  // Prevent concurrent deletions of the same property
  if (deletionInProgress.has(propertyId)) {
    console.log('⚠️ Property deletion already in progress, skipping...');
    throw new Error('Property deletion is already in progress. Please wait for the current operation to complete.');
  }

  deletionInProgress.add(propertyId);

  // Helper function to safely delete from a table (handles table not existing)
  const safeDelete = async (
    tableName: string, 
    filter: { [key: string]: any }, 
    description: string
  ): Promise<void> => {
    try {
      let query = supabase.from(tableName).delete();
      
      // Apply filters
      Object.entries(filter).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });

      const { error } = await query;
      
      if (error) {
        // If table doesn't exist, that's okay - it means it's not in this environment
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`⚠️ Table ${tableName} doesn't exist - skipping ${description}`);
          return;
        }
        throw error;
      }
      
      console.log(`✅ ${description} deleted successfully`);
    } catch (error) {
      console.error(`❌ Error deleting ${description}:`, error);
      throw new Error(`Failed to delete ${description}: ${error.message}`);
    }
  };

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
        
        // Step 3: Delete checklist item change logs (foreign key to checklist_items) - SKIPPED (table removed)
        console.log('📋 Skipping checklist item change logs (collaboration table removed)...');

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

      // Step 6: Delete collaboration conflicts for these inspections - SKIPPED (table removed)
      console.log('🤝 Skipping collaboration conflicts (collaboration table removed)...');

      // Step 7: Delete inspector assignments for these inspections - SKIPPED (table removed)
      console.log('👨‍🔧 Skipping inspector assignments (collaboration table removed)...');

      // Step 8: Delete inspector presence for these inspections - SKIPPED (table removed)
      console.log('👀 Skipping inspector presence (collaboration table removed)...');

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

      // Step 9.1: Delete auditor feedback (AI learning data) - using safe delete
      console.log('🧠 Deleting auditor feedback...');
      await safeDelete('auditor_feedback', { inspection_id: inspectionIds }, 'auditor feedback');

      // Step 9.2: Delete RAG query logs (AI learning data) - using safe delete
      console.log('🔍 Deleting RAG query logs...');
      await safeDelete('rag_query_log', { inspection_id: inspectionIds }, 'RAG query logs');

      // Step 9.3: Delete audit feedback (new table) - using safe delete
      console.log('📝 Deleting audit feedback...');
      await safeDelete('audit_feedback', { inspection_id: inspectionIds }, 'audit feedback');

      // Step 9.4: Delete report deliveries - using safe delete
      console.log('📧 Deleting report deliveries...');
      await safeDelete('report_deliveries', { inspection_id: inspectionIds }, 'report deliveries');

      // Step 9.5: Delete inspection reports - using safe delete
      console.log('📄 Deleting inspection reports...');
      await safeDelete('inspection_reports', { inspection_id: inspectionIds }, 'inspection reports');

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
    
    // Mark deletion as complete
    deletionInProgress.delete(propertyId);
  } catch (error) {
    console.error('💥 Comprehensive deletion failed:', error);
    
    // Always remove from tracking set on error
    deletionInProgress.delete(propertyId);
    
    throw error;
  }
};
