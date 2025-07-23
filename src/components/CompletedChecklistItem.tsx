import React from "react";
import { ChecklistItemType } from "@/types/inspection";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Minus, RotateCcw } from "lucide-react";

interface CompletedChecklistItemProps {
  item: ChecklistItemType;
  onComplete: () => void;
}

export const CompletedChecklistItem: React.FC<CompletedChecklistItemProps> = ({
  item,
  onComplete,
}) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "not_applicable":
        return <Minus className="w-5 h-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (item.status) {
      case "completed":
        return "Passed";
      case "failed":
        return "Failed";
      case "not_applicable":
        return "Not Applicable";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "not_applicable":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleReopen = () => {
    // In a real implementation, this would reset the item status to pending
    console.log(`Reopening item: ${item.id}`);
    onComplete(); // Trigger refresh
  };

  return (
    <Card
      id={`completed-checklist-item-${item.id}`}
      className={`${getStatusColor()}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <h3 className="font-semibold text-gray-900 truncate">
                {item.label}
              </h3>
              <Badge variant="secondary" className="ml-auto">
                {getStatusText()}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Badge variant="outline" className="capitalize">
                {item.category}
              </Badge>
              <span className="capitalize">{item.evidence_type} evidence</span>
            </div>

            {item.notes && (
              <div className="mt-2 p-2 bg-white/50 rounded text-sm">
                <strong>Notes:</strong> {item.notes}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReopen}
            className="ml-2 text-gray-600 hover:text-gray-800"
            title="Reopen this item"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
