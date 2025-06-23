
import { Badge } from "@/components/ui/badge";
import { Camera, Video, Check, Clock, AlertTriangle } from "lucide-react";
import { ChecklistItemType } from "@/types/inspection";

interface ChecklistItemHeaderProps {
  item: ChecklistItemType;
}

export const ChecklistItemHeader = ({ item }: ChecklistItemHeaderProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-red-100 text-red-800 border-red-200';
      case 'amenity': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cleanliness': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety': return <AlertTriangle className="w-4 h-4" />;
      case 'amenity': return item.evidence_type === 'photo' ? <Camera className="w-4 h-4" /> : <Video className="w-4 h-4" />;
      case 'cleanliness': return <Check className="w-4 h-4" />;
      case 'maintenance': return <Clock className="w-4 h-4" />;
      default: return <Check className="w-4 h-4" />;
    }
  };

  return (
    <div>
      <h3 className="font-semibold text-gray-900 text-xl leading-tight mb-3">
        {item.label}
      </h3>
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className={`${getCategoryColor(item.category)} border`}>
          <div className="flex items-center gap-1">
            {getCategoryIcon(item.category)}
            <span className="capitalize font-medium">{item.category}</span>
          </div>
        </Badge>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {item.evidence_type === 'photo' ? (
            <Camera className="w-4 h-4" />
          ) : (
            <Video className="w-4 h-4" />
          )}
          <span className="font-medium">{item.evidence_type} required</span>
        </div>
      </div>
    </div>
  );
};
