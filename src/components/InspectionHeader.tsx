
import { ArrowLeft, Home, AlertTriangle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InspectionProgress } from "@/components/InspectionProgress";
import { UserMenu } from "@/components/UserMenu";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ChecklistItemType } from "@/types/inspection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InspectionHeaderProps {
  inspectionId: string;
  propertyName?: string;
  propertyAddress?: string;
  completedCount: number;
  totalCount: number;
  showCompleted: boolean;
  onToggleCompleted: () => void;
  checklistItems: ChecklistItemType[];
}

export const InspectionHeader = ({ 
  inspectionId,
  propertyName, 
  propertyAddress, 
  completedCount, 
  totalCount,
  showCompleted,
  onToggleCompleted,
  checklistItems
}: InspectionHeaderProps) => {
  const navigate = useNavigate();

  // Fetch property details for this inspection
  const { data: propertyDetails, isLoading: propertyLoading, error: propertyError } = useQuery({
    queryKey: ['inspection-property', inspectionId],
    queryFn: async () => {
      console.log('🏠 Fetching property details for inspection:', inspectionId);
      
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          properties (
            name,
            address
          )
        `)
        .eq('id', inspectionId)
        .single();

      if (error) {
        console.error('❌ Error fetching property details:', error);
        throw error;
      }

      console.log('✅ Property details fetched:', data);
      return data.properties;
    },
    enabled: !!inspectionId,
    staleTime: 300000, // Cache for 5 minutes
  });

  const displayPropertyName = propertyName || propertyDetails?.name || 'Property Inspection';
  const displayPropertyAddress = propertyAddress || propertyDetails?.address;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              console.log('🔙 Navigating back to properties');
              navigate('/properties');
            }}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Home className="w-4 h-4" />
              {propertyLoading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading property...
                </span>
              ) : propertyError ? (
                <span className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  Error loading property
                </span>
              ) : (
                displayPropertyName
              )}
            </h1>
            {displayPropertyAddress && (
              <p className="text-sm text-gray-600">{displayPropertyAddress}</p>
            )}
            <p className="text-xs text-gray-500">Inspection ID: {inspectionId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <OfflineIndicator />
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-blue-600">DoubleCheck</div>
            <div className="text-xs text-gray-500">Powered by Rent Responsibly</div>
          </div>
          <UserMenu />
        </div>
      </div>
      
      {checklistItems.length > 0 && (
        <InspectionProgress items={checklistItems} />
      )}
    </div>
  );
};
