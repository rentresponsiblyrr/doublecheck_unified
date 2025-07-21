import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, Trash2 } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url: string | null;
  airbnb_url: string | null;
  status: string | null;
}

interface PropertyStatus {
  status: string;
  color: string;
  text: string;
}

interface PropertyCardProps {
  property: Property;
  status: PropertyStatus;
  isSelected: boolean;
  onSelect: (propertyId: string) => void;
  onPropertyDeleted: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  status,
  isSelected,
  onSelect,
  onPropertyDeleted
}) => {
  const handleCardClick = () => {
    onSelect(property.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${property.name}"?`)) {
      // Note: Delete functionality would need to be implemented
      // For now, just trigger the callback
      onPropertyDeleted();
    }
  };

  return (
    <Card 
      id={`property-card-${property.id}`}
      className={`cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
          : 'hover:shadow-md border-gray-200'
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {property.name}
            </CardTitle>
            <div className="flex items-center mt-1 text-gray-600">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{property.address}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            <Badge 
              className={`${status.color}`}
              variant="secondary"
            >
              {status.text}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-red-50 text-red-600 hover:text-red-700"
              title={`Delete ${property.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Quick Links */}
        {(property.vrbo_url || property.airbnb_url) && (
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            {property.vrbo_url && (
              <a
                href={property.vrbo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Vrbo
              </a>
            )}
            {property.airbnb_url && (
              <a
                href={property.airbnb_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Airbnb
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};