
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink } from "lucide-react";
import { SimplePropertyActions } from "@/components/SimplePropertyActions";

interface Property {
  id: string;
  name: string;
  address: string;
  vrbo_url: string | null;
  airbnb_url: string | null;
}

interface PropertyStatus {
  status: string;
  color: string;
  text: string;
}

interface OptimizedPropertyCardProps {
  property: Property;
  isSelected: boolean;
  onSelect: () => void;
  status: PropertyStatus;
  onPropertyDeleted: () => void;
}

export const OptimizedPropertyCard = ({ 
  property, 
  isSelected, 
  onSelect, 
  status,
  onPropertyDeleted 
}: OptimizedPropertyCardProps) => {
  
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't select when clicking on action buttons or links
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    onSelect();
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Property Name and Status */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {property.name}
              </h3>
              <Badge className={`${status.color} text-white text-xs`}>
                {status.text}
              </Badge>
            </div>

            {/* Address */}
            <div className="flex items-center gap-1 text-gray-600 text-sm mb-3">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{property.address}</span>
            </div>

            {/* Listing Links */}
            <div className="flex flex-wrap gap-2">
              {property.vrbo_url && (
                <a
                  href={property.vrbo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  Vrbo
                </a>
              )}
              {property.airbnb_url && (
                <a
                  href={property.airbnb_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-pink-600 hover:text-pink-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  Airbnb
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 ml-2">
            <SimplePropertyActions
              propertyId={property.id}
              propertyName={property.name}
              onPropertyDeleted={onPropertyDeleted}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
