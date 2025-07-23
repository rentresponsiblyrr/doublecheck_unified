/**
 * Batched Checklist Media Hook - Solves N+1 Query Performance Issue
 *
 * This hook replaces individual useChecklistItemMedia calls with a single batched query
 * that fetches all media for multiple checklist items at once.
 *
 * Performance Impact:
 * - Before: 20 checklist items = 20 separate database queries (N+1 problem)
 * - After: 20 checklist items = 1 batched database query
 * - Expected speedup: 10-20x faster for typical inspections
 *
 * @author STR Certified Engineering Team
 * @since 2.0.0
 * @version 1.0.0
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MediaUpload } from "@/types/inspection";

/**
 * Fetches media for multiple checklist items in a single optimized query
 *
 * @param checklistItemIds - Array of checklist item IDs to fetch media for
 * @returns React Query result with media grouped by checklist item ID
 *
 * @example
 * ```typescript
 * const { data: mediaByItem, isLoading } = useBatchedChecklistMedia([
 *   'item-1', 'item-2', 'item-3'
 * ]);
 *
 * // Access media for specific item
 * const item1Media = mediaByItem?.['item-1'] || [];
 * ```
 *
 * @performance Single database query instead of N separate queries
 * @since 2.0.0
 */
export const useBatchedChecklistMedia = (checklistItemIds: string[]) => {
  return useQuery({
    queryKey: ["batched-checklist-media", ...checklistItemIds.sort()],
    queryFn: async (): Promise<Record<string, MediaUpload[]>> => {
      if (checklistItemIds.length === 0) {
        return {};
      }

      // Single optimized query for all media
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .in("checklist_item_id", checklistItemIds)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Group media by checklist item ID for easy lookup
      const mediaByItem: Record<string, MediaUpload[]> = {};

      // Initialize empty arrays for all requested items
      checklistItemIds.forEach((id) => {
        mediaByItem[id] = [];
      });

      // Group the media results
      (data || []).forEach((item) => {
        const checklistItemId = item.checklist_item_id;
        if (!mediaByItem[checklistItemId]) {
          mediaByItem[checklistItemId] = [];
        }

        mediaByItem[checklistItemId].push({
          id: item.id,
          checklist_item_id: item.checklist_item_id,
          type: item.type as "photo" | "video",
          url: item.url || "",
          created_at: item.created_at || new Date().toISOString(),
        });
      });

      return mediaByItem;
    },
    enabled: checklistItemIds.length > 0,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 300000, // Keep in cache for 5 minutes
  });
};

/**
 * Hook to get media for a single checklist item from batched data
 * Use this as a drop-in replacement for useChecklistItemMedia
 *
 * @param checklistItemId - Single checklist item ID
 * @param allChecklistItemIds - All checklist item IDs in the current context
 * @returns Media array for the specific checklist item
 *
 * @example
 * ```typescript
 * // In the parent component that knows all item IDs:
 * const allItemIds = checklist.map(item => item.id);
 *
 * // In child components:
 * const media = useOptimizedChecklistItemMedia(item.id, allItemIds);
 * ```
 *
 * @performance Uses batched query when multiple items are present
 * @since 2.0.0
 */
export const useOptimizedChecklistItemMedia = (
  checklistItemId: string,
  allChecklistItemIds: string[],
) => {
  const { data: batchedMedia, ...rest } =
    useBatchedChecklistMedia(allChecklistItemIds);

  return {
    ...rest,
    data: batchedMedia?.[checklistItemId] || [],
  };
};
