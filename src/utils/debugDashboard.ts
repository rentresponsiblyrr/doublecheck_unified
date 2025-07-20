import { supabase } from '@/integrations/supabase/client';

export const debugDashboardData = async (userId?: string) => {
  // REMOVED: console.log('🔍 Debug Dashboard Data - Starting analysis...');
  
  try {
    // Get inspections with correct schema (no created_at column)
    const { data: allInspections, error: allError } = await supabase
      .from('inspections')
      .select('id, inspector_id, status, start_time, end_time, completed')
      .order('start_time', { ascending: false, nullsFirst: false })
      .limit(10);

    if (allError) {
      // REMOVED: console.error('❌ Error fetching all inspections:', allError);
      // REMOVED: console.error('❌ Error details:', allError.message, allError.code);
      return;
    }

    // REMOVED: console.log('📋 All Inspections (sample):', allInspections);

    // Get user-specific inspections if userId provided
    if (userId) {
      const { data: userInspections, error: userError } = await supabase
        .from('inspections')
        .select('id, inspector_id, status, start_time, end_time, completed')
        .eq('inspector_id', userId)
        .order('start_time', { ascending: false, nullsFirst: false });

      if (userError) {
        // REMOVED: console.error('❌ Error fetching user inspections:', userError);
        // REMOVED: console.error('❌ User error details:', userError.message, userError.code);
      } else {
        // REMOVED: console.log(`👤 User ${userId} Inspections:`, userInspections);
      }
    }

    // Get checklist items for first inspection
    if (allInspections && allInspections.length > 0) {
      const firstInspection = allInspections[0];
      const { data: checklistItems, error: checklistError } = await supabase
        .from('logs')
        .select('id, status, inspection_id')
        .eq('inspection_id', firstInspection.id);

      if (checklistError) {
        // REMOVED: console.error('❌ Error fetching checklist items:', checklistError);
      } else {
        // REMOVED: console.log(`📝 Checklist items for inspection ${firstInspection.id}:`, checklistItems);
      }
    }

    // Get property count
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, name')
      .limit(5);

    if (propError) {
      // REMOVED: console.error('❌ Error fetching properties:', propError);
    } else {
      // REMOVED: console.log('🏠 Properties (sample):', properties);
    }

    // Get user info
    const { data: userData, error: userAuthError } = await supabase.auth.getUser();
    if (userAuthError) {
      // REMOVED: console.error('❌ Error fetching user auth:', userAuthError);
    } else {
      // REMOVED: console.log('👤 Current user:', userData.user?.id, userData.user?.email);
    }

    // Check if user exists in users table
    if (userId) {
      const { data: userRecord, error: userRecordError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', userId)
        .single();

      if (userRecordError) {
        // REMOVED: console.error('❌ Error fetching user record:', userRecordError);
      } else {
        // REMOVED: console.log('👤 User record:', userRecord);
      }
    }

    // Check for inspections with null inspector_id
    const { data: nullInspections, error: nullError } = await supabase
      .from('inspections')
      .select('id, inspector_id, status, created_at')
      .is('inspector_id', null)
      .limit(5);

    if (nullError) {
      // REMOVED: console.error('❌ Error fetching null inspections:', nullError);
    } else {
      // REMOVED: console.log('🔍 Inspections with null inspector_id:', nullInspections);
    }

    // Get unique statuses
    const { data: statusData, error: statusError } = await supabase
      .from('inspections')
      .select('status')
      .limit(50);

    if (statusError) {
      // REMOVED: console.error('❌ Error fetching statuses:', statusError);
    } else {
      const uniqueStatuses = [...new Set(statusData?.map(i => i.status))];
      // REMOVED: console.log('📊 Unique inspection statuses in DB:', uniqueStatuses);
    }

  } catch (error) {
    // REMOVED: console.error('❌ Debug failed:', error);
  }
};