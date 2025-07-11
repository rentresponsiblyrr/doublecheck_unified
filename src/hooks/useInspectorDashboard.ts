import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export interface InspectorInspection {
  id: string;
  property_id: string;
  status: 'draft' | 'in_progress' | 'in-progress' | 'completed' | 'pending_review' | 'pending-review' | 'approved' | 'rejected';
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

  const { data: dashboardData = { inspections: [], properties: [] }, isLoading, error, refetch } = useQuery({
    queryKey: ['inspector-dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ No user ID available');
        return { inspections: [], properties: [] };
      }

      console.log('🔍 Fetching dashboard data for user:', user.id);

      try {
        // Fetch both inspections and properties in parallel
        const [inspectionsResult, propertiesResult] = await Promise.all([
          // Fetch inspections
          supabase
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
            .order('start_time', { ascending: false, nullsFirst: false }),
          
          // Fetch properties with inspection counts
          supabase.rpc('get_properties_with_inspections', {
            _user_id: user.id
          })
        ]);

        const { data: inspectionsData, error: inspectionsError } = inspectionsResult;
        const { data: propertiesData, error: propertiesError } = propertiesResult;

        if (inspectionsError) {
          console.error('❌ Inspections query failed:', inspectionsError);
          
          // Handle permission errors gracefully
          if (inspectionsError.code === 'PGRST116' || 
              inspectionsError.message?.includes('permission') ||
              inspectionsError.message?.includes('RLS')) {
            console.warn('⚠️ No permission to access inspections, returning empty state');
            return { inspections: [], properties: propertiesData || [] };
          }
          
          throw new Error(`Database error: ${inspectionsError.message}`);
        }

        if (propertiesError) {
          console.error('❌ Properties query failed:', propertiesError);
          // Continue with inspections only if properties fail
        }

        console.log('✅ Successfully fetched', inspectionsData?.length || 0, 'inspections');
        console.log('✅ Successfully fetched', propertiesData?.length || 0, 'properties');

        // Transform inspections with progress calculation
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

        return { 
          inspections: inspectionsWithProgress, 
          properties: propertiesData || [] 
        };
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

  // Extract data from the new structure
  const inspections = dashboardData.inspections;
  const properties = dashboardData.properties;

  // Get summary statistics with robust status matching
  const summary = {
    total: inspections.length,
    properties: properties.length,
    draft: inspections.filter((i: InspectorInspection) => i.status === 'draft').length,
    in_progress: inspections.filter((i: InspectorInspection) => i.status === 'in_progress' || i.status === 'in-progress').length,
    completed: inspections.filter((i: InspectorInspection) => i.status === 'completed').length,
    pending_review: inspections.filter((i: InspectorInspection) => i.status === 'pending_review' || i.status === 'pending-review').length,
    approved: inspections.filter((i: InspectorInspection) => i.status === 'approved').length,
    // Add aggregated property stats
    total_property_inspections: properties.reduce((sum: number, p: any) => sum + (p.inspection_count || 0), 0),
    active_property_inspections: properties.reduce((sum: number, p: any) => sum + (p.active_inspection_count || 0), 0),
    completed_property_inspections: properties.reduce((sum: number, p: any) => sum + (p.completed_inspection_count || 0), 0),
  };

  // Debug logging for summary
  console.log('📊 Dashboard Summary:', summary);
  console.log('📋 Inspection statuses:', inspections.map((i: InspectorInspection) => ({ id: i.id, status: i.status })));
  console.log('🏠 Properties with inspections:', properties.map((p: any) => ({ 
    id: p.property_id, 
    name: p.property_name,
    total: p.inspection_count,
    active: p.active_inspection_count,
    completed: p.completed_inspection_count
  })));

  // If no data found, provide helpful debug information
  if (inspections.length === 0 && properties.length === 0) {
    console.log('⚠️ No data found for this user. This could mean:');
    console.log('1. User has no properties or inspections yet');
    console.log('2. User ID mismatch in database');
    console.log('3. Database connection issue');
    console.log('4. Incorrect inspector_id relationship');
  } else if (properties.length > 0 && inspections.length === 0) {
    console.log('ℹ️ Properties found but no inspections. This suggests:');
    console.log('1. User has properties but hasn\'t started inspecting them yet');
    console.log('2. Inspections may need to be created for these properties');
  }

  // Get recent inspections (last 7 days)
  const recentInspections = inspections.filter((inspection: InspectorInspection) => {
    if (!inspection.start_time) return false;
    const inspectionDate = new Date(inspection.start_time);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return inspectionDate >= sevenDaysAgo;
  });

  return {
    inspections,
    properties,
    recentInspections,
    summary,
    isLoading,
    error,
    refetch,
  };
};