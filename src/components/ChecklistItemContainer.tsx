
import { useState, useEffect } from "react";
import { ChecklistItemType } from "@/types/inspection";
import { ChecklistItemCore } from "@/components/ChecklistItemCore";
import { CompletedChecklistItem } from "@/components/CompletedChecklistItem";
import { Card, CardContent } from "@/components/ui/card";
import { ChecklistItemPriorityBadge } from "@/components/ChecklistItemPriorityBadge";
import { NetworkStatusBadge } from "@/components/NetworkStatusBadge";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface ChecklistItemContainerProps {
  item: ChecklistItemType;
  onComplete: () => void;
}

// Determine priority based on item properties
const getItemPriority = (item: ChecklistItemType): 'high' | 'medium' | 'low' => {
  // Use category to determine priority since 'required' doesn't exist in the type
  if (item.category === 'safety' || item.category === 'legal') return 'high';
  if (item.category === 'amenities') return 'low';
  return 'medium';
};

// Priority-based styling
const getPriorityStyles = (priority: 'high' | 'medium' | 'low') => {
  switch (priority) {
    case 'high': return 'border-red-200 bg-red-50';
    case 'low': return 'border-gray-200 bg-gray-50';
    default: return 'border-blue-200 bg-blue-50';
  }
};

export const ChecklistItemContainer = ({ item, onComplete }: ChecklistItemContainerProps) => {
  const [isInView, setIsInView] = useState(false);
  const [currentNotes, setCurrentNotes] = useState(item.notes || "");
  const [isUploading, setIsUploading] = useState(false);
  
  const { isOnline } = useNetworkStatus();
  const priority = getItemPriority(item);

  const isCompleted = item.status === 'completed' || item.status === 'failed' || item.status === 'not_applicable';

  // Track when this item comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`checklist-item-${item.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [item.id]);

  // If item is completed, show the completed state component
  if (isCompleted) {
    return <CompletedChecklistItem item={item} onComplete={onComplete} />;
  }

  return (
    <Card 
      id={`checklist-item-${item.id}`}
      className={`shadow-sm hover:shadow-md transition-shadow ${getPriorityStyles(priority)}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <ChecklistItemCore
                item={item}
                onComplete={onComplete}
                onNotesChange={setCurrentNotes}
                onUploadingChange={setIsUploading}
              />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <ChecklistItemPriorityBadge priority={priority} />
              <NetworkStatusBadge isOnline={isOnline} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
