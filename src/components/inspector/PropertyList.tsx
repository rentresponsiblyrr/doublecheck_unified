/**
 * Property List - Focused Component
 *
 * Displays list of properties with selection functionality
 * and proper accessibility support
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Home,
  ExternalLink,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import type { Property } from "./PropertySelectionStep";

interface PropertyListProps {
  properties: Property[];
  selectedProperty?: Property | null;
  isSelecting: boolean;
  onPropertySelect: (property: Property) => void;
}

export const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  selectedProperty,
  isSelecting,
  onPropertySelect,
}) => {
  const getPropertyTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "apartment":
        return "bg-blue-100 text-blue-800";
      case "house":
        return "bg-green-100 text-green-800";
      case "condo":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (properties.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500" id="property-list-empty">
        <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No properties found.</p>
        <p className="text-sm mt-2">Try adjusting your search terms.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96 w-full" id="property-list">
      <div className="space-y-3">
        {properties.map((property) => (
          <Card
            key={property.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedProperty?.id === property.id
                ? "border-blue-500 bg-blue-50"
                : "hover:border-gray-300"
            } ${isSelecting ? "pointer-events-none opacity-60" : ""}`}
            onClick={() => !isSelecting && onPropertySelect(property)}
            role="button"
            tabIndex={0}
            aria-label={`Select property ${property.property_name}`}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isSelecting) {
                e.preventDefault();
                onPropertySelect(property);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {property.property_name}
                    </h4>
                    <Badge className={getPropertyTypeColor(property.type)}>
                      {property.type || "rental"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{property.street_address}</span>
                  </div>

                  {/* Property Links */}
                  <div className="flex gap-2">
                    {property.vrbo_url && (
                      <a
                        href={property.vrbo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="View on VRBO"
                      >
                        VRBO <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {property.airbnb_url && (
                      <a
                        href={property.airbnb_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="View on Airbnb"
                      >
                        Airbnb <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {selectedProperty?.id === property.id ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
