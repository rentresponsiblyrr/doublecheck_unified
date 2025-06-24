
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useInspectionData } from "@/hooks/useInspectionData";
import { useInspectorPresence } from "@/hooks/useInspectorPresence";
import { InspectionInvalidState } from "@/components/InspectionInvalidState";
import { InspectionLoadingState } from "@/components/InspectionLoadingState";
import { InspectionErrorState } from "@/components/InspectionErrorState";
import { InspectionContent } from "@/components/InspectionContent";

const Inspection = () => {
  console.log('🏗️ Inspection component mounting');
  
  const { inspectionId } = useParams<{ inspectionId: string }>();

  console.log('🔗 Inspection route params:', { inspectionId });

  // Early return for missing inspectionId
  if (!inspectionId) {
    console.error('❌ No inspectionId in route params');
    return <InspectionInvalidState />;
  }

  const { 
    checklistItems, 
    isLoading,
    refetch, 
    isRefetching,
    error
  } = useInspectionData(inspectionId);

  // Initialize inspector presence tracking
  const { updatePresence } = useInspectorPresence(inspectionId);

  // Log component state changes
  useEffect(() => {
    console.log('🔄 Inspection component state:', {
      inspectionId,
      isLoading,
      isRefetching,
      itemCount: checklistItems.length,
      hasError: !!error
    });
  }, [inspectionId, isLoading, isRefetching, checklistItems.length, error]);

  // Update presence when page loads
  useEffect(() => {
    if (inspectionId) {
      updatePresence('online');
    }
  }, [inspectionId, updatePresence]);

  // Handle errors
  if (error) {
    console.error('💥 Inspection page error:', error);
    return <InspectionErrorState error={error} onRetry={refetch} />;
  }

  // Show loading state
  if (isLoading) {
    return <InspectionLoadingState inspectionId={inspectionId} />;
  }

  return (
    <InspectionContent
      inspectionId={inspectionId}
      checklistItems={checklistItems}
      onRefetch={refetch}
      isRefetching={isRefetching}
    />
  );
};

export default Inspection;
