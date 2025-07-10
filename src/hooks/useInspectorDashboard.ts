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
        console.log('❌ No user ID available');
        return [];
      }

      console.log('🔍 Fetching inspections for user:', user.id);

      try {
        // Use the proven working pattern - minimal query first
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
          console.error('❌ Inspections query failed:', inspectionsError);
          
          // Handle permission errors gracefully
          if (inspectionsError.code === 'PGRST116' || 
              inspectionsError.message?.includes('permission') ||
              inspectionsError.message?.includes('RLS')) {
            console.warn('⚠️ No permission to access inspections, returning empty state');
            return [];
          }
          
          throw new Error(`Database error: ${inspectionsError.message}`);
        }

        console.log('✅ Successfully fetched', inspectionsData?.length || 0, 'inspections');

        if (!inspectionsData || inspectionsData.length === 0) {
          console.log('📝 No inspections found for this user');
          return [];
        }

        // Transform data with progress calculation
        const inspectionsWithProgress = await Promise.all(
          inspectionsData.map(async (inspection) => {
            try {
              const { data: checklistItems } = await supabase
                .from('checklist_items')
                .select('id, status')
                .eq('inspection_id', inspection.id);

              const totalItems = checklistItems?.length || 0;
              const completedItems = checklistItems?.filter(item => item.status === 'completed').length || 0;
              const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

              return {
                ...inspection,
                property: inspection.properties,
                checklist_items_count: totalItems,
                completed_items_count: completedItems,
                progress_percentage: progressPercentage,
              } as InspectorInspection;
            } catch (error) {
              console.warn(`Failed to get progress for inspection ${inspection.id}:`, error);
              return {
                ...inspection,
                property: inspection.properties,
                checklist_items_count: 0,
                completed_items_count: 0,
                progress_percentage: 0,
              } as InspectorInspection;
            }
          })
        );

        return inspectionsWithProgress;
      } catch (error) {
        console.error('❌ Query execution failed:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: (failureCount, error) => {
      // Don't retry permission errors
      if (error?.message?.includes('permission') || error?.message?.includes('RLS')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchInterval: 60000, // Reduced frequency to avoid rate limits
  });

  // Get summary statistics with robust status matching
  const summary = {
    total: inspections.length,
    draft: inspections.filter(i => i.status === 'draft').length,
    in_progress: inspections.filter(i => i.status === 'in_progress' || i.status === 'in-progress').length,
    completed: inspections.filter(i => i.status === 'completed').length,
    pending_review: inspections.filter(i => i.status === 'pending_review' || i.status === 'pending-review').length,
    approved: inspections.filter(i => i.status === 'approved').length,
  };

  // Debug logging for summary
  console.log('📊 Dashboard Summary:', summary);
  console.log('📋 Inspection statuses:', inspections.map(i => ({ id: i.id, status: i.status })));

  // If no data found, provide helpful debug information
  if (inspections.length === 0) {
    console.log('⚠️ No inspections found for this user. This could mean:');
    console.log('1. User has no inspections yet');
    console.log('2. User ID mismatch in database');
    console.log('3. Database connection issue');
    console.log('4. Incorrect inspector_id relationship');
  }

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