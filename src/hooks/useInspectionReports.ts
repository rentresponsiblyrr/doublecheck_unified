import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export interface InspectionReport {
  id: string;
  property_id: string;
  property_name: string;
  property_address: string;
  status: 'draft' | 'in_progress' | 'completed' | 'auditing' | 'approved' | 'rejected';
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  completed: boolean;
  // Property details from scraped data
  bedrooms: number | null;
  bathrooms: number | null;
  max_guests: number | null;
  property_type: string | null;
  // Checklist progress
  total_items: number;
  completed_items: number;
  progress_percentage: number;
  // Media counts
  photos_count: number;
  videos_count: number;
  // Audit information
  auditor_feedback: string | null;
  review_time_minutes: number | null;
  overrides_count: number | null;
}

export interface ReportsSummary {
  total: number;
  completed: number;
  avgDuration: number;
  thisMonth: number;
  thisWeek: number;
  avgPhotosPerInspection: number;
  avgCompletionRate: number;
}

export const useInspectionReports = () => {
  const { user } = useAuth();

  const { data: rawData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['inspection-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('❌ No user ID available for reports');
        return [];
      }

      console.log('🔍 Fetching comprehensive inspection reports for user:', user.id);

      try {
        // Fetch inspections with property data and basic counts
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
              address,
              scraped_data
            )
          `)
          .eq('inspector_id', user.id)
          .order('start_time', { ascending: false, nullsFirst: false });

        if (inspectionsError) {
          console.error('❌ Failed to fetch inspections:', inspectionsError);
          throw new Error(`Database error: ${inspectionsError.message}`);
        }

        if (!inspectionsData || inspectionsData.length === 0) {
          console.log('📝 No inspections found for reports');
          return [];
        }

        console.log('✅ Fetched', inspectionsData.length, 'inspections for reports');

        // Process each inspection to gather detailed metrics
        const enrichedInspections = await Promise.all(
          inspectionsData.map(async (inspection) => {
            try {
              // Calculate duration
              let durationMinutes = 0;
              if (inspection.start_time && inspection.end_time) {
                const start = new Date(inspection.start_time);
                const end = new Date(inspection.end_time);
                durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
              }

              // Get checklist items and their status
              const { data: checklistItems } = await supabase
                .from('logs')
                .select('id, status')
                .eq('inspection_id', inspection.id);

              const totalItems = checklistItems?.length || 0;
              const completedItems = checklistItems?.filter(item => 
                item.status === 'completed' || item.status === 'approved'
              ).length || 0;
              const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

              // Get media counts
              const { data: mediaData } = await supabase
                .from('media')
                .select('type, checklist_item_id')
                .in('checklist_item_id', checklistItems?.map(item => item.id) || []);

              const photosCount = mediaData?.filter(media => media.type === 'photo').length || 0;
              const videosCount = mediaData?.filter(media => media.type === 'video').length || 0;

              // Get audit feedback if available
              const { data: auditData } = await supabase
                .from('audit_feedback')
                .select('feedback_text, review_time_minutes, overrides_count')
                .eq('inspection_id', inspection.id)
                .order('created_at', { ascending: false })
                .limit(1);

              const auditFeedback = auditData?.[0];

              // Extract property details from scraped data
              const scrapedData = inspection.properties?.scraped_data as any;
              const specifications = scrapedData?.specifications || {};
              
              const bedrooms = specifications?.bedrooms || null;
              const bathrooms = specifications?.bathrooms || null;
              const maxGuests = specifications?.maxGuests || null;
              const propertyType = specifications?.propertyType || null;

              return {
                id: inspection.id,
                property_id: inspection.property_id,
                property_name: inspection.properties?.name || 'Unknown Property',
                property_address: inspection.properties?.address || 'Address not available',
                status: inspection.status as InspectionReport['status'],
                start_time: inspection.start_time,
                end_time: inspection.end_time,
                duration_minutes: durationMinutes,
                completed: inspection.completed,
                bedrooms,
                bathrooms,
                max_guests: maxGuests,
                property_type: propertyType,
                total_items: totalItems,
                completed_items: completedItems,
                progress_percentage: progressPercentage,
                photos_count: photosCount,
                videos_count: videosCount,
                auditor_feedback: auditFeedback?.feedback_text || null,
                review_time_minutes: auditFeedback?.review_time_minutes || null,
                overrides_count: auditFeedback?.overrides_count || null,
              } as InspectionReport;
            } catch (error) {
              console.warn(`Failed to process inspection ${inspection.id}:`, error);
              // Return basic inspection data if detailed processing fails
              return {
                id: inspection.id,
                property_id: inspection.property_id,
                property_name: inspection.properties?.name || 'Unknown Property',
                property_address: inspection.properties?.address || 'Address not available',
                status: inspection.status as InspectionReport['status'],
                start_time: inspection.start_time,
                end_time: inspection.end_time,
                duration_minutes: 0,
                completed: inspection.completed,
                bedrooms: null,
                bathrooms: null,
                max_guests: null,
                property_type: null,
                total_items: 0,
                completed_items: 0,
                progress_percentage: 0,
                photos_count: 0,
                videos_count: 0,
                auditor_feedback: null,
                review_time_minutes: null,
                overrides_count: null,
              } as InspectionReport;
            }
          })
        );

        return enrichedInspections;
      } catch (error) {
        console.error('❌ Reports query execution failed:', error);
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
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  // Calculate summary statistics
  const summary: ReportsSummary = {
    total: rawData.length,
    completed: rawData.filter(inspection => 
      inspection.status === 'completed' || 
      inspection.status === 'approved'
    ).length,
    avgDuration: rawData.length > 0 
      ? Math.round(rawData.reduce((sum, inspection) => sum + (inspection.duration_minutes || 0), 0) / rawData.length)
      : 0,
    thisMonth: rawData.filter(inspection => {
      if (!inspection.start_time) return false;
      const inspectionDate = new Date(inspection.start_time);
      const now = new Date();
      return inspectionDate.getMonth() === now.getMonth() && 
             inspectionDate.getFullYear() === now.getFullYear();
    }).length,
    thisWeek: rawData.filter(inspection => {
      if (!inspection.start_time) return false;
      const inspectionDate = new Date(inspection.start_time);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return inspectionDate >= oneWeekAgo;
    }).length,
    avgPhotosPerInspection: rawData.length > 0
      ? Math.round(rawData.reduce((sum, inspection) => sum + (inspection.photos_count || 0), 0) / rawData.length)
      : 0,
    avgCompletionRate: rawData.length > 0
      ? Math.round(rawData.reduce((sum, inspection) => sum + (inspection.progress_percentage || 0), 0) / rawData.length)
      : 0,
  };

  console.log('📊 Reports Summary:', summary);

  return {
    inspections: rawData,
    summary,
    isLoading,
    error,
    refetch,
  };
};