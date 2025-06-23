
import { useEffect } from "react";
import { PropertyHeader } from "@/components/PropertyHeader";
import { MobilePropertyList } from "@/components/MobilePropertyList";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { useMobilePropertyData } from "@/hooks/useMobilePropertyData";
import { useMobilePropertyActions } from "@/hooks/useMobilePropertyActions";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Zap, Smartphone } from "lucide-react";

const OptimizedProperties = () => {
  const { startMeasure, endMeasure, getAllMetrics } = usePerformanceMonitoring();
  const { user } = useMobileAuth();
  const { data: properties, isLoading, error, refetch, isFetching } = useMobilePropertyData(user?.id);
  const { handleEdit, handleDelete, handleStartInspection } = useMobilePropertyActions();

  useEffect(() => {
    startMeasure('optimized-page-load');
    
    const timer = setTimeout(() => {
      endMeasure('optimized-page-load');
    }, 100);

    return () => clearTimeout(timer);
  }, [startMeasure, endMeasure]);

  const metrics = getAllMetrics();

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
              {metrics.length > 0 && (
                <div className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-600" />
                  <span>Load Time</span>
                  <Badge variant="secondary" className="text-xs">
                    {metrics[0]?.duration?.toFixed(0)}ms
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <MobilePropertyList
        properties={properties || []}
        isLoading={isLoading}
        error={error}
        onRefresh={refetch}
        isFetching={isFetching}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStartInspection={handleStartInspection}
      />
      
      <AddPropertyButton />
    </div>
  );
};

export default OptimizedProperties;
