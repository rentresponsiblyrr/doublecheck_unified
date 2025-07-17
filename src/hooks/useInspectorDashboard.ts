import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { statusCountService } from "@/services/statusCountService";
import { normalizeStatus } from "@/types/inspection-status";

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

// Helper function to fetch properties with inspection counts
async function fetchPropertiesWithInspections(userId: string) {
  try {
    // Try RPC function first
    const result = await supabase.rpc('get_properties_with_inspections', {
      _user_id: userId
    });
    
    if (!result.error) {
      // CRITICAL FIX: Filter out properties with completed inspections
      const filteredData = (result.data || []).filter(property => {
        // Hide properties with completed inspections
        return !property.latest_inspection_completed;
      }).map(property => {
        // CRITICAL FIX: Show only 1 inspection per property for inspector view
        return {
          ...property,
          inspection_count: property.inspection_count > 0 ? 1 : 0
        };
      });
      
      console.log('🔧 Filtered properties:', {
        original: result.data?.length || 0,
        filtered: filteredData.length,
        removed: (result.data?.length || 0) - filteredData.length
      });
      
      return { ...result, data: filteredData };
    }
    
    console.warn('⚠️ RPC function failed, falling back to direct query:', result.error);
    
    // Fallback to direct query using properties
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        property_id,
        property_name,
        street_address as property_address,
        vrbo_url as property_vrbo_url,
        airbnb_url as property_airbnb_url,
        scraped_at as property_scraped_at,
        created_at as property_created_at
      `)
      .eq('created_by', userId);
      // Removed status filter - properties table doesn't have status column
    
    if (error) throw error;
    
    // Add inspection count data manually
    const enrichedProperties = await Promise.all(
      (properties || []).map(async (property) => {
        const { data: inspections } = await supabase
          .from('inspections')
          .select('id, status, completed')
          .eq('property_id', property.property_id);
        
        const inspection_count = inspections?.length || 0;
        const completed_inspection_count = inspections?.filter(i => i.status === 'completed').length || 0;
        const active_inspection_count = inspections?.filter(i => i.status === 'in_progress').length || 0;
        const draft_inspection_count = inspections?.filter(i => i.status === 'draft').length || 0;
        
        return {
          ...property,
          inspection_count,
          completed_inspection_count,
          active_inspection_count,
          draft_inspection_count,
          latest_inspection_id: inspections?.[0]?.id || null,
          latest_inspection_completed: inspections?.[0]?.completed || false
        };
      })
    );
    
    return { data: enrichedProperties, error: null };
  } catch (error) {
    console.error('❌ Both RPC and fallback failed:', error);
    return { data: [], error };
  }
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
          fetchPropertiesWithInspections(user.id)
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
                .from('logs')
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
    refetchInterval: false, // Disabled to prevent render loops - manual refresh only
  });

  // Extract data from the new structure
  const inspections = dashboardData.inspections;
  const properties = dashboardData.properties;

  // Calculate status counts from actual inspection data
  const statusCounts = {
    total: inspections.length,
    draft: 0,
    in_progress: 0,
    completed: 0,
    pending_review: 0,
    approved: 0
  };

  // Count inspections with normalized status handling
  inspections.forEach((inspection: InspectorInspection) => {
    const normalizedStatus = normalizeStatus(inspection.status);
    switch (normalizedStatus) {
      case 'draft':
        statusCounts.draft++;
        break;
      case 'in_progress':
        statusCounts.in_progress++;
        break;
      case 'completed':
        statusCounts.completed++;
        break;
      case 'pending_review':
        statusCounts.pending_review++;
        break;
      case 'approved':
        statusCounts.approved++;
        break;
    }
  });

  console.log('🔢 Status counts calculated:', statusCounts);

  // Calculate property-level aggregations with fallback handling
  let propertyStats = { totalInspections: 0, activeInspections: 0, completedInspections: 0 };
  
  try {
    propertyStats = statusCountService.calculatePropertyStats(properties);
  } catch (error) {
    console.warn('❌ Property stats calculation failed, using fallback', error);
    // Fallback calculation
    propertyStats = properties.reduce((stats, property) => ({
      totalInspections: stats.totalInspections + (property.inspection_count || 0),
      activeInspections: stats.activeInspections + (property.active_inspection_count || 0),
      completedInspections: stats.completedInspections + (property.completed_inspection_count || 0)
    }), { totalInspections: 0, activeInspections: 0, completedInspections: 0 });
  }

  const summary = {
    properties: properties.length,
    total_property_inspections: inspections.length,
    active_property_inspections: statusCounts.in_progress + statusCounts.draft,
    completed_property_inspections: statusCounts.completed,
    pending_review: statusCounts.pending_review + statusCounts.approved,
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