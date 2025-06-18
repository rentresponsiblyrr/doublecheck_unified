
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChecklistItem } from "@/components/ChecklistItem";
import { InspectionHeader } from "@/components/InspectionHeader";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { supabase } from "@/lib/supabase";
import { ChecklistItemType } from "@/types/inspection";

// Mock inspection ID for demo - in real app this would come from routing/context
const CURRENT_INSPECTION_ID = "demo-inspection-001";

const Index = () => {
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: checklistItems = [], isLoading, refetch } = useQuery({
    queryKey: ['checklist-items', CURRENT_INSPECTION_ID, showCompleted],
    queryFn: async () => {
      console.log('Fetching checklist items...');
      
      // For demo purposes, we'll return mock data since Supabase isn't connected
      // In real implementation: 
      // const { data, error } = await supabase
      //   .from('checklist_items')
      //   .select('*')
      //   .eq('inspection_id', CURRENT_INSPECTION_ID)
      //   .is(showCompleted ? null : 'status', showCompleted ? false : null);
      
      const mockData: ChecklistItemType[] = [
        {
          id: "item-1",
          inspection_id: CURRENT_INSPECTION_ID,
          label: "Smoke detector present and functional",
          category: "safety",
          evidence_type: "photo",
          status: null,
          created_at: new Date().toISOString()
        },
        {
          id: "item-2", 
          inspection_id: CURRENT_INSPECTION_ID,
          label: "Fire extinguisher accessible",
          category: "safety",
          evidence_type: "photo",
          status: null,
          created_at: new Date().toISOString()
        },
        {
          id: "item-3",
          inspection_id: CURRENT_INSPECTION_ID,
          label: "Pool area safety demonstration",
          category: "amenity", 
          evidence_type: "video",
          status: null,
          created_at: new Date().toISOString()
        },
        {
          id: "item-4",
          inspection_id: CURRENT_INSPECTION_ID,
          label: "Kitchen appliances operational",
          category: "amenity",
          evidence_type: "photo", 
          status: "completed",
          created_at: new Date().toISOString()
        }
      ];

      return showCompleted ? mockData : mockData.filter(item => !item.status);
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
