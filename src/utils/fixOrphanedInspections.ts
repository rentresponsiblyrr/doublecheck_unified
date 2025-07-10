import { supabase } from '@/integrations/supabase/client';

/**
 * Utility to fix orphaned inspections that have null inspector_id
 * This is a temporary fix for development/testing
 */
export const fixOrphanedInspections = async (userId: string) => {
  try {
    console.log('🔧 Fixing orphaned inspections for user:', userId);

    // Get inspections with null inspector_id
    const { data: orphanedInspections, error: fetchError } = await supabase
      .from('inspections')
      .select('id, inspector_id, status, start_time')
      .is('inspector_id', null)
      .limit(10);

    if (fetchError) {
      console.error('❌ Error fetching orphaned inspections:', fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!orphanedInspections || orphanedInspections.length === 0) {
      console.log('✅ No orphaned inspections found');
      return { success: true, updated: 0 };
    }

    console.log(`🔧 Found ${orphanedInspections.length} orphaned inspections`);

    // Update orphaned inspections to assign them to current user
    const { error: updateError } = await supabase
      .from('inspections')
      .update({ inspector_id: userId })
      .is('inspector_id', null);

    if (updateError) {
      console.error('❌ Error updating orphaned inspections:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ Successfully assigned ${orphanedInspections.length} orphaned inspections to user ${userId}`);
    return { success: true, updated: orphanedInspections.length };

  } catch (error) {
    console.error('❌ Fix orphaned inspections failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Create test inspection data for development
 */
export const createTestInspection = async (userId: string) => {
  try {
    console.log('🧪 Creating test inspection for user:', userId);

    // Get a property to use
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id')
      .limit(1);

    if (propError || !properties || properties.length === 0) {
      console.error('❌ No properties found for test inspection');
      return { success: false, error: 'No properties available' };
    }

    const propertyId = properties[0].id;

    // Create test inspection
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .insert({
        property_id: propertyId,
        inspector_id: userId,
        status: 'in_progress',
        start_time: new Date().toISOString(),
        completed: false
      })
      .select()
      .single();

    if (inspectionError) {
      console.error('❌ Error creating test inspection:', inspectionError);
      return { success: false, error: inspectionError.message };
    }

    console.log('✅ Created test inspection:', inspection);
    return { success: true, inspection };

  } catch (error) {
    console.error('❌ Create test inspection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};