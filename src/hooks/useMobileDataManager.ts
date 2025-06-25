
import { useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mobileCache, MOBILE_CACHE_KEYS } from '@/utils/mobileCache';
import { ChecklistItemType } from '@/types/inspection';

interface PropertyData {
  property_id: string;
  property_name: string;
  property_address: string;
  property_vrbo_url: string | null;
  property_airbnb_url: string | null;
  inspection_count?: number;
  completed_inspection_count?: number;
  active_inspection_count?: number;
}

interface MobileDataState {
  properties: PropertyData[];
  selectedProperty: string | null;
  checklistItems: ChecklistItemType[];
  isLoading: boolean;
  error: string | null;
}

export const useMobileDataManager = (userId?: string) => {
  const [state, setState] = useState<MobileDataState>({
    properties: [],
    selectedProperty: null,
    checklistItems: [],
    isLoading: false,
    error: null
  });

  const queryClient = useQueryClient();
  const batchRequestsRef = useRef<Set<string>>(new Set());

  // Optimized properties query with caching
  const { data: properties = [], isLoading: propertiesLoading, error: propertiesError } = useQuery({
    queryKey: ['mobile-properties', userId],
    queryFn: async () => {
      console.log('📱 Fetching mobile properties with optimization');
      
      // Check cache first
      const cached = mobileCache.get<PropertyData[]>(MOBILE_CACHE_KEYS.PROPERTIES(userId));
      if (cached) {
        console.log('✅ Using cached mobile properties');
        return cached;
      }

      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          address,
          vrbo_url,
          airbnb_url,
          status
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform and cache the data
      const transformedData: PropertyData[] = (data || []).map(property => ({
        property_id: property.id,
        property_name: property.name || '',
        property_address: property.address || '',
        property_vrbo_url: property.vrbo_url,
        property_airbnb_url: property.airbnb_url,
      }));

      // Cache for 2 minutes on mobile
      mobileCache.set(MOBILE_CACHE_KEYS.PROPERTIES(userId), transformedData, 2 * 60 * 1000);
      
      console.log('✅ Mobile properties fetched and cached:', transformedData.length);
      return transformedData;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Optimized checklist items query
  const fetchChecklistItems = useCallback(async (inspectionId: string): Promise<ChecklistItemType[]> => {
    if (!inspectionId) return [];

    console.log('📱 Fetching mobile checklist items for:', inspectionId);

    // Check cache first
    const cached = mobileCache.get<ChecklistItemType[]>(MOBILE_CACHE_KEYS.CHECKLIST_ITEMS(inspectionId));
    if (cached) {
      console.log('✅ Using cached mobile checklist items');
      return cached;
    }

    const { data, error } = await supabase
      .from('checklist_items')
      .select('id, inspection_id, label, category, evidence_type, status, created_at')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const transformedData: ChecklistItemType[] = (data || []).map(item => ({
      id: item.id,
      inspection_id: item.inspection_id,
      label: item.label || '',
      category: item.category || 'safety',
      evidence_type: item.evidence_type as 'photo' | 'video',
      status: item.status as 'completed' | 'failed' | 'not_applicable' | null,
      created_at: item.created_at || new Date().toISOString()
    }));

    // Cache for 1 minute on mobile
    mobileCache.set(MOBILE_CACHE_KEYS.CHECKLIST_ITEMS(inspectionId), transformedData, 60 * 1000);
    
    console.log('✅ Mobile checklist items fetched and cached:', transformedData.length);
    return transformedData;
  }, []);

  // Batch property status requests
  const getPropertyStatusBatch = useCallback(async (propertyIds: string[]) => {
    console.log('📱 Batch fetching property statuses for:', propertyIds.length, 'properties');

    const uncachedIds = propertyIds.filter(id => 
      !mobileCache.get(MOBILE_CACHE_KEYS.PROPERTY_STATUS(id))
    );

    if (uncachedIds.length === 0) {
      console.log('✅ All property statuses cached');
      return;
    }

    // Batch query for inspection counts
    const { data, error } = await supabase
      .from('inspections')
      .select('property_id, completed, id')
      .in('property_id', uncachedIds);

    if (error) {
      console.error('❌ Batch property status query failed:', error);
      return;
    }

    // Process and cache results
    const statusMap = new Map<string, { completed: number; active: number }>();
    
    (data || []).forEach(inspection => {
      if (!statusMap.has(inspection.property_id)) {
        statusMap.set(inspection.property_id, { completed: 0, active: 0 });
      }
      
      const status = statusMap.get(inspection.property_id)!;
      if (inspection.completed) {
        status.completed++;
      } else {
        status.active++;
      }
    });

    // Cache individual property statuses
    uncachedIds.forEach(propertyId => {
      const status = statusMap.get(propertyId) || { completed: 0, active: 0 };
      mobileCache.set(MOBILE_CACHE_KEYS.PROPERTY_STATUS(propertyId), status, 3 * 60 * 1000); // 3 minutes
    });

    console.log('✅ Batch property statuses cached');
  }, []);

  // Optimized property selection with preloading
  const selectProperty = useCallback(async (propertyId: string | null) => {
    setState(prev => ({ ...prev, selectedProperty: propertyId }));

    if (propertyId && !batchRequestsRef.current.has(propertyId)) {
      batchRequestsRef.current.add(propertyId);
      
      // Preload property status if not cached
      const cached = mobileCache.get(MOBILE_CACHE_KEYS.PROPERTY_STATUS(propertyId));
      if (!cached) {
        getPropertyStatusBatch([propertyId]);
      }
    }
  }, [getPropertyStatusBatch]);

  // Invalidate cache and refetch
  const refreshData = useCallback(async () => {
    console.log('📱 Refreshing mobile data');
    
    // Clear relevant cache entries
    mobileCache.delete(MOBILE_CACHE_KEYS.PROPERTIES(userId));
    
    // Invalidate React Query cache
    await queryClient.invalidateQueries({ queryKey: ['mobile-properties'] });
    
    // Clear batch requests
    batchRequestsRef.current.clear();
  }, [userId, queryClient]);

  // Get cached property status
  const getPropertyStatus = useCallback((propertyId: string) => {
    const cached = mobileCache.get<{ completed: number; active: number }>(
      MOBILE_CACHE_KEYS.PROPERTY_STATUS(propertyId)
    );
    
    if (!cached) {
      return { status: 'pending', color: 'bg-gray-500', textLabel: 'Loading...' };
    }

    if (cached.active > 0) {
      return { status: 'in-progress', color: 'bg-yellow-500', textLabel: 'In Progress' };
    }
    
    if (cached.completed > 0) {
      return { status: 'completed', color: 'bg-green-500', textLabel: 'Completed' };
    }
    
    return { status: 'available', color: 'bg-blue-500', textLabel: 'Available' };
  }, []);

  return {
    // Data
    properties,
    selectedProperty: state.selectedProperty,
    
    // Loading states
    isLoading: propertiesLoading,
    error: propertiesError?.message || null,
    
    // Actions
    selectProperty,
    fetchChecklistItems,
    getPropertyStatus,
    getPropertyStatusBatch,
    refreshData,
    
    // Utilities
    cacheStats: mobileCache.getStats()
  };
};
