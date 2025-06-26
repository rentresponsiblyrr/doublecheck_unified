
import { ChecklistItemContainer } from "@/components/ChecklistItemContainer";
import { ChecklistItemType } from "@/types/inspection";

interface ChecklistItemProps {
  item: ChecklistItemType;
  onComplete: () => void;
}

export const ChecklistItem = ({ item, onComplete }: ChecklistItemProps) => {
  return <ChecklistItemContainer item={item} onComplete={onComplete} />;
};
