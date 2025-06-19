
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InspectionProgress } from "@/components/InspectionProgress";
import { UserMenu } from "@/components/UserMenu";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ChecklistItemType } from "@/types/inspection";

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

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/properties')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Home className="w-4 h-4" />
              {propertyName || 'Property Inspection'}
            </h1>
            {propertyAddress && (
              <p className="text-sm text-gray-600">{propertyAddress}</p>
            )}
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
      
      <InspectionProgress items={checklistItems} />
    </div>
  );
};
