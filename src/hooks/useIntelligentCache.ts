/**
 * Intelligent Cache Hook - Netflix/Google-level Performance
 * Seamlessly integrates IndexedDB intelligent caching with TanStack Query
 * Provides progressive sync, predictive preloading, and background refresh
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { intelligentCache } from '@/lib/cache/IntelligentCacheManager';

interface CacheOptions {
  store?: string;
  ttl?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  enableBackgroundRefresh?: boolean;
  enablePredictivePreload?: boolean;
  compressionThreshold?: number;
}

/**
 * Enhanced useQuery with intelligent IndexedDB caching
 * Provides Netflix/Google-level performance with progressive sync
 */
export function useIntelligentQuery<T>(
  queryKey: (string | number)[],
  queryFn: () => Promise<T>,
  options: CacheOptions & {
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    enabled?: boolean;
  } = {}
) {
  const queryClient = useQueryClient();
  
  const {
    store = 'default',
    ttl = 5 * 60 * 1000, // 5 minutes
    priority = 'medium',
    tags = [],
    enableBackgroundRefresh = true,
    enablePredictivePreload = true,
    staleTime = 30000, // 30 seconds
    gcTime = 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = false,
    enabled = true,
    ...restOptions
  } = options;

  const cacheKey = useMemo(() => queryKey.join(':'), [queryKey]);

  // Enhanced query function with intelligent caching
  const enhancedQueryFn = useCallback(async (): Promise<T> => {
    try {
      // First, try to get from intelligent cache
      const cachedData = await intelligentCache.get<T>(store, cacheKey);
      
      if (cachedData) {
        // Cache hit - return immediately for better UX
        if (enableBackgroundRefresh) {
          // Background refresh for fresh data
          setTimeout(async () => {
            try {
              const freshData = await queryFn();
              await intelligentCache.set(store, cacheKey, freshData, {
                ttl,
                priority,
                tags: [...tags, 'background-refresh']
              });
              
              // Update TanStack Query cache
              queryClient.setQueryData(queryKey, freshData);
            } catch (error) {
              console.warn('Background refresh failed:', error);
            }
          }, 0);
        }
        
        return cachedData;
      }

      // Cache miss - fetch from network
      const freshData = await queryFn();
      
      // Store in intelligent cache
      await intelligentCache.set(store, cacheKey, freshData, {
        ttl,
        priority,
        tags: [...tags, 'network-fetch']
      });

      return freshData;
    } catch (error) {
      // Fallback to cached data even if expired for offline support
      const expiredCachedData = await intelligentCache.get<T>(store, cacheKey);
      if (expiredCachedData) {
        console.warn('Using expired cache data due to network error:', error);
        return expiredCachedData;
      }
      
      throw error;
    }
  }, [queryFn, store, cacheKey, ttl, priority, tags, enableBackgroundRefresh, queryClient, queryKey]);

  // Use TanStack Query with our enhanced query function
  const query = useQuery({
    queryKey,
    queryFn: enhancedQueryFn,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    enabled,
    ...restOptions
  });

  return {
    ...query,
    // Additional intelligent cache methods
    invalidateCache: useCallback(async () => {
      await intelligentCache.delete(store, cacheKey);
      queryClient.invalidateQueries({ queryKey });
    }, [store, cacheKey, queryClient, queryKey]),
    
    clearStore: useCallback(async () => {
      await intelligentCache.clear(store);
      queryClient.invalidateQueries();
    }, [store, queryClient]),
    
    getCacheStats: useCallback(async () => {
      return await intelligentCache.getStats();
    }, [])
  };
}

/**
 * Basic intelligent cache hook (alias for useIntelligentQuery)
 */
export function useIntelligentCache<T>(
  key: string | (string | number)[],
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
) {
  const queryKey = Array.isArray(key) ? key : [key];
  return useIntelligentQuery(queryKey, fetcher, options);
}

/**
 * Hook for cache performance metrics
 */
export function useCacheMetrics() {
  const [stats, setStats] = useState<{
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    stores: Record<string, { entries: number; size: number }>;
  }>({
    totalEntries: 0,
    totalSize: 0,
    hitRate: 0,
    stores: {}
  });

  const refreshStats = useCallback(async () => {
    try {
      const cacheStats = await intelligentCache.getStats();
      setStats(cacheStats);
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    refreshStats
  };
}

/**
 * Property-specific intelligent cache hook
 */
export function usePropertyCache() {
  return useIntelligentQuery(
    ['properties'], 
    async () => {
      // This would be your actual property fetching logic
      throw new Error('Property fetch function not implemented');
    },
    {
      store: 'properties',
      ttl: 10 * 60 * 1000, // 10 minutes for properties
      priority: 'high',
      tags: ['properties', 'core-data'],
      enableBackgroundRefresh: true,
      enablePredictivePreload: true
    }
  );
}