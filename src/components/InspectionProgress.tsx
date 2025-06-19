
import { EnhancedProgressIndicator } from "@/components/EnhancedProgressIndicator";
import { ChecklistItemType } from "@/types/inspection";

interface InspectionProgressProps {
  items: ChecklistItemType[];
}

export const InspectionProgress = ({ items }: InspectionProgressProps) => {
  return <EnhancedProgressIndicator items={items} />;
};
