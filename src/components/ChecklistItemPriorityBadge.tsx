
import { Badge } from "@/components/ui/badge";

interface ChecklistItemPriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
}

export const ChecklistItemPriorityBadge = ({ priority }: ChecklistItemPriorityBadgeProps) => {
  if (priority !== 'high') return null;
  
  return (
    <Badge variant="destructive" className="text-xs">
      Priority
    </Badge>
  );
};
