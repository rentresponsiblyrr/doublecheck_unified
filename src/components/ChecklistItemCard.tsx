
import { Card, CardContent } from "@/components/ui/card";
import { ChecklistItemPriorityBadge } from "@/components/ChecklistItemPriorityBadge";
import { NetworkStatusBadge } from "@/components/NetworkStatusBadge";

interface ChecklistItemCardProps {
  itemId: string;
  priority: 'high' | 'medium' | 'low';
  networkStatus: boolean;
  children: React.ReactNode;
}

export const ChecklistItemCard = ({ 
  itemId, 
  priority, 
  networkStatus, 
  children 
}: ChecklistItemCardProps) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'low': return 'border-gray-200 bg-gray-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card 
      id={`checklist-item-${itemId}`}
      className={`shadow-sm hover:shadow-md transition-shadow ${getPriorityColor()}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Header with network status */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {children}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <ChecklistItemPriorityBadge priority={priority} />
              <NetworkStatusBadge isOnline={networkStatus} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
