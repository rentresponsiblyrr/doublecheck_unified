
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChecklistItem } from "@/components/ChecklistItem";
import { InspectionHeader } from "@/components/InspectionHeader";
import { InspectionProgress } from "@/components/InspectionProgress";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ChecklistItemType } from "@/types/inspection";
import { RefreshCw, Filter, Eye, EyeOff } from "lucide-react";

// Demo inspection ID - in a real app this would come from routing/context
const CURRENT_INSPECTION_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

const Index = () => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: checklistItems = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['checklist-items', CURRENT_INSPECTION_ID],
    queryFn: async () => {
      console.log('Fetching checklist items from Supabase...');
      
      const { data, error } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('inspection_id', CURRENT_INSPECTION_ID)
        .order('created_at', { ascending: true });
      
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
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  const filteredItems = checklistItems.filter(item => {
    const matchesCompletedFilter = showCompleted || !item.status;
    const matchesCategoryFilter = !selectedCategory || item.category === selectedCategory;
    return matchesCompletedFilter && matchesCategoryFilter;
  });

  const categories = ['safety', 'amenity', 'cleanliness', 'maintenance'];
  
  const getCategoryCount = (category: string) => {
    return checklistItems.filter(item => item.category === category).length;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-red-100 text-red-800 border-red-200';
      case 'amenity': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cleanliness': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Auto-refresh every 30 seconds when not actively uploading
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefetching) {
        refetch();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch, isRefetching]);

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
          <div className="px-4 space-y-4">
            {/* Progress Overview */}
            <InspectionProgress items={checklistItems} />

            {/* Controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              {/* Filter Controls */}
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Filters</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isRefetching}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-1"
                >
                  <Filter className="w-3 h-3" />
                  All ({checklistItems.length})
                </Button>
                {categories.map(category => (
                  <Badge
                    key={category}
                    className={`cursor-pointer border transition-all hover:shadow-sm ${
                      selectedCategory === category 
                        ? getCategoryColor(category) + ' ring-2 ring-offset-1 ring-blue-500' 
                        : getCategoryColor(category) + ' opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  >
                    <span className="capitalize">{category}</span>
                    <span className="ml-1">({getCategoryCount(category)})</span>
                  </Badge>
                ))}
              </div>

              {/* Show/Hide Completed */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2"
              >
                {showCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showCompleted ? 'Hide' : 'Show'} Completed Items
              </Button>
            </div>

            {/* Checklist Items */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                <p className="text-gray-500 text-lg">
                  {showCompleted 
                    ? "No completed items yet" 
                    : selectedCategory 
                      ? `No ${selectedCategory} items remaining`
                      : "All items completed! 🎉"
                  }
                </p>
                {!showCompleted && selectedCategory && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setSelectedCategory(null)}
                  >
                    View All Items
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <ChecklistItem
                    key={item.id}
                    item={item}
                    onComplete={() => refetch()}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
