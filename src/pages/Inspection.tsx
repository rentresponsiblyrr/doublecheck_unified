
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { InspectionLayout } from "@/components/InspectionLayout";
import { InspectionFilters } from "@/components/InspectionFilters";
import { InspectionList } from "@/components/InspectionList";
import { useInspectionData } from "@/hooks/useInspectionData";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Inspection = () => {
  console.log('🏗️ Inspection component mounting');
  
  const { inspectionId } = useParams<{ inspectionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  console.log('🔗 Inspection route params:', { inspectionId });

  // Early return for missing inspectionId
  if (!inspectionId) {
    console.error('❌ No inspectionId in route params');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid Inspection
          </h2>
          <p className="text-gray-600 mb-4">
            No inspection ID was provided in the URL.
          </p>
          <Button onClick={() => navigate('/properties')} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Properties
          </Button>
        </div>
      </div>
    );
  }

  const { 
    checklistItems, 
    isLoading,
    refetch, 
    isRefetching,
    error
  } = useInspectionData(inspectionId);

  // Log component state changes
  useEffect(() => {
    console.log('🔄 Inspection component state:', {
      inspectionId,
      isLoading,
      isRefetching,
      itemCount: checklistItems.length,
      hasError: !!error,
      showCompleted,
      selectedCategory
    });
  }, [inspectionId, isLoading, isRefetching, checklistItems.length, error, showCompleted, selectedCategory]);

  // Handle errors
  if (error) {
    console.error('💥 Inspection page error:', error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Inspection
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'An unexpected error occurred while loading the inspection.'}
          </p>
          <div className="space-y-2">
            <Button onClick={() => refetch()} className="w-full">
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/properties')} 
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Properties
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    console.log('⏳ Showing loading state for inspection:', inspectionId);
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-6">
          <LoadingSpinner message="Loading inspection checklist..." />
        </div>
      </div>
    );
  }

  const filteredItems = checklistItems.filter(item => {
    const matchesCompletedFilter = showCompleted || (!item.status || item.status === null);
    const matchesCategoryFilter = !selectedCategory || item.category === selectedCategory;
    return matchesCompletedFilter && matchesCategoryFilter;
  });

  const completedCount = checklistItems.filter(item => item.status === 'completed' || item.status === 'failed').length;
  const totalCount = checklistItems.length;
  const passedCount = checklistItems.filter(item => item.status === 'completed').length;
  const failedCount = checklistItems.filter(item => item.status === 'failed').length;
  const isAllCompleted = completedCount === totalCount && totalCount > 0;

  console.log('📊 Inspection render stats:', {
    totalItems: totalCount,
    completedItems: completedCount,
    passedItems: passedCount,
    failedItems: failedCount,
    filteredItems: filteredItems.length,
    isAllCompleted
  });

  const handleCompleteInspection = async () => {
    try {
      console.log('✅ Starting inspection completion:', inspectionId);
      
      const { error } = await supabase
        .from('inspections')
        .update({ 
          completed: true,
          end_time: new Date().toISOString()
        })
        .eq('id', inspectionId);

      if (error) {
        console.error('❌ Error completing inspection:', error);
        toast({
          title: "Error",
          description: "Failed to complete inspection. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Inspection completed successfully');
      toast({
        title: "Inspection Complete!",
        description: `Inspection submitted with ${passedCount} passed and ${failedCount} failed items.`,
      });
      
      navigate(`/inspection/${inspectionId}/complete`);
    } catch (error) {
      console.error('💥 Failed to complete inspection:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

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

      {/* Complete Inspection Button with improved stats */}
      {isAllCompleted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="mb-3 text-center">
            <div className="text-sm text-gray-600">
              <span className="text-green-600 font-medium">✓ {passedCount} Passed</span>
              {failedCount > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-red-600 font-medium">✗ {failedCount} Failed</span>
                </>
              )}
            </div>
          </div>
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
