
import { useEffect } from "react";
import { PropertyHeader } from "@/components/PropertyHeader";
import { MobileOptimizedPropertyList } from "@/components/MobileOptimizedPropertyList";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { useMobilePropertyData } from "@/hooks/useMobilePropertyData";
import { useMobilePropertyActions } from "@/hooks/useMobilePropertyActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Zap, Smartphone } from "lucide-react";

const OptimizedProperties = () => {
  const { user } = useMobileAuth();
  const { data: properties, isLoading, error, refetch, isFetching } = useMobilePropertyData(user?.id);
  const { handleEdit, handleDelete, handleStartInspection } = useMobilePropertyActions();

  const getPropertyStatus = (completedCount: number, activeCount: number) => {
    if (activeCount > 0) {
      return {
        status: 'in-progress',
        color: 'bg-yellow-500',
        textLabel: 'In Progress',
        badgeColor: 'bg-yellow-100 text-yellow-800'
      };
    }
    
    if (completedCount > 0) {
      return {
        status: 'completed',
        color: 'bg-green-500',
        textLabel: 'Completed',
        badgeColor: 'bg-green-100 text-green-800'
      };
    }
    
    return {
      status: 'pending',
      color: 'bg-gray-500',
      textLabel: 'Not Started',
      badgeColor: 'bg-gray-100 text-gray-800'
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="Properties"
        subtitle="Mobile-optimized property management"
      />
      
      {/* Performance Dashboard */}
      <div className="px-4 py-2">
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Mobile Performance Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3 text-green-600" />
                <span>Optimized Queries</span>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-blue-600" />
                <span>Mobile First</span>
                <Badge variant="secondary" className="text-xs">Enabled</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-600" />
                <span>Fast Cache</span>
                <Badge variant="secondary" className="text-xs">
                  {properties?.length || 0} items
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-600" />
                <span>Status</span>
                <Badge variant="secondary" className="text-xs">
                  Ready
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileOptimizedPropertyList
        properties={properties || []}
        isLoading={isLoading}
        error={error}
        onRefresh={refetch}
        isFetching={isFetching}
        selectedProperty={null}
        onPropertySelect={() => {}} // Not used in this simplified version
        onEdit={handleEdit}
        onStartInspection={handleStartInspection}
        getPropertyStatus={getPropertyStatus}
      />
      
      <AddPropertyButton />
    </div>
  );
};

export default OptimizedProperties;
