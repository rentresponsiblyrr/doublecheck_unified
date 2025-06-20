
import { ArrowLeft, Home, AlertTriangle, RefreshCw, Eye, EyeOff } from "lucide-react";
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
    <header className="bg-white border-b border-gray-200">
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        {/* Top row with navigation and user menu */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                console.log('🔙 Navigating back to properties');
                navigate('/properties');
              }}
              className="p-2 shrink-0"
              aria-label="Go back to properties"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2 truncate">
                <Home className="w-4 h-4 shrink-0" />
                {propertyLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Loading property...</span>
                    <span className="sm:hidden">Loading...</span>
                  </span>
                ) : propertyError ? (
                  <span className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="hidden sm:inline">Error loading property</span>
                    <span className="sm:hidden">Error</span>
                  </span>
                ) : (
                  <span className="truncate">{displayPropertyName}</span>
                )}
              </h1>
              
              {displayPropertyAddress && (
                <p className="text-xs sm:text-sm text-gray-600 truncate mt-1">
                  {displayPropertyAddress}
                </p>
              )}
              
              <p className="text-xs text-gray-500 mt-1">
                ID: {inspectionId.slice(0, 8)}...
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <OfflineIndicator />
            
            {/* Toggle completed items button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCompleted}
              className="p-2"
              aria-label={showCompleted ? "Hide completed items" : "Show completed items"}
              title={showCompleted ? "Hide completed items" : "Show completed items"}
            >
              {showCompleted ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
            
            {/* Brand info - hidden on mobile */}
            <div className="text-right hidden lg:block">
              <div className="text-sm font-medium text-blue-600">DoubleCheck</div>
              <div className="text-xs text-gray-500">Powered by Rent Responsibly</div>
            </div>
            
            <UserMenu />
          </div>
        </div>
        
        {/* Progress section - only show on larger screens, mobile has its own */}
        {checklistItems.length > 0 && (
          <div className="hidden sm:block">
            <InspectionProgress items={checklistItems} />
          </div>
        )}
        
        {/* Mobile summary stats */}
        <div className="sm:hidden flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {completedCount}/{totalCount} completed
          </span>
          <span className="text-gray-600">
            {showCompleted ? 'Showing all' : 'Hiding completed'}
          </span>
        </div>
      </div>
    </header>
  );
};
