import { supabase } from '@/integrations/supabase/client';

export const debugDashboardData = async (userId?: string) => {
  console.log('🔍 Debug Dashboard Data - Starting analysis...');
  
  try {
    // Get all inspections
    const { data: allInspections, error: allError } = await supabase
      .from('inspections')
      .select('id, inspector_id, status, start_time, end_time, completed, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError) {
      console.error('❌ Error fetching all inspections:', allError);
      return;
    }

    console.log('📋 All Inspections (sample):', allInspections);

    // Get user-specific inspections if userId provided
    if (userId) {
      const { data: userInspections, error: userError } = await supabase
        .from('inspections')
        .select('id, inspector_id, status, start_time, end_time, completed, created_at')
        .eq('inspector_id', userId)
        .order('created_at', { ascending: false });

      if (userError) {
        console.error('❌ Error fetching user inspections:', userError);
      } else {
        console.log(`👤 User ${userId} Inspections:`, userInspections);
      }
    }

    // Get checklist items for first inspection
    if (allInspections && allInspections.length > 0) {
      const firstInspection = allInspections[0];
      const { data: checklistItems, error: checklistError } = await supabase
        .from('checklist_items')
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

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};