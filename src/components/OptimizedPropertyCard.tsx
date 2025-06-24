
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink } from "lucide-react";
import { SimplePropertyActions } from "@/components/SimplePropertyActions";

interface PropertyData {
  property_id: string;
  property_name: string;
  property_address: string;
  property_vrbo_url: string | null;
  property_airbnb_url: string | null;
  property_status?: string;
  property_created_at?: string;
  inspection_count?: number;
  completed_inspection_count?: number;
  active_inspection_count?: number;
  latest_inspection_id?: string | null;
  latest_inspection_completed?: boolean | null;
}

interface PropertyStatus {
  status: string;
  color: string;
  textLabel: string;
  badgeColor?: string;
}

interface OptimizedPropertyCardProps {
  property: PropertyData;
  onEdit?: (propertyId: string) => void;
  onDelete?: (propertyId: string) => void;
  onStartInspection?: (propertyId: string) => void;
}

export const OptimizedPropertyCard = ({ 
  property, 
  onEdit,
  onDelete,
  onStartInspection
}: OptimizedPropertyCardProps) => {
  
  // Calculate status based on inspection counts
  const getPropertyStatus = (): PropertyStatus => {
    const activeCount = property.active_inspection_count || 0;
    const completedCount = property.completed_inspection_count || 0;
    
    if (activeCount > 0) {
      return {
        status: 'in-progress',
        color: 'bg-yellow-500',
        textLabel: 'In Progress',
        badgeColor: 'bg-yellow-100 text-yellow-800'
      };
    }
    
    if (completedCount > 0) {
      return {
        status: 'completed',
        color: 'bg-green-500',
        textLabel: 'Completed',
        badgeColor: 'bg-green-100 text-green-800'
      };
    }
    
    return {
      status: 'pending',
      color: 'bg-gray-500',
      textLabel: 'Not Started',
      badgeColor: 'bg-gray-100 text-gray-800'
    };
  };

  const status = getPropertyStatus();

  const handleEdit = () => {
    if (onEdit) {
      onEdit(property.property_id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(property.property_id);
    }
  };

  const handleStartInspection = () => {
    if (onStartInspection) {
      onStartInspection(property.property_id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Property Name and Status */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {property.property_name}
              </h3>
              <Badge className={`${status.badgeColor} text-xs`}>
                {status.textLabel}
              </Badge>
            </div>

            {/* Address */}
            <div className="flex items-center gap-1 text-gray-600 text-sm mb-3">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{property.property_address}</span>
            </div>

            {/* Listing Links */}
            <div className="flex flex-wrap gap-2">
              {property.property_vrbo_url && (
                <a
                  href={property.property_vrbo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-3 h-3" />
                  Vrbo
                </a>
              )}
              {property.property_airbnb_url && (
                <a
                  href={property.property_airbnb_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-pink-600 hover:text-pink-800"
                >
                  <ExternalLink className="w-3 h-3" />
                  Airbnb
                </a>
              )}
            </div>

            {/* Inspection Stats */}
            {(property.inspection_count || 0) > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                {property.inspection_count} inspections • {property.completed_inspection_count || 0} completed
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 ml-2">
            <SimplePropertyActions
              propertyId={property.property_id}
              propertyName={property.property_name}
              onPropertyDeleted={() => {
                // Refresh the parent component
                window.location.reload();
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
