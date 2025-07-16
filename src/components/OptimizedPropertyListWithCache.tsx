
import { useAuth } from "@/components/AuthProvider";
import { useOptimizedPropertyData } from "@/hooks/useOptimizedPropertyData";
import { OptimizedPropertyCard } from "./OptimizedPropertyCard";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyPropertiesState } from "./EmptyPropertiesState";
import { usePropertyActions } from "@/hooks/usePropertyActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const OptimizedPropertyListWithCache = () => {
  const { user } = useAuth();
  const { data: properties, isLoading, error, refetch, isFetching } = useOptimizedPropertyData(user?.id);
  const { handleEdit, handleDelete, handleStartInspection } = usePropertyActions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner message="Loading properties with optimized performance..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mx-4 my-4 border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          Failed to load properties. Please try again.
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="ml-2"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!properties || properties.length === 0) {
    return <EmptyPropertiesState />;
  }

  return (
    <div className="space-y-4">
      {/* Performance Indicator */}
      <div className="px-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 p-2 rounded-lg">
          <Zap className="w-4 h-4 text-green-600" />
          <span>Optimized loading • {properties.length} properties</span>
          {isFetching && (
            <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin ml-auto" />
          )}
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid gap-4 px-4">
        {properties.map((property) => (
          <OptimizedPropertyCard
            key={property.property_id}
            property={property}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStartInspection={handleStartInspection}
          />
        ))}
      </div>

      {/* Manual Refresh */}
      <div className="px-4 pb-4">
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Refreshing...' : 'Refresh Properties'}
        </Button>
      </div>
    </div>
  );
};
