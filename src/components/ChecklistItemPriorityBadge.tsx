import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Circle, Minus } from "lucide-react";

interface ChecklistItemPriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
}

export const ChecklistItemPriorityBadge: React.FC<ChecklistItemPriorityBadgeProps> = ({
  priority
}) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'high':
        return {
          icon: AlertTriangle,
          text: 'High',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'low':
        return {
          icon: Minus,
          text: 'Low',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      default:
        return {
          icon: Circle,
          text: 'Medium',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
    }
  };

  const { icon: Icon, text, className } = getPriorityConfig();

  return (
    <Badge variant="outline" className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {text}
    </Badge>
  );
};