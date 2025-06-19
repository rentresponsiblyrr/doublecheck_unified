
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { InspectionLayout } from "@/components/InspectionLayout";
import { InspectionFilters } from "@/components/InspectionFilters";
import { InspectionList } from "@/components/InspectionList";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useInspectionData } from "@/hooks/useInspectionData";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Inspection = () => {
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  if (!inspectionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid Inspection
          </h2>
          <Button onClick={() => navigate('/')}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  const { 
    checklistItems, 
    isLoading, 
    refetch, 
    isRefetching
  } = useInspectionData(inspectionId);

  const filteredItems = checklistItems.filter(item => {
    const matchesCompletedFilter = showCompleted || !item.status;
    const matchesCategoryFilter = !selectedCategory || item.category === selectedCategory;
    return matchesCompletedFilter && matchesCategoryFilter;
  });

  const completedCount = checklistItems.filter(item => item.status === 'completed').length;
  const totalCount = checklistItems.length;
  const isAllCompleted = completedCount === totalCount && totalCount > 0;

  const handleCompleteInspection = async () => {
    try {
      console.log('Completing inspection:', inspectionId);
      
      const { error } = await supabase
        .from('inspections')
        .update({ 
          completed: true,
          end_time: new Date().toISOString()
        })
        .eq('id', inspectionId);

      if (error) {
        console.error('Error completing inspection:', error);
        toast({
          title: "Error",
          description: "Failed to complete inspection. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Inspection completed successfully');
      toast({
        title: "Inspection Complete!",
        description: "Your inspection has been submitted for review.",
      });
      
      navigate(`/inspection/${inspectionId}/complete`);
    } catch (error) {
      console.error('Failed to complete inspection:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <InspectionLayout
      inspectionId={inspectionId}
      checklistItems={checklistItems}
      showCompleted={showCompleted}
      onToggleCompleted={() => setShowCompleted(!showCompleted)}
    >
      <InspectionFilters
        checklistItems={checklistItems}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        showCompleted={showCompleted}
        onToggleCompleted={() => setShowCompleted(!showCompleted)}
        onRefresh={refetch}
        isRefetching={isRefetching}
      />

      <InspectionList
        items={filteredItems}
        showCompleted={showCompleted}
        selectedCategory={selectedCategory}
        onComplete={refetch}
        onCategoryChange={setSelectedCategory}
        inspectionId={inspectionId}
      />

      {/* Complete Inspection Button */}
      {isAllCompleted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <Button 
            onClick={handleCompleteInspection}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
            size="lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Inspection
          </Button>
        </div>
      )}
    </InspectionLayout>
  );
};

export default Inspection;
