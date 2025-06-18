
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChecklistItem } from "@/components/ChecklistItem";
import { InspectionHeader } from "@/components/InspectionHeader";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";

// Demo inspection ID - in a real app this would come from routing/context
const CURRENT_INSPECTION_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

const Index = () => {
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: checklistItems = [], isLoading, refetch } = useQuery({
    queryKey: ['checklist-items', CURRENT_INSPECTION_ID, showCompleted],
    queryFn: async () => {
      console.log('Fetching checklist items from Supabase...');
      
      let query = supabase
        .from('checklist_items')
        .select('*')
        .eq('inspection_id', CURRENT_INSPECTION_ID);

      if (!showCompleted) {
        query = query.is('status', null);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching checklist items:', error);
        throw error;
      }

      console.log('Fetched checklist items:', data);
      
      // Transform the data to match our TypeScript interface
      return (data || []).map(item => ({
        id: item.id,
        inspection_id: item.inspection_id,
        label: item.label || '',
        category: item.category as 'safety' | 'amenity' | 'cleanliness' | 'maintenance',
        evidence_type: item.evidence_type as 'photo' | 'video',
        status: item.status === 'completed' ? 'completed' : null,
        created_at: item.created_at || new Date().toISOString()
      })) as ChecklistItemType[];
    },
  });

  const filteredItems = checklistItems.filter(item => 
    showCompleted || !item.status
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <InspectionHeader 
        inspectionId={CURRENT_INSPECTION_ID}
        showCompleted={showCompleted}
        onToggleCompleted={() => setShowCompleted(!showCompleted)}
        completedCount={checklistItems.filter(item => item.status === 'completed').length}
        totalCount={checklistItems.length}
      />
      
      <main className="pb-6">
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4 px-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {showCompleted ? "No completed items yet" : "All items completed! 🎉"}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onComplete={() => refetch()}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
