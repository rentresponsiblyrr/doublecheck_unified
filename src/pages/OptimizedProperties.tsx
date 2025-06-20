
import { useEffect } from "react";
import { PropertyHeader } from "@/components/PropertyHeader";
import { OptimizedPropertyListWithCache } from "@/components/OptimizedPropertyListWithCache";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { useSmartCache } from "@/hooks/useSmartCache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Zap } from "lucide-react";

const OptimizedProperties = () => {
  const { startMeasure, endMeasure, getAllMetrics } = usePerformanceMonitoring();
  const { warmCache, getCacheSize } = useSmartCache();

  useEffect(() => {
    startMeasure('page-load');
    warmCache();
    
    const timer = setTimeout(() => {
      endMeasure('page-load');
    }, 100);

    return () => clearTimeout(timer);
  }, [startMeasure, endMeasure, warmCache]);

  const metrics = getAllMetrics();
  const cacheSize = getCacheSize();

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="Properties"
        subtitle="Manage your DoubleCheck property inspections"
      />
      
      {/* Performance Dashboard */}
      <div className="px-4 py-2">
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Performance Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Database className="w-3 h-3 text-green-600" />
                <span>Optimized DB Queries</span>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-600" />
                <span>Smart Cache</span>
                <Badge variant="secondary" className="text-xs">{cacheSize} items</Badge>
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

      <OptimizedPropertyListWithCache />
      <AddPropertyButton />
    </div>
  );
};

export default OptimizedProperties;
