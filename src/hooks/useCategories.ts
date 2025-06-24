
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/categories";

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log('📊 Fetching categories from database...');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching categories:', error);
        throw error;
      }

      console.log('✅ Successfully fetched categories:', data?.length || 0);
      return data as Category[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useCategoryByName = (categoryName: string) => {
  return useQuery({
    queryKey: ['category', categoryName],
    queryFn: async () => {
      console.log('📊 Fetching category by name:', categoryName);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('name', categoryName)
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('❌ Error fetching category:', error);
        throw error;
      }

      return data as Category;
    },
    enabled: !!categoryName,
    staleTime: 5 * 60 * 1000,
  });
};
