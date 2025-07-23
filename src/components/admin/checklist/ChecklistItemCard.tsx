/**
 * Checklist Item Card Component
 * Extracted from FunctionalChecklistManagement.tsx
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Trash2,
  CheckSquare,
  Camera,
  Video,
  FileText,
} from "lucide-react";
import { ProductionSafetyItem } from "@/services/productionDatabaseService";

interface ChecklistItemCardProps {
  item: ProductionSafetyItem;
  onEdit: (item: ProductionSafetyItem) => void;
  onDelete: (item: ProductionSafetyItem) => void;
}

const evidenceTypes = [
  { value: "photo", label: "Photo", icon: Camera },
  { value: "video", label: "Video", icon: Video },
  { value: "none", label: "Visual Check Only", icon: CheckSquare },
  { value: "documentation", label: "Documentation", icon: FileText },
];

const getEvidenceIcon = (evidenceType: string) => {
  const type = evidenceTypes.find((t) => t.value === evidenceType);
  return type ? type.icon : CheckSquare;
};

const getCategoryBadgeColor = (category: string) => {
  const colors = {
    Safety: "bg-red-100 text-red-800",
    Compliance: "bg-blue-100 text-blue-800",
    Cleanliness: "bg-green-100 text-green-800",
    Amenities: "bg-purple-100 text-purple-800",
    Maintenance: "bg-orange-100 text-orange-800",
    Accessibility: "bg-teal-100 text-teal-800",
    "Fire Safety": "bg-red-100 text-red-800",
    Security: "bg-gray-100 text-gray-800",
    Electrical: "bg-yellow-100 text-yellow-800",
    Plumbing: "bg-blue-100 text-blue-800",
  };
  return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export const ChecklistItemCard: React.FC<ChecklistItemCardProps> = ({
  item,
  onEdit,
  onDelete,
}) => {
  const EvidenceIcon = getEvidenceIcon(item.evidence_type);

  return (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <EvidenceIcon className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-lg">{item.label}</h3>
              {item.required && (
                <Badge className="bg-red-100 text-red-800">Required</Badge>
              )}
              <Badge className={getCategoryBadgeColor(item.category)}>
                {item.category}
              </Badge>
            </div>

            {item.notes && (
              <p className="text-gray-600 text-sm mb-2">{item.notes}</p>
            )}

            {item.gpt_prompt && (
              <div className="bg-gray-50 p-2 rounded text-xs mb-2">
                <strong>AI Prompt:</strong> {item.gpt_prompt.substring(0, 100)}
                {item.gpt_prompt.length > 100 && "..."}
              </div>
            )}

            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Evidence: {item.evidence_type}</span>
              <span>
                Created: {new Date(item.created_at).toLocaleDateString()}
              </span>
              <span>ID: {item.id.substring(0, 8)}...</span>
            </div>
          </div>

          <div className="flex space-x-2 ml-4">
            <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(item)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
