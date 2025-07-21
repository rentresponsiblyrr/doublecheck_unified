import { supabase } from '@/integrations/supabase/client';

export const debugDashboardData = async (userId?: string) => {
  
  try {
    // Get inspections with correct schema (no created_at column)
    const { data: allInspections, error: allError } = await supabase
      .from('inspections')
      .select('id, inspector_id, status, start_time, end_time, completed')
      .order('start_time', { ascending: false, nullsFirst: false })
      .limit(10);

    if (allError) {
      return;
    }


    // Get user-specific inspections if userId provided
    if (userId) {
      const { data: userInspections, error: userError } = await supabase
        .from('inspections')
        .select('id, inspector_id, status, start_time, end_time, completed')
        .eq('inspector_id', userId)
        .order('start_time', { ascending: false, nullsFirst: false });

      if (userError) {
      } else {
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
      } else {
      }
    }

    // Get property count
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('id, name')
      .limit(5);

    if (propError) {
    } else {
    }

    // Get user info
    const { data: userData, error: userAuthError } = await supabase.auth.getUser();
    if (userAuthError) {
    } else {
    }

    // Check if user exists in users table
    if (userId) {
      const { data: userRecord, error: userRecordError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', userId)
        .single();

      if (userRecordError) {
      } else {
      }
    }

    // Check for inspections with null inspector_id
    const { data: nullInspections, error: nullError } = await supabase
      .from('inspections')
      .select('id, inspector_id, status, created_at')
      .is('inspector_id', null)
      .limit(5);

    if (nullError) {
    } else {
    }

    // Get unique statuses
    const { data: statusData, error: statusError } = await supabase
      .from('inspections')
      .select('status')
      .limit(50);

    if (statusError) {
    } else {
      const uniqueStatuses = [...new Set(statusData?.map(i => i.status))];
    }

  } catch (error) {
  }
};