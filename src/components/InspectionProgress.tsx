
import { EnhancedProgressIndicator } from "@/components/EnhancedProgressIndicator";
import { ChecklistItemType } from "@/types/inspection";

interface InspectionProgressProps {
  items: ChecklistItemType[];
}

export const InspectionProgress = ({ items }: InspectionProgressProps) => {
  // Only show progress indicator if there are items
  if (items.length === 0) {
    return null;
  }

  return <EnhancedProgressIndicator items={items} />;
};
