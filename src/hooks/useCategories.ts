
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { updateValidCategories } from "@/utils/categoryMapping";
import type { Category } from "@/types/categories";

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // REMOVED: console.log('📊 Fetching categories from database...');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) {
        // REMOVED: console.error('❌ Error fetching categories:', error);
        throw error;
      }

      // REMOVED: console.log('✅ Successfully fetched categories:', data?.length || 0);
      
      // Update the valid categories in the mapping utility
      if (data) {
        const categoryNames = data.map(cat => cat.name);
        updateValidCategories(categoryNames);
        // REMOVED: console.log('🔄 Updated valid categories in mapping utility:', categoryNames);
      }
      
      return (data as Category[]) || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};
