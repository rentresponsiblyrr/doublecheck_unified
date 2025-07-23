import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export const useSmartCache = () => {
  const queryClient = useQueryClient();

  const invalidatePropertyData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["optimized-properties"] });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
  }, [queryClient]);

  const prefetchProperty = useCallback(
    (propertyId: string) => {
      // This could be expanded to prefetch specific property details
      queryClient.prefetchQuery({
        queryKey: ["property", propertyId],
        queryFn: () => {
          // Implement property detail fetching if needed
          return Promise.resolve(null);
        },
        staleTime: 60000, // Cache for 1 minute
      });
    },
    [queryClient],
  );

  const warmCache = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ["optimized-properties"],
      staleTime: 30000,
    });
  }, [queryClient]);

  const getCacheSize = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    return queries.length;
  }, [queryClient]);

  const clearCache = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  return {
    invalidatePropertyData,
    prefetchProperty,
    warmCache,
    getCacheSize,
    clearCache,
  };
};
