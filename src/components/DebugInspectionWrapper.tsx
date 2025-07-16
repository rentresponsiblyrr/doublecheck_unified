
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useDebugInspectionData } from "@/hooks/useDebugInspectionData";
import { debugLogger } from "@/utils/debugLogger";
import { InspectionLoadingState } from "@/components/InspectionLoadingState";
import { DebugInspectionContent } from "@/components/DebugInspectionContent";
import { MobileErrorRecovery } from "@/components/MobileErrorRecovery";
import { DebugAuthStates } from "@/components/DebugAuthStates";

export const DebugInspectionWrapper = () => {
  debugLogger.info('DebugInspectionWrapper', 'Component rendering');
  
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const inspectionId = params.id;

  const { user, loading: authLoading, error: authError } = useAuth();
  const isAuthenticated = !!user;
  
  debugLogger.info('DebugInspectionWrapper', 'Route and auth analysis', { 
    params, 
    inspectionId,
    isAuthenticated,
    authLoading,
    hasAuthError: !!authError,
    userId: user?.id
  });

  // Handle auth states and missing inspection ID
  const authStateResult = DebugAuthStates({
    inspectionId,
    authLoading,
    authError,
    isAuthenticated,
    navigate
  });

  if (authStateResult) {
    return authStateResult;
  }

  return <DebugDataLoader inspectionId={inspectionId!} />;
};

const DebugDataLoader = ({ inspectionId }: { inspectionId: string }) => {
  const navigate = useNavigate();
  const { checklistItems, isLoading, refetch, error } = useDebugInspectionData(inspectionId);

  debugLogger.info('DebugDataLoader', 'Data loader state', {
    inspectionId,
    isLoading,
    itemCount: checklistItems.length,
    hasError: !!error
  });

  // Handle data loading errors
  if (error) {
    debugLogger.error('DebugDataLoader', 'Data loading error', error);
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <MobileErrorRecovery
          error={error}
          onRetry={refetch}
          onNavigateHome={() => navigate('/properties')}
          context="Debug Mode: Loading inspection data"
        />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    debugLogger.info('DebugDataLoader', 'Showing loading state');
    return <InspectionLoadingState inspectionId={inspectionId} />;
  }

  // Show success state with data
  debugLogger.info('DebugDataLoader', 'Rendering debug inspection content', {
    itemCount: checklistItems.length
  });

  return (
    <DebugInspectionContent
      inspectionId={inspectionId}
      checklistItems={checklistItems}
      onRefetch={refetch}
      isRefetching={false}
    />
  );
};
