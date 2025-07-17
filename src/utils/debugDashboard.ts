import { supabase } from '@/integrations/supabase/client';

export const debugDashboardData = async (userId?: string) => {
  console.log('🔍 Debug Dashboard Data - Starting analysis...');
  
  try {
    // Get inspections with correct schema (no created_at column)
    const { data: allInspections, error: allError } = await supabase
      .from('inspections')
      .select('id, inspector_id, status, start_time, end_time, completed')
      .order('start_time', { ascending: false, nullsFirst: false })
      .limit(10);

    if (allError) {
      console.error('❌ Error fetching all inspections:', allError);
      console.error('❌ Error details:', allError.message, allError.code);
      return;
    }

    console.log('📋 All Inspections (sample):', allInspections);

    // Get user-specific inspections if userId provided
    if (userId) {
      const { data: userInspections, error: userError } = await supabase
        .from('inspections')
        .select('id, inspector_id, status, start_time, end_time, completed')
        .eq('inspector_id', userId)
        .order('start_time', { ascending: false, nullsFirst: false });

      if (userError) {
        console.error('❌ Error fetching user inspections:', userError);
        console.error('❌ User error details:', userError.message, userError.code);
      } else {
        console.log(`👤 User ${userId} Inspections:`, userInspections);
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
        console.error('❌ Error fetching checklist items:', checklistError);
      } else {
        console.log(`📝 Checklist items for inspection ${firstInspection.id}:`, checklistItems);
      }
    }

    // Get property count
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, name')
      .limit(5);

    if (propError) {
      console.error('❌ Error fetching properties:', propError);
    } else {
      console.log('🏠 Properties (sample):', properties);
    }

    // Get user info
    const { data: userData, error: userAuthError } = await supabase.auth.getUser();
    if (userAuthError) {
      console.error('❌ Error fetching user auth:', userAuthError);
    } else {
      console.log('👤 Current user:', userData.user?.id, userData.user?.email);
    }

    // Check if user exists in users table
    if (userId) {
      const { data: userRecord, error: userRecordError } = await supabase
        .from('users')
        .select('id, email, name, role')
        .eq('id', userId)
        .single();

      if (userRecordError) {
        console.error('❌ Error fetching user record:', userRecordError);
      } else {
        console.log('👤 User record:', userRecord);
      }
    }

    // Check for inspections with null inspector_id
    const { data: nullInspections, error: nullError } = await supabase
      .from('inspections')
      .select('id, inspector_id, status, created_at')
      .is('inspector_id', null)
      .limit(5);

    if (nullError) {
      console.error('❌ Error fetching null inspections:', nullError);
    } else {
      console.log('🔍 Inspections with null inspector_id:', nullInspections);
    }

    // Get unique statuses
    const { data: statusData, error: statusError } = await supabase
      .from('inspections')
      .select('status')
      .limit(50);

    if (statusError) {
      console.error('❌ Error fetching statuses:', statusError);
    } else {
      const uniqueStatuses = [...new Set(statusData?.map(i => i.status))];
      console.log('📊 Unique inspection statuses in DB:', uniqueStatuses);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};