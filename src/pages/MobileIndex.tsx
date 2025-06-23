
import { PropertyHeader } from "@/components/PropertyHeader";
import { AddPropertyButton } from "@/components/AddPropertyButton";
import { MobilePropertyList } from "@/components/MobilePropertyList";
import { useMobileAuth } from "@/hooks/useMobileAuth";
import { useMobilePropertyData } from "@/hooks/useMobilePropertyData";
import { useMobilePropertyActions } from "@/hooks/useMobilePropertyActions";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Zap, Clock } from "lucide-react";

const MobileIndex = () => {
  const { user, isAuthenticated } = useMobileAuth();
  const { data: properties, isLoading, error, refetch, isFetching } = useMobilePropertyData(user?.id);
  const { handleEdit, handleDelete, handleStartInspection } = useMobilePropertyActions();

  console.log('📱 MobileIndex optimized rendering:', { 
    isAuthenticated, 
    propertiesCount: properties?.length || 0, 
    isLoading, 
    error: !!error 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <PropertyHeader 
        title="DoubleCheck Mobile"
        subtitle="Optimized for field inspections"
      />
      
      {/* Mobile Performance Dashboard */}
      <div className="px-4 py-2">
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Smartphone className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium">Mobile Optimized</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">Fast Loading</span>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3 text-gray-600" />
                <span className="text-gray-600 text-xs">
                  {properties?.length || 0} properties
                </span>
              </div>
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

      <div className="px-4 mt-6 pb-6">
        <AddPropertyButton />
      </div>
    </div>
  );
};

export default MobileIndex;
