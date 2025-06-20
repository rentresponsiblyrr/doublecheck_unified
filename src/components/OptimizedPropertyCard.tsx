
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { PropertyActionsDropdown } from "./PropertyActionsDropdown";
import { usePropertyStatusCalculator } from "@/hooks/useOptimizedPropertyData";
import { formatDistanceToNow } from "date-fns";

interface OptimizedPropertyCardProps {
  property: {
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
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStartInspection?: (id: string) => void;
}

export const OptimizedPropertyCard = ({ 
  property, 
  onEdit, 
  onDelete, 
  onStartInspection 
}: OptimizedPropertyCardProps) => {
  const { getPropertyStatus } = usePropertyStatusCalculator();
  
  const status = getPropertyStatus(
    property.completed_inspection_count,
    property.active_inspection_count
  );

  const hasListingUrls = property.property_vrbo_url || property.property_airbnb_url;
  const createdAt = new Date(property.property_created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  const getStatusIcon = () => {
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {property.property_name}
            </h3>
            <div className="flex items-center gap-1 text-gray-600 mt-1">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">{property.property_address}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 mt-1">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs">Added {timeAgo}</span>
            </div>
          </div>
          <PropertyActionsDropdown
            propertyId={property.property_id}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Status and Inspection Count */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="secondary"
            className={`${status.badgeColor} flex items-center gap-1`}
          >
            {getStatusIcon()}
            {status.textLabel}
          </Badge>
          
          <div className="text-sm text-gray-600">
            {property.inspection_count > 0 ? (
              <span>
                {property.completed_inspection_count} of {property.inspection_count} completed
              </span>
            ) : (
              <span>No inspections</span>
            )}
          </div>
        </div>

        {/* Listing URLs */}
        {hasListingUrls && (
          <div className="flex gap-2">
            {property.property_vrbo_url && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => window.open(property.property_vrbo_url, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Vrbo
              </Button>
            )}
            {property.property_airbnb_url && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => window.open(property.property_airbnb_url, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Airbnb
              </Button>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button
          className="w-full"
          onClick={() => onStartInspection?.(property.property_id)}
          disabled={property.active_inspection_count > 0}
        >
          {property.active_inspection_count > 0 
            ? 'Inspection In Progress'
            : property.completed_inspection_count > 0
            ? 'Start New Inspection'
            : 'Start First Inspection'
          }
        </Button>
      </CardContent>
    </Card>
  );
};
