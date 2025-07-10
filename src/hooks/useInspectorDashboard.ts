import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export interface InspectorInspection {
  id: string;
  property_id: string;
  status: 'draft' | 'in_progress' | 'completed' | 'pending_review' | 'approved' | 'rejected';
  start_time: string | null;
  end_time: string | null;
  completed: boolean;
  property: {
    id: string;
    name: string;
    address: string;
  } | null;
  checklist_items_count: number;
  completed_items_count: number;
  progress_percentage: number;
}

export const useInspectorDashboard = () => {
  const { user } = useAuth();

  const { data: inspections = [], isLoading, error, refetch } = useQuery({
    queryKey: ['inspector-inspections', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Fetching inspections for inspector:', user.email, 'User ID:', user.id);

      // Query inspections for the current user
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from('inspections')
        .select(`
          id,
          property_id,
          status,
          start_time,
          end_time,
          completed,
          inspector_id,
          properties:property_id (
            id,
            name,
            address
          )
        `)
        .eq('inspector_id', user.id)
        .order('start_time', { ascending: false, nullsFirst: false });

      if (inspectionsError) {
        console.error('❌ Failed to fetch inspections:', inspectionsError);
        throw new Error(`Failed to fetch inspections: ${inspectionsError.message}`);
      }

      console.log('✅ Fetched inspections:', inspectionsData?.length || 0);
      console.log('📊 Inspection data sample:', inspectionsData?.[0]);

      // If no inspections found, let's also try to fetch all inspections to debug
      if (!inspectionsData || inspectionsData.length === 0) {
        console.log('🔍 No inspections found for user, checking all inspections...');
        const { data: allInspections } = await supabase
          .from('inspections')
          .select('id, inspector_id, status')
          .limit(5);
        console.log('📋 Sample of all inspections:', allInspections);
      }

      // For each inspection, get checklist items count and completed count
      const inspectionsWithProgress = await Promise.all(
        (inspectionsData || []).map(async (inspection) => {
          const { data: checklistItems, error: itemsError } = await supabase
            .from('checklist_items')
            .select('id, status')
            .eq('inspection_id', inspection.id);

          if (itemsError) {
            console.warn(`⚠️ Failed to fetch checklist items for inspection ${inspection.id}:`, itemsError);
          }

          const totalItems = checklistItems?.length || 0;
          const completedItems = checklistItems?.filter(item => item.status === 'completed').length || 0;
          const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

          console.log(`📝 Inspection ${inspection.id}: ${completedItems}/${totalItems} items (${progressPercentage}%)`);

          return {
            ...inspection,
            property: inspection.properties,
            checklist_items_count: totalItems,
            completed_items_count: completedItems,
            progress_percentage: progressPercentage,
          } as InspectorInspection;
        })
      );

      return inspectionsWithProgress;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds for updates
  });

  // Get summary statistics
  const summary = {
    total: inspections.length,
    draft: inspections.filter(i => i.status === 'draft').length,
    in_progress: inspections.filter(i => i.status === 'in_progress').length,
    completed: inspections.filter(i => i.status === 'completed').length,
    pending_review: inspections.filter(i => i.status === 'pending_review').length,
    approved: inspections.filter(i => i.status === 'approved').length,
  };

  // Debug logging for summary
  console.log('📊 Dashboard Summary:', summary);
  console.log('📋 Inspection statuses:', inspections.map(i => ({ id: i.id, status: i.status })));

  // Get recent inspections (last 7 days)
  const recentInspections = inspections.filter(inspection => {
    if (!inspection.start_time) return false;
    const inspectionDate = new Date(inspection.start_time);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return inspectionDate >= sevenDaysAgo;
  });

  return {
    inspections,
    recentInspections,
    summary,
    isLoading,
    error,
    refetch,
  };
};