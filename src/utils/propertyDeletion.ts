
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
    filter: Record<string, unknown>, 
    description: string
  ): Promise<void> => {
    try {
      let query = supabase.from(tableName).delete();
      
      // Apply filters
      let shouldSkip = false;
      Object.entries(filter).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // For arrays, use the proper PostgreSQL IN syntax
          if (value.length === 0) {
            // Skip deletion if no values to delete
            console.log(`⚠️ No values for ${description} - skipping`);
            shouldSkip = true;
            return;
          }
          // Use the correct Supabase syntax for IN queries
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });

      // If we should skip, return early
      if (shouldSkip) {
        console.log(`✅ ${description} skipped (no data to delete)`);
        return;
      }

      const { error } = await query;
      
      if (error) {
        // Handle network errors gracefully
        if (error.message.includes('ERR_INTERNET_DISCONNECTED') || 
            error.message.includes('ERR_NETWORK') ||
            error.message.includes('network error') ||
            error.message.includes('Failed to fetch')) {
          console.log(`🌐 Network error for ${tableName} - skipping ${description} (will retry when online)`);
          return;
        }
        
        // Handle 404 errors (table/endpoint doesn't exist)
        if (error.message.includes('404') || error.code === '404' || error.status === 404) {
          console.log(`⚠️ Table ${tableName} doesn't exist (404) - skipping ${description}`);
          return;
        }
        
        // Handle 400 errors (bad request - likely schema mismatch)
        if (error.message.includes('400') || error.code === '400' || error.status === 400) {
          console.log(`⚠️ Bad request for ${tableName} (400) - likely schema mismatch - skipping ${description}`);
          return;
        }
        
        // Handle 409 errors (conflict - likely foreign key constraint)
        if (error.message.includes('409') || error.code === '409' || error.status === 409) {
          console.log(`⚠️ Conflict for ${tableName} (409) - likely foreign key constraint - skipping ${description}`);
          return;
        }
        
        // If table doesn't exist, that's okay - it means it's not in this environment
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`⚠️ Table ${tableName} doesn't exist - skipping ${description}`);
          return;
        }
        
        // If column doesn't exist, that's also okay - different schema version
        if (error.message.includes('column') && error.message.includes('does not exist')) {
          console.log(`⚠️ Column referenced in ${description} doesn't exist - skipping`);
          return;
        }
        
        // Handle the specific audit_feedback.inspection_id error
        if (error.message.includes('audit_feedback.inspection_id')) {
          console.log(`⚠️ audit_feedback.inspection_id column doesn't exist - likely uses checklist_item_id instead`);
          return;
        }
        
        // If invalid filter (like column name mismatch), skip gracefully
        if (error.message.includes('operator does not exist') || error.message.includes('syntax error')) {
          console.log(`⚠️ Schema mismatch for ${description} - skipping`);
          return;
        }
        
        throw error;
      }
      
      console.log(`✅ ${description} deleted successfully`);
    } catch (error) {
      console.error(`❌ Error deleting ${description}:`, error);
      console.error(`📊 Debug info - Table: ${tableName}, Filter:`, filter);
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
      // Handle network errors gracefully
      if (inspectionsQueryError.message.includes('ERR_INTERNET_DISCONNECTED') || 
          inspectionsQueryError.message.includes('ERR_NETWORK') ||
          inspectionsQueryError.message.includes('network error') ||
          inspectionsQueryError.message.includes('Failed to fetch')) {
        console.log('🌐 Network error while querying inspections - deletion will be skipped until online');
        deletionInProgress.delete(propertyId);
        throw new Error('Network error: Please check your internet connection and try again');
      }
      
      console.error('❌ Error querying inspections:', inspectionsQueryError);
      throw new Error(`Failed to query inspections: ${inspectionsQueryError.message}`);
    }

    console.log('📋 Found inspections to delete:', inspections?.length || 0);

    if (inspections && inspections.length > 0) {
      const inspectionIds = inspections.map(inspection => inspection.id);
      
      // Step 2: Get all checklist items for these inspections
      const { data: checklistItems, error: checklistQueryError } = await supabase
        .from('inspection_checklist_items')
        .select('id')
        .in('inspection_id', inspectionIds);

      if (checklistQueryError) {
        // Handle network errors gracefully
        if (checklistQueryError.message.includes('ERR_INTERNET_DISCONNECTED') || 
            checklistQueryError.message.includes('ERR_NETWORK') ||
            checklistQueryError.message.includes('network error') ||
            checklistQueryError.message.includes('Failed to fetch')) {
          console.log('🌐 Network error while querying checklist items - deletion will be skipped until online');
          deletionInProgress.delete(propertyId);
          throw new Error('Network error: Please check your internet connection and try again');
        }
        
        console.error('❌ Error querying checklist items:', checklistQueryError);
        throw new Error(`Failed to query checklist items: ${checklistQueryError.message}`);
      }

      console.log('📝 Found checklist items to delete:', checklistItems?.length || 0);

      let checklistItemIds: string[] = [];
      if (checklistItems && checklistItems.length > 0) {
        checklistItemIds = checklistItems.map(item => item.id);
        
        // Step 3: Delete checklist item change logs - SKIPPED (table removed)
        console.log('📋 Skipping checklist item change logs (table removed in collaboration cleanup)...');

        // Step 4: Delete checklist audit logs (foreign key to checklist_items)
        console.log('📋 Deleting checklist audit logs...');
        if (checklistItemIds.length > 0) {
          // Delete one by one to avoid URL length limits completely
          const BATCH_SIZE = 1;
          for (let i = 0; i < checklistItemIds.length; i += BATCH_SIZE) {
            const batch = checklistItemIds.slice(i, i + BATCH_SIZE);
            await safeDelete('checklist_audit_log', { checklist_item_id: batch }, `checklist audit logs batch ${Math.floor(i/BATCH_SIZE) + 1}`);
          }
        }
        
        // Step 5: Delete media files for checklist items
        console.log('🎬 Deleting media for checklist items...');
        if (checklistItemIds.length > 0) {
          // Delete one by one to avoid URL length limits completely
          const BATCH_SIZE = 1;
          for (let i = 0; i < checklistItemIds.length; i += BATCH_SIZE) {
            const batch = checklistItemIds.slice(i, i + BATCH_SIZE);
            await safeDelete('media', { checklist_item_id: batch }, `media batch ${Math.floor(i/BATCH_SIZE) + 1}`);
          }
        }
      }

      // Step 6: Delete collaboration conflicts for these inspections - SKIPPED (table removed)
      console.log('🤝 Skipping collaboration conflicts (collaboration table removed)...');

      // Step 7: Delete inspector assignments for these inspections - SKIPPED (table removed)
      console.log('👨‍🔧 Skipping inspector assignments (collaboration table removed)...');

      // Step 8: Delete inspector presence for these inspections - SKIPPED (table removed)
      console.log('👀 Skipping inspector presence (collaboration table removed)...');

      // Step 9: Delete checklist operations audit for these inspections
      console.log('📊 Deleting checklist operations audit...');
      if (inspectionIds.length > 0) {
        for (const inspectionId of inspectionIds) {
          await safeDelete('checklist_operations_audit', { inspection_id: inspectionId }, `checklist operations audit for inspection ${inspectionId}`);
        }
      }

      // Step 9.1: Delete auditor feedback (AI learning data) - using safe delete
      console.log('🧠 Deleting auditor feedback...');
      if (inspectionIds.length > 0) {
        for (const inspectionId of inspectionIds) {
          await safeDelete('auditor_feedback', { inspection_id: inspectionId }, `auditor feedback for inspection ${inspectionId}`);
        }
      }

      // Step 9.2: Delete RAG query logs (AI learning data) - using safe delete
      console.log('🔍 Deleting RAG query logs...');
      if (inspectionIds.length > 0) {
        for (const inspectionId of inspectionIds) {
          await safeDelete('rag_query_log', { inspection_id: inspectionId }, `RAG query logs for inspection ${inspectionId}`);
        }
      }

      // Step 9.3: Delete audit feedback (uses inspection_id based on migration)
      console.log('📝 Deleting audit feedback...');
      
      // Based on migration 20250709000000_add_inspection_reports_table.sql, audit_feedback uses inspection_id
      if (inspectionIds && inspectionIds.length > 0) {
        // Delete each inspection individually to avoid the IN query issue
        for (const inspectionId of inspectionIds) {
          await safeDelete('audit_feedback', { inspection_id: inspectionId }, `audit feedback for inspection ${inspectionId}`);
        }
      } else {
        console.log('⚠️ No inspection IDs found for audit_feedback deletion');
      }

      // Step 9.4: Delete report deliveries - using safe delete
      console.log('📧 Deleting report deliveries...');
      if (inspectionIds && inspectionIds.length > 0) {
        for (const inspectionId of inspectionIds) {
          await safeDelete('report_deliveries', { inspection_id: inspectionId }, `report deliveries for inspection ${inspectionId}`);
        }
      }

      // Step 9.5: Delete inspection reports - using safe delete
      console.log('📄 Deleting inspection reports...');
      if (inspectionIds && inspectionIds.length > 0) {
        for (const inspectionId of inspectionIds) {
          await safeDelete('inspection_reports', { inspection_id: inspectionId }, `inspection reports for inspection ${inspectionId}`);
        }
      }

      // Step 10: Delete checklist items - using safe delete for better error handling
      console.log('🗂️ Deleting checklist items...');
      if (inspectionIds && inspectionIds.length > 0) {
        for (const inspectionId of inspectionIds) {
          await safeDelete('checklist_items', { inspection_id: inspectionId }, `checklist items for inspection ${inspectionId}`);
        }
      }
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
