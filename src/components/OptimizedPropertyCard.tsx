
import { memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Play, Users } from "lucide-react";
import { PropertyActionsDropdown } from "@/components/PropertyActionsDropdown";

interface MobilePropertyData {
  property_id: string;
  property_name: string;
  property_address: string;
  property_vrbo_url: string;
  property_airbnb_url: string;
  property_status: string;
  property_created_at: string;
  inspection_count: number;
  completed_inspection_count: number;
  active_inspection_count: number;
  latest_inspection_id: string | null;
  latest_inspection_completed: boolean | null;
}

interface OptimizedPropertyCardProps {
  property: MobilePropertyData;
  onEdit: (propertyId: string) => void;
  onDelete: (propertyId: string) => void;
  onStartInspection: (propertyId: string) => void;
  selectedProperty?: string | null;
  onPropertySelect?: (propertyId: string | null) => void;
}

export const OptimizedPropertyCard = memo(({
  property,
  onEdit,
  onDelete,
  onStartInspection,
  selectedProperty,
  onPropertySelect
}: OptimizedPropertyCardProps) => {
  const isSelected = selectedProperty === property.property_id;
  
  // Determine property status
  const getStatus = () => {
    if (property.active_inspection_count > 0) {
      return { status: 'in-progress', color: 'bg-yellow-500', text: 'In Progress' };
    }
    if (property.completed_inspection_count > 0) {
      return { status: 'completed', color: 'bg-green-500', text: 'Completed' };
    }
    return { status: 'pending', color: 'bg-gray-500', text: 'Not Started' };
  };

  const status = getStatus();
  const isInProgress = status.status === 'in-progress';

  const handleCardClick = () => {
    if (onPropertySelect) {
      onPropertySelect(isSelected ? null : property.property_id);
    }
  };

  const handleInspectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartInspection(property.property_id);
  };

  const handleEdit = () => {
    onEdit(property.property_id);
  };

  const handleDelete = () => {
    onDelete(property.property_id);
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {property.property_name || 'Unnamed Property'}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{property.property_address}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${status.color} text-white border-none`}
            >
              {status.text}
            </Badge>
            <PropertyActionsDropdown
              propertyId={property.property_id}
              propertyName={property.property_name}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* URLs */}
          <div className="flex flex-wrap gap-2">
            {property.property_vrbo_url && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(property.property_vrbo_url, '_blank');
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Vrbo
              </Button>
            )}
            {property.property_airbnb_url && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(property.property_airbnb_url, '_blank');
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Airbnb
              </Button>
            )}
          </div>

          {/* Inspection Stats */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {property.inspection_count} inspection{property.inspection_count !== 1 ? 's' : ''}
              {property.completed_inspection_count > 0 && 
                ` • ${property.completed_inspection_count} completed`
              }
            </span>
          </div>

          {/* Multi-inspector indication for in-progress inspections */}
          {isInProgress && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <Users className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-700">
                Inspection in progress - you can join
              </span>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleInspectionClick}
            className={`w-full text-sm ${
              isInProgress 
                ? 'bg-yellow-600 hover:bg-yellow-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            size="sm"
          >
            {isInProgress ? (
              <>
                <Users className="w-4 h-4 mr-2" />
                Join Inspection
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Inspection
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

OptimizedPropertyCard.displayName = 'OptimizedPropertyCard';
